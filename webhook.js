const crypto = require('crypto');

/**
 * Verifies the GitHub webhook signature using HMAC-SHA256.
 * The secret is read from the GITHUB_WEBHOOK_SECRET environment variable.
 * Returns true when no secret is configured (open mode).
 * @param {Buffer} rawBody - The raw request body.
 * @param {string|undefined} signature - The X-Hub-Signature-256 header value.
 * @returns {boolean} Whether the signature is valid.
 */
function verifyGitHubSignature(rawBody, signature) {
  if (!process.env.GITHUB_WEBHOOK_SECRET) return true;
  if (!signature) return false;
  const expected = 'sha256=' + crypto
    .createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);
  if (expectedBuf.length !== signatureBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

module.exports = { verifyGitHubSignature };
