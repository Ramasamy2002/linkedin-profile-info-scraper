function scrapeLinkedInProfiles() {
  const profiles = [];
  const profileElements = document.querySelectorAll('a[href*="/in/"]');

  profileElements.forEach((el) => {
    const url = el.href.split('?')[0]; // Extract the base URL
    const nameSpan = el.querySelector('span[aria-hidden="true"]');
    const name = nameSpan ? nameSpan.textContent.trim() : null;

    if (name && url) {
      profiles.push({ name, url });

      // Send each scraped profile to popup
      chrome.runtime.sendMessage({ action: "updateProfiles", profile: { name, url } });
    }
  });

  chrome.storage.local.set({ profiles }, () => {
    console.log("Profiles scraped and stored:", profiles);
    chrome.runtime.sendMessage({ action: "scrapingComplete" });
  });
}

// Start scraping when the content script is injected
scrapeLinkedInProfiles();
