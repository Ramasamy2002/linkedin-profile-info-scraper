chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "scrapeProfiles") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab?.url && !activeTab.url.startsWith("chrome://")) {
        chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          files: ["content.js"],
        });
        sendResponse({ status: "Scraping profiles..." });
      } else {
        console.error("Cannot scrape profiles: Invalid tab or page.");
        sendResponse({ status: "Error: Invalid tab or page." });
      }
    });
    return true;
  } else if (message.action === "scrapeContactInfo") {
    chrome.storage.local.get("profiles", ({ profiles }) => {
      if (profiles && profiles.length > 0) {
        let index = 0;
        const emails = [];

        function processNextProfile() {
          if (index < profiles.length) {
            const currentProfile = profiles[index];
            const overlayUrl = `${currentProfile.url}/overlay/contact-info/`;

            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              const activeTab = tabs[0];
              chrome.tabs.update(activeTab.id, { url: overlayUrl }, () => {
                setTimeout(() => {
                  chrome.scripting.executeScript(
                    {
                      target: { tabId: activeTab.id },
                      func: scrapeContactInfo,
                    },
                    (results) => {
                      const contactInfo = results?.[0]?.result || {};
                      if (contactInfo.email) {
                        emails.push({
                          name: currentProfile.name,
                          url: currentProfile.url,
                          email: contactInfo.email,
                        });

                        // Update popup dynamically
                        chrome.runtime.sendMessage({
                          action: "updateEmails",
                          emailData: {
                            name: currentProfile.name,
                            url: currentProfile.url,
                            email: contactInfo.email,
                          },
                        });
                      }

                      index++;
                      processNextProfile();
                    }
                  );
                }, 5000); // Wait for navigation and loading
              });
            });
          } else {
            chrome.storage.local.set({ emails }, () => {
              console.log("Finished processing all profiles.");
              chrome.runtime.sendMessage({ action: "scrapingComplete" });
            });
          }
        }

        processNextProfile();
      } else {
        console.log("No profiles available for contact info scraping.");
      }
    });
    sendResponse({ status: "Contact info scraping started." });
    return true;
  }
});

function scrapeContactInfo() {
  return new Promise((resolve) => {
    const emailElement = document.querySelector('a[href^="mailto:"]');
    const email = emailElement ? emailElement.textContent.trim() : null;

    resolve({ email });
  });
}
