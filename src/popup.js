const options = ['bypassPreroll', 'bypassMidroll', 'swapVisuals', 'showNotifications', 'autoClaimPoints', 'instantRewind'];

// Chargement initial des réglages avec protection contre les éléments nuls
options.forEach(id => {
    const element = document.getElementById(id);
    if (!element) return;

    chrome.storage.local.get([id], (result) => {
        let defaultValue = true;
        if (id === 'autoClaimPoints') defaultValue = false;
        
        const value = result[id] !== undefined ? result[id] : defaultValue;
        element.checked = value;
    });

    element.addEventListener('change', (e) => {
        const obj = {};
        obj[id] = e.target.checked;
        chrome.storage.local.set(obj);
    });
});

// Fonction améliorée pour envoyer un message à l'onglet Twitch actif
function sendMessageToTwitch(message) {
    chrome.tabs.query({ url: "*://*.twitch.tv/*" }, (tabs) => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, message, (response) => {
                if (chrome.runtime.lastError) return;
            });
        });
    });
}

const testNotifBtn = document.getElementById('testNotification');
if (testNotifBtn) {
    testNotifBtn.addEventListener('click', () => {
        sendMessageToTwitch({ type: "TEST_NOTIFICATION" });
    });
}

const resetStatsBtn = document.getElementById('resetStats');
if (resetStatsBtn) {
    resetStatsBtn.addEventListener('click', () => {
        if (confirm('Voulez-vous vraiment réinitialiser les statistiques ?')) {
            chrome.storage.local.set({ preRollsBlocked: 0, midRollsBlocked: 0 }, updateStats);
        }
    });
}

function updateStats() {
    chrome.storage.local.get(['preRollsBlocked', 'midRollsBlocked'], (result) => {
        const preEl = document.getElementById('preRollCount');
        const midEl = document.getElementById('midRollCount');
        if (preEl) preEl.textContent = result.preRollsBlocked || 0;
        if (midEl) midEl.textContent = result.midRollsBlocked || 0;
    });
}

updateStats();
chrome.storage.onChanged.addListener(updateStats);
