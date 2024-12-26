// The LinkedIn profile Contact details button
const detailsBtn = () => {
    return document.getElementById('top-card-text-details-contact-info');
};

// Initializing an empty array to later store all the profiles found in the connections list
let allProfiles = [];

// Initializing an object to store scraped contact information
const contactInfo = {
    Name: '',
    'Profile Link': '',
    'Twitter Username': '',
    Address: '',
    Websites: '',
    Email: '',
    'Phone Number': ''
};

// Function to extract contact information from the LinkedIn profile
const getContactInfo = () => {
    const name = document.getElementById('pv-contact-info').textContent.split('\n')[1].trimStart();
    contactInfo['Name'] = name;

    const profileLink = document.getElementsByClassName('pv-contact-info__contact-link link-without-visited-state')[0].href;
    contactInfo['Profile Link'] = profileLink;

    const twitterEle = document.querySelector('.pv-contact-info__contact-type.ci-twitter');
    if (twitterEle) {
        const twitterUsername = twitterEle.querySelector('.pv-contact-info__contact-link.link-without-visited-state.t-14').textContent.split('\n')[1].trimStart();
        contactInfo['Twitter Username'] = twitterUsername;
    }

    const addressEle = document.querySelector('.pv-contact-info__contact-type.ci-address');
    if (addressEle) {
        const address = addressEle.querySelector('.pv-contact-info__contact-link.link-without-visited-state.t-14').textContent.split('\n')[1].trimStart();
        contactInfo['Address'] = address;
    }

    const websitesEle = document.querySelector('.pv-contact-info__contact-type.ci-websites');
    if (websitesEle) {
        const websites = websitesEle.getElementsByClassName('pv-contact-info__contact-link link-without-visited-state');
        let websitesArr = [];
        for (let i = 0; i < websites.length; i++) {
            websitesArr.push(websites[i].href);
        }
        contactInfo['Websites'] = websitesArr.toString();
    }

    const emailEle = document.querySelector('.pv-contact-info__contact-type.ci-email');
    if (emailEle) {
        const email = emailEle.querySelector('.pv-contact-info__contact-link.link-without-visited-state.t-14').href.split(':')[1];
        contactInfo['Email'] = email;
    }

    const phoneEle = document.querySelector('.pv-contact-info__contact-type.ci-phone');
    if (phoneEle) {
        const phoneNum = phoneEle.querySelector('.t-14.t-black.t-normal').textContent.split('\n')[1].trimStart();
        contactInfo['Phone Number'] = phoneNum;
    }

    // Send contactInfo to be displayed in the extension
    chrome.runtime.sendMessage({ action: 'displayData', data: contactInfo });
};

// Function to extract all profiles from the LinkedIn connections list
const clickConnectionProfiles = (loadProfiles) => {
    const profilesLink = document.querySelectorAll('.ember-view.mn-connection-card__link');
    profilesLink[profilesLink.length - 1].focus();

    const btn = document.querySelector('[class="artdeco-button artdeco-button--muted artdeco-button--1 artdeco-button--full artdeco-button--secondary ember-view scaffold-finite-scroll__load-button"]');

    if (allProfiles.length === profilesLink.length) {
        if (btn) {
            btn.click();
        } else {
            chrome.storage.local.set({ profiles: allProfiles.toString() }).then(() => {
                console.log('Profile links are stored in Chrome storage:', allProfiles.toString());
            });
            clearInterval(loadProfiles);
        }
    }

    for (let i = allProfiles.length; i < profilesLink.length; i++) {
        allProfiles.push(profilesLink[i]);
    }
};

// Listener for messages from the extension
chrome.runtime.onMessage.addListener((obj, sender, response) => {
    if (obj.message === 'profile page') {
        if (detailsBtn()) {
            detailsBtn().click();
        }
    }

    if (obj.message === 'scrape data') {
        getContactInfo();
    }

    if (obj.message === 'click all profiles') {
        const loadProfiles = setInterval(() => clickConnectionProfiles(loadProfiles), 1000);

        setTimeout(() => {
            const loadButton = document.querySelector('[class="artdeco-button artdeco-button--muted artdeco-button--1 artdeco-button--full artdeco-button--secondary ember-view scaffold-finite-scroll__load-button"]');
            if (loadButton) loadButton.click();
        }, 3000);
    }
});
