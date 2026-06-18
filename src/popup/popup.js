const LOCAL_SCRIPT_URL = chrome.runtime.getURL('src/scripts/video-swap.js');
const REMOTE_SCRIPT_URL = 'https://raw.githubusercontent.com/pixeltris/TwitchAdSolutions/master/video-swap-new/video-swap-new.user.js';
const VERSION_REGEX = /const\s+ourTwitchAdSolutionsVersion\s*=\s*(\d+);/;

const adsCountEl  = document.getElementById('adsCount');
const resetBtn    = document.getElementById('resetBtn');
const statusBadge = document.getElementById('statusBadge');
const statusDot   = document.getElementById('statusDot');
const statusText  = document.getElementById('statusText');
const versionEl   = document.getElementById('versionText');

/* ── Version (mise à jour via checkUpdates) ── */

/* ── Affiche le compteur ── */
function renderCount(n) {
  if (adsCountEl) {
    adsCountEl.textContent = n.toLocaleString('fr-FR');
  }
}

/* ── Lecture depuis le storage ── */
chrome.storage.local.get(['adsBypassed'], (data) => {
  renderCount(data.adsBypassed ?? 0);
});

/* ── Reset ── */
if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    chrome.storage.local.set({ adsBypassed: 0 }, () => {
      renderCount(0);
    });
  });
}

/* ── Storage listener for live updates ── */
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.adsBypassed) {
        renderCount(changes.adsBypassed.newValue || 0);
    }
});

/* ── Update checker ── */
async function checkUpdates() {
    try {
        const localRes = await fetch(LOCAL_SCRIPT_URL);
        const localText = await localRes.text();
        const localMatch = localText.match(VERSION_REGEX);
        const localVersion = localMatch ? parseInt(localMatch[1], 10) : 0;
        
        if (versionEl && localVersion > 0) {
            versionEl.textContent = `v${localVersion}`;
        }

        const remoteRes = await fetch(REMOTE_SCRIPT_URL + '?t=' + Date.now());
        const remoteText = await remoteRes.text();
        const remoteMatch = remoteText.match(VERSION_REGEX);
        const remoteVersion = remoteMatch ? parseInt(remoteMatch[1], 10) : 0;

        if (remoteVersion > localVersion) {
            if (statusBadge) {
                statusBadge.style.background = 'rgba(255, 71, 71, 0.1)';
                statusBadge.style.color = '#ff4747';
                statusBadge.style.borderColor = 'rgba(255, 71, 71, 0.2)';
            }
            if (statusDot) {
                statusDot.style.backgroundColor = '#ff4747';
                statusDot.style.boxShadow = '0 0 8px #ff4747';
            }
            if (statusText) {
                statusText.textContent = 'Mise à jour requise';
            }

            const container = document.getElementById('updateCard');
            const localVerSpan = document.getElementById('local-ver');
            const remoteVerSpan = document.getElementById('remote-ver');

            if (localVerSpan) localVerSpan.textContent = localVersion;
            if (remoteVerSpan) remoteVerSpan.textContent = remoteVersion;
            if (container) container.style.display = 'block';
        } else {
            if (statusText) statusText.textContent = 'Actif et à jour';
        }
    } catch (error) {
        if (statusBadge) statusBadge.classList.add('inactive');
        if (statusText) statusText.textContent = 'Vérification impossible';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkUpdates();

    const claimPointsToggle = document.getElementById('claimPointsToggle');
    if (claimPointsToggle) {
        chrome.storage.local.get(['autoClaimPoints'], (data) => {
            // Option is enabled (true) by default
            claimPointsToggle.checked = data.autoClaimPoints ?? true;
        });

        claimPointsToggle.addEventListener('change', () => {
            chrome.storage.local.set({ autoClaimPoints: claimPointsToggle.checked });
        });
    }

    const cmdElement = document.getElementById('update-cmd');
    if (cmdElement) {
        cmdElement.addEventListener('click', () => {
            navigator.clipboard.writeText(cmdElement.textContent).then(() => {
                const originalText = cmdElement.textContent;
                cmdElement.textContent = "Copié !";
                cmdElement.style.color = "var(--green, #22c55e)";
                setTimeout(() => {
                    cmdElement.textContent = originalText;
                    cmdElement.style.color = "#ff47ff";
                }, 1500);
            });
        });
    }
});
