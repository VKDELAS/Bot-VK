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
 * Monta o container de entrada (Components V2) — perfil enxuto
 * @param {import('discord.js').GuildMember} member
 */
function buildEntradaContainer(member) {
  const container = new ContainerBuilder().setAccentColor(COR_ENTRADA);

  const section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        [
          '# Tropa do VK',
          `### Chegou mais um pra tropa, ${member}!`,
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
      `-# Agora somos **${member.guild.memberCount}** na tropa`,
    ),
  );

  return container;
}

/**
 * Monta o container de saída (Components V2) — perfil enxuto
 * @param {import('discord.js').GuildMember|import('discord.js').PartialGuildMember} member
 */
function buildSaidaContainer(member) {
  const container = new ContainerBuilder().setAccentColor(COR_SAIDA);

  const section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        [
          '# Tropa do VK',
          `### **${member.user.tag}** saiu da tropa`,
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
      `-# Restaram **${member.guild.memberCount}** na tropa`,
    ),
  );

  return container;
}

module.exports = { buildEntradaContainer, buildSaidaContainer };
