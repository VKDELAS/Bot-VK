const {
  EmbedBuilder,
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ThumbnailBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');
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

      const logChannel = interaction.guild.channels.cache.get(ids.canais.logs);
      if (logChannel) {
        const logContainer = new ContainerBuilder().setAccentColor(0x57F287);

        logContainer.addSectionComponents(
          new SectionBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              '## Verificação Realizada'
            )
          ).setThumbnailAccessory(
            new ThumbnailBuilder().setURL(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
          )
        );

        logContainer.addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
        );

        logContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `> **Usuário:** ${member} (${member.user.tag})\n` +
            `> **ID:** \`${member.id}\`\n` +
            `> **Cargos adicionados:** ${rolesToAdd.filter(Boolean).map(r => r.toString()).join(', ')}`
          )
        );

        logContainer.addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
        );

        logContainer.addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setLabel('Perfil')
              .setURL(`https://discord.com/users/${member.id}`)
              .setStyle(ButtonStyle.Link)
          )
        );

        logContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `-# ${interaction.guild.name} · verificação registrada automaticamente`
          )
        );

        await logChannel.send({
          components: [logContainer],
          flags: MessageFlags.IsComponentsV2,
        });
      }
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
