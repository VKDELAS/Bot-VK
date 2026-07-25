const {
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ThumbnailBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const PLATFORM_CONFIG = {
  twitch: {
    accentColor: 0x9146ff,
    badge: '🔴 **AO VIVO NA TWITCH**',
    footer: '-# VK DELAS na Twitch • Transmissão ao vivo em andamento',
    buttonLabel: 'Assistir na Twitch',
    buttonUrl: 'https://www.twitch.tv/vk_delaass',
    buttonEmoji: '🟣',
  },
  youtube: {
    accentColor: 0xff0000,
    badge: '🔴 **AO VIVO NO YOUTUBE**',
    footer: '-# VK DELAS no YouTube • Transmissão ao vivo em andamento',
    buttonLabel: 'Assistir no YouTube',
    buttonUrl: null,
    buttonEmoji: '▶️',
  },
};

function buildLiveNotifyContainer({
  streamTitle,
  gameName,
  streamThumbnailUrl,
  avatarUrl,
  platform = 'twitch',
  videoId,
  twitchUsername = 'vk_delaass',
}) {
  const config = PLATFORM_CONFIG[platform] || PLATFORM_CONFIG.twitch;

  let buttonUrl = config.buttonUrl;
  if (platform === 'twitch') {
    buttonUrl = `https://www.twitch.tv/${twitchUsername}`;
  } else if (platform === 'youtube' && videoId) {
    buttonUrl = `https://www.youtube.com/watch?v=${videoId}`;
  }

  const container = new ContainerBuilder().setAccentColor(config.accentColor);

  // Status Badge
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(config.badge),
  );

  // Informações da Live
  const section = new SectionBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `# ${streamTitle}\n\n` +
      `🎮 **Categoria:** ${gameName || 'Geral'}\n` +
      `✨ A live já começou! Venha acompanhar e trocar aquela ideia.\n\n` +
      `@everyone`,
    ),
  );

  if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.startsWith('http')) {
    section.setThumbnailAccessory(new ThumbnailBuilder().setURL(avatarUrl));
  }

  container.addSectionComponents(section);

  // Thumbnail em Galeria de Mídia
  if (streamThumbnailUrl && typeof streamThumbnailUrl === 'string' && streamThumbnailUrl.startsWith('http')) {
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(streamThumbnailUrl),
      ),
    );
  }

  container.addSeparatorComponents(
    new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large),
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(config.footer),
  );

  if (buttonUrl) {
    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel(config.buttonLabel)
          .setURL(buttonUrl)
          .setEmoji(config.buttonEmoji),
      ),
    );
  }

  return container;
}

module.exports = { buildLiveNotifyContainer };

