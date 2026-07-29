const {
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
} = require('discord.js');

// Cores do tema "Tropa do VK" — vermelho forte em fundo escuro
const COR_ENTRADA = 0xE8102B; // vermelho vibrante, boas-vindas
const COR_SAIDA = 0x1A1A1A; // quase preto, despedida

/**
 * Monta o container de entrada (Components V2)
 * @param {import('discord.js').GuildMember} member
 */
function buildEntradaContainer(member) {
  const container = new ContainerBuilder().setAccentColor(COR_ENTRADA);

  const section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        [
          '# 🔥 TROPA DO VK',
          `### Chegou mais um pra tropa, ${member}!`,
        ].join('\n'),
      ),
      new TextDisplayBuilder().setContent(
        [
          `> 👤 **Usuário:** ${member.user.tag}`,
          `> 🆔 **ID:** \`${member.id}\``,
          `> 📅 **Conta criada em:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:D>`,
        ].join('\n'),
      ),
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder().setURL(
        member.displayAvatarURL({ extension: 'png', size: 256 }),
      ),
    );

  container.addSectionComponents(section);

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `-# 📈 Agora somos **${member.guild.memberCount}** na tropa • Bem-vindo(a)!`,
    ),
  );

  return container;
}

/**
 * Monta o container de saída (Components V2)
 * @param {import('discord.js').GuildMember|import('discord.js').PartialGuildMember} member
 */
function buildSaidaContainer(member) {
  const container = new ContainerBuilder().setAccentColor(COR_SAIDA);

  const section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        [
          '# 💀 TROPA DO VK',
          `### Mais um saiu da tropa: **${member.user.tag}**`,
        ].join('\n'),
      ),
      new TextDisplayBuilder().setContent(
        [
          `> 🆔 **ID:** \`${member.id}\``,
          `> 📅 **Entrou em:** ${
            member.joinedTimestamp
              ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>`
              : 'não disponível'
          }`,
        ].join('\n'),
      ),
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder().setURL(
        member.displayAvatarURL({ extension: 'png', size: 256 }),
      ),
    );

  container.addSectionComponents(section);

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `-# 📉 Restaram **${member.guild.memberCount}** na tropa • Até a próxima!`,
    ),
  );

  return container;
}

module.exports = { buildEntradaContainer, buildSaidaContainer };
