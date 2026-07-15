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
        .setDescription('Qual embed testar')
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

    try {
      if (tipo === 'video' || tipo === 'both') {
        const videoContainer = buildVideoNotifyContainer({
          videoTitle: 'TESTE — Como criar um bot no Discord',
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          videoThumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
          channelAvatarUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_kTest123=s176-c-k-c0x00ffffff-no-rj',
        });

        await interaction.channel.send({
          flags: MessageFlags.IsComponentsV2,
          components: [videoContainer],
        });
      }

      if (tipo === 'live-twitch' || tipo === 'both') {
        const liveContainer = buildLiveNotifyContainer({
          streamTitle: 'TESTE — Live chill jogando qualquer coisa',
          gameName: 'Just Chatting',
          streamThumbnailUrl: 'https://static-cdn.jtvnw.net/previews-ttv/live_user_vk_delaass-640x360.jpg',
          avatarUrl: 'https://static-cdn.jtvnw.net/jtv_user_pictures/vk_delaass-profile_image-752f5e9e3b2b2a4e-150x150.png',
          platform: 'twitch',
        });

        await interaction.channel.send({
          flags: MessageFlags.IsComponentsV2,
          components: [liveContainer],
        });
      }

      if (tipo === 'live-youtube' || tipo === 'both') {
        const liveContainer = buildLiveNotifyContainer({
          streamTitle: 'TESTE — Live no YouTube',
          gameName: 'YouTube Live',
          streamThumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
          avatarUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_kTest123=s176-c-k-c0x00ffffff-no-rj',
          platform: 'youtube',
          videoId: 'dQw4w9WgXcQ',
        });

        await interaction.channel.send({
          flags: MessageFlags.IsComponentsV2,
          components: [liveContainer],
        });
      }

      await interaction.editReply({ content: 'Containers enviados com sucesso neste canal.' });
    } catch (error) {
      console.error('[BOT] Erro ao testar embeds:', error);
      await interaction.editReply({ content: `Erro: ${error.message}` });
    }
  },
};
