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

function buildLiveNotifyContainer({ streamTitle, gameName, streamThumbnailUrl, twitchAvatarUrl }) {
  return new ContainerBuilder()
    .setAccentColor(0x9146ff)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('🔴 **AO VIVO AGORA!**'),
    )
    .addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## ${streamTitle}\nJogando **${gameName}** — bora dar aquela força na live! 🎮`,
          ),
        )
        .setThumbnailAccessory(new ThumbnailBuilder().setURL(twitchAvatarUrl)),
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
      new TextDisplayBuilder().setContent('-# VK_DELAAS na Twitch • ao vivo agora'),
    )
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel('Assistir na Twitch')
          .setURL('https://www.twitch.tv/vk_delaass')
          .setEmoji('🟣'),
      ),
    );
}

module.exports = { buildLiveNotifyContainer };
