const { MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');
const ids = require('../../lib/ids');
const { buildLiveNotifyContainer } = require('../utils/live-notify-container');

const TWITCH_USERNAME = 'vk_delaass';
const STATE_PATH = path.join(__dirname, '..', '..', '..', 'data', 'twitch-state.json');
const POLL_INTERVAL = 90 * 1000;

function loadState() {
  try {
    if (fs.existsSync(STATE_PATH)) {
      return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
    }
  } catch (error) {
    console.error('[BOT] Erro ao ler twitch-state.json:', error.message);
  }
  return { isLive: false };
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('[BOT] Erro ao salvar twitch-state.json:', error.message);
  }
}

let accessToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiresAt) return accessToken;

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

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
    throw new Error(`Falha ao obter token Twitch: ${response.status}`);
  }

  const data = await response.json();
  accessToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return accessToken;
}

async function checkTwitch(client) {
  try {
    const token = await getAccessToken();
    const clientId = process.env.TWITCH_CLIENT_ID;

    const response = await fetch(`https://api.twitch.tv/helix/streams?user_login=${TWITCH_USERNAME}`, {
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error('[BOT] Twitch API retornou status:', response.status);
      return;
    }

    const data = await response.json();
    const stream = data.data && data.data[0];
    const state = loadState();

    if (stream) {
      if (!state.isLive) {
        const guild = client.guilds.cache.get(ids.guildId);
        if (!guild) return;

        const channel = guild.channels.cache.get(ids.canais.liveNotify);
        if (!channel) return;

        const thumbnailUrl = stream.thumbnail_url
          ? stream.thumbnail_url.replace('{width}x{height}', '640x360')
          : 'https://static-cdn.jtvnw.net/previews-ttv/live_user_vk_delaass-640x360.jpg';

        const container = buildLiveNotifyContainer({
          streamTitle: stream.title || 'Live sem título',
          gameName: stream.game_name || 'Sem categoria',
          streamThumbnailUrl: thumbnailUrl,
          avatarUrl: 'https://static-cdn.jtvnw.net/jtv_user_pictures/vk_delaass-profile_image-752f5e9e3b2b2a4e-150x150.png',
          platform: 'twitch',
        });

        await channel.send({
          flags: MessageFlags.IsComponentsV2,
          components: [container],
        });

        console.log(`[BOT] Notificação de live enviada: ${stream.title}`);
        saveState({ isLive: true });
      }
    } else {
      if (state.isLive) {
        saveState({ isLive: false });
        console.log('[BOT] Twitch live encerrada, estado resetado');
      }
    }
  } catch (error) {
    console.error('[BOT] Erro ao verificar Twitch:', error);
  }
}

function startTwitchMonitor(client) {
  console.log('[BOT] Monitor de Twitch iniciado');
  checkTwitch(client);
  setInterval(() => checkTwitch(client), POLL_INTERVAL);
}

module.exports = { startTwitchMonitor };
