'use strict';
// Infra comum: identidade (SWA), blobs e merge do estado.
const { BlobServiceClient } = require('@azure/storage-blob');

let _svc;
function svc() {
  if (!_svc) _svc = BlobServiceClient.fromConnectionString(process.env.STORAGE_CONN);
  return _svc;
}
const container = (name) => svc().getContainerClient(name);

async function readJson(cont, path, fallback = null) {
  try {
    const buf = await container(cont).getBlobClient(path).downloadToBuffer();
    return JSON.parse(buf.toString('utf8'));
  } catch (e) {
    if (e.statusCode === 404) return fallback;
    throw e;
  }
}
async function writeJson(cont, path, obj) {
  const body = Buffer.from(JSON.stringify(obj), 'utf8');
  await container(cont).getBlockBlobClient(path).uploadData(body, { blobHTTPHeaders: { blobContentType: 'application/json; charset=utf-8' } });
}

// Identidade: o SWA injeta x-ms-client-principal. Só o dono passa.
function principal(req) {
  const h = req.headers['x-ms-client-principal'];
  if (!h) return null;
  try { return JSON.parse(Buffer.from(h, 'base64').toString('utf8')); } catch (e) { return null; }
}
function isOwner(p) {
  if (!p) return false;
  const allowed = String(process.env.ALLOWED_USERS || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  return (p.userRoles || []).includes('dono') || allowed.includes(String(p.userDetails || '').toLowerCase());
}
function json(context, status, body) {
  context.res = { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, body };
}
function guard(context, req) {
  const p = principal(req);
  if (!isOwner(p)) { json(context, 403, { error: 'acesso negado' }); return null; }
  return p;
}

// Mesmo merge do app: por registro, vence o updatedAt mais novo.
function mergeState(a, b) {
  const out = { v: 1, logs: {}, body: {}, analyses: {}, polar: {}, settings: { updatedAt: 0 }, updatedAt: 0 };
  for (const k of ['logs', 'body', 'analyses', 'polar']) {
    const A = (a && a[k]) || {}, B = (b && b[k]) || {};
    for (const id of new Set([...Object.keys(A), ...Object.keys(B)])) {
      const x = A[id], y = B[id];
      out[k][id] = !x ? y : !y ? x : ((y.updatedAt || 0) > (x.updatedAt || 0) ? y : x);
    }
  }
  const sa = (a && a.settings) || {}, sb = (b && b.settings) || {};
  out.settings = (sb.updatedAt || 0) > (sa.updatedAt || 0) ? sb : sa;
  out.updatedAt = Math.max((a && a.updatedAt) || 0, (b && b.updatedAt) || 0);
  return out;
}

module.exports = { container, readJson, writeJson, principal, isOwner, json, guard, mergeState };
