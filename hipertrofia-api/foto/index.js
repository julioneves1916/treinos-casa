'use strict';
const crypto = require('crypto');
const { container, json, guard } = require('../shared/base');

const SAFE = /^[a-z0-9][a-z0-9._-]{0,120}$/i;

module.exports = async function (context, req) {
  if (!guard(context, req)) return;
  try {
    if (req.method === 'GET') {
      const id = String(req.query.id || '');
      if (!SAFE.test(id)) return json(context, 400, { error: 'id inválido' });
      const buf = await container('fotos').getBlobClient(id).downloadToBuffer();
      context.res = { status: 200, isRaw: true, headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=31536000, immutable' }, body: buf };
      return;
    }
    const b = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const m = /^data:image\/(jpeg|png|webp);base64,(.+)$/.exec((b && b.data) || '');
    if (!m) return json(context, 400, { error: 'imagem inválida' });
    const buf = Buffer.from(m[2], 'base64');
    if (buf.length > 8 * 1024 * 1024) return json(context, 413, { error: 'imagem grande demais' });
    const kind = ['corpo', 'polar'].includes(b.kind) ? b.kind : 'outro';
    const ref = String(b.ref || '').replace(/[^a-z0-9-]/gi, '').slice(0, 40);
    const id = `${kind}-${ref || 'x'}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.jpg`;
    await container('fotos').getBlockBlobClient(id).uploadData(buf, { blobHTTPHeaders: { blobContentType: `image/${m[1]}` } });
    return json(context, 200, { id });
  } catch (e) {
    if (e.statusCode === 404) return json(context, 404, { error: 'não encontrada' });
    context.log.error('foto:', e);
    return json(context, 500, { error: e.message });
  }
};
