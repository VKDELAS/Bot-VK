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

function buildVideoNotifyContainer({ videoTitle, videoUrl, videoThumbnailUrl, channelAvatarUrl }) {
  return new ContainerBuilder()
    .setAccentColor(0xff0000)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('📹 **Vídeo novo no ar!**'),
    )
    .addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## ${videoTitle}\nSaiu conteúdo novo lá no canal, corre pra assistir! 🔥\n\n@everyone`,
          ),
        )
        .setThumbnailAccessory(new ThumbnailBuilder().setURL(channelAvatarUrl)),
    )
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(videoThumbnailUrl),
      ),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('-# VK DELAS • postado agora'),
    )
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel('Assistir agora')
          .setURL(videoUrl)
          .setEmoji('▶️'),
      ),
    );
}

module.exports = { buildVideoNotifyContainer };
