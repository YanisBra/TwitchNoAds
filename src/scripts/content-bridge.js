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

    // Handshake for background saver setting
    if (event.data && event.data.type === 'TNA_GET_BG_SAVER_SETTING') {
        chrome.storage.local.get(['autoBackgroundSaver'], (data) => {
            const enabled = data.autoBackgroundSaver ?? true;
            window.postMessage({ type: 'TNA_BG_SAVER_SETTING', enabled: enabled }, '*');
        });
    }
});

// Listen to storage changes to update the MAIN world in real time
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.autoBackgroundSaver) {
        const enabled = changes.autoBackgroundSaver.newValue ?? true;
        autoBackgroundSaverEnabled = enabled;
        window.postMessage({ type: 'TNA_BG_SAVER_SETTING', enabled: enabled }, '*');
    }
});

// Cache setting value to respond quickly
let autoBackgroundSaverEnabled = true;
chrome.storage.local.get(['autoBackgroundSaver'], (data) => {
    autoBackgroundSaverEnabled = data.autoBackgroundSaver ?? true;
});

// Listener for visibility changes in ISOLATED world (immune to page script hijacking)
let lastState = 'visible';

function triggerStateChange(state) {
    if (lastState === state) return;
    lastState = state;

    if (!autoBackgroundSaverEnabled) return;

    window.postMessage({ type: 'TNA_VISIBILITY_CHANGE', state: state }, '*');
}

document.addEventListener('visibilitychange', () => {
    triggerStateChange(document.visibilityState);
});

window.addEventListener('blur', () => {
    setTimeout(() => {
        if (document.visibilityState === 'hidden') {
            triggerStateChange('hidden');
        }
    }, 100);
});

window.addEventListener('focus', () => {
    if (document.visibilityState === 'visible') {
        triggerStateChange('visible');
    }
});
