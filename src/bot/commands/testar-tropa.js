const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { MessageFlags } = require('discord.js');
const ids = require('../../lib/ids');
const {
  buildEntradaContainer,
  buildSaidaContainer,
} = require('../utils/entrada-saida-container');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('testar-tropa')
    .setDescription('Testa as mensagens de entrada/saída da Tropa do VK')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('entrada').setDescription('Testa a mensagem de entrada'),
    )
    .addSubcommand(sub =>
      sub.setName('saida').setDescription('Testa a mensagem de saída'),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    const canalId = sub === 'entrada' ? ids.canais.entrada : ids.canais.saida;
    const canal = await interaction.guild.channels.fetch(canalId);

    if (!canal) {
      await interaction.reply({
        content: `Canal de ${sub} não encontrado (ID: ${canalId}).`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const container =
      sub === 'entrada'
        ? buildEntradaContainer(interaction.member)
        : buildSaidaContainer(interaction.member);

    await canal.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });

    await interaction.reply({
      content: `Mensagem de teste (${sub}) enviada em ${canal}.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
