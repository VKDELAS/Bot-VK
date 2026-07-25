const { MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');
const ids = require('../../lib/ids');
const { buildVideoNotifyContainer } = require('../utils/video-notify-container');
const { buildLiveNotifyContainer } = require('../utils/live-notify-container');

const API_BASE = 'https://www.googleapis.com/youtube/v3';
const STATE_PATH = path.join(__dirname, '..', '..', '..', 'data', 'youtube-state.json');
const LIVE_STATE_PATH = path.join(__dirname, '..', '..', '..', 'data', 'youtube-live-state.json');

function getChannelId() {
  return process.env.YOUTUBE_CHANNEL_ID || 'UC3Bkdcwe1IwiZrg9CBB76OQ';
}

function loadState(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (error) {
    console.error('[BOT] Erro ao ler estado YouTube:', error.message);
  }
  return { lastVideoId: null, lastLiveId: null };
}

function saveState(filePath, state) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('[BOT] Erro ao salvar estado YouTube:', error.message);
  }
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

let cachedYoutubeAvatar = null;
let youtubeAvatarExpiresAt = 0;

async function getYouTubeChannelAvatar(channelId) {
  if (cachedYoutubeAvatar && Date.now() < youtubeAvatarExpiresAt) return cachedYoutubeAvatar;
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `${API_BASE}/channels?key=${apiKey}&id=${channelId}&part=snippet`;
    const data = await fetchJson(url);
    if (data.items && data.items[0] && data.items[0].snippet && data.items[0].snippet.thumbnails) {
      const thumbs = data.items[0].snippet.thumbnails;
      cachedYoutubeAvatar = (thumbs.high || thumbs.medium || thumbs.default).url;
      youtubeAvatarExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
      return cachedYoutubeAvatar;
    }
  } catch (err) {
    // Silenciosamente ignora e usa fallback
  }
  return null;
}

// Fallback gratuito via RSS XML sem necessidade de API Key
async function getLatestVideoFromRss(channelId) {
  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const response = await fetch(rssUrl);
    if (!response.ok) return null;
    const xml = await response.text();

    const videoIdMatch = xml.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
    const titleMatch = xml.match(/<title>(.*?)<\/title>/g);

    if (videoIdMatch && titleMatch && titleMatch.length > 1) {
      const videoId = videoIdMatch[1];
      // O primeiro título no XML é o do canal, o segundo é o do primeiro vídeo
      const rawTitle = titleMatch[1].replace(/<\/?title>/g, '').replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1');
      return {
        videoId,
        title: rawTitle,
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      };
    }
  } catch (error) {
    console.error('[BOT] Erro ao buscar RSS do YouTube:', error.message);
  }
  return null;
}

async function getLatestVideo() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = getChannelId();

  if (!apiKey) {
    return getLatestVideoFromRss(channelId);
  }

  try {
    // Busca os últimos vídeos postados (redefinido sem eventType=completed)
    const url = `${API_BASE}/search?key=${apiKey}&channelId=${channelId}&part=snippet&type=video&order=date&maxResults=1`;
    const data = await fetchJson(url);
    if (!data.items || data.items.length === 0) return null;
    const item = data.items[0];
    return {
      videoId: item.id.videoId,
      title: item.snippet.title,
      thumbnailUrl: `https://i.ytimg.com/vi/${item.id.videoId}/maxresdefault.jpg`,
    };
  } catch (error) {
    console.warn('[BOT] API do YouTube falhou. Usando fallback de RSS:', error.message);
    return getLatestVideoFromRss(channelId);
  }
}

async function getLatestLive() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;
  const channelId = getChannelId();

  try {
    const url = `${API_BASE}/search?key=${apiKey}&channelId=${channelId}&part=snippet&type=video&eventType=live&order=date&maxResults=1`;
    const data = await fetchJson(url);
    if (!data.items || data.items.length === 0) return null;
    const item = data.items[0];
    return {
      videoId: item.id.videoId,
      title: item.snippet.title,
      thumbnailUrl: `https://i.ytimg.com/vi/${item.id.videoId}/maxresdefault.jpg`,
    };
  } catch (error) {
    console.error('[BOT] Erro ao verificar Live no YouTube:', error.message);
    return null;
  }
}

async function checkYouTube(client) {
  try {
    const video = await getLatestVideo();
    if (!video) return;

    const state = loadState(STATE_PATH);
    if (state.lastVideoId === video.videoId) return;

    // Se for primeira execução e o estado estiver nulo, salva para não spammar vídeos antigos
    if (!state.lastVideoId) {
      saveState(STATE_PATH, { lastVideoId: video.videoId });
      return;
    }

    const guild = client.guilds.cache.get(ids.guildId);
    if (!guild) return;

    const channel = guild.channels.cache.get(ids.canais.videoNotify);
    if (!channel) return;

    const avatarUrl = await getYouTubeChannelAvatar(getChannelId());

    const container = buildVideoNotifyContainer({
      videoTitle: video.title,
      videoUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
      videoThumbnailUrl: video.thumbnailUrl,
      channelAvatarUrl: avatarUrl,
    });

    await channel.send({
      flags: MessageFlags.IsComponentsV2,
      components: [container],
    });

    console.log(`[BOT] 📹 Notificação de vídeo enviada no Discord: "${video.title}"`);
    saveState(STATE_PATH, { lastVideoId: video.videoId });
  } catch (error) {
    console.error('[BOT] Erro no checkYouTube:', error.message || error);
  }
}

async function checkYouTubeLive(client) {
  try {
    const live = await getLatestLive();
    const liveState = loadState(LIVE_STATE_PATH);

    if (live) {
      if (liveState.lastLiveId === live.videoId) return;

      const guild = client.guilds.cache.get(ids.guildId);
      if (!guild) return;

      const channel = guild.channels.cache.get(ids.canais.liveNotify);
      if (!channel) return;

      const avatarUrl = await getYouTubeChannelAvatar(getChannelId());

      const container = buildLiveNotifyContainer({
        streamTitle: live.title,
        gameName: 'YouTube Live',
        streamThumbnailUrl: live.thumbnailUrl,
        avatarUrl: avatarUrl,
        platform: 'youtube',
        videoId: live.videoId,
      });

      await channel.send({
        flags: MessageFlags.IsComponentsV2,
        components: [container],
      });

      console.log(`[BOT] 🔴 Notificação de live YouTube enviada no Discord: "${live.title}"`);
      saveState(LIVE_STATE_PATH, { lastLiveId: live.videoId });
    } else {
      if (liveState.lastLiveId) {
        saveState(LIVE_STATE_PATH, { lastLiveId: null });
        console.log('[BOT] YouTube live encerrada, estado resetado.');
      }
    }
  } catch (error) {
    console.error('[BOT] Erro no checkYouTubeLive:', error.message || error);
  }
}

function startYoutubeMonitor(client) {
  const channelId = getChannelId();
  console.log(`[BOT] Monitor de YouTube iniciado para o canal: ${channelId}`);
  checkYouTube(client);
  checkYouTubeLive(client);
  setInterval(() => checkYouTube(client), 3 * 60 * 1000);
  setInterval(() => checkYouTubeLive(client), 2 * 60 * 1000);
}

module.exports = { startYoutubeMonitor };

