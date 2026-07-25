// Cache em memória de notificações já enviadas, pra evitar duplicatas
const sent = new Map();
const TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

function jáEnviou(key) {
  if (sent.has(key)) {
    const expiry = sent.get(key);
    if (Date.now() < expiry) return true;
    sent.delete(key);
  }
  return false;
}

function marcarEnviado(key) {
  sent.set(key, Date.now() + TTL_MS);
}

function limpar(key) {
  sent.delete(key);
}

module.exports = { jáEnviou, marcarEnviado, limpar };
