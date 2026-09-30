/**
 * ProjectWeek AdBlocker - Advanced Cosmetic Filter
 *
 * Combines immediate CSS injection (to prevent layout flicker)
 * with a MutationObserver to actively strip ad containers injected
 * dynamically by JavaScript after initial page load.
 */

(() => {
  // Target selectors for common ad containers, iframes, and slots
  const adSelectors = [
    ".adsbygoogle",
    "[id^='google_ads_']",
    "[id*='ad-container']",
    "[id*='ad_container']",
    "[class*='ad-banner']",
    "[class*='ad_banner']",
    "[class*='ad-slot']",
    ".ad-slot",
    ".trc_related_container",
    ".taboola-container",
    ".outbrain_widget",
    "iframe[src*='doubleclick']",
    "iframe[src*='googlesyndication']",
    "iframe[src*='adnxs']"
  ];

  /**
   * 1. STATIC INJECTION:
   * Insert high-priority CSS rules into document head or root
   */
  const style = document.createElement("style");
  style.id = "shieldblock-cosmetic-engine";
  style.textContent = `
    ${adSelectors.join(",\n")} {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      min-height: 0 !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
  `;

  const target = document.head || document.documentElement;
  if (target) {
    target.appendChild(style);
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      (document.head || document.documentElement).appendChild(style);
    });
  }

  /**
   * 2. DYNAMIC REMOVAL:
   * MutationObserver tracks changes to the DOM and collapses newly added ad nodes.
   */
  function cleanDOM() {
    const combinedSelector = adSelectors.join(",");
    const elements = document.querySelectorAll(combinedSelector);
    elements.forEach((el) => {
      el.style.setProperty("display", "none", "important");
      el.style.setProperty("visibility", "hidden", "important");
    });
  }

  // Run cleanup once the DOM starts building
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", cleanDOM);
  } else {
    cleanDOM();
  }

  // Observe ongoing DOM insertions (catches lazy-loaded ads)
  const observer = new MutationObserver(() => {
    cleanDOM();
  });

  // Start observing once <body> exists
  const observeBody = () => {
    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    } else {
      requestAnimationFrame(observeBody);
    }
  };
  observeBody();
})();