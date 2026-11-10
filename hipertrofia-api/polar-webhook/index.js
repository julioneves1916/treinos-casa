'use strict';
// Webhook da Polar (rota anônima): valida a assinatura HMAC e guarda o treino novo.
const crypto = require('crypto');
const { json } = require('../shared/base');
const P = require('../shared/polar');

module.exports = async function (context, req) {
  const raw = req.rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}));
  const event = req.headers['polar-webhook-event'] || (req.body && req.body.event);
  if (event === 'PING') return json(context, 200, { ok: true });
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  const sig = String(req.headers['polar-webhook-signature'] || '');
  const calc = secret ? crypto.createHmac('sha256', secret).update(raw).digest('hex') : '';
  if (!secret || sig.length !== calc.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(calc))) {
    return json(context, 401, { error: 'assinatura inválida' });
  }
  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (b.event === 'EXERCISE' && b.url) {
      const tok = await P.token();
      if (tok) await P.store([await P.fetchExercise(tok, b.url)]);
    }
    return json(context, 200, { ok: true });
  } catch (e) {
    context.log.error('polar-webhook:', e);
    return json(context, 200, { ok: false }); // 200 para a Polar não desativar o webhook; erro fica no log
  }
};
