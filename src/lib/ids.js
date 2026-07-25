module.exports = {
  guildId: process.env.DISCORD_GUILD_ID || '1062511882386280510',
  canais: {
    verificacao: process.env.CANAL_VERIFICACAO || '1062512407710281878',
    logs: process.env.CANAL_LOGS || '1062512395102212106',
    videoNotify: process.env.CANAL_VIDEO_NOTIFY || '1062763623556055080',
    liveNotify: process.env.CANAL_LIVE_NOTIFY || '1062763577846530088',
  },
  cargos: {
    admin: process.env.CARGO_ADMIN || '1062512326324011138',
    naoInscrito: process.env.CARGO_NAO_INSCRITO || '1062947172640886845',
    inscrito: process.env.CARGO_INSCRITO || '1062512367965061170',
    verificado: process.env.CARGO_VERIFICADO || '1062512369017835600',
  },
};

