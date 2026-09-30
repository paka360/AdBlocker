// Keep track of badge counter per tab (using declarativeNetRequestFeedback in dev mode)
chrome.declarativeNetRequest.onRuleMatchedDebug?.addListener((info) => {
  if (info.tabId && info.tabId > 0) {
    chrome.action.setBadgeText({ tabId: info.tabId, text: "BLOCKED" });
    chrome.action.setBadgeBackgroundColor({ tabId: info.tabId, color: "#E53E3E" });
  }
});

// Listener to handle allowlist toggles from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleWhitelist") {
    handleWhitelistToggle(request.domain, request.enableBlocker).then(() => {
      sendResponse({ status: "success" });
    });
    return true; // Keep message channel open for async response
  }
});

async function handleWhitelistToggle(domain, enableBlocker) {
  const RULE_ID_OFFSET = 10000;
  // Compute deterministic rule ID from domain hash
  const ruleId = RULE_ID_OFFSET + Math.abs(hashCode(domain) % 10000);

  if (!enableBlocker) {
    // Add dynamic allow rule that bypasses blocking for this domain
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [ruleId],
      addRules: [
        {
          id: ruleId,
          priority: 2, // Overrides static block rules (priority 1)
          action: { type: "allowAllRequests" },
          condition: {
            initiatorDomains: [domain],
            resourceTypes: [
              "main_frame",
              "sub_frame",
              "stylesheet",
              "script",
              "image",
              "font",
              "object",
              "xmlhttprequest",
              "ping",
              "media",
              "websocket",
              "other"
            ]
          }
        }
      ]
    });
  } else {
    // Re-enable blocking: remove the bypass rule
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [ruleId]
    });
  }
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}