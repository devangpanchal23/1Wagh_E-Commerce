// Thin wrapper around the GitHub Contents API, used to store product images
// in a GitHub repo and serve them to the storefront via jsDelivr's CDN
// instead of raw.githubusercontent.com (which is not meant for production
// traffic). All calls require GITHUB_TOKEN, which must only ever live in
// backend env vars — this module is never imported by client code.
const crypto = require('crypto');

const GITHUB_API_BASE = 'https://api.github.com';
const IMAGE_ROOT = 'product-photos';

function getConfig() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';
  return { token, owner, repo, branch };
}

// True once all required env vars are present. Callers use this to degrade
// gracefully (empty cloud gallery, skip background sync) instead of throwing
// when the GitHub integration hasn't been configured for an environment.
function isConfigured() {
  const { token, owner, repo } = getConfig();
  return Boolean(token && owner && repo);
}

function authHeaders() {
  const { token } = getConfig();
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

function sanitizeSegment(segment) {
  return String(segment).replace(/[^a-zA-Z0-9._-]/g, '_');
}

function productFolderPath(productId) {
  return `${IMAGE_ROOT}/${sanitizeSegment(productId || 'unassigned')}`;
}

// jsDelivr's GitHub CDN endpoint — edge-cached, meant for production traffic
// (unlike raw.githubusercontent.com, which GitHub explicitly says not to
// use for that purpose).
function toJsDelivrUrl(filePath) {
  const { owner, repo, branch } = getConfig();
  return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${filePath}`;
}

function toUniqueFilename(originalName) {
  const ext = (originalName.match(/\.[a-zA-Z0-9]+$/) || [''])[0].toLowerCase() || '.jpg';
  const base = originalName.replace(/\.[a-zA-Z0-9]+$/, '').slice(0, 40);
  const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  return `${sanitizeSegment(base) || 'image'}-${uniqueSuffix}${ext}`;
}

async function githubRequest(path, options = {}) {
  const res = await fetch(`${GITHUB_API_BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });
  return res;
}

// Lists the images already stored for a product. A missing folder (product
// has never had a cloud image) is a normal empty state, not an error.
async function listFolderImages(productId) {
  if (!isConfigured()) return [];

  const { branch } = getConfig();
  const folderPath = productFolderPath(productId);
  const res = await githubRequest(`/repos/${getConfig().owner}/${getConfig().repo}/contents/${folderPath}?ref=${branch}`);

  if (res.status === 404) return [];
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `GitHub API error (${res.status})`);
  }

  const entries = await res.json();
  const files = Array.isArray(entries) ? entries : [entries];

  return files
    .filter((entry) => entry.type === 'file' && /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(entry.name))
    .map((entry) => ({
      name: entry.name,
      path: entry.path,
      sha: entry.sha,
      size: entry.size,
      url: toJsDelivrUrl(entry.path),
    }));
}

// Uploads a single file's contents into the product's GitHub folder,
// generating a unique filename so re-uploads never collide with what
// jsDelivr (or a browser) has already cached under an old path.
async function uploadImage({ productId, originalName, buffer }) {
  if (!isConfigured()) {
    throw new Error('GitHub integration is not configured on this server.');
  }

  const { owner, repo, branch } = getConfig();
  const folderPath = productFolderPath(productId);
  const filename = toUniqueFilename(originalName || 'image.jpg');
  const filePath = `${folderPath}/${filename}`;

  // The generated filename already includes a random+timestamp suffix, so a
  // collision is not expected — but the Contents API requires the existing
  // file's `sha` to overwrite it, so check first and pass it along if a file
  // somehow already exists at this exact path.
  let existingSha;
  const existingRes = await githubRequest(`/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`);
  if (existingRes.ok) {
    const existing = await existingRes.json();
    existingSha = existing.sha;
  }

  const putRes = await githubRequest(`/repos/${owner}/${repo}/contents/${filePath}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `Add product image ${filename} (product ${productId || 'unassigned'})`,
      content: buffer.toString('base64'),
      branch,
      ...(existingSha ? { sha: existingSha } : {}),
    }),
  });

  if (!putRes.ok) {
    const body = await putRes.json().catch(() => ({}));
    throw new Error(body.message || `GitHub upload failed (${putRes.status})`);
  }

  const result = await putRes.json();
  return {
    name: filename,
    path: filePath,
    sha: result.content?.sha,
    url: toJsDelivrUrl(filePath),
  };
}

module.exports = {
  isConfigured,
  listFolderImages,
  uploadImage,
  toJsDelivrUrl,
  productFolderPath,
};
