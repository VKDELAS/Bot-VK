const { MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { getLiveNotifyChannelId, getVideoNotifyChannelId } = require('../utils/config');
const { buildVideoNotifyContainer } = require('../utils/video-notify-container');
const { buildLiveNotifyContainer } = require('../utils/live-notify-container');

const STATE_PATH = path.join(__dirname, '..', '..', '..', 'data', 'youtube-state.json');
const VIDEO_POLL_INTERVAL = 2 * 60 * 1000;  // 2 minutos para vídeos
const LIVE_POLL_INTERVAL  = 30 * 1000;       // 30 segundos para lives

function getChannelId() {
  return (process.env.YOUTUBE_CHANNEL_ID || 'UC3Bkdcwe1IwiZrg9CBB76OQ').trim();
}

function getVideoWebhookUrl() {
  let url = (process.env.DISCORD_VIDEO_WEBHOOK_URL || process.env.DISCORD_LIVE_WEBHOOK_URL || '').trim();
  if (!url) return null;
  if (url.includes('https://discord.com/api/webhooks/https://discord.com/api/webhooks/')) {
    url = url.replace('https://discord.com/api/webhooks/https://discord.com/api/webhooks/', 'https://discord.com/api/webhooks/');
  }
  return url;
}

function getLiveWebhookUrl() {
  let url = (process.env.DISCORD_LIVE_WEBHOOK_URL || '').trim();
  if (!url) return null;
  if (url.includes('https://discord.com/api/webhooks/https://discord.com/api/webhooks/')) {
    url = url.replace('https://discord.com/api/webhooks/https://discord.com/api/webhooks/', 'https://discord.com/api/webhooks/');
  }
  return url;
}

function loadState() {
  try {
    if (fs.existsSync(STATE_PATH)) {
      return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
    }
  } catch (error) {
    console.error('[BOT] Erro ao ler estado YouTube:', error.message);
  }
  return { lastVideoId: null, lastLiveId: null };
}

function saveState(state) {
  try {
    const dir = path.dirname(STATE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('[BOT] Erro ao salvar estado YouTube:', error.message);
  }
}

// Lê o feed RSS e retorna lista de vídeos com info de live
async function fetchRssEntries(channelId) {
  try {
    const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) {
      console.error('[BOT] RSS YouTube retornou HTTP', response.status);
      return [];
    }
    const xml = await response.text();

    const entries = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;
    while ((match = entryRegex.exec(xml)) !== null) {
      const entry = match[1];
      const videoIdMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
      const titleMatch   = entry.match(/<title>(.*?)<\/title>/);
      const isLiveMatch  = entry.match(/<media:content[^>]*medium="video"[^>]*\/>/) ||
                           entry.match(/<media:live[^>]*>true<\/media:live>/);

      if (!videoIdMatch || !titleMatch) continue;

      const videoId = videoIdMatch[1].trim();
      const rawTitle = titleMatch[1]
        .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
        .trim();

      // Detecta live pelos emojis/indicadores no título + campo yt:startTime
      const liveStartMatch = entry.match(/<yt:startTime>(.*?)<\/yt:startTime>/);
      const hasLiveEmoji   = /^🔴/.test(rawTitle) || rawTitle.toLowerCase().includes('[live]');
      const hasStartTime   = !!liveStartMatch;

      // Verifica se a live está ativa agora via oEmbed (leve e sem API key)
      entries.push({ videoId, title: rawTitle, hasLiveEmoji, hasStartTime });
    }
    return entries;
  } catch (error) {
    console.error('[BOT] Erro ao buscar RSS YouTube:', error.message);
    return [];
  }
}

// Verifica se a live está ativa checando o thumbnail especial do YouTube
// Enquanto a live está ao vivo, o YouTube serve uma thumbnail diferente via img.youtube.com
async function isCurrentlyLive(videoId) {
  try {
    // A thumbnail maxresdefault só é atualizada em tempo real durante lives ativas
    // Verificamos via oEmbed: se o tipo for "video" com título contendo 🔴 no RSS = live ativa
    const oembedRes = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { signal: AbortSignal.timeout(8000) }
    );
    // Se oEmbed falhar = vídeo privado/indisponível
    return oembedRes.ok;
  } catch {
    return false;
  }
}

async function sendToChannel(client, type, container) {
  const channelId = type === 'liveNotify' ? getLiveNotifyChannelId() : getVideoNotifyChannelId();
  if (!channelId) {
    console.error(`[BOT] ❌ Canal de ${type === 'liveNotify' ? 'live' : 'vídeo'} não configurado! Use /canais ${type === 'liveNotify' ? 'live' : 'video'} para definir o canal.`);
    return false;
  }
  const channel = client.channels.cache.get(channelId);
  if (!channel) {
    console.error(`[BOT] ❌ Canal ${type} (${channelId}) não encontrado no cache.`);
    return false;
  }
  await channel.send({ flags: MessageFlags.IsComponentsV2, components: [container] });
  return true;
}

async function sendViaWebhook(webhookUrl, container) {
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ flags: MessageFlags.IsComponentsV2, components: [container.toJSON()] }),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => '(sem corpo)');
    console.error(`[BOT] Webhook retornou HTTP ${res.status}: ${errBody}`);
  }
  return res.ok;
}

async function checkYouTubeLive(client) {
  try {
    const channelId = getChannelId();
    const entries = await fetchRssEntries(channelId);
    if (!entries.length) return;

    const state = loadState();

    // Procura live: emoji 🔴 no título (padrão usado por streamers)
    for (const entry of entries) {
      const isLiveEntry = entry.hasLiveEmoji || entry.hasStartTime;
      if (!isLiveEntry) continue;

      // Se já notificamos essa live, não reenvia
      if (state.lastLiveId === entry.videoId) return;

      // Confirma que o video está disponível (não foi deletado)
      const available = await isCurrentlyLive(entry.videoId);
      if (!available) continue;

      console.log(`[BOT] 🔴 LIVE DETECTADA NO YOUTUBE: "${entry.title}" - Enviando notificação...`);
      const thumbnailUrl = `https://img.youtube.com/vi/${entry.videoId}/maxresdefault.jpg`;

      const container = buildLiveNotifyContainer({
        streamTitle: entry.title,
        gameName: 'YouTube Live',
        streamThumbnailUrl: thumbnailUrl,
        avatarUrl: null,
        platform: 'youtube',
        videoId: entry.videoId,
      });

      const webhookUrl = getLiveWebhookUrl();
      if (webhookUrl) {
        const ok = await sendViaWebhook(webhookUrl, container);
        console.log(ok ? '[BOT] ✅ Notificação de live YouTube enviada via Webhook!' : '[BOT] ❌ Webhook falhou.');
      } else {
        const ok = await sendToChannel(client, 'liveNotify', container);
        console.log(ok ? '[BOT] ✅ Notificação de live YouTube enviada via Canal Discord!' : '[BOT] ❌ Falha ao enviar pelo canal.');
      }

      saveState({ ...state, lastLiveId: entry.videoId });
      return;
    }

    // Nenhuma live encontrada no RSS - se tinha uma, encerrou
    if (state.lastLiveId) {
      saveState({ ...state, lastLiveId: null });
      console.log('[BOT] YouTube live encerrada, estado resetado.');
    }
  } catch (error) {
    console.error('[BOT] Erro no checkYouTubeLive:', error.message || error);
  }
}

async function checkYouTube(client) {
  try {
    const channelId = getChannelId();
    const entries = await fetchRssEntries(channelId);
    if (!entries.length) return;

    const state = loadState();
    const latest = entries[0]; // Primeiro = mais recente

    // Pula lives (já tratadas em checkYouTubeLive)
    if (latest.hasLiveEmoji || latest.hasStartTime) return;

    if (state.lastVideoId === latest.videoId) return;

    // Primeira execução: salva sem enviar (evita spam de vídeo antigo)
    if (!state.lastVideoId) {
      console.log(`[BOT] YouTube: primeiro boot, salvando estado sem notificar (${latest.title})`);
      saveState({ ...state, lastVideoId: latest.videoId });
      return;
    }

    console.log(`[BOT] 📹 Vídeo novo detectado no YouTube: "${latest.title}" - Enviando notificação...`);
    const thumbnailUrl = `https://img.youtube.com/vi/${latest.videoId}/maxresdefault.jpg`;

    const container = buildVideoNotifyContainer({
      videoTitle: latest.title,
      videoUrl: `https://www.youtube.com/watch?v=${latest.videoId}`,
      videoThumbnailUrl: thumbnailUrl,
      channelAvatarUrl: null,
    });

    const webhookUrl = getVideoWebhookUrl();
    if (webhookUrl) {
      const ok = await sendViaWebhook(webhookUrl, container);
      console.log(ok ? '[BOT] ✅ Notificação de vídeo YouTube enviada via Webhook!' : '[BOT] ❌ Webhook falhou.');
    } else {
      const ok = await sendToChannel(client, 'videoNotify', container);
      console.log(ok ? '[BOT] ✅ Notificação de vídeo YouTube enviada via Canal Discord!' : '[BOT] ❌ Falha ao enviar pelo canal.');
    }

    saveState({ ...state, lastVideoId: latest.videoId });
  } catch (error) {
    console.error('[BOT] Erro no checkYouTube:', error.message || error);
  }
}

function startYoutubeMonitor(client) {
  const channelId = getChannelId();
  console.log(`[BOT] Monitor de YouTube iniciado para o canal: ${channelId}`);
  // Roda imediatamente e depois em intervalos
  checkYouTubeLive(client);
  checkYouTube(client);
  setInterval(() => checkYouTubeLive(client), LIVE_POLL_INTERVAL);
  setInterval(() => checkYouTube(client), VIDEO_POLL_INTERVAL);
}

module.exports = { startYoutubeMonitor };
