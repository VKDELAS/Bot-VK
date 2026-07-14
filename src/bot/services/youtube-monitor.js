const { MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');
const ids = require('../../lib/ids');
const { buildVideoNotifyContainer } = require('../utils/video-notify-container');

const CHANNEL_ID = 'UC3Bkdcwe1IwiZrg9CBB76OQ';
const API_BASE = 'https://www.googleapis.com/youtube/v3';
const STATE_PATH = path.join(__dirname, '..', '..', '..', 'data', 'youtube-state.json');

function loadState() {
  try {
    if (fs.existsSync(STATE_PATH)) {
      return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
    }
  } catch (error) {
    console.error('[BOT] Erro ao ler youtube-state.json:', error.message);
  }
  return { lastVideoId: null };
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('[BOT] Erro ao salvar youtube-state.json:', error.message);
  }
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function getLatestVideo() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const url = `${API_BASE}/search?key=${apiKey}&channelId=${CHANNEL_ID}&part=snippet&type=video&order=date&maxResults=1`;
  const data = await fetchJson(url);
  if (!data.items || data.items.length === 0) return null;
  const item = data.items[0];
  return {
    videoId: item.id.videoId,
    title: item.snippet.title,
    thumbnailUrl: `https://i.ytimg.com/vi/${item.id.videoId}/maxresdefault.jpg`,
  };
}

async function getChannelAvatar() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const url = `${API_BASE}/channels?key=${apiKey}&id=${CHANNEL_ID}&part=snippet`;
  const data = await fetchJson(url);
  if (!data.items || data.items.length === 0) return null;
  return data.items[0].snippet.thumbnails.default.url;
}

async function checkYouTube(client) {
  try {
    const video = await getLatestVideo();
    if (!video) return;

    const state = loadState();
    if (state.lastVideoId === video.videoId) return;

    const avatar = await getChannelAvatar();

    const guild = client.guilds.cache.get(ids.guildId);
    if (!guild) return;

    const channel = guild.channels.cache.get(ids.canais.videoNotify);
    if (!channel) return;

    const container = buildVideoNotifyContainer({
      videoTitle: video.title,
      videoUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
      videoThumbnailUrl: video.thumbnailUrl,
      channelAvatarUrl: avatar || 'https://i.ytimg.com/vi/default.jpg',
    });

    await channel.send({
      flags: MessageFlags.IsComponentsV2,
      components: [container],
    });

    console.log(`[BOT] Notificação de vídeo enviada: ${video.title}`);
    saveState({ lastVideoId: video.videoId });
  } catch (error) {
    console.error('[BOT] Erro ao verificar YouTube:', error);
  }
}

function startYoutubeMonitor(client) {
  console.log('[BOT] Monitor de YouTube iniciado');
  checkYouTube(client);
  setInterval(() => checkYouTube(client), 3 * 60 * 1000);
}

module.exports = { startYoutubeMonitor };
