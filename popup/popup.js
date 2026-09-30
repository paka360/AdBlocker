document.addEventListener("DOMContentLoaded", async () => {
  const toggle = document.getElementById("blocker-toggle");
  const domainLabel = document.getElementById("domain-label");
  const statusText = document.getElementById("status-text");

  // Get active tab URL
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url || !tab.url.startsWith("http")) {
    domainLabel.textContent = "Unsupported Page";
    toggle.disabled = true;
    return;
  }

  const url = new URL(tab.url);
  const domain = url.hostname;
  domainLabel.textContent = domain;

  // Retrieve site state
  const { disabledDomains = [] } = await chrome.storage.local.get("disabledDomains");
  const isEnabled = !disabledDomains.includes(domain);
  toggle.checked = isEnabled;
  statusText.textContent = isEnabled ? "Protection Active" : "Protection Disabled";

  toggle.addEventListener("change", async () => {
    const active = toggle.checked;
    statusText.textContent = active ? "Protection Active" : "Protection Disabled";

    let updatedDisabled = [...disabledDomains];
    if (!active) {
      if (!updatedDisabled.includes(domain)) updatedDisabled.push(domain);
    } else {
      updatedDisabled = updatedDisabled.filter((d) => d !== domain);
    }

    await chrome.storage.local.set({ disabledDomains: updatedDisabled });

    chrome.runtime.sendMessage({
      action: "toggleWhitelist",
      domain: domain,
      enableBlocker: active
    }, () => {
      chrome.tabs.reload(tab.id);
    });
  });
});