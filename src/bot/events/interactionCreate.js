const { EmbedBuilder } = require('discord.js');
const ids = require('../../lib/ids');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`[BOT] Erro no comando ${interaction.commandName}:`, error);
        const reply = interaction.deferred || interaction.replied
          ? interaction.editReply.bind(interaction)
          : interaction.reply.bind(interaction);
        await reply({ content: 'Ocorreu um erro ao executar este comando.', ephemeral: true });
      }
      return;
    }

    if (!interaction.isButton()) return;
    if (interaction.customId !== 'verificar') return;

    await interaction.deferReply({ ephemeral: true });

    try {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      if (!member) {
        return interaction.editReply({ content: 'Não foi possível identificar seu usuário.' });
      }

      const roleNaoInscrito = interaction.guild.roles.cache.get(ids.cargos.naoInscrito);
      const roleInscrito = interaction.guild.roles.cache.get(ids.cargos.inscrito);
      const roleVerificado = interaction.guild.roles.cache.get(ids.cargos.verificado);

      if (!roleInscrito || !roleVerificado) {
        const embed = new EmbedBuilder()
          .setTitle('Erro na Verificação')
          .setDescription('Os cargos de verificação não foram configurados corretamente no servidor.\n\n> Contate um administrador.')
          .setColor(0xED4245)
          .setTimestamp();
        return interaction.editReply({ embeds: [embed] });
      }

      if (member.roles.cache.has(ids.cargos.verificado)) {
        const embed = new EmbedBuilder()
          .setTitle('Você já está verificado')
          .setDescription('Seu acesso já foi liberado anteriormente.')
          .setColor(0xFEE75C)
          .setTimestamp();
        return interaction.editReply({ embeds: [embed] });
      }

      const rolesToAdd = [roleInscrito, roleVerificado].filter(Boolean);
      await member.roles.add(rolesToAdd, 'Verificação por botão');

      if (roleNaoInscrito && member.roles.cache.has(ids.cargos.naoInscrito)) {
        await member.roles.remove(roleNaoInscrito, 'Verificação concluída');
      }

      const embed = new EmbedBuilder()
        .setTitle('Verificação Concluída')
        .setDescription(
          'Seus cargos foram ajustados com sucesso.\n\n' +
          '**Acessos liberados**\n' +
          `• ${roleInscrito}\n` +
          `• ${roleVerificado}`
        )
        .setColor(0x57F287)
        .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      console.log(`[BOT] ${member.user.tag} verificou-se com sucesso`);
    } catch (error) {
      console.error('[BOT] Erro na verificação:', error);
        const embed = new EmbedBuilder()
          .setTitle('Erro na Verificação')
          .setDescription('Ocorreu um erro ao processar sua verificação. Tente novamente ou contate um administrador.')
          .setColor(0xED4245)
          .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    }
  },
};
