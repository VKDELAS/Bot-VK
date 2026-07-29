const { Events, MessageFlags } = require('discord.js');
const ids = require('../../lib/ids');
const { buildEntradaContainer } = require('../utils/entrada-saida-container');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    try {
      const canal = await member.guild.channels.fetch(ids.canais.entrada);
      if (!canal) return;

      const container = buildEntradaContainer(member);

      await canal.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    } catch (err) {
      console.error('[guildMemberAdd] Erro ao enviar mensagem de entrada:', err);
    }
  },
};
