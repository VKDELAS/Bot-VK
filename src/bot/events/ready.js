const ids = require('../../lib/ids');
const { setupPainel } = require('../utils/sendPainel');

module.exports = {
  name: 'clientReady',
  once: true,
  async execute(client) {
    console.log(`[BOT] Logado como ${client.user.tag}`);

    const guild = client.guilds.cache.get(ids.guildId);
    if (!guild) return console.error('[BOT] Guild não encontrada');

    const channel = guild.channels.cache.get(ids.canais.verificacao);
    if (!channel) return console.error('[BOT] Canal de verificação não encontrado');

    try {
      await setupPainel(guild);
      console.log('[BOT] Painel de verificação enviado automaticamente');
    } catch (error) {
      console.error('[BOT] Erro ao configurar painel:', error.message);
    }
  },
};
