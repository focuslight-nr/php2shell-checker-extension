// Ported from openai/php2shell-checker's skills/phpcheck-url/scripts/phpcheck.js
// (same cutoff table and header-parsing regex, see logic.js), adapted to
// watch response headers live instead of running as a one-shot CLI.
import { evaluateHeaders } from './logic.js'

const BADGE_COLOR = { ok: '#2e7d32', vulnerable: '#c62828', unknown: '#757575' }
const BADGE_TEXT = { ok: 'OK', vulnerable: '!', unknown: '?' }

// tabId -> { status, version, reason, url, checkedAt }
const results = new Map()

function setBadge(tabId, status) {
  chrome.action.setBadgeBackgroundColor({ tabId, color: BADGE_COLOR[status] || BADGE_COLOR.unknown })
  chrome.action.setBadgeText({ tabId, text: BADGE_TEXT[status] || '?' })
}

function clearBadge(tabId) {
  chrome.action.setBadgeText({ tabId, text: '' })
}

chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (details.tabId < 0) return
    const headerMap = {}
    for (const h of details.responseHeaders || []) {
      headerMap[h.name.toLowerCase()] = h.value || ''
    }
    const { status, version, reason } = evaluateHeaders(headerMap['server'], headerMap['x-powered-by'])
    results.set(details.tabId, { status, version, reason, url: details.url, checkedAt: Date.now() })
    setBadge(details.tabId, status)
  },
  { urls: ['http://*/*', 'https://*/*'], types: ['main_frame'] },
  ['responseHeaders', 'extraHeaders']
)

// Clear the stale result the instant a new top-level navigation starts, so
// the badge never shows a previous page's verdict while the next one loads.
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0) return
  results.delete(details.tabId)
  clearBadge(details.tabId)
})

chrome.tabs.onRemoved.addListener((tabId) => results.delete(tabId))

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'get-result') {
    sendResponse(results.get(message.tabId) || null)
  }
  return false
})
