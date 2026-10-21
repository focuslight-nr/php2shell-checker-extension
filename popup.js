const STATUS_TEXT = { ok: 'OK', vulnerable: 'VULNERABLE', unknown: 'UNKNOWN' }

function render(result, tabUrl) {
  const dot = document.getElementById('dot')
  const label = document.getElementById('statusLabel')
  const reason = document.getElementById('reason')
  const url = document.getElementById('url')

  const status = result?.status || 'unknown'
  dot.className = `dot ${status}`
  label.textContent = STATUS_TEXT[status] || 'UNKNOWN'
  reason.textContent = result
    ? result.reason
    : 'No response headers observed yet for this tab. Try reloading the page.'
  url.textContent = result?.url || tabUrl || ''
}

async function load() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) return render(null, '')
  const result = await chrome.runtime.sendMessage({ type: 'get-result', tabId: tab.id })
  render(result, tab.url)
}

document.getElementById('recheck').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab?.id) {
    await chrome.tabs.reload(tab.id)
    window.close()
  }
})

load()
