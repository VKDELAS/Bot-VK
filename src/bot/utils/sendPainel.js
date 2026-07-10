const {
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
const path = require('node:path');
const fs = require('node:fs');

const dataPath = path.join(__dirname, '..', '..', '..', 'data', 'verification.json');

const CORES = {
  padrao: 0x5865F2,
};

function getStoredMessageId() {
  try {
    if (fs.existsSync(dataPath)) {
      return JSON.parse(fs.readFileSync(dataPath, 'utf-8')).messageId;
    }
  } catch {}
  return null;
}

function storeMessageId(messageId) {
  const dir = path.dirname(dataPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(dataPath, JSON.stringify({ messageId }), 'utf-8');
}

function clearStoredMessageId() {
  const dir = path.dirname(dataPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(dataPath, JSON.stringify({ messageId: null }), 'utf-8');
}

function buildContainer(guild) {
  const iconURL = guild.iconURL({ dynamic: true, size: 256 });

  const container = new ContainerBuilder().setAccentColor(CORES.padrao);

  // Cabeçalho com thumbnail do servidor
  const header = new SectionBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      '## Verificação de Acesso\n' +
        'Para liberar seu acesso completo ao servidor, clique no botão abaixo.'
    )
  );
  if (iconURL) {
    header.setThumbnailAccessory(new ThumbnailBuilder().setURL(iconURL));
  }
  container.addSectionComponents(header);

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      '**Alterações realizadas**\n' +
        '> Adicionado: **Inscrito**, **Verificado**\n' +
        '> Removido: **Não Inscrito**'
    )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
  );

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('verificar')
        .setLabel('Verificar-se')
        .setStyle(ButtonStyle.Success)
    )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `-# ${guild.name} · verificação instantânea e necessária apenas uma vez`
    )
  );

  return container;
}

async function getExistingPainel(channel) {
  const storedId = getStoredMessageId();
  if (!storedId) return null;
  try {
    return await channel.messages.fetch(storedId);
  } catch {
    clearStoredMessageId();
    return null;
  }
}

function isPainelDiferente(message, guild) {
  const expected = buildContainer(guild).toJSON();
  const current = message.components?.map((c) => c.toJSON?.() ?? c) || [];
  return JSON.stringify(current) !== JSON.stringify([expected]);
}

async function sendPainel(guild) {
  const channel = guild.channels.cache.get(ids.canais.verificacao);
  if (!channel) throw new Error('Canal de verificação não encontrado');

  const container = buildContainer(guild);

  const message = await channel.send({
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  });

  storeMessageId(message.id);
  return message;
}

async function setupPainel(guild) {
  const channel = guild.channels.cache.get(ids.canais.verificacao);
  if (!channel) throw new Error('Canal de verificação não encontrado');

  const existing = await getExistingPainel(channel);

  if (existing) {
    try {
      await existing.delete();
    } catch {
      // Painel já foi deletado manualmente
    }
  }

  clearStoredMessageId();
  const nova = await sendPainel(guild);
  return { status: 'sent', message: nova };
}

module.exports = { sendPainel, getExistingPainel, setupPainel };
