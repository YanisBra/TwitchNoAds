window.addEventListener('message', (event) => {
    if (event.source !== window) return;

    if (event.data && event.data.type === 'TNA_AD_BYPASSED') {
        chrome.storage.local.get(['adsBypassed'], (result) => {
            let count = result.adsBypassed || 0;
            chrome.storage.local.set({ adsBypassed: count + 1 });
        });
    }

    if (event.data && event.data.type === 'TNA_RESET_COUNTER') {
        chrome.storage.local.set({ adsBypassed: 0 });
    }
});
