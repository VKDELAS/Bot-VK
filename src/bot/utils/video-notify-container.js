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
  const container = new ContainerBuilder().setAccentColor(0xff0000);

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent('📹 **VÍDEO NOVO NO CANAL**'),
  );

  const section = new SectionBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `# ${videoTitle}\n\n` +
      `🔥 Conteúdo inédito disponível no canal! Corre para assistir e deixar o seu like.\n\n` +
      `@everyone`,
    ),
  );

  if (channelAvatarUrl && typeof channelAvatarUrl === 'string' && channelAvatarUrl.startsWith('http')) {
    section.setThumbnailAccessory(new ThumbnailBuilder().setURL(channelAvatarUrl));
  }

  container.addSectionComponents(section);

  if (videoThumbnailUrl && typeof videoThumbnailUrl === 'string' && videoThumbnailUrl.startsWith('http')) {
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(videoThumbnailUrl),
      ),
    );
  }

  container.addSeparatorComponents(
    new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large),
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent('-# VK DELAS no YouTube • Vídeo publicado recentemente'),
  );

  if (videoUrl) {
    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel('Assistir no YouTube')
          .setURL(videoUrl)
          .setEmoji('▶️'),
      ),
    );
  }

  return container;
}

module.exports = { buildVideoNotifyContainer };

