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

    try {
      await interaction.deferReply({ ephemeral: true });
    } catch (error) {
      // Interação expirou antes do bot conseguir responder (ex: cold start,
      // instabilidade da hospedagem). Não há mais como responder a ela.
      console.error('[BOT] Falha ao dar defer na interação de verificação (provavelmente expirou):', error.message);
      return;
    }

    try {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      if (!member) {
        return interaction.editReply({ content: 'Não foi possível identificar seu usuário.' });
      }

      const roleNaoInscrito = interaction.guild.roles.cache.get(ids.cargos.naoInscrito);
      const roleInscrito = interaction.guild.roles.cache.get(ids.cargos.inscrito);
      const roleVerificado = interaction.guild.roles.cache.get(ids.cargos.verificado);

      if (!roleInscrito || !roleVerificado) {
        const errorContainer = new ContainerBuilder()
          .setAccentColor(0xED4245)
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('⚠️ **ERRO DE CONFIGURAÇÃO**'),
          )
          .addSectionComponents(
            new SectionBuilder().addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                '## Cargos não encontrados\n' +
                'Os cargos de verificação não foram encontrados ou configurados neste servidor.\n\n' +
                '> Entre em contato com a equipe de administração.'
              )
            )
          );
        return interaction.editReply({ components: [errorContainer], flags: MessageFlags.IsComponentsV2 });
      }

      if (member.roles.cache.has(ids.cargos.verificado)) {
        const alreadyContainer = new ContainerBuilder()
          .setAccentColor(0xFEE75C)
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('ℹ️ **VOCÊ JÁ ESTÁ VERIFICADO**'),
          )
          .addSectionComponents(
            new SectionBuilder().addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                '## Acesso Liberado\n' +
                'Seu perfil já possui a verificação concluída e seu acesso já está liberado!\n\n' +
                'Aproveite a comunidade e os canais disponíveis.'
              )
            )
          );
        return interaction.editReply({ components: [alreadyContainer], flags: MessageFlags.IsComponentsV2 });
      }

      const rolesToAdd = [roleInscrito, roleVerificado].filter(Boolean);
      await member.roles.add(rolesToAdd, 'Verificação por botão');

      if (roleNaoInscrito && member.roles.cache.has(ids.cargos.naoInscrito)) {
        await member.roles.remove(roleNaoInscrito, 'Verificação concluída');
      }

      const successContainer = new ContainerBuilder()
        .setAccentColor(0x57F287)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('🎉 **VERIFICAÇÃO CONCLUÍDA COM SUCESSO!**'),
        )
        .addSectionComponents(
          new SectionBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              '## Acesso Total Concedido\n' +
              'Seus cargos foram atualizados e o seu acesso ao servidor foi liberado.\n\n' +
              '**Cargos Recebidos:**\n' +
              `• ${roleInscrito}\n` +
              `• ${roleVerificado}`
            )
          )
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `-# ${interaction.guild.name} • Obrigado por se verificar!`
          )
        );

      await interaction.editReply({ components: [successContainer], flags: MessageFlags.IsComponentsV2 });
      console.log(`[BOT] ${member.user.tag} verificou-se com sucesso`);

      const logChannel = interaction.guild.channels.cache.get(ids.canais.logs);
      if (logChannel) {
        const logContainer = new ContainerBuilder().setAccentColor(0x57F287);

        const memberAvatar = member.user.displayAvatarURL({ extension: 'png', size: 256 });

        const logSection = new SectionBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            '## Verificação Registrada'
          )
        );
        if (memberAvatar) {
          logSection.setThumbnailAccessory(new ThumbnailBuilder().setURL(memberAvatar));
        }

        logContainer.addSectionComponents(logSection);

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
            `-# ${interaction.guild.name} · Verificação registrada automaticamente`
          )
        );

        await logChannel.send({
          components: [logContainer],
          flags: MessageFlags.IsComponentsV2,
        });
      }
    } catch (error) {
      console.error('[BOT] Erro na verificação:', error);
      const failContainer = new ContainerBuilder()
        .setAccentColor(0xED4245)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('❌ **ERRO AO PROCESSAR VERIFICAÇÃO**'),
        )
        .addSectionComponents(
          new SectionBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              'Ocorreu uma falha ao tentar atualizar seus cargos.\nPor favor, tente novamente em instantes ou contate um administrador.'
            )
          )
        );
      await interaction.editReply({ components: [failContainer], flags: MessageFlags.IsComponentsV2 });
    }

  },
};
