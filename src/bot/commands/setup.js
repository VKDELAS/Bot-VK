const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setupPainel } = require('../utils/sendPainel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Envia ou atualiza o painel de verificação')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      await setupPainel(interaction.guild);
      await interaction.editReply({ content: 'Painel de verificação enviado com sucesso.' });
    } catch (error) {
      await interaction.editReply({ content: `Erro: ${error.message}` });
    }
  },
};
