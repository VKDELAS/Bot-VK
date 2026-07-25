const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { buildVideoNotifyContainer } = require('../utils/video-notify-container');
const { buildLiveNotifyContainer } = require('../utils/live-notify-container');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('testar-embeds')
    .setDescription('Testa os containers de notificação de vídeo e live')
    .addStringOption(option =>
      option
        .setName('tipo')
        .setDescription('Qual container testar')
        .addChoices(
          { name: 'Vídeo novo (YouTube)', value: 'video' },
          { name: 'Live (Twitch)', value: 'live-twitch' },
          { name: 'Live (YouTube)', value: 'live-youtube' },
          { name: 'Ambos', value: 'both' },
        ),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const tipo = interaction.options.getString('tipo') || 'both';
    const guildIcon = interaction.guild?.iconURL({ extension: 'png', size: 256 });
    const twitchUsername = process.env.TWITCH_USERNAME || 'vk_delaass';

    try {
      if (tipo === 'video' || tipo === 'both') {
        const videoContainer = buildVideoNotifyContainer({
          videoTitle: 'TESTE — Novo Vídeo no Canal VK DELAS',
          videoUrl: 'https://www.youtube.com/@vk_delaass',
          videoThumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
          channelAvatarUrl: guildIcon,
        });

        await interaction.channel.send({
          flags: MessageFlags.IsComponentsV2,
          components: [videoContainer],
        });
      }

      if (tipo === 'live-twitch' || tipo === 'both') {
        const liveContainer = buildLiveNotifyContainer({
          streamTitle: 'TESTE — Transmissão Ao Vivo na Twitch!',
          gameName: 'Just Chatting',
          streamThumbnailUrl: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${twitchUsername}-1280x720.jpg?t=${Date.now()}`,
          avatarUrl: guildIcon,
          platform: 'twitch',
          twitchUsername: twitchUsername,
        });

        await interaction.channel.send({
          flags: MessageFlags.IsComponentsV2,
          components: [liveContainer],
        });
      }

      if (tipo === 'live-youtube' || tipo === 'both') {
        const liveContainer = buildLiveNotifyContainer({
          streamTitle: 'TESTE — Transmissão Ao Vivo no YouTube!',
          gameName: 'YouTube Live',
          streamThumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
          avatarUrl: guildIcon,
          platform: 'youtube',
          videoId: 'dQw4w9WgXcQ',
        });

        await interaction.channel.send({
          flags: MessageFlags.IsComponentsV2,
          components: [liveContainer],
        });
      }

      await interaction.editReply({ content: '✅ Containers de teste enviados com sucesso neste canal!' });
    } catch (error) {
      console.error('[BOT] Erro ao testar embeds:', error);
      await interaction.editReply({ content: `❌ Erro ao enviar teste: ${error.message}` });
    }
  },
};

