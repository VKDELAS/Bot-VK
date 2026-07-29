const { Events, MessageFlags } = require('discord.js');
const ids = require('../../lib/ids');
const { buildSaidaContainer } = require('../utils/entrada-saida-container');

module.exports = {
  name: Events.GuildMemberRemove,
  async execute(member) {
    try {
      const canal = await member.guild.channels.fetch(ids.canais.saida);
      if (!canal) return;

      const container = buildSaidaContainer(member);

      await canal.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    } catch (err) {
      console.error('[guildMemberRemove] Erro ao enviar mensagem de saída:', err);
    }
  },
};
