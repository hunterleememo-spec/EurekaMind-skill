import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { mkdtemp, readFile, stat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const client = fileURLToPath(new URL('../skills/eurekamind/scripts/client.mjs', import.meta.url));
const key = 'em_ro_' + randomBytes(32).toString('base64url');
const observed = [];
const sample = ['recording', 'transcript', 'note', 'memo_audio', 'memo_text', 'memo_asset'].map((type, i) => ({ id: `fixture-${i}`, type, title: `Sample ${type}` }));
let server, origin, temp, config;
function run(args, input) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env }; delete env.EUREKAMIND_API_KEY; delete env.EUREKAMIND_API_BASE;
    const child = spawn(process.execPath, [client, ...args, '--config', config], { env, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    child.stdout.on('data', bytes => stdout += bytes); child.stderr.on('data', bytes => stderr += bytes);
    child.on('error', reject); child.on('close', code => resolve({ code, stdout, stderr }));
    child.stdin.end(input || '');
  });
}
before(async () => {
  temp = await mkdtemp(path.join(tmpdir(), 'eurekamind-contract-')); config = path.join(temp, 'credentials.json');
  server = createServer(async (req, res) => {
    if (req.url === '/fixture-download') {
      observed.push({ downloadAuth: req.headers.authorization || null });
      res.writeHead(200, { 'Content-Type': 'text/plain' }); res.end('sample file\n'); return;
    }
    let body = ''; for await (const chunk of req) body += chunk;
    const request = JSON.parse(body); observed.push(request);
    if (req.url !== '/api/agent/v1/gateway' || req.method !== 'POST') { res.writeHead(404); res.end(); return; }
    res.setHeader('Content-Type', 'application/json');
    if (req.headers.authorization !== 'Bearer ' + key) {
      res.writeHead(401); res.end(JSON.stringify({ code: 'UNAUTHORIZED', message: 'Never display upstream secrets: ' + key })); return;
    }
    if (request.protocol_version !== '1' || request.skill_version !== '0.1.0' || !request.params) {
      res.writeHead(400); res.end(JSON.stringify({ code: 'INVALID_REQUEST' })); return;
    }
    let data;
    if (request.api_name === '/me') data = { userId: 'fixture-user', scope: 'assets:read', dataSource: 'local-demo' };
    else if (request.api_name === '/assets/search') {
      const offset = request.params.cursor === 'page-2' ? 3 : 0;
      data = { items: sample.slice(offset, offset + 3), hasMore: offset === 0, nextCursor: offset === 0 ? 'page-2' : '', dataSource: 'local-demo' };
    } else if (request.api_name === '/files/get_download_url') data = { url: origin + '/fixture-download', size: 12, mimeType: 'text/plain', dataSource: 'local-demo' };
    else { res.writeHead(403); res.end(JSON.stringify({ code: 'OPERATION_DENIED' })); return; }
    res.end(JSON.stringify({ code: 0, data }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  const result = await run(['configure', '--base-url', origin], key + '\n'); assert.equal(result.code, 0);
});
after(async () => { if (server) await new Promise(resolve => server.close(resolve)); if (temp) await rm(temp, { recursive: true, force: true }); });

test('configuration validates identity and persists an endpoint-bound credential', async () => {
  const saved = JSON.parse(await readFile(config, 'utf8'));
  assert.equal(saved.baseUrl, origin); assert.ok(saved.key === key);
  if (process.platform !== 'win32') assert.equal((await stat(config)).mode & 0o777, 0o600);
  const result = await run(['me']); assert.equal(result.code, 0);
  assert.equal(JSON.parse(result.stdout).dataSource, 'local-demo'); assert.ok(!result.stdout.includes(key));
});
test('all pages preserve query, send versions and contain all six asset types', async () => {
  observed.length = 0;
  const result = await run(['search', '--query', 'sample', '--all']); assert.equal(result.code, 0);
  const data = JSON.parse(result.stdout); assert.equal(data.complete, true); assert.equal(data.items.length, 6);
  assert.deepEqual(data.items.map(item => item.type), sample.map(item => item.type));
  const requests = observed.filter(item => item.api_name === '/assets/search'); assert.equal(requests.length, 2);
  assert.ok(requests.every(item => item.params.query === 'sample' && item.skill_version === '0.1.0' && item.protocol_version === '1'));
  assert.equal(requests[1].params.cursor, 'page-2');
});
test('downloads omit credentials and cannot overwrite an existing file', async () => {
  const output = path.join(temp, 'sample.txt');
  let result = await run(['download', '--file-id', 'fixture-file', '--output', output]); assert.equal(result.code, 0);
  assert.equal(await readFile(output, 'utf8'), 'sample file\n');
  assert.ok(observed.filter(item => 'downloadAuth' in item).every(item => item.downloadAuth === null));
  result = await run(['download', '--file-id', 'fixture-file', '--output', output]); assert.notEqual(result.code, 0);
  assert.equal(await readFile(output, 'utf8'), 'sample file\n');
});
test('rejected configuration leaves credentials intact and hides upstream secrets', async () => {
  const before = await readFile(config, 'utf8');
  const invalid = 'em_ro_' + randomBytes(32).toString('base64url');
  const result = await run(['configure', '--base-url', origin], invalid + '\n');
  assert.notEqual(result.code, 0); assert.match(result.stderr, /UNAUTHORIZED/);
  assert.ok(!result.stderr.includes(key) && !result.stderr.includes(invalid));
  assert.ok((await readFile(config, 'utf8')) === before);
});
