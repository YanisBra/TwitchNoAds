const LOCAL_SCRIPT_URL = chrome.runtime.getURL('src/scripts/video-swap-new.js');
const REMOTE_SCRIPT_URL = 'https://raw.githubusercontent.com/pixeltris/TwitchAdSolutions/master/video-swap-new/video-swap-new.user.js';
const VERSION_REGEX = /const\s+ourTwitchAdSolutionsVersion\s*=\s*(\d+);/;

async function checkUpdates() {
    const statusIcon = document.getElementById('status-icon');
    const statusText = document.getElementById('status-text');
    const statusContainer = document.getElementById('script-status');
    const mainBadge = document.getElementById('main-status-badge');
    const mainDot = document.getElementById('main-status-dot');
    const mainText = document.getElementById('main-status-text');

    try {
        // Fetch local version
        const localRes = await fetch(LOCAL_SCRIPT_URL);
        const localText = await localRes.text();
        const localMatch = localText.match(VERSION_REGEX);
        const localVersion = localMatch ? parseInt(localMatch[1], 10) : 0;

        // Fetch remote version
        const remoteRes = await fetch(REMOTE_SCRIPT_URL + '?t=' + Date.now());
        const remoteText = await remoteRes.text();
        const remoteMatch = remoteText.match(VERSION_REGEX);
        const remoteVersion = remoteMatch ? parseInt(remoteMatch[1], 10) : 0;

        console.log(`Version check - Local: ${localVersion}, Remote: ${remoteVersion}`);

        if (remoteVersion > localVersion) {
            // Update available
            if (mainBadge) {
                mainBadge.style.background = 'rgba(255, 71, 71, 0.1)';
                mainBadge.style.color = '#ff4747';
                mainDot.style.backgroundColor = '#ff4747';
                mainDot.style.boxShadow = '0 0 8px #ff4747';
                mainText.textContent = 'Mise à jour requise';
            }
            statusIcon.className = '';
            statusIcon.innerHTML = '⚠';
            statusIcon.style.color = '#ff47ff';
            statusIcon.style.fontWeight = 'bold';
            
            statusText.textContent = `Mise à jour disponible (v${remoteVersion})`;
            statusContainer.style.color = '#ff47ff';

            const container = document.getElementById('update-notification');
            const localVerSpan = document.getElementById('local-ver');
            const remoteVerSpan = document.getElementById('remote-ver');

            localVerSpan.textContent = localVersion;
            remoteVerSpan.textContent = remoteVersion;
            container.style.display = 'block';
        } else {
            // Up to date
            if (mainBadge) {
                mainBadge.style.background = 'rgba(0, 245, 147, 0.1)';
                mainBadge.style.color = '#00f593';
                mainDot.style.backgroundColor = '#00f593';
                mainDot.style.boxShadow = '0 0 8px #00f593';
                mainText.textContent = 'Actif et à jour';
            }
            statusIcon.className = '';
            statusIcon.innerHTML = '✓';
            statusIcon.style.color = '#00f593';
            statusIcon.style.fontWeight = 'bold';

            statusText.textContent = `Extension à jour (v${localVersion})`;
            statusContainer.style.color = 'var(--text-muted)';
        }
    } catch (error) {
        console.error("Failed to check for updates:", error);
        if (statusIcon && statusText) {
            statusIcon.className = '';
            statusIcon.innerHTML = '⚠';
            statusIcon.style.color = 'var(--text-muted)';
            statusText.textContent = "Vérification impossible";
        }
    }
}

function loadAdCounter() {
    chrome.storage.local.get(['adsBypassed'], (result) => {
        const count = result.adsBypassed || 0;
        const counterEl = document.getElementById('ad-counter');
        if (counterEl) {
            counterEl.textContent = count;
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    checkUpdates();
    loadAdCounter();

    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.adsBypassed) {
            const counterEl = document.getElementById('ad-counter');
            if (counterEl) {
                counterEl.textContent = changes.adsBypassed.newValue || 0;
            }
        }
    });

    const resetBtn = document.getElementById('btn-reset');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            chrome.storage.local.set({ adsBypassed: 0 });
        });
    }

    // Make the command code element copy-on-click
    const cmdElement = document.getElementById('update-cmd');
    if (cmdElement) {
        cmdElement.addEventListener('click', () => {
            navigator.clipboard.writeText(cmdElement.textContent).then(() => {
                const originalText = cmdElement.textContent;
                cmdElement.textContent = "Copié !";
                cmdElement.style.color = "#00f593";
                setTimeout(() => {
                    cmdElement.textContent = originalText;
                    cmdElement.style.color = "#ff47ff";
                }, 1500);
            }).catch(err => {
                console.error("Could not copy text: ", err);
            });
        });
    }
});
