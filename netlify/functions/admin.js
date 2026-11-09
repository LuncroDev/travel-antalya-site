// Travel Antalya admin API (Netlify Function).
// Password login with a signed, HttpOnly cookie; reads and writes content
// files in the GitHub repo, which triggers a Netlify deploy.
// Env: ADMIN_PASSWORD, GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO (GITHUB_BRANCH optional)
'use strict';
const crypto = require('node:crypto');

const COOKIE = 'ta_admin';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const ALLOWED = /^(content\/(hotels|restaurants|golf|events|things-to-do|blog)\/[a-z0-9][a-z0-9-]*\.md|images\/uploads\/[a-z0-9][a-z0-9._-]*\.(jpe?g|png|webp|avif))$/;

const env = k => process.env[k] || '';
const key = () => crypto.createHash('sha256').update(`${env('ADMIN_PASSWORD')}|${env('GITHUB_TOKEN')}|travel-antalya-admin`).digest();
const sign = v => crypto.createHmac('sha256', key()).update(v).digest('base64url');
const json = (statusCode, body, headers = {}) => ({ statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers }, body: JSON.stringify(body) });
const cookieHeader = (value, maxAge) => `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;

function session(event) {
  const raw = (event.headers.cookie || '').split(/;\s*/).find(c => c.startsWith(COOKIE + '='));
  if (!raw) return false;
  const [exp, sig] = raw.slice(COOKIE.length + 1).split('.');
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  const expected = sign(exp);
  return sig.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

async function github(path, opts = {}) {
  const url = `https://api.github.com/repos/${env('GITHUB_OWNER')}/${env('GITHUB_REPO')}/contents/${path}`;
  const res = await fetch(url + (opts.method ? '' : `?ref=${env('GITHUB_BRANCH') || 'main'}`), {
    ...opts,
    headers: { Authorization: `Bearer ${env('GITHUB_TOKEN')}`, Accept: 'application/vnd.github+json', 'User-Agent': 'travel-antalya-admin', 'Content-Type': 'application/json' }
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

exports.handler = async (event) => {
  const action = (event.queryStringParameters || {}).action || '';
  let body = {};
  try { body = event.body ? JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body) : {}; } catch { return json(400, { error: 'Bad request' }); }

  if (!env('ADMIN_PASSWORD') || !env('GITHUB_TOKEN')) return json(500, { error: 'Admin is not configured (ADMIN_PASSWORD / GITHUB_TOKEN missing).' });

  if (action === 'login' && event.httpMethod === 'POST') {
    const given = Buffer.from(String(body.password || ''));
    const real = Buffer.from(env('ADMIN_PASSWORD'));
    const ok = given.length === real.length && crypto.timingSafeEqual(given, real);
    if (!ok) { await new Promise(r => setTimeout(r, 1200)); return json(401, { error: 'Wrong password' }); }
    const exp = String(Math.floor(Date.now() / 1000) + MAX_AGE);
    return json(200, { ok: true }, { 'Set-Cookie': cookieHeader(`${exp}.${sign(exp)}`, MAX_AGE) });
  }
  if (action === 'logout') return json(200, { ok: true }, { 'Set-Cookie': cookieHeader('', 0) });
  if (!session(event)) return json(401, { error: 'Please log in' });
  if (action === 'me') return json(200, { ok: true });

  const path = String(body.path || (event.queryStringParameters || {}).path || '');
  if (!ALLOWED.test(path)) return json(400, { error: 'This file cannot be edited from the admin.' });

  if (action === 'file') {
    const r = await github(path);
    if (r.status === 404) return json(404, { error: 'Not found' });
    if (!r.ok) return json(502, { error: r.data.message || 'GitHub error' });
    return json(200, { path, sha: r.data.sha, content: Buffer.from(r.data.content || '', 'base64').toString('utf8') });
  }

  if ((action === 'save' || action === 'upload') && event.httpMethod === 'POST') {
    const content = action === 'upload' ? String(body.base64 || '') : Buffer.from(String(body.content || ''), 'utf8').toString('base64');
    if (!content) return json(400, { error: 'Empty file' });
    if (content.length > 9_000_000) return json(413, { error: 'File is too large (max ~6 MB).' });
    const message = String(body.message || `admin: update ${path}`).slice(0, 200);
    const r = await github(path, { method: 'PUT', body: JSON.stringify({ message, content, sha: body.sha || undefined, branch: env('GITHUB_BRANCH') || 'main' }) });
    if (r.status === 409 || r.status === 422) return json(409, { error: 'This entry was changed elsewhere. Reload it and try again.' });
    if (!r.ok) return json(502, { error: r.data.message || 'GitHub error' });
    return json(200, { ok: true, sha: r.data.content && r.data.content.sha, path });
  }

  if (action === 'delete' && event.httpMethod === 'POST') {
    if (!body.sha) return json(400, { error: 'Missing version' });
    const r = await github(path, { method: 'DELETE', body: JSON.stringify({ message: `admin: delete ${path}`, sha: body.sha, branch: env('GITHUB_BRANCH') || 'main' }) });
    if (!r.ok) return json(502, { error: r.data.message || 'GitHub error' });
    return json(200, { ok: true });
  }

  return json(404, { error: 'Unknown action' });
};
