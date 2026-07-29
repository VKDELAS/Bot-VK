const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require('discord.js');
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
    .setDescription('Diagnóstico do bot: status e reset de estado')
    .addStringOption(o =>
      o.setName('acao')
        .setDescription('O que fazer')
        .setRequired(true)
        .addChoices(
          { name: 'Ver status do bot e variáveis', value: 'status' },
          { name: 'Resetar estados (permite re-notificar)', value: 'resetstate' },
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

      let ytState = { lastVideoId: null, lastLiveId: null };
      let twState = { isLive: false };
      try { if (fs.existsSync(STATE_PATH_YOUTUBE)) ytState = JSON.parse(fs.readFileSync(STATE_PATH_YOUTUBE, 'utf8')); } catch {}
      try { if (fs.existsSync(STATE_PATH_TWITCH))  twState = JSON.parse(fs.readFileSync(STATE_PATH_TWITCH, 'utf8')); } catch {}

      const guild = interaction.guild;
      const chanLive  = guild.channels.cache.get(ids.canais.liveNotify);
      const chanVideo = guild.channels.cache.get(ids.canais.videoNotify);

      const lines = [
        '## Diagnóstico do Bot\n',
        '**Variáveis de Ambiente:**',
        `• TWITCH_CLIENT_ID: ${twitchId ? 'OK' : 'AUSENTE'}`,
        `• TWITCH_CLIENT_SECRET: ${process.env.TWITCH_CLIENT_SECRET ? 'OK' : 'AUSENTE'}`,
        `• TWITCH_USERNAME: \`${twitchUser}\``,
        `• YOUTUBE_API_KEY: ${ytKey ? 'OK' : 'Ausente (usando RSS)'}`,
        `• YOUTUBE_CHANNEL_ID: \`${ytChannel}\``,
        `• DISCORD_LIVE_WEBHOOK_URL: ${webhookFixed ? 'OK' : webhookRaw ? 'URL inválida/duplicada' : 'Não configurado (usa canal do bot)'}`,
        '',
        '**Canais do Discord:**',
        `• Canal de Live: ${chanLive ? `#${chanLive.name}` : `Não encontrado (ID: ${ids.canais.liveNotify})`}`,
        `• Canal de Vídeo: ${chanVideo ? `#${chanVideo.name}` : `Não encontrado (ID: ${ids.canais.videoNotify})`}`,
        '',
        '**Estado Salvo:**',
        `• Último vídeo YT: \`${ytState.lastVideoId || 'nenhum'}\``,
        `• Última live YT: \`${ytState.lastLiveId || 'nenhum'}\``,
        `• Twitch ao vivo: \`${twState.isLive ? 'sim' : 'não'}\``,
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
        return interaction.editReply({ content: 'Estados resetados. O bot vai re-notificar na próxima detecção de live ou vídeo novo.' });
      } catch (e) {
        return interaction.editReply({ content: `Erro ao resetar: ${e.message}` });
      }
    }
  },
};
