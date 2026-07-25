const { MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { getLiveNotifyChannelId } = require('../utils/config');
const { buildLiveNotifyContainer } = require('../utils/live-notify-container');

const STATE_PATH = path.join(__dirname, '..', '..', '..', 'data', 'twitch-state.json');
const POLL_INTERVAL = 30 * 1000; // Checa a cada 30 segundos

function getTwitchUsername() {
  return (process.env.TWITCH_USERNAME || 'vk_delaass').trim();
}

function getWebhookUrl() {
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
    console.error('[BOT] Erro ao ler twitch-state.json:', error.message);
  }
  return { isLive: false, lastStreamId: null };
}

function saveState(state) {
  try {
    const dir = path.dirname(STATE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('[BOT] Erro ao salvar twitch-state.json:', error.message);
  }
}

let accessToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiresAt) return accessToken;

  const clientId = (process.env.TWITCH_CLIENT_ID || '').trim();
  const clientSecret = (process.env.TWITCH_CLIENT_SECRET || '').trim();

  if (!clientId || !clientSecret) {
    throw new Error('TWITCH_CLIENT_ID ou TWITCH_CLIENT_SECRET não configurados no arquivo .env');
  }

  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    }),
  });

  if (!response.ok) {
    throw new Error(`Falha ao obter token Twitch (HTTP ${response.status})`);
  }

  const data = await response.json();
  accessToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return accessToken;
}

let cachedAvatarUrl = null;
let avatarExpiresAt = 0;

async function getTwitchUserAvatar(username, token, clientId) {
  if (cachedAvatarUrl && Date.now() < avatarExpiresAt) return cachedAvatarUrl;
  try {
    const response = await fetch(`https://api.twitch.tv/helix/users?login=${username}`, {
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${token}`,
      },
    });
    if (response.ok) {
      const data = await response.json();
      if (data.data && data.data[0] && data.data[0].profile_image_url) {
        cachedAvatarUrl = data.data[0].profile_image_url;
        avatarExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
        return cachedAvatarUrl;
      }
    }
  } catch (error) {
    console.error('[BOT] Erro ao buscar avatar Twitch:', error.message);
  }
  return null;
}

async function checkTwitch(client) {
  const username = getTwitchUsername();
  const clientId = (process.env.TWITCH_CLIENT_ID || '').trim();

  if (!clientId) {
    console.warn('[BOT] TWITCH_CLIENT_ID ausente na Discloud / .env. Pulando verificação Twitch.');
    return;
  }

  try {
    const token = await getAccessToken();

    const response = await fetch(`https://api.twitch.tv/helix/streams?user_login=${username}`, {
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error('[BOT] Twitch API retornou status HTTP:', response.status);
      return;
    }

    const data = await response.json();
    const stream = data.data && data.data[0];
    const state = loadState();

    if (stream) {
      const isNewStream = !state.isLive || (state.lastStreamId !== stream.id);
      if (isNewStream) {
        console.log(`[BOT] 🔴 LIVE DETECTADA NA TWITCH (${username}): "${stream.title}" - Enviando notificação...`);

        const avatarUrl = await getTwitchUserAvatar(username, token, clientId);
        const thumbnailUrl = stream.thumbnail_url
          ? stream.thumbnail_url.replace('{width}x{height}', '1280x720') + `?t=${Date.now()}`
          : `https://static-cdn.jtvnw.net/previews-ttv/live_user_${username}-1280x720.jpg`;

        const container = buildLiveNotifyContainer({
          streamTitle: stream.title || 'Live sem título',
          gameName: stream.game_name || 'Sem categoria',
          streamThumbnailUrl: thumbnailUrl,
          avatarUrl: avatarUrl,
          platform: 'twitch',
          twitchUsername: username,
        });

        const webhookUrl = getWebhookUrl();
        if (webhookUrl) {
          const whRes = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              flags: MessageFlags.IsComponentsV2,
              components: [container],
            }),
          });
          if (!whRes.ok) {
            console.error(`[BOT] Webhook retornou status HTTP ${whRes.status}`);
          } else {
            console.log(`[BOT] ✅ Notificação enviada com sucesso via Webhook! (${username})`);
          }
        } else {
          const liveChannelId = getLiveNotifyChannelId();
          if (!liveChannelId) {
            console.error('[BOT] ❌ Canal de live não configurado! Use /canais live para definir o canal.');
            return;
          }

          const channel = client.channels.cache.get(liveChannelId);
          if (!channel) {
            console.error(`[BOT] ❌ Canal de live (${liveChannelId}) não encontrado no cache. Verifique se o bot tem acesso ao canal.`);
            return;
          }

          await channel.send({
            flags: MessageFlags.IsComponentsV2,
            components: [container],
          });
          console.log(`[BOT] ✅ Notificação enviada com sucesso via Canal Discord! (${username})`);
        }

        saveState({ isLive: true, lastStreamId: stream.id });
      }
    } else {
      if (state.isLive) {
        saveState({ isLive: false, lastStreamId: null });
        console.log(`[BOT] Twitch live de ${username} encerrada, estado de live resetado.`);
      }
    }
  } catch (error) {
    if (error.message && error.message.includes('403')) {
      console.error('[BOT] ❌ ERRO CRÍTICO NA TWITCH: TWITCH_CLIENT_SECRET inválido ou expirado! Gere um novo Secret em https://dev.twitch.tv/console/apps e atualize o .env');
    } else {
      console.error('[BOT] Erro ao verificar status da Twitch:', error.message || error);
    }
  }
}



function startTwitchMonitor(client) {
  const username = getTwitchUsername();
  console.log(`[BOT] Monitor de Twitch iniciado para o canal: ${username}`);
  checkTwitch(client);
  setInterval(() => checkTwitch(client), POLL_INTERVAL);
}

module.exports = { startTwitchMonitor };

