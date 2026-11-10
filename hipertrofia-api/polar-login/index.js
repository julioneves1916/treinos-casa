'use strict';
const crypto = require('crypto');
const { guard, json, writeJson } = require('../shared/base');
const P = require('../shared/polar');

module.exports = async function (context, req) {
  if (!guard(context, req)) return;
  if (!P.configured()) return json(context, 503, { error: 'Polar ainda não configurada (POLAR_CLIENT_ID/SECRET).' });
  const state = crypto.randomBytes(16).toString('hex');
  await writeJson('dados', 'segredos/polar-state.json', { state, at: Date.now() });
  const u = new URL(P.AUTH_URL);
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('client_id', process.env.POLAR_CLIENT_ID);
  u.searchParams.set('redirect_uri', P.redirectUri());
  u.searchParams.set('state', state);
  context.res = { status: 302, headers: { Location: u.toString() } };
};
