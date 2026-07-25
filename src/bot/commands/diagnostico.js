const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require('discord.js');
const { buildLiveNotifyContainer } = require('../utils/live-notify-container');
const { buildVideoNotifyContainer } = require('../utils/video-notify-container');
const ids = require('../../lib/ids');
const fs = require('fs');
const path = require('path');

const STATE_PATH_YOUTUBE = path.join(__dirname, '..', '..', '..', 'data', 'youtube-state.json');
const STATE_PATH_TWITCH  = path.join(__dirname, '..', '..', '..', 'data', 'twitch-state.json');

function sanitizeWebhook(url) {
  if (!url) return null;
  url = url.trim();
  if (url.includes('https://discord.com/api/webhooks/https://discord.com/api/webhooks/')) {
    url = url.replace('https://discord.com/api/webhooks/https://discord.com/api/webhooks/', 'https://discord.com/api/webhooks/');
  }
  return url.startsWith('http') ? url : null;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('diagnostico')
    .setDescription('Diagnóstico completo do bot + forçar envio de notificação de teste')
    .addStringOption(o =>
      o.setName('acao')
        .setDescription('O que fazer')
        .setRequired(true)
        .addChoices(
          { name: '🔍 Ver status do bot e variáveis', value: 'status' },
          { name: '🔴 Forçar notificação de LIVE (Twitch)', value: 'forcalive-twitch' },
          { name: '🔴 Forçar notificação de LIVE (YouTube)', value: 'forcalive-youtube' },
          { name: '📹 Forçar notificação de VÍDEO (YouTube)', value: 'forcavideo' },
          { name: '🗑️ Resetar estados (permite re-notificar)', value: 'resetstate' },
        ),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const acao = interaction.options.getString('acao');

    // ─── STATUS ───────────────────────────────────────────────────
    if (acao === 'status') {
      const webhookRaw = process.env.DISCORD_LIVE_WEBHOOK_URL || '';
      const webhookFixed = sanitizeWebhook(webhookRaw);
      const twitchId  = (process.env.TWITCH_CLIENT_ID || '').trim();
      const ytKey     = (process.env.YOUTUBE_API_KEY || '').trim();
      const ytChannel = (process.env.YOUTUBE_CHANNEL_ID || 'UC3Bkdcwe1IwiZrg9CBB76OQ').trim();
      const twitchUser = (process.env.TWITCH_USERNAME || 'vk_delaass').trim();

      // Lê estados salvos
      let ytState = { lastVideoId: null, lastLiveId: null };
      let twState = { isLive: false };
      try { if (fs.existsSync(STATE_PATH_YOUTUBE)) ytState = JSON.parse(fs.readFileSync(STATE_PATH_YOUTUBE, 'utf8')); } catch {}
      try { if (fs.existsSync(STATE_PATH_TWITCH))  twState = JSON.parse(fs.readFileSync(STATE_PATH_TWITCH, 'utf8')); } catch {}

      // Checa canais
      const guild = interaction.guild;
      const chanLive  = guild.channels.cache.get(ids.canais.liveNotify);
      const chanVideo = guild.channels.cache.get(ids.canais.videoNotify);

      const lines = [
        '## 🔍 Diagnóstico do Bot\n',
        '**🔑 Variáveis de Ambiente:**',
        `• TWITCH_CLIENT_ID: ${twitchId ? '✅ OK' : '❌ AUSENTE'}`,
        `• TWITCH_CLIENT_SECRET: ${process.env.TWITCH_CLIENT_SECRET ? '✅ OK' : '❌ AUSENTE'}`,
        `• TWITCH_USERNAME: \`${twitchUser}\``,
        `• YOUTUBE_API_KEY: ${ytKey ? '✅ OK' : '⚠️ Ausente (usando RSS)'}`,
        `• YOUTUBE_CHANNEL_ID: \`${ytChannel}\``,
        `• DISCORD_LIVE_WEBHOOK_URL: ${webhookFixed ? '✅ OK' : webhookRaw ? '❌ URL INVÁLIDA/DUPLICADA' : '⚠️ Não configurado (usa canal do bot)'}`,
        '',
        '**📺 Canais do Discord:**',
        `• Canal de Live: ${chanLive ? `✅ #${chanLive.name}` : `❌ Não encontrado (ID: ${ids.canais.liveNotify})`}`,
        `• Canal de Vídeo: ${chanVideo ? `✅ #${chanVideo.name}` : `❌ Não encontrado (ID: ${ids.canais.videoNotify})`}`,
        '',
        '**💾 Estado Salvo:**',
        `• Último vídeo YT: \`${ytState.lastVideoId || 'nenhum'}\``,
        `• Última live YT: \`${ytState.lastLiveId || 'nenhum'}\``,
        `• Twitch ao vivo: \`${twState.isLive ? 'SIM' : 'NÃO'}\``,
        `• Último stream ID Twitch: \`${twState.lastStreamId || 'nenhum'}\``,
        '',
        '> Use `/diagnostico resetstate` para limpar os estados e permitir re-notificar.',
      ];

      return interaction.editReply({ content: lines.join('\n') });
    }

    // ─── RESETAR ESTADO ───────────────────────────────────────────
    if (acao === 'resetstate') {
      try {
        const dir = path.join(__dirname, '..', '..', '..', 'data');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(STATE_PATH_YOUTUBE, JSON.stringify({ lastVideoId: null, lastLiveId: null }, null, 2));
        fs.writeFileSync(STATE_PATH_TWITCH,  JSON.stringify({ isLive: false, lastStreamId: null }, null, 2));
        return interaction.editReply({ content: '✅ **Estados resetados!**\nO bot vai re-notificar na próxima detecção de live ou vídeo novo.' });
      } catch (e) {
        return interaction.editReply({ content: `❌ Erro ao resetar: ${e.message}` });
      }
    }

    // ─── FORÇAR LIVE TWITCH ───────────────────────────────────────
    if (acao === 'forcalive-twitch') {
      const twitchUser = (process.env.TWITCH_USERNAME || 'vk_delaass').trim();
      const container = buildLiveNotifyContainer({
        streamTitle: '🔴 LIVE DE TESTE — Bot funcionando!',
        gameName: 'Just Chatting',
        streamThumbnailUrl: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${twitchUser}-1280x720.jpg`,
        avatarUrl: interaction.guild.iconURL({ extension: 'png', size: 256 }),
        platform: 'twitch',
        twitchUsername: twitchUser,
      });
      return sendNotification(interaction, container, 'liveNotify', '🔴 Live Twitch (TESTE)');
    }

    // ─── FORÇAR LIVE YOUTUBE ──────────────────────────────────────
    if (acao === 'forcalive-youtube') {
      const container = buildLiveNotifyContainer({
        streamTitle: '🔴 LIVE DE TESTE — Bot funcionando no YouTube!',
        gameName: 'YouTube Live',
        streamThumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        avatarUrl: interaction.guild.iconURL({ extension: 'png', size: 256 }),
        platform: 'youtube',
        videoId: 'dQw4w9WgXcQ',
      });
      return sendNotification(interaction, container, 'liveNotify', '🔴 Live YouTube (TESTE)');
    }

    // ─── FORÇAR VÍDEO YOUTUBE ─────────────────────────────────────
    if (acao === 'forcavideo') {
      const container = buildVideoNotifyContainer({
        videoTitle: '📹 VÍDEO DE TESTE — Bot funcionando!',
        videoUrl: 'https://www.youtube.com/@vk_delas',
        videoThumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        channelAvatarUrl: interaction.guild.iconURL({ extension: 'png', size: 256 }),
      });
      return sendNotification(interaction, container, 'videoNotify', '📹 Vídeo YouTube (TESTE)');
    }
  },
};

async function sendNotification(interaction, container, channelKey, label) {
  const webhookRaw = process.env.DISCORD_LIVE_WEBHOOK_URL || '';
  const webhookUrl = sanitizeWebhook(webhookRaw);

  try {
    if (webhookUrl) {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flags: MessageFlags.IsComponentsV2, components: [container] }),
      });
      if (res.ok) {
        return interaction.editReply({ content: `✅ **${label}** enviado com sucesso via **Webhook**!\nVerifique o canal de notificações.` });
      }
      const body = await res.text();
      return interaction.editReply({ content: `❌ Webhook falhou (HTTP ${res.status}): ${body}\n\nTente \`/diagnostico status\` para checar a URL.` });
    }

    // Sem webhook: envia pelo canal do bot
    const guild = interaction.guild;
    const channel = guild.channels.cache.get(ids.canais[channelKey]);
    if (!channel) {
      return interaction.editReply({ content: `❌ Canal \`${channelKey}\` não encontrado (ID: ${ids.canais[channelKey]}).\nUse \`/diagnostico status\` para ver o diagnóstico completo.` });
    }
    await channel.send({ flags: MessageFlags.IsComponentsV2, components: [container] });
    return interaction.editReply({ content: `✅ **${label}** enviado com sucesso para ${channel}!` });
  } catch (e) {
    return interaction.editReply({ content: `❌ Erro ao enviar: \`${e.message}\`\n\nUse \`/diagnostico status\` para verificar as configurações.` });
  }
}
