/**
 * ProjectWeek AdBlocker - Service Worker
 */

// Verify service worker start and rule readiness
chrome.runtime.onInstalled.addListener(async () => {
  console.log("[ShieldBlock] Extension installed / reloaded.");
  
  // Inspect loaded declarative rulesets to confirm Chrome sees them
  if (chrome.declarativeNetRequest.getEnabledRulesets) {
    const activeRulesets = await chrome.declarativeNetRequest.getEnabledRulesets();
    console.log("[ShieldBlock] Active Static Rulesets:", activeRulesets);
  }
});

// Log any rule matches to the background console
if (chrome.declarativeNetRequest.onRuleMatchedDebug) {
  chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((matchInfo) => {
    console.warn(
      `[ShieldBlock BLOCKED] Rule ID ${matchInfo.rule.ruleId} matched URL:`,
      matchInfo.request.url
    );

    const tabId = matchInfo.request.tabId;
    if (tabId && tabId > 0) {
      chrome.action.setBadgeText({ tabId: tabId, text: "🛡️️" });
      chrome.action.setBadgeBackgroundColor({ tabId: tabId, color: "#DC2626" });
    }
  });
}

// Runtime message handler for allowlisting
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggleWhitelist") {
    handleWhitelistChange(message.domain, message.enableBlocker)
      .then(() => sendResponse({ status: "success" }))
      .catch((err) => sendResponse({ status: "error", message: err.message }));
    return true;
  }
});

async function handleWhitelistChange(domain, enableBlocker) {
  const RULE_BASE_ID = 20000;
  const computedRuleId = RULE_BASE_ID + Math.abs(computeSimpleHash(domain) % 10000);

  if (!enableBlocker) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [computedRuleId],
      addRules: [
        {
          id: computedRuleId,
          priority: 2,
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
              "xmlhttprequest",
              "ping",
              "other"
            ]
          }
        }
      ]
    });
  } else {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [computedRuleId]
    });
  }
}

function computeSimpleHash(inputString) {
  let hash = 0;
  for (let i = 0; i < inputString.length; i++) {
    hash = (hash << 5) - hash + inputString.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}