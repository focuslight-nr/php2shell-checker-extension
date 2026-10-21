// Pure, browser/chrome-API-free port of openai/php2shell-checker's
// skills/phpcheck-url/scripts/phpcheck.js version check logic, so it can be
// unit-tested under plain Node and shared by the extension's service worker.

// Vulnerable version cutoffs as of 2026-10-20. A newer stable patch in a
// listed branch is OK by this table; unlisted branches remain unknown.
export const VULNERABLE_THROUGH = {
  '5.4': 45, '5.5': 38, '5.6': 40,
  '7.0': 33, '7.1': 33, '7.2': 34, '7.3': 33, '7.4': 33,
  '8.0': 30, '8.1': 34, '8.2': 34, '8.3': 35, '8.4': 26, '8.5': 11,
}

export function patchStatus(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)([-+~].*)?$/.exec(version || '')
  if (!match) return 'unknown'
  const cutoff = VULNERABLE_THROUGH[`${Number(match[1])}.${Number(match[2])}`]
  if (cutoff === undefined) return 'unknown'
  if (Number(match[3]) <= cutoff) return 'vulnerable'
  // A development build of the next patch is not evidence of a stable fix.
  if (/(?:^|[-+~.])(?:dev|alpha|beta|rc)/i.test(match[4] || '')) return 'unknown'
  return 'ok'
}

export function evaluateHeaders(serverHeader, poweredByHeader) {
  const combined = `${serverHeader || ''}\n${poweredByHeader || ''}`
  const pattern = /\bPHP[ /]([^\s,;)]+)/gi
  let version = null
  let status = 'unknown'
  for (const match of combined.matchAll(pattern)) {
    const candidateStatus = patchStatus(match[1])
    // Do not let an OK banner hide a vulnerable or unrecognized PHP version.
    if (version === null || candidateStatus === 'vulnerable' || status === 'ok') {
      version = match[1]
      status = candidateStatus
    }
    if (status === 'vulnerable') break
  }
  const reason = version ? `PHP ${version}` : 'No PHP version found in Server / X-Powered-By headers'
  return { status, version, reason }
}
