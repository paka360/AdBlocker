(() => {
  // Common element hiding selectors
  const adSelectors = [
    ".adsbygoogle",
    "[id^='google_ads_']",
    "[id*='ad-container']",
    "[class*='ad-banner']",
    ".ad-slot",
    ".trc_related_container",
    ".taboola-container"
  ];

  const style = document.createElement("style");
  style.id = "shieldblock-css";
  style.textContent = `
    ${adSelectors.join(", ")} {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
  `;

  // Attach immediately to document head or root
  const target = document.head || document.documentElement;
  if (target) {
    target.appendChild(style);
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      (document.head || document.documentElement).appendChild(style);
    });
  }
})();