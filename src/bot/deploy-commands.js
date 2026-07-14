require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

async function deployCommands() {
  const commands = [];
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
    }
  }

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  console.log(`[DEPLOY] Sincronizando ${commands.length} comandos...`);

  const data = await rest.put(
    Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
    { body: commands },
  );

  console.log(`[DEPLOY] ${data.length} comandos sincronizados com sucesso!`);
  return data.length;
}

module.exports = { deployCommands };

if (require.main === module) {
  deployCommands().catch(err => {
    console.error('[DEPLOY] Erro:', err);
    process.exit(1);
  });
}
