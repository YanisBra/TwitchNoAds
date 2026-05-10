// Twitch Ad Swap & Bypass - Content Script

const DEBUG = true;
function log(...args) { if (DEBUG) console.log('[TwitchAdSwap]', ...args); }

let settings = {};

// --- CHARGEMENT DES RÉGLAGES ---
function loadSettings() {
  chrome.storage.local.get(['bypassPreroll', 'bypassMidroll', 'swapVisuals', 'showNotifications', 'autoClaimPoints', 'instantRewind'], (result) => {
    settings = {
      bypassPreroll: result.bypassPreroll !== undefined ? result.bypassPreroll : true,
      bypassMidroll: result.bypassMidroll !== undefined ? result.bypassMidroll : true,
      swapVisuals: result.swapVisuals !== undefined ? result.swapVisuals : true,
      showNotifications: result.showNotifications !== undefined ? result.showNotifications : true,
      autoClaimPoints: result.autoClaimPoints !== undefined ? result.autoClaimPoints : false,
      instantRewind: result.instantRewind !== undefined ? result.instantRewind : true
    };
    log('Settings loaded:', settings);
    updateRewindButton();
    // Synchronisation avec le script de bypass injecté
    window.postMessage({ type: "UPDATE_SETTINGS", settings: settings }, "*");
  });
}

chrome.storage.onChanged.addListener(loadSettings);
loadSettings();

// --- STATISTIQUES ---
let lastCountTime = 0;
const COUNT_COOLDOWN = 30000;

function incrementCount(type) {
  const now = Date.now();
  if (now - lastCountTime < COUNT_COOLDOWN) return;
  lastCountTime = now;
  const key = type === 'pre' ? 'preRollsBlocked' : 'midRollsBlocked';
  chrome.storage.local.get([key], (result) => {
    const current = result[key] || 0;
    chrome.storage.local.set({ [key]: current + 1 });
  });
}

// --- AUTO-CLAIM POINTS ---
function claimPoints() {
    if (!settings.autoClaimPoints) return;
    const claimButton = document.querySelector('.community-points-summary .tw-button');
    if (claimButton) {
        claimButton.click();
        showToast("💎 Points de chaîne récupérés !");
    }
}
setInterval(claimPoints, 5000);

// --- REWIND (Dernière Chance) ---
function rewindStream() {
    const video = document.querySelector('video');
    if (video) {
        log('Rewinding 10s...');
        video.currentTime = Math.max(0, video.currentTime - 10);
        showToast("⏪ Reculé de 10 secondes");
    }
}

function updateRewindButton() {
    const clipBtn = document.querySelector('[data-a-target="player-clip-button"]');
    const rightControls = document.querySelector('.player-controls__right-control-group');
    const leftControls = document.querySelector('.player-controls__left-control-group');
    
    const existing = document.getElementById('twitch-no-ads-rewind-btn');
    
    if (!settings.instantRewind) {
        if (existing) existing.remove();
        return;
    }

    if (!existing) {
        const btn = document.createElement('button');
        btn.id = 'twitch-no-ads-rewind-btn';
        btn.className = 'tw-align-items-center tw-align-middle tw-core-button tw-core-button--subtle tw-inline-flex tw-interactive tw-justify-content-center';
        btn.style.cssText = 'background:none;border:none;color:white;font-size:18px;cursor:pointer;padding:0 5px;display:flex;align-items:center;';
        btn.title = 'Reculer de 10s (Dernière Chance)';
        btn.innerHTML = '⏪';
        btn.onclick = (e) => {
            e.preventDefault(); e.stopPropagation(); rewindStream();
        };

        // Placement : à gauche du bouton Clip si possible, sinon dans les contrôles de droite
        if (clipBtn) {
            clipBtn.parentNode.insertBefore(btn, clipBtn);
        } else if (rightControls) {
            rightControls.insertBefore(btn, rightControls.firstChild);
        } else if (leftControls) {
            leftControls.appendChild(btn);
        }
    }
}

// --- NOTIFICATIONS STYLE TWITCH ---
function showToast(message) {
  if (!settings.showNotifications) return;
  const player = document.querySelector('.video-player') || document.body;
  let toast = document.getElementById('twitch-no-ads-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'twitch-no-ads-toast';
    toast.style.cssText = `position:absolute;top:20px;left:50%;transform:translateX(-50%) translateY(-50px);background:#1f1f23;color:white;padding:12px 20px;border-radius:4px;font-family:Inter,sans-serif;font-size:13px;font-weight:600;z-index:1000000;box-shadow:0 4px 12px rgba(0,0,0,0.5);border-left:4px solid #9147ff;transition:transform 0.4s,opacity 0.3s;opacity:0;white-space:nowrap;display:flex;align-items:center;gap:10px;pointer-events:none;`;
    player.appendChild(toast);
  }
  toast.innerHTML = `<span style="font-size: 16px;">${message.split(' ')[0]}</span> <span>${message.split(' ').slice(1).join(' ')}</span>`;
  setTimeout(() => { toast.style.opacity = '1'; toast.style.transform = 'translateX(-50%) translateY(0)'; }, 10);
  setTimeout(() => { 
    toast.style.opacity = '0'; 
    toast.style.transform = 'translateX(-50%) translateY(-50px)';
  }, 3000);
}

// --- GESTION DES MESSAGES DU POPUP ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  log('Message from popup:', message.type);
  if (message.type === "TEST_NOTIFICATION") showToast("🔔 Test : Notification Active !");
  if (message.type === "INSTANT_REWIND") rewindStream();
  return true;
});

// --- SURVEILLANCE PUBS ET SWAP ---
const styleBlock = document.createElement('style');
styleBlock.id = 'twitch-no-ads-styles';
document.head.appendChild(styleBlock);

function isAdPlaying() {
  return !!(document.querySelector('[data-a-target="video-ad-label"]') || document.querySelector('.video-ad-label'));
}

function applyVisualSwap() {
  if (!settings.swapVisuals) return;
  const videos = Array.from(document.querySelectorAll('video'));
  if (videos.length < 2) return;

  const player = document.querySelector('.video-player');
  if (!player) return;
  const playerRect = player.getBoundingClientRect();
  
  videos.forEach(v => {
    if (v.closest('.stream-display-ad__wrapper') || v.closest('.video-ad-player') || v.getBoundingClientRect().width > 400) {
      v.classList.add('tw-no-ads-video-ad');
      v.muted = true;
    } else {
      v.classList.add('tw-no-ads-video-stream');
      v.muted = false;
    }
  });

  styleBlock.innerHTML = `
    .tw-no-ads-video-stream { position:fixed!important; top:${playerRect.top}px!important; left:${playerRect.left}px!important; width:${playerRect.width}px!important; height:${playerRect.height}px!important; z-index:999999!important; background:black!important; visibility:visible!important; }
    .tw-no-ads-video-ad { position:fixed!important; bottom:20px!important; right:20px!important; width:320px!important; height:180px!important; z-index:1000000!important; border:2px solid #9147ff!important; visibility:visible!important; }
  `;

  if (!document.getElementById('twitch-no-ads-active-marker')) {
    showToast("🔄 Mode Incrustation Activé");
    incrementCount('mid');
    const marker = document.createElement('div');
    marker.id = 'twitch-no-ads-active-marker';
    document.body.appendChild(marker);
  }
}

function clearVisualSwap() {
  styleBlock.innerHTML = '';
  const marker = document.getElementById('twitch-no-ads-active-marker');
  if (marker) marker.remove();
}

setInterval(() => {
  if (isAdPlaying()) applyVisualSwap();
  else clearVisualSwap();
  updateRewindButton();
}, 1000);

// Injection du script de bypass
const script = document.createElement('script');
script.src = chrome.runtime.getURL('src/scripts/bypass.js');
script.onload = function() { this.remove(); };
(document.head || document.documentElement).appendChild(script);

window.addEventListener("message", (event) => {
  if (event.data && event.data.type === "AD_BYPASS_SUCCESS") {
    showToast("✅ Publicité Contournée (Mode 360p)");
    incrementCount(window.location.pathname === '/' ? 'pre' : 'mid');
  }
});
