const test = require('node:test');
const assert = require('node:assert/strict');

const githubService = require('../src/services/githubService');
const { ensureUploadsDirectoryWritable } = require('../src/services/uploadStorageService');
const { verifyAdminToken } = require('../src/middleware/adminAuth');
const errorHandler = require('../src/middleware/errorHandler');

const githubEnvKeys = ['GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO', 'GITHUB_BRANCH'];
const originalEnv = Object.fromEntries(githubEnvKeys.map((key) => [key, process.env[key]]));
const originalFetch = global.fetch;

function restoreGithubEnvironment() {
  for (const key of githubEnvKeys) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
  global.fetch = originalFetch;
}

test.after(restoreGithubEnvironment);

test('local upload storage is created and accepts a write probe', () => {
  const directory = ensureUploadsDirectoryWritable();
  assert.ok(require('fs').existsSync(directory));
});

test('missing GitHub configuration fails with an explicit GITHUB_AUTH_ERROR', async () => {
  delete process.env.GITHUB_TOKEN;
  delete process.env.GITHUB_OWNER;
  delete process.env.GITHUB_REPO;

  await assert.rejects(githubService.validateConfiguration(), (error) => {
    assert.equal(error.code, 'GITHUB_AUTH_ERROR');
    assert.match(error.message, /missing GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO/);
    return true;
  });
  restoreGithubEnvironment();
});

test('GitHub write denial preserves the upstream HTTP status and message', async () => {
  process.env.GITHUB_TOKEN = 'test-token';
  process.env.GITHUB_OWNER = 'owner';
  process.env.GITHUB_REPO = 'repo';
  process.env.GITHUB_BRANCH = 'main';
  global.fetch = async () => new Response(JSON.stringify({ message: 'Resource not accessible by personal access token' }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  });

  await assert.rejects(
    githubService.uploadImage({ productId: 'test', originalName: 'image.jpg', buffer: Buffer.from('image') }),
    (error) => {
      assert.equal(error.code, 'GITHUB_AUTH_ERROR');
      assert.equal(error.status, 403);
      assert.equal(error.githubMessage, 'Resource not accessible by personal access token');
      return true;
    }
  );
  restoreGithubEnvironment();
});

test('admin middleware returns ADMIN_AUTH_ERROR for a missing upload token', () => {
  let body;
  const res = {
    status(code) { this.statusCode = code; return this; },
    json(payload) { body = payload; return this; },
  };
  verifyAdminToken({ headers: {} }, res, () => assert.fail('next must not run'));
  assert.equal(res.statusCode, 401);
  assert.equal(body.code, 'ADMIN_AUTH_ERROR');
});

test('filesystem write errors return LOCAL_STORAGE_PERMISSION_ERROR', () => {
  let body;
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(payload) { body = payload; return this; },
  };
  errorHandler(Object.assign(new Error('permission denied'), { code: 'EACCES' }), {}, res, () => {});
  assert.equal(res.statusCode, 503);
  assert.equal(body.code, 'LOCAL_STORAGE_PERMISSION_ERROR');
  assert.equal(body.nodeCode, 'EACCES');
});

test('GitHub errors retain their exact diagnostic fields through the API error handler', () => {
  let body;
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(payload) { body = payload; return this; },
  };
  errorHandler(new githubService.GitHubApiError({
    status: 403,
    message: 'Resource not accessible by personal access token',
    operation: 'PUT /repos/owner/repo/contents/image.jpg',
  }), {}, res, () => {});
  assert.equal(res.statusCode, 502);
  assert.equal(body.code, 'GITHUB_AUTH_ERROR');
  assert.equal(body.githubStatus, 403);
  assert.equal(body.githubMessage, 'Resource not accessible by personal access token');
});
