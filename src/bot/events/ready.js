const ids = require('../../lib/ids');
const { setupPainel } = require('../utils/sendPainel');
const { startYoutubeMonitor } = require('../services/youtube-monitor');
const { startTwitchMonitor } = require('../services/twitch-monitor');
const { deployCommands } = require('../deploy-commands');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`[BOT] Logado como ${client.user.tag}`);

    const guild = client.guilds.cache.get(ids.guildId);
    if (!guild) return console.error('[BOT] Guild não encontrada');

    const channel = guild.channels.cache.get(ids.canais.verificacao);
    if (!channel) return console.error('[BOT] Canal de verificação não encontrado');

    try {
      await deployCommands();
    } catch (error) {
      console.error('[BOT] Erro ao sincronizar comandos:', error.message);
    }

    try {
      await setupPainel(guild);
      console.log('[BOT] Painel de verificação enviado automaticamente');
    } catch (error) {
      console.error('[BOT] Erro ao configurar painel:', error.message);
    }

    startYoutubeMonitor(client);
    startTwitchMonitor(client);
  },
};
