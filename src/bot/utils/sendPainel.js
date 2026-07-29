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
  padrao: 0xE0242A,
};

const LOGO_URL =
  'https://cdn.discordapp.com/attachments/1489797401039474808/1526915242095939685/logo_vk_delas_preto.jpg?ex=6a6a8e62&is=6a693ce2&hm=39239110da364e08367aa61ab79ff6127ef9ee3ad2b4bc28541508de2649a526&';

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
  const container = new ContainerBuilder().setAccentColor(CORES.padrao);

  const header = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# Verificação de Membros\n\n` +
          `Clique no botão abaixo para confirmar sua verificação e liberar seu acesso ao ${guild.name}.`,
      ),
    )
    .setThumbnailAccessory(new ThumbnailBuilder().setURL(LOGO_URL));

  container.addSectionComponents(header);

  container.addSeparatorComponents(
    new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
  );

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('verificar')
        .setLabel('Concluir Verificação')
        .setStyle(ButtonStyle.Success),
    ),
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `-# ${guild.name} • Verificação instantânea e necessária apenas uma vez`,
    ),
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

  // Painel já existe e é igual ao que seria enviado agora: não faz nada.
  if (existing && !isPainelDiferente(existing, guild)) {
    return { status: 'unchanged', message: existing };
  }

  // Só apaga o antigo depois de confirmar que vai conseguir mandar um novo.
  const nova = await sendPainel(guild);

  if (existing) {
    try {
      await existing.delete();
    } catch {
      // Painel antigo já tinha sido apagado manualmente
    }
  }

  return { status: existing ? 'updated' : 'sent', message: nova };
}

module.exports = { sendPainel, getExistingPainel, setupPainel };
