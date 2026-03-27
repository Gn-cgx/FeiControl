const test = require('node:test');
const assert = require('node:assert/strict');

const { createProcessKeepAlive, getUnexpectedExitCode } = require('./dev-server.cjs');

test('unexpected clean child exit is treated as failure', () => {
  assert.equal(getUnexpectedExitCode(0), 1);
  assert.equal(getUnexpectedExitCode(undefined), 1);
  assert.equal(getUnexpectedExitCode(null), 1);
});

test('unexpected non-zero child exit preserves failure code', () => {
  assert.equal(getUnexpectedExitCode(3), 3);
  assert.equal(getUnexpectedExitCode(137), 137);
});

test('process keep-alive interval is refed until cleared', () => {
  const timer = createProcessKeepAlive();
  assert.equal(typeof timer.hasRef, 'function');
  assert.equal(timer.hasRef(), true);
  clearInterval(timer);
});
