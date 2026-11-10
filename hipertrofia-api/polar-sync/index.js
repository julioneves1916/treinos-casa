'use strict';
const { guard, json } = require('../shared/base');
const P = require('../shared/polar');

// GET = status; POST = busca os treinos dos últimos 30 dias e devolve o acervo guardado
module.exports = async function (context, req) {
  if (!guard(context, req)) return;
  try {
    const tok = await P.token();
    if (req.method === 'GET') {
      const all = await P.stored();
      return json(context, 200, { configured: P.configured(), connected: !!tok, count: Object.keys(all).length });
    }
    if (!tok) return json(context, 409, { error: 'Conta Polar não conectada. Ajustes → Conectar conta Polar.' });
    const all = await P.store(await P.fetchExercises(tok));
    const exercises = Object.values(all).sort((a, b) => (b.start_time || '').localeCompare(a.start_time || '')).slice(0, 60);
    return json(context, 200, { exercises });
  } catch (e) {
    context.log.error('polar-sync:', e);
    return json(context, 502, { error: e.message });
  }
};
