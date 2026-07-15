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
    label: '🔴 **AO VIVO AGORA!**',
    footer: '-# VK_DELAAS na Twitch • ao vivo agora',
    buttonLabel: 'Assistir na Twitch',
    buttonUrl: 'https://www.twitch.tv/vk_delaass',
    buttonEmoji: '🟣',
  },
  youtube: {
    accentColor: 0xff0000,
    label: '🔴 **AO VIVO NO YOUTUBE!**',
    footer: '-# VK DELAS no YouTube • ao vivo agora',
    buttonLabel: 'Assistir no YouTube',
    buttonUrl: null,
    buttonEmoji: '▶️',
  },
};

function buildLiveNotifyContainer({ streamTitle, gameName, streamThumbnailUrl, avatarUrl, platform = 'twitch', videoId }) {
  const config = PLATFORM_CONFIG[platform] || PLATFORM_CONFIG.twitch;

  const buttonUrl = platform === 'youtube' && videoId
    ? `https://www.youtube.com/watch?v=${videoId}`
    : config.buttonUrl;

  return new ContainerBuilder()
    .setAccentColor(config.accentColor)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(config.label),
    )
    .addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## ${streamTitle}\nJogando **${gameName}** — bora dar aquela força na live! 🎮`,
          ),
        )
        .setThumbnailAccessory(new ThumbnailBuilder().setURL(avatarUrl)),
    )
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(streamThumbnailUrl),
      ),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(config.footer),
    )
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel(config.buttonLabel)
          .setURL(buttonUrl)
          .setEmoji(config.buttonEmoji),
      ),
    );
}

module.exports = { buildLiveNotifyContainer };
