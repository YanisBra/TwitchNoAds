// src/scripts/player-controls.js

(function() {
    'use strict';

    const REWIND_30S_ID = 'tna-rewind-30s';
    const GO_LIVE_ID = 'tna-go-live';
    let rewindSeconds = 30;

    // Get URLs for the assets from the extension
    const imgRewindUrl = chrome.runtime.getURL('src/assets/rewind.png');
    const imgLiveUrl = chrome.runtime.getURL('src/assets/live.png');

    // Custom Tooltip Logic to match Twitch's tooltip style
    let activeTooltip = null;

    function showTooltip(targetElement, text) {
        if (activeTooltip) {
            activeTooltip.remove();
        }

        const tooltip = document.createElement('div');
        tooltip.style.position = 'absolute';
        tooltip.style.backgroundColor = '#ffffff';
        tooltip.style.color = '#000000';
        tooltip.style.padding = '3px 6px';
        tooltip.style.borderRadius = '4px';
        tooltip.style.fontSize = '14px';
        tooltip.style.fontWeight = '600';
        tooltip.style.fontFamily = 'Inter, Roobert, "Helvetica Neue", Helvetica, Arial, sans-serif';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.zIndex = '99999';
        tooltip.style.whiteSpace = 'nowrap';
        tooltip.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        tooltip.innerText = text;

        // Create the arrow/triangle pointing down
        const arrow = document.createElement('div');
        arrow.style.position = 'absolute';
        arrow.style.bottom = '-4px';
        arrow.style.left = '50%';
        arrow.style.transform = 'translateX(-50%)';
        arrow.style.width = '0';
        arrow.style.height = '0';
        arrow.style.borderLeft = '4px solid transparent';
        arrow.style.borderRight = '4px solid transparent';
        arrow.style.borderTop = '4px solid #ffffff';
        tooltip.appendChild(arrow);

        document.body.appendChild(tooltip);

        // Position the tooltip above the button using bulletproof parent relative coordinates
        const rect = targetElement.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let parentRect = { top: 0, left: 0 };
        if (tooltip.offsetParent) {
            parentRect = tooltip.offsetParent.getBoundingClientRect();
        }

        const top = rect.top - parentRect.top - tooltipRect.height - 8;
        const left = rect.left - parentRect.left + (rect.width / 2) - (tooltipRect.width / 2);

        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;

        activeTooltip = tooltip;
    }

    function hideTooltip() {
        if (activeTooltip) {
            activeTooltip.remove();
            activeTooltip = null;
        }
    }

    function createButton(id) {
        const btn = document.createElement('button');
        btn.id = id;
        btn.className = 'ScCoreButton-sc-ocjdkq-0 ScCoreButtonText-sc-ocjdkq-3 ibtqAh dXoNnI';
        btn.setAttribute('aria-label', `Reculer de ${rewindSeconds}s`);
        
        btn.style.margin = '0 2px';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.background = 'transparent';
        btn.style.border = 'none';
        btn.style.cursor = 'pointer';
        btn.style.padding = '0';
        btn.style.height = '30px';
        btn.style.width = '30px';
        btn.style.borderRadius = '50%';
        btn.style.opacity = '0.8';
        btn.style.transition = 'opacity 0.2s, background-color 0.2s, transform 0.1s';

        btn.innerHTML = `<img src="${imgRewindUrl}" style="width: 17px; height: 17px; display: block;" />`;

        btn.addEventListener('mouseenter', () => {
            btn.style.opacity = '1';
            btn.style.background = 'rgba(255, 255, 255, 0.15)';
            showTooltip(btn, `Reculer de ${rewindSeconds}s`);
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.opacity = '0.8';
            btn.style.background = 'transparent';
            hideTooltip();
        });

        btn.addEventListener('click', () => {
            const video = document.querySelector('video');
            if (video) {
                video.currentTime -= rewindSeconds;
                
                // Visual feedback
                btn.style.opacity = '0.4';
                btn.style.transform = 'scale(0.9)';
                hideTooltip();
                setTimeout(() => {
                    btn.style.opacity = '1';
                    btn.style.transform = 'scale(1)';
                }, 150);
            }
        });

        return btn;
    }

    function createLiveButton() {
        const btn = document.createElement('button');
        btn.id = GO_LIVE_ID;
        btn.className = 'ScCoreButton-sc-ocjdkq-0 ScCoreButtonText-sc-ocjdkq-3 ibtqAh dXoNnI';
        btn.setAttribute('aria-label', 'Retour au direct');
        
        btn.style.margin = '0 2px';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.background = 'transparent';
        btn.style.border = 'none';
        btn.style.cursor = 'pointer';
        btn.style.padding = '0';
        btn.style.height = '30px';
        btn.style.width = '30px';
        btn.style.borderRadius = '50%';
        btn.style.opacity = '0.8';
        btn.style.transition = 'opacity 0.2s, background-color 0.2s, transform 0.1s';

        btn.innerHTML = `<img src="${imgLiveUrl}" style="width: 20px; height: 20px; display: block;" />`;

        btn.addEventListener('mouseenter', () => {
            btn.style.opacity = '1';
            btn.style.background = 'rgba(255, 255, 255, 0.15)';
            showTooltip(btn, 'Retour au direct');
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.opacity = '0.8';
            btn.style.background = 'transparent';
            hideTooltip();
        });

        btn.addEventListener('click', () => {
            const video = document.querySelector('video');
            if (video && video.buffered.length > 0) {
                video.currentTime = video.buffered.end(video.buffered.length - 1);
                
                // Visual feedback
                btn.style.opacity = '0.4';
                btn.style.transform = 'scale(0.9)';
                hideTooltip();
                setTimeout(() => {
                    btn.style.opacity = '1';
                    btn.style.transform = 'scale(1)';
                }, 150);
            }
        });

        return btn;
    }

    function injectRewindButtons() {
        // Find the left control group of the Twitch player (where Play/Pause and Volume are)
        const leftControlGroup = document.querySelector('.player-controls__left-control-group');
        
        if (leftControlGroup) {
            // Check if our buttons are already there
            const hasBtn30 = document.getElementById(REWIND_30S_ID);
            const hasBtnLive = document.getElementById(GO_LIVE_ID);
            
            if (!hasBtn30 || !hasBtnLive) {
                // Find the mute/unmute button to insert our controls just to its left (between play and volume)
                const muteBtn = leftControlGroup.querySelector('[data-a-target="player-mute-unmute-button"]');
                let targetToInsertBefore = null;
                
                if (muteBtn) {
                    targetToInsertBefore = muteBtn;
                    while (targetToInsertBefore && targetToInsertBefore.parentNode !== leftControlGroup) {
                        targetToInsertBefore = targetToInsertBefore.parentNode;
                    }
                }
                
                const btn30 = hasBtn30 || createButton(REWIND_30S_ID);
                const btnLive = hasBtnLive || createLiveButton();
                
                if (targetToInsertBefore) {
                    if (!hasBtn30) leftControlGroup.insertBefore(btn30, targetToInsertBefore);
                    if (!hasBtnLive) leftControlGroup.insertBefore(btnLive, targetToInsertBefore);
                } else {
                    // Fallback if mute button is not found
                    if (!hasBtn30) leftControlGroup.appendChild(btn30);
                    if (!hasBtnLive) leftControlGroup.appendChild(btnLive);
                }
            }
        }
    }

    // Set up a MutationObserver to watch for the player being created/destroyed
    const observer = new MutationObserver((mutations) => {
        injectRewindButtons();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Fetch initial rewind duration
    chrome.storage.local.get(['rewindDuration'], (data) => {
        rewindSeconds = data.rewindDuration ?? 30;
        const btn = document.getElementById(REWIND_30S_ID);
        if (btn) {
            btn.setAttribute('aria-label', `Reculer de ${rewindSeconds}s`);
        }
    });

    // Listen to changes in the rewind duration
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.rewindDuration) {
            rewindSeconds = changes.rewindDuration.newValue ?? 30;
            const btn = document.getElementById(REWIND_30S_ID);
            if (btn) {
                btn.setAttribute('aria-label', `Reculer de ${rewindSeconds}s`);
            }
        }
    });

    // Initial check just in case it's already there
    setTimeout(injectRewindButtons, 2000);

})();
