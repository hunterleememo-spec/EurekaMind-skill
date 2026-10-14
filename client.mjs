#!/usr/bin/env node
import { readFile, mkdir, writeFile, rename, unlink, link, chmod } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';

const VERSION = '0.1.0';
const args = process.argv.slice(2);
const command = args.shift();
const options = {};
for (let i = 0; i < args.length; i++) {
  if (!args[i].startsWith('--')) throw new Error('Expected a named option.');
  const key = args[i].slice(2);
  if (Object.hasOwn(options, key)) throw new Error('Duplicate option.');
  options[key] = key === 'all' ? true : args[++i];
  if (options[key] === undefined) throw new Error('Missing option value.');
}
const configPath = path.resolve(options.config || path.join(homedir(), '.config/eurekamind/credentials.json'));

function baseUrl(value) {
  const url = new URL(value);
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('Base URL must be an origin without credentials or a path.');
  const local = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) throw new Error('Use HTTPS except for a local loopback server.');
  return url.origin;
}
function permitted(names) {
  for (const name of Object.keys(options)) if (!names.includes(name) && name !== 'config') throw new Error('Unsupported option: --' + name);
}
async function credentials() {
  let saved = {};
  try { saved = JSON.parse(await readFile(configPath, 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw new Error('Could not read credential configuration.'); }
  const key = process.env.EUREKAMIND_API_KEY || saved.key;
  const endpoint = process.env.EUREKAMIND_API_BASE || saved.baseUrl;
  if (!key || !endpoint) throw new Error('Configure the Key locally using the configure command. Do not paste it into a chat.');
  const base = baseUrl(endpoint);
  if (!process.env.EUREKAMIND_API_KEY && base !== baseUrl(saved.baseUrl)) throw new Error('Endpoint changed. Configure a Key for the new endpoint explicitly.');
  return { key, base };
}
async function request(connection, operation, params = {}) {
  let response;
  try {
    response = await fetch(connection.base + '/api/agent/v1/gateway', {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(30_000),
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + connection.key },
      body: JSON.stringify({ api_name: operation, protocol_version: '1', skill_version: VERSION, params }),
    });
  } catch { throw new Error('Gateway unreachable or timed out. Check the configured endpoint.'); }
  let body;
  try { body = await response.json(); } catch { throw new Error('Gateway returned a non-JSON response.'); }
  if (!response.ok || body.code !== 0) {
    const code = /^[A-Z_]{1,40}$/.test(body.code) ? body.code : 'REQUEST_FAILED';
    throw new Error(`Gateway rejected request (${response.status}, ${code}).`);
  }
  return body.data;
}
async function secretInput() {
  if (!process.stdin.isTTY) {
    let text = '';
    for await (const chunk of process.stdin) { text += chunk; if (text.length > 256) throw new Error('Key input too long.'); }
    return text.trim();
  }
  process.stderr.write('API Key (hidden): ');
  return new Promise((resolve, reject) => {
    let value = '';
    process.stdin.setRawMode(true); process.stdin.resume(); process.stdin.setEncoding('utf8');
    const finish = (error) => { process.stdin.setRawMode(false); process.stdin.pause(); process.stdin.off('data', input); process.stderr.write('\n'); error ? reject(error) : resolve(value.trim()); };
    const input = chunk => {
      for (const char of chunk) {
        if (char === '\u0003') return finish(new Error('Cancelled.'));
        if (char === '\r' || char === '\n') return finish();
        if (char === '\u007f' || char === '\b') value = value.slice(0, -1);
        else if (/^[a-zA-Z0-9_-]$/.test(char)) value += char;
        if (value.length > 128) return finish(new Error('Key input too long.'));
      }
    };
    process.stdin.on('data', input);
  });
}
async function configure() {
  permitted(['base-url']);
  if (!options['base-url']) throw new Error('Provide --base-url.');
  const base = baseUrl(options['base-url']);
  const key = await secretInput();
  if (!/^em_ro_[A-Za-z0-9_-]{43}$/.test(key)) throw new Error('Invalid Key format.');
  const identity = await request({ base, key }, '/me');
  await mkdir(path.dirname(configPath), { recursive: true, mode: 0o700 });
  const temp = configPath + '.' + randomUUID() + '.tmp';
  try {
    await writeFile(temp, JSON.stringify({ baseUrl: base, key }) + '\n', { mode: 0o600, flag: 'wx' });
    await rename(temp, configPath); await chmod(configPath, 0o600);
  } finally { await unlink(temp).catch(() => {}); }
  return { configured: true, dataSource: identity.dataSource, scope: identity.scope };
}
async function pages(connection, operation, params) {
  if (!options.all) return request(connection, operation, params);
  const items = [], ids = new Set(), cursors = new Set();
  for (let page = 0; page < 10000; page++) {
    const result = await request(connection, operation, params);
    if (!Array.isArray(result.items)) throw new Error('Invalid page response.');
    for (const item of result.items) {
      if (!ids.has(item.id)) { items.push(item); ids.add(item.id); }
    }
    if (!result.hasMore) return { items, complete: true, pages: page + 1, dataSource: result.dataSource, ...(result.status ? { status: result.status } : {}) };
    if (!result.nextCursor || cursors.has(result.nextCursor)) throw new Error('Pagination did not advance. Export is incomplete.');
    cursors.add(result.nextCursor); params = { ...params, cursor: result.nextCursor };
  }
  throw new Error('Page limit exceeded. Narrow the query; export is incomplete.');
}
async function download(connection) {
  permitted(['file-id', 'output']);
  if (!options['file-id'] || !options.output) throw new Error('Provide --file-id and --output.');
  const info = await request(connection, '/files/get_download_url', { fileId: options['file-id'] });
  const url = new URL(info.url);
  if (url.username || url.password || (url.protocol !== 'https:' && !(url.protocol === 'http:' && url.origin === connection.base))) throw new Error('Unsafe download URL.');
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(60_000) });
  if (!response.ok || !response.body) throw new Error('Download failed. Request a fresh link or check authorization.');
  const MAX = 100 * 1024 * 1024;
  if (Number(response.headers.get('content-length')) > MAX) { await response.body.cancel(); throw new Error('Download exceeds the 100 MiB local client limit.'); }
  const destination = path.resolve(options.output);
  const temp = destination + '.' + randomUUID() + '.part';
  const stream = createWriteStream(temp, { flags: 'wx', mode: 0o600 });
  let size = 0, writeError;
  stream.on('error', e => { writeError = e; });
  try {
    for await (const chunk of response.body) {
      size += chunk.length;
      if (size > MAX) throw new Error('Download exceeds the 100 MiB local client limit.');
      if (writeError) throw writeError;
      if (!stream.write(chunk)) await once(stream, 'drain');
    }
    stream.end(); await once(stream, 'close');
    if (writeError) throw writeError;
    if (Number.isFinite(info.size) && size !== info.size) throw new Error('Download size mismatch.');
    await link(temp, destination);
    return { downloaded: true, path: destination, size, mimeType: info.mimeType, dataSource: info.dataSource };
  } finally { stream.destroy(); await unlink(temp).catch(() => {}); }
}
async function main() {
  if (!command || command === 'help') return { commands: ['configure --base-url URL', 'me', 'capabilities', 'list [--type TYPE] [--all]', 'search --query TEXT [--all]', 'get --id ID', 'transcript --id ID [--all]', 'download --file-id ID --output PATH'], credentialInput: 'configure reads the Key from hidden terminal input or stdin', optional: '--config PATH selects a credential file' };
  if (command === 'configure') return configure();
  const connection = await credentials();
  if (command === 'me' || command === 'capabilities') { permitted([]); return request(connection, command === 'me' ? '/me' : '/_list'); }
  if (command === 'get') { permitted(['id']); return request(connection, '/assets/get', { assetId: options.id }); }
  if (command === 'download') return download(connection);
  if (['list', 'search', 'transcript'].includes(command)) {
    permitted(command === 'transcript' ? ['id', 'limit', 'cursor', 'all'] : ['type', 'query', 'from', 'to', 'limit', 'cursor', 'all']);
    const params = {};
    for (const name of ['type', 'query', 'from', 'to', 'cursor']) if (options[name] !== undefined) params[name] = options[name];
    if (options.limit !== undefined) { params.limit = Number(options.limit); if (!Number.isInteger(params.limit) || params.limit < 1 || params.limit > 100) throw new Error('limit must be 1–100.'); }
    if (command === 'transcript') params.assetId = options.id;
    return pages(connection, command === 'transcript' ? '/transcripts/list' : '/assets/' + command, params);
  }
  throw new Error('Unknown command. Run help.');
}
main().then(result => process.stdout.write(JSON.stringify(result, null, 2) + '\n')).catch(error => {
  // Do not print error causes, response bodies or URLs containing download grants.
  const message = error.code ? 'Local file operation failed (' + error.code + ').' : error.message;
  process.stderr.write(message + '\n'); process.exitCode = 1;
});
