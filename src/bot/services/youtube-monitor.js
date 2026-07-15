const { MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');
const ids = require('../../lib/ids');
const { buildVideoNotifyContainer } = require('../utils/video-notify-container');
const { buildLiveNotifyContainer } = require('../utils/live-notify-container');

const CHANNEL_ID = 'UC3Bkdcwe1IwiZrg9CBB76OQ';
const API_BASE = 'https://www.googleapis.com/youtube/v3';
const STATE_PATH = path.join(__dirname, '..', '..', '..', 'data', 'youtube-state.json');
const LIVE_STATE_PATH = path.join(__dirname, '..', '..', '..', 'data', 'youtube-live-state.json');

function loadState(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (error) {
    console.error('[BOT] Erro ao ler estado:', error.message);
  }
  return { lastVideoId: null };
}

function saveState(filePath, state) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('[BOT] Erro ao salvar estado:', error.message);
  }
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function getLatestVideo() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const url = `${API_BASE}/search?key=${apiKey}&channelId=${CHANNEL_ID}&part=snippet&type=video&eventType=completed&order=date&maxResults=1`;
  const data = await fetchJson(url);
  if (!data.items || data.items.length === 0) return null;
  const item = data.items[0];
  return {
    videoId: item.id.videoId,
    title: item.snippet.title,
    thumbnailUrl: `https://i.ytimg.com/vi/${item.id.videoId}/maxresdefault.jpg`,
  };
}

async function getLatestLive() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const url = `${API_BASE}/search?key=${apiKey}&channelId=${CHANNEL_ID}&part=snippet&type=video&eventType=live&order=date&maxResults=1`;
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

    const state = loadState(STATE_PATH);
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
    saveState(STATE_PATH, { lastVideoId: video.videoId });
  } catch (error) {
    console.error('[BOT] Erro ao verificar YouTube:', error);
  }
}

async function checkYouTubeLive(client) {
  try {
    const live = await getLatestLive();
    const liveState = loadState(LIVE_STATE_PATH);

    if (live) {
      if (liveState.lastLiveId === live.videoId) return;

      const avatar = await getChannelAvatar();

      const guild = client.guilds.cache.get(ids.guildId);
      if (!guild) return;

      const channel = guild.channels.cache.get(ids.canais.liveNotify);
      if (!channel) return;

      const container = buildLiveNotifyContainer({
        streamTitle: live.title,
        gameName: 'YouTube Live',
        streamThumbnailUrl: live.thumbnailUrl,
        avatarUrl: avatar || 'https://i.ytimg.com/vi/default.jpg',
        platform: 'youtube',
        videoId: live.videoId,
      });

      await channel.send({
        flags: MessageFlags.IsComponentsV2,
        components: [container],
      });

      console.log(`[BOT] Notificação de live YouTube enviada: ${live.title}`);
      saveState(LIVE_STATE_PATH, { lastLiveId: live.videoId });
    } else {
      if (liveState.lastLiveId) {
        saveState(LIVE_STATE_PATH, { lastLiveId: null });
        console.log('[BOT] YouTube live encerrada, estado resetado');
      }
    }
  } catch (error) {
    console.error('[BOT] Erro ao verificar live YouTube:', error);
  }
}

function startYoutubeMonitor(client) {
  console.log('[BOT] Monitor de YouTube iniciado');
  checkYouTube(client);
  checkYouTubeLive(client);
  setInterval(() => checkYouTube(client), 3 * 60 * 1000);
  setInterval(() => checkYouTubeLive(client), 2 * 60 * 1000);
}

module.exports = { startYoutubeMonitor };
