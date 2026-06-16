/* ─────────────────────────────────────
   TwitchNoAds — popup.js
   Gestion du compteur et du statut
───────────────────────────────────── */

const adsCountEl  = document.getElementById('adsCount');
const resetBtn    = document.getElementById('resetBtn');
const statusBadge = document.getElementById('statusBadge');
const statusDot   = document.getElementById('statusDot');
const statusText  = document.getElementById('statusText');
const versionEl   = document.getElementById('versionText');

/* ── Version (depuis manifest) ── */
const manifest = chrome.runtime.getManifest();
if (manifest?.version) {
  versionEl.textContent = `v${manifest.version}`;
}

/* ── Affiche le compteur ── */
function renderCount(n) {
  adsCountEl.textContent = n.toLocaleString('fr-FR');
}

/* ── Affiche le statut ── */
function renderStatus(active) {
  if (active) {
    statusBadge.classList.remove('inactive');
    statusText.textContent = 'Actif et à jour';
  } else {
    statusBadge.classList.add('inactive');
    statusText.textContent = 'Désactivé';
  }
}

/* ── Lecture depuis le storage ── */
chrome.storage.local.get(['adsBlocked', 'active'], (data) => {
  renderCount(data.adsBlocked ?? 0);
  renderStatus(data.active !== false); // actif par défaut
});

/* ── Reset ── */
resetBtn.addEventListener('click', () => {
  chrome.storage.local.set({ adsBlocked: 0 }, () => {
    renderCount(0);
  });
});
