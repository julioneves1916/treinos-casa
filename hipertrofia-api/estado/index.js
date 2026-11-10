'use strict';
const { readJson, writeJson, json, guard, mergeState } = require('../shared/base');
const PATH = 'estado.json';

module.exports = async function (context, req) {
  if (!guard(context, req)) return;
  try {
    const cur = await readJson('dados', PATH, {});
    if (req.method === 'GET') return json(context, 200, cur);
    const incoming = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!incoming || typeof incoming !== 'object') return json(context, 400, { error: 'corpo inválido' });
    const merged = mergeState(cur, incoming);
    await writeJson('dados', PATH, merged);
    // cópia diária (rede de segurança contra sobrescrita acidental)
    const day = new Date().toISOString().slice(0, 10);
    await writeJson('dados', `historico/estado-${day}.json`, merged);
    return json(context, 200, merged);
  } catch (e) {
    context.log.error('estado:', e);
    return json(context, 500, { error: e.message });
  }
};
