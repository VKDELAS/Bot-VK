const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { setLiveNotifyChannelId, setVideoNotifyChannelId, getLiveNotifyChannelId, getVideoNotifyChannelId } = require('../utils/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('canais')
    .setDescription('Configura os canais de notificação do bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub
        .setName('live')
        .setDescription('Define o canal onde as notificações de LIVE serão enviadas')
        .addChannelOption(opt =>
          opt
            .setName('canal')
            .setDescription('Selecione o canal de texto')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('video')
        .setDescription('Define o canal onde as notificações de VÍDEO serão enviadas')
        .addChannelOption(opt =>
          opt
            .setName('canal')
            .setDescription('Selecione o canal de texto')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('ver')
        .setDescription('Mostra os canais de notificação configurados atualmente')
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const sub = interaction.options.getSubcommand();

    if (sub === 'ver') {
      const liveId = getLiveNotifyChannelId();
      const videoId = getVideoNotifyChannelId();
      const liveText = liveId ? `<#${liveId}>` : '❌ Não configurado';
      const videoText = videoId ? `<#${videoId}>` : '❌ Não configurado';
      return interaction.editReply({
        content: `📡 **Canais de notificação configurados:**\n\n🔴 **Live:** ${liveText}\n📹 **Vídeo:** ${videoText}`,
      });
    }

    const channel = interaction.options.getChannel('canal');

    if (sub === 'live') {
      setLiveNotifyChannelId(channel.id);
      return interaction.editReply({
        content: `✅ Canal de notificação de **LIVE** definido como ${channel}!\n\nAgora quando a live começar, o bot vai enviar a notificação lá automaticamente.`,
      });
    }

    if (sub === 'video') {
      setVideoNotifyChannelId(channel.id);
      return interaction.editReply({
        content: `✅ Canal de notificação de **VÍDEO** definido como ${channel}!\n\nAgora quando um novo vídeo for publicado, o bot vai avisar lá.`,
      });
    }
  },
};
