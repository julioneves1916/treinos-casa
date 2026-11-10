'use strict';
const { readJson, writeJson } = require('../shared/base');
const P = require('../shared/polar');

// Rota anônima: o retorno da Polar pode chegar sem o cookie de login (redirecionamento entre sites).
// A proteção é o `state`: aleatório, gerado só por /api/polar-login (que exige o dono), uso único e válido por 15 min.
module.exports = async function (context, req) {
  const back = (q) => { context.res = { status: 302, headers: { Location: `/#ajustes?${q}` } }; };
  try {
    const saved = await readJson('dados', 'segredos/polar-state.json', null);
    if (!saved || !saved.state || saved.state !== req.query.state || Date.now() - saved.at > 15 * 60000) return back('polar=estado-invalido');
    await writeJson('dados', 'segredos/polar-state.json', { state: null, at: 0 }); // uso único
    if (req.query.error || !req.query.code) return back('polar=recusado');
    await P.exchangeCode(req.query.code);
    await P.store(await P.fetchExercises(await P.token()));
    return back('polar=ok');
  } catch (e) {
    context.log.error('polar-callback:', e);
    return back('polar=erro');
  }
};
