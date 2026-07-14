const { MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');
const ids = require('../../lib/ids');
const { buildVideoNotifyContainer } = require('../utils/video-notify-container');

const CHANNEL_ID = 'UC3Bkdcwe1IwiZrg9CBB76OQ';
const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
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

function extractVideoId(entry) {
  const match = entry.match(/yt:videoId>([^<]+)/);
  return match ? match[1] : null;
}

function extractTitle(entry) {
  const match = entry.match(/<media:title[^>]*>([^<]+)<\/media:title>/);
  return match ? match[1] : 'Sem título';
}

function extractThumbnail(entry) {
  const match = entry.match(/<media:thumbnail[^>]*url="([^"]+)"/);
  return match ? match[1] : null;
}

function extractChannelAvatar(feed) {
  const match = feed.match(/<media:thumbnail[^>]*url="([^"]+)"/);
  return match ? match[1] : null;
}

async function checkYouTube(client) {
  try {
    const response = await fetch(RSS_URL);
    if (!response.ok) {
      console.error('[BOT] YouTube RSS retornou status:', response.status);
      return;
    }

    const feed = await response.text();
    const entries = feed.split('<entry>').slice(1);

    if (entries.length === 0) return;

    const latestEntry = entries[0];
    const videoId = extractVideoId(latestEntry);

    if (!videoId) return;

    const state = loadState();
    if (state.lastVideoId === videoId) return;

    const title = extractTitle(latestEntry);
    const thumbnail = extractThumbnail(latestEntry);
    const avatar = extractChannelAvatar(feed);

    const guild = client.guilds.cache.get(ids.guildId);
    if (!guild) return;

    const channel = guild.channels.cache.get(ids.canais.videoNotify);
    if (!channel) return;

    const container = buildVideoNotifyContainer({
      videoTitle: title,
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      videoThumbnailUrl: thumbnail || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      channelAvatarUrl: avatar || 'https://i.ytimg.com/vi/default.jpg',
    });

    await channel.send({
      flags: MessageFlags.IsComponentsV2,
      components: [container],
    });

    console.log(`[BOT] Notificação de vídeo enviada: ${title}`);
    saveState({ lastVideoId: videoId });
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
