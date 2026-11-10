'use strict';
const { guard, readJson } = require('../shared/base');
const P = require('../shared/polar');

module.exports = async function (context, req) {
  if (!guard(context, req)) return;
  const back = (q) => { context.res = { status: 302, headers: { Location: `/#ajustes?${q}` } }; };
  try {
    const saved = await readJson('dados', 'segredos/polar-state.json', null);
    if (!saved || saved.state !== req.query.state || Date.now() - saved.at > 15 * 60000) return back('polar=estado-invalido');
    if (req.query.error || !req.query.code) return back('polar=recusado');
    await P.exchangeCode(req.query.code);
    await P.store(await P.fetchExercises(await P.token()));
    return back('polar=ok');
  } catch (e) {
    context.log.error('polar-callback:', e);
    return back('polar=erro');
  }
};
