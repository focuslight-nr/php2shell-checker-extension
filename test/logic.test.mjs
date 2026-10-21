import { test } from 'node:test'
import assert from 'node:assert/strict'
import { patchStatus, evaluateHeaders } from '../logic.js'

test('patchStatus: vulnerable patch at/under cutoff', () => {
  assert.equal(patchStatus('8.1.30'), 'vulnerable') // cutoff 34, 30 <= 34
  assert.equal(patchStatus('8.1.34'), 'vulnerable') // exactly at cutoff
})

test('patchStatus: ok patch above cutoff', () => {
  assert.equal(patchStatus('8.1.35'), 'ok')
  assert.equal(patchStatus('8.3.36'), 'ok')
})

test('patchStatus: unknown branch not in table', () => {
  assert.equal(patchStatus('9.0.0'), 'unknown')
  assert.equal(patchStatus('5.3.29'), 'unknown')
})

test('patchStatus: unparsable version string', () => {
  assert.equal(patchStatus(''), 'unknown')
  assert.equal(patchStatus('not-a-version'), 'unknown')
  assert.equal(patchStatus(undefined), 'unknown')
})

test('patchStatus: prerelease build of next patch is unknown, not ok', () => {
  assert.equal(patchStatus('8.1.35-dev'), 'unknown')
  assert.equal(patchStatus('8.1.35~beta1'), 'unknown')
  assert.equal(patchStatus('8.1.35-rc1'), 'unknown')
})

test('patchStatus: prerelease build of a vulnerable patch is still vulnerable', () => {
  // match[3] (the numeric patch) is 30, which is <= cutoff regardless of suffix
  assert.equal(patchStatus('8.1.30-dev'), 'vulnerable')
})

test('evaluateHeaders: reads X-Powered-By', () => {
  const r = evaluateHeaders('Apache/2.4.41', 'PHP/8.1.30')
  assert.equal(r.status, 'vulnerable')
  assert.equal(r.version, '8.1.30')
})

test('evaluateHeaders: reads Server header PHP banner', () => {
  const r = evaluateHeaders('nginx/1.18 PHP/8.3.40', '')
  assert.equal(r.status, 'ok')
  assert.equal(r.version, '8.3.40')
})

test('evaluateHeaders: no PHP mention anywhere -> unknown with no version', () => {
  const r = evaluateHeaders('nginx/1.18', '')
  assert.equal(r.status, 'unknown')
  assert.equal(r.version, null)
  assert.match(r.reason, /No PHP version found/)
})

test('evaluateHeaders: a vulnerable match found after an ok one is not hidden', () => {
  // Server banner looks fine, but X-Powered-By reveals the real (vulnerable) version.
  const r = evaluateHeaders('PHP/8.3.40', 'PHP/8.1.20')
  assert.equal(r.status, 'vulnerable')
  assert.equal(r.version, '8.1.20')
})

test('evaluateHeaders: empty headers -> unknown', () => {
  const r = evaluateHeaders('', '')
  assert.equal(r.status, 'unknown')
  assert.equal(r.version, null)
})
