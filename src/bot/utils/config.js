const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', '..', '..', 'data', 'config.json');

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
  } catch (error) {
    console.error('[BOT] Erro ao ler config.json:', error.message);
  }
  return { liveNotifyChannelId: null, videoNotifyChannelId: null };
}

function saveConfig(config) {
  try {
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('[BOT] Erro ao salvar config.json:', error.message);
  }
}

function getLiveNotifyChannelId() {
  return loadConfig().liveNotifyChannelId || null;
}

function getVideoNotifyChannelId() {
  return loadConfig().videoNotifyChannelId || null;
}

function setLiveNotifyChannelId(channelId) {
  const config = loadConfig();
  config.liveNotifyChannelId = channelId;
  saveConfig(config);
}

function setVideoNotifyChannelId(channelId) {
  const config = loadConfig();
  config.videoNotifyChannelId = channelId;
  saveConfig(config);
}

module.exports = {
  getLiveNotifyChannelId,
  getVideoNotifyChannelId,
  setLiveNotifyChannelId,
  setVideoNotifyChannelId,
};
