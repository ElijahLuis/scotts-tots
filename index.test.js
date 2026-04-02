const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { verifyGitHubSignature } = require('./webhook');

// ---- Tests ----

describe('verifyGitHubSignature', () => {
  const secret = 'test-secret';
  const body = Buffer.from(JSON.stringify({ foo: 'bar' }));

  before(() => { process.env.GITHUB_WEBHOOK_SECRET = secret; });
  after(() => { delete process.env.GITHUB_WEBHOOK_SECRET; });

  it('returns true when signature matches', () => {
    const sig = 'sha256=' + crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    assert.ok(verifyGitHubSignature(body, sig));
  });

  it('returns false when signature is wrong', () => {
    assert.ok(!verifyGitHubSignature(body, 'sha256=badhash'));
  });

  it('returns false when signature is missing and secret is set', () => {
    assert.ok(!verifyGitHubSignature(body, undefined));
  });

  it('returns true when no secret is configured (open mode)', () => {
    delete process.env.GITHUB_WEBHOOK_SECRET;
    assert.ok(verifyGitHubSignature(body, undefined));
  });
});

