// src/scripts/channel-points.js

(function() {
    'use strict';

    let isEnabled = false;
    let claimDebounce = null;

    chrome.storage.local.get(['autoClaimPoints'], (data) => {
        isEnabled = data.autoClaimPoints ?? false;
        if (isEnabled) claimChannelPoints();
    });

    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.autoClaimPoints) {
            isEnabled = changes.autoClaimPoints.newValue ?? false;
            if (isEnabled) claimChannelPoints();
        }
    });

    function claimChannelPoints() {
        if (!isEnabled) return;

        const claimBtn = 
            document.querySelector('.community-points-summary > *:nth-child(2) button') ||
            document.querySelector('[aria-label="Claim Bonus"]') ||
            document.querySelector('[aria-label="Récupérer le bonus"]');
            
        if (claimBtn) {
            claimBtn.click();
            console.log('[TwitchNoAds] Points de chaîne récupérés !');
        }
    }

    const observer = new MutationObserver(() => {
        if (!isEnabled) return;
        if (claimDebounce) return;
        claimDebounce = setTimeout(() => {
            claimDebounce = null;
            claimChannelPoints();
        }, 500);
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Filet de sécurité périodique (sans appel storage)
    setInterval(claimChannelPoints, 15000);

})();
