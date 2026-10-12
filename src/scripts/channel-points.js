// src/scripts/channel-points.js

(function() {
    'use strict';

    function claimChannelPoints() {
        chrome.storage.local.get(['autoClaimPoints'], (data) => {
            const enabled = data.autoClaimPoints ?? false;
            if (!enabled) return;

            const claimBtn = 
                document.querySelector('.community-points-summary > *:nth-child(2) button') ||
                document.querySelector('[aria-label="Claim Bonus"]') ||
                document.querySelector('[aria-label="Récupérer le bonus"]');
                
            if (claimBtn) {
                claimBtn.click();
                console.log('[TwitchNoAds] Points de chaîne récupérés !');
            }
        });
    }

    // Auto-claim channel points every 5 seconds
    setInterval(claimChannelPoints, 5000);

})();
