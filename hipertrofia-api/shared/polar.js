'use strict';
// Polar AccessLink v3: OAuth (authorization code), registro do usuário, exercícios.
const { readJson, writeJson } = require('./base');

const AUTH_URL = 'https://flow.polar.com/oauth2/authorization';
const TOKEN_URL = 'https://polarremote.com/v2/oauth2/token';
const API = 'https://www.polaraccesslink.com/v3';
const TOKEN_PATH = 'segredos/polar-token.json';
const EX_PATH = 'polar/exercicios.json';

const basic = () => 'Basic ' + Buffer.from(`${process.env.POLAR_CLIENT_ID}:${process.env.POLAR_CLIENT_SECRET}`).toString('base64');
const redirectUri = () => `${process.env.APP_ORIGIN}/api/polar-callback`;
const configured = () => !!(process.env.POLAR_CLIENT_ID && process.env.POLAR_CLIENT_SECRET && process.env.APP_ORIGIN);

async function exchangeCode(code) {
  const r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { Authorization: basic(), 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json;charset=UTF-8' },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri() }),
  });
  if (!r.ok) throw new Error(`token Polar: HTTP ${r.status} ${await r.text()}`);
  const t = await r.json(); // { access_token, token_type, expires_in, x_user_id }
  // registra o usuário no cliente (409 = já registrado)
  const u = await fetch(`${API}/users`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${t.access_token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ 'member-id': `jnt-${t.x_user_id}` }),
  });
  if (!u.ok && u.status !== 409) throw new Error(`registro Polar: HTTP ${u.status} ${await u.text()}`);
  await writeJson('dados', TOKEN_PATH, { access_token: t.access_token, x_user_id: t.x_user_id, saved: new Date().toISOString() });
  return t;
}

async function token() { return readJson('dados', TOKEN_PATH, null); }

function slim(x) {
  const z = {};
  for (const hz of (x.heart_rate_zones || [])) {
    const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:([\d.]+)S)?/.exec(hz['in-zone'] || '');
    if (m) z[`z${hz.index + 1}`] = Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Math.round(Number(m[3] || 0));
  }
  return {
    id: String(x.id), start_time: x.start_time, utc_offset: x.start_time_utc_offset, duration: x.duration,
    calories: x.calories, heart_rate: x.heart_rate || null, sport: x.detailed_sport_info || x.sport || '',
    training_load: x.training_load ?? null, device: x.device || '', zones_s: Object.keys(z).length ? z : null,
  };
}

async function fetchExercises(tok) {
  const r = await fetch(`${API}/exercises?samples=false&zones=true&route=false`, {
    headers: { Authorization: `Bearer ${tok.access_token}`, Accept: 'application/json' },
  });
  if (r.status === 204) return [];
  if (!r.ok) throw new Error(`exercícios Polar: HTTP ${r.status} ${await r.text()}`);
  return (await r.json()).map(slim);
}
async function fetchExercise(tok, url) {
  const u = new URL(url);
  if (u.hostname !== 'www.polaraccesslink.com') throw new Error('URL inesperada no webhook');
  u.searchParams.set('zones', 'true');
  const r = await fetch(u, { headers: { Authorization: `Bearer ${tok.access_token}`, Accept: 'application/json' } });
  if (!r.ok) throw new Error(`exercício Polar: HTTP ${r.status}`);
  return slim(await r.json());
}

// guarda tudo o que já veio (a API só devolve os últimos 30 dias)
async function store(list) {
  const cur = await readJson('dados', EX_PATH, {});
  for (const x of list) cur[x.id] = Object.assign({}, cur[x.id] || {}, x);
  await writeJson('dados', EX_PATH, cur);
  return cur;
}
const stored = () => readJson('dados', EX_PATH, {});

module.exports = { AUTH_URL, redirectUri, configured, exchangeCode, token, fetchExercises, fetchExercise, store, stored };
