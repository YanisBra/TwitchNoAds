// src/scripts/sidebar-pins.js
// v2.6.2 - Flex-push reveal: pin expands from 0→26px, content slides naturally, viewer count stays in place

(function () {
    'use strict';

    const PIN_IMG_URL = chrome.runtime.getURL('src/assets/Pin.png');
    const STYLE_ID = 'tna-sidebar-pins-styles';
    const CARD_ATTR = 'data-tna-card';
    const PINNED_ATTR = 'data-tna-pinned';

    // Twitch paths that are NOT channel pages
    const EXCLUDED_PATHS = new Set([
        'following', 'directory', 'search', 'prime', 'subscriptions',
        'settings', 'payments', 'videos', 'clips', 'schedule', 'about',
        'home', 'friends', 'browse', 'esports', 'soundtrack', 'inventory',
        'turbo', 'drops', 'login', 'signup', 'popout', 'moderator', 'u',
        'bits', 'store', 'charity', 'wallet', 'inbox', 'notifications',
    ]);

    let pinnedStreamers = [];
    let observer = null;
    let processDebounce = null;
    let draggedUsername = null;
    let autoExpandAttempts = 0; // allow up to 5 clicks on "Afficher plus"
    let initialized = false;

    // ── CSS ─────────────────────────────────────────────────────────────────────
    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;
        const s = document.createElement('style');
        s.id = STYLE_ID;

        // The core idea:
        //   Card row is made flex (our pin button is the FIRST flex child).
        //   Pin button starts at flex-basis:0 / width:0 / overflow:hidden → invisible.
        //   On hover it expands to 26px → its "push" shifts avatar + name to the right.
        //   Viewer-count metadata is absolutely anchored to the card's right edge
        //   so it never moves, never clips.
        s.textContent = `
/* ═══ TwitchNoAds — Sidebar Pin v2.6.2 ═══════════════════════════════════ */

/* Card row becomes a flex container */
[data-tna-card] {
    display: flex !important;
    align-items: center !important;
    position: relative !important;
    overflow: hidden !important;
}

/* Twitch's channel link (or its wrapper) fills remaining space */
[data-tna-card] > a,
[data-tna-card] > *:not(.tna-pin-btn) {
    flex: 1 1 auto !important;
    min-width: 0 !important;
    overflow: hidden !important;
}

/* ── Pin button: first flex child, width grows from 0 to 26px ── */
.tna-pin-btn {
    flex: 0 0 0px;
    width: 0;
    height: 100%;
    min-height: 36px;
    overflow: hidden;
    opacity: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: flex-basis 0.18s ease, width 0.18s ease, opacity 0.15s ease;
    z-index: 20;
    pointer-events: none;
}

.tna-pin-btn img {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    object-fit: contain;
    pointer-events: none;
    /* Default: white icon at 80% opacity */
    filter: brightness(0) invert(1) opacity(0.8);
    transition: filter 0.15s ease;
}

/* Hover → expand pin button, push content right */
[data-tna-card]:hover .tna-pin-btn {
    flex-basis: 26px;
    width: 26px;
    opacity: 1;
    pointer-events: auto;
}

/* Pinned → always expanded, purple tint */
[data-tna-card][data-tna-pinned] .tna-pin-btn {
    flex-basis: 26px;
    width: 26px;
    opacity: 1;
    pointer-events: auto;
}

[data-tna-card][data-tna-pinned] .tna-pin-btn img {
    /* Twitch purple #9147ff */
    filter: brightness(0) saturate(100%) invert(26%) sepia(97%) saturate(5000%) hue-rotate(256deg) brightness(110%);
}

/* Drag and drop */
[data-tna-card].tna-dragging { opacity: 0.4 !important; }
[data-tna-card].tna-drag-over {
    outline: 2px dashed #9147ff !important;
    outline-offset: -2px;
}

/* Hide offline channels */
[data-tna-offline="true"] {
    display: none !important;
}
`;
        (document.head || document.documentElement).appendChild(s);
    }

    // ── Username extraction ──────────────────────────────────────────────────────
    function usernameFromLink(a) {
        try {
            const url = new URL(a.href, location.origin);
            const seg = url.pathname.replace(/^\//, '').split('/')[0].toLowerCase();
            if (!seg || seg.length < 2 || EXCLUDED_PATHS.has(seg)) return null;
            return seg;
        } catch { return null; }
    }

    // ── Find all channel anchor tags in the page ─────────────────────────────────
    function getChannelLinks() {
        // Only look inside the sidebar to prevent pins appearing under the video player
        const sidebar = document.querySelector('[data-a-target="side-nav-bar"]');
        if (!sidebar) return [];

        return Array.from(sidebar.querySelectorAll('a[href]')).filter(a => {
            const href = a.getAttribute('href') || '';
            if (!/^\/[a-zA-Z0-9_]{2,25}$/.test(href)) return false;
            const seg = href.slice(1).toLowerCase();
            return !EXCLUDED_PATHS.has(seg);
        });
    }

    // ── Find the individual card row that wraps a given link ─────────────────────
    // Walks UP from the link until the parent element contains more than one
    // link-bearing child — that parent is the list container, so `row` is the card.
    function getCardRow(linkEl) {
        let row = linkEl;
        for (let depth = 0; depth < 12; depth++) {
            const parent = row.parentElement;
            if (!parent || parent === document.body) break;

            // Count direct children of parent that contain (or are) an <a> to a channel
            let linkChildren = 0;
            for (const child of parent.children) {
                if (child === row) { linkChildren++; continue; }
                if (child.tagName === 'A' || child.querySelector('a[href]')) linkChildren++;
                if (linkChildren > 1) break;
            }

            if (linkChildren > 1) return row; // parent = list container, row = card ✓
            row = parent;
        }
        return row;
    }

    // ── Is this channel currently live? ──────────────────────────────────────────
    function isLive(cardEl) {
        const text = cardEl.textContent.toLowerCase();
        if (
            text.includes('hors ligne') ||
            text.includes('offline') ||
            text.includes('déconnecté') ||
            text.includes('disconnected')
        ) return false;
        // Presence of a digit that looks like a viewer count
        if (/\b\d[\d\s,.]*\s*[km]?\b/i.test(cardEl.textContent)) return true;
        if (cardEl.querySelector('[class*="live" i], [aria-label*="live" i], [aria-label*="direct" i]')) return true;
        return false;
    }

    // ── Inject pin button as FIRST child of the card row ─────────────────────────
    function injectPinButton(cardRow, username) {
        // Avoid double injection
        if (cardRow.querySelector('.tna-pin-btn')) return;

        const btn = document.createElement('button');
        btn.className = 'tna-pin-btn';
        btn.setAttribute('data-tna-for', username);
        btn.setAttribute('aria-label', 'Épingler ' + username);
        btn.setAttribute('title', 'Épingler ' + username);

        const img = document.createElement('img');
        img.src = PIN_IMG_URL;
        img.alt = 'pin';
        img.draggable = false;
        btn.appendChild(img);

        btn.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            togglePin(username);
        });

        cardRow.insertBefore(btn, cardRow.firstChild);
    }

    // ── Apply visual state (pinned / not pinned) ─────────────────────────────────
    function applyPinState(cardRow, username) {
        if (pinnedStreamers.includes(username)) {
            cardRow.setAttribute(PINNED_ATTR, '');
            cardRow.setAttribute('draggable', 'true');
        } else {
            cardRow.removeAttribute(PINNED_ATTR);
            cardRow.removeAttribute('draggable');
        }
    }

    // ── Toggle pin for a username ────────────────────────────────────────────────
    function togglePin(username) {
        const idx = pinnedStreamers.indexOf(username);
        if (idx === -1) pinnedStreamers.push(username);
        else pinnedStreamers.splice(idx, 1);

        chrome.storage.local.set({ pinnedStreamers }, () => {
            document.querySelectorAll(`[${CARD_ATTR}="${username}"]`).forEach(card => {
                applyPinState(card, username);
            });
            sortSidebar();
        });
    }

    // ── Sort the sidebar with CSS order ─────────────────────────────────────────
    function sortSidebar() {
        const allCards = Array.from(document.querySelectorAll(`[${CARD_ATTR}]`));
        if (allCards.length === 0) return;

        // Group cards by their parent container (handles multiple sections)
        const containers = new Map();
        allCards.forEach(card => {
            const p = card.parentElement;
            if (!p) return;
            if (!containers.has(p)) containers.set(p, []);
            containers.get(p).push(card);
        });

        containers.forEach((cards, container) => {
            // Ensure the list container is flex-column
            if (!container.style.display || container.style.display === 'block') {
                container.style.display = 'flex';
                container.style.flexDirection = 'column';
            }

            // Reset all orders
            cards.forEach(c => { c.style.order = '0'; });

            // Pinned + live streamers float to top (negative order)
            let order = -100;
            pinnedStreamers.forEach(username => {
                const card = cards.find(c => c.getAttribute(CARD_ATTR) === username);
                if (!card) return;
                if (isLive(card)) {
                    card.style.order = String(order++);
                }
            });
        });
    }

    // ── Drag and drop for reordering pinned streamers ────────────────────────────
    function setupDragAndDrop(cardRow, username) {
        cardRow.addEventListener('dragstart', e => {
            if (!pinnedStreamers.includes(username)) { e.preventDefault(); return; }
            draggedUsername = username;
            cardRow.classList.add('tna-dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        cardRow.addEventListener('dragend', () => {
            cardRow.classList.remove('tna-dragging');
            draggedUsername = null;
            document.querySelectorAll('.tna-drag-over').forEach(el => el.classList.remove('tna-drag-over'));
        });

        cardRow.addEventListener('dragover', e => {
            if (!draggedUsername || draggedUsername === username) return;
            if (!pinnedStreamers.includes(username)) return;
            e.preventDefault();
            cardRow.classList.add('tna-drag-over');
        });

        cardRow.addEventListener('dragleave', () => cardRow.classList.remove('tna-drag-over'));

        cardRow.addEventListener('drop', e => {
            e.preventDefault();
            cardRow.classList.remove('tna-drag-over');
            if (!draggedUsername || draggedUsername === username) return;
            const from = pinnedStreamers.indexOf(draggedUsername);
            const to = pinnedStreamers.indexOf(username);
            if (from !== -1 && to !== -1) {
                pinnedStreamers.splice(from, 1);
                pinnedStreamers.splice(to, 0, draggedUsername);
                chrome.storage.local.set({ pinnedStreamers }, sortSidebar);
            }
        });
    }

    // ── Process one link element ─────────────────────────────────────────────────
    function processLink(linkEl) {
        const username = usernameFromLink(linkEl);
        if (!username) return;

        const cardRow = getCardRow(linkEl);
        if (!cardRow || cardRow === document.body || cardRow === document.documentElement) return;

        // Offline check
        if (!isLive(cardRow)) {
            cardRow.setAttribute('data-tna-offline', 'true');
        } else {
            cardRow.removeAttribute('data-tna-offline');
        }

        const existing = cardRow.getAttribute(CARD_ATTR);

        if (existing === username) {
            // Already processed — just re-inject pin button if React removed it
            injectPinButton(cardRow, username);
            return;
        }

        if (existing && existing !== username) {
            // Stale attribute (card was reused for different channel) — reset
            cardRow.removeAttribute(PINNED_ATTR);
        }

        cardRow.setAttribute(CARD_ATTR, username);
        injectPinButton(cardRow, username);
        applyPinState(cardRow, username);
        setupDragAndDrop(cardRow, username);
    }

    // ── Scan and process all visible channel links ───────────────────────────────
    function processCards() {
        const links = getChannelLinks();
        links.forEach(processLink);
        if (links.length > 0) {
            sortSidebar();
            // Automatically expand if a pinned streamer is still hidden
            expandIfPinnedHidden();
        }
    }

    // ── MutationObserver — watches the entire body for React re-renders ──────────
    function scheduleProcess() {
        if (processDebounce) clearTimeout(processDebounce);
        processDebounce = setTimeout(() => {
            processCards();
            processDebounce = null;
        }, 150); // 150ms debounce: fast enough to re-inject before user notices
    }

    function startObserver() {
        if (observer) observer.disconnect();
        observer = new MutationObserver(mutations => {
            // Only re-process if nodes were added (React re-renders add nodes)
            if (mutations.some(m => m.addedNodes.length > 0)) {
                scheduleProcess();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // ── Auto-expand "Afficher plus" if a pinned streamer is hidden ────────────────

    // Click all visible "Show more" buttons in the sidebar
    function clickShowMoreButtons() {
        const sidebar = document.querySelector('[data-a-target="side-nav-bar"]');
        if (!sidebar) return 0;

        let clicked = 0;
        const patterns = ['afficher plus', 'show more', 'ver más', 'mehr anzeigen', 'mostra di più', 'mostrar mais', 'show more channels'];
        
        // Native Twitch buttons
        const nativeBtns = Array.from(sidebar.querySelectorAll('[data-a-target="side-nav-show-more-button"]'));
        
        // Fallback buttons
        const candidates = Array.from(sidebar.querySelectorAll('button, [role="button"], p, span, a'));
        const fallbackBtns = candidates.filter(el => {
            const text = el.textContent.trim().toLowerCase();
            return patterns.some(p => text === p || text.startsWith(p));
        }).map(el => el.closest('button') || el);

        // Deduplicate
        const allBtns = new Set([...nativeBtns, ...fallbackBtns]);

        for (const btn of allBtns) {
            // Only click if the button is actually visible on screen
            if (btn && (btn.offsetWidth > 0 || btn.offsetHeight > 0)) {
                btn.click();
                clicked++;
            }
        }
        return clicked;
    }

    // Returns true if at least one pinned streamer has no visible card in the DOM
    function hasPinnedStreamerHidden() {
        if (pinnedStreamers.length === 0) return false;
        const sidebar = document.querySelector('[data-a-target="side-nav-bar"]');
        if (!sidebar) return false;

        return pinnedStreamers.some(username => {
            // Is the card present AND visible?
            const card = sidebar.querySelector('[' + CARD_ATTR + '="' + username + '"]');
            if (card && (card.offsetWidth > 0 || card.offsetHeight > 0)) return false;

            // Is the raw link present AND visible?
            const link = sidebar.querySelector('a[href="/' + username + '"]');
            if (link && (link.offsetWidth > 0 || link.offsetHeight > 0)) return false;

            // If we reach here, the streamer is either not in the DOM or hidden by CSS
            return true;
        });
    }

    // Click "Afficher plus" if needed
    function expandIfPinnedHidden() {
        // Stop if we've tried 5 times to avoid infinite clicking
        if (autoExpandAttempts >= 5) return;
        
        if (!hasPinnedStreamerHidden()) {
            autoExpandAttempts = 5; // Success! All pinned are visible, disable further checks
            return;
        }

        const clickedCount = clickShowMoreButtons();
        if (clickedCount === 0) {
            // No visible button found, Twitch might be loading. Don't increment attempts so we can try again on next mutation
            return;
        }

        autoExpandAttempts++;
        console.log(`[TwitchNoAds] Épinglés cachés détectés — ${clickedCount} bouton(s) "Afficher plus" cliqué(s) (Essai ${autoExpandAttempts}/5)`);
        
        // Twitch React will add/show new nodes, triggering our MutationObserver,
        // which will call processCards() -> expandIfPinnedHidden() again automatically!
    }

    // ── Bootstrap: retry until sidebar is rendered ───────────────────────────────
    function tryInit(attempts) {
        if (!initialized) return;
        attempts = attempts || 0;
        const links = getChannelLinks();
        if (links.length > 0) {
            processCards();
            startObserver();
            console.log('[TwitchNoAds] sidebar-pins prêt (' + links.length + ' chaînes)');
        } else if (attempts < 25) {
            setTimeout(() => tryInit(attempts + 1), 400);
        } else {
            console.warn('[TwitchNoAds] sidebar-pins: aucune chaîne trouvée après 10s.');
        }
    }

    function init() {
        if (initialized) return;
        chrome.storage.local.get(['enableSidebarPins', 'pinnedStreamers'], data => {
            const enabled = data.enableSidebarPins ?? false;
            if (!enabled) {
                console.log('[TwitchNoAds] sidebar-pins désactivé par configuration.');
                return;
            }
            initialized = true;
            injectStyles();
            pinnedStreamers = data.pinnedStreamers || [];
            tryInit(0);
        });
    }

    function cleanup() {
        if (!initialized) return;
        initialized = false;

        if (observer) {
            observer.disconnect();
            observer = null;
        }
        if (processDebounce) {
            clearTimeout(processDebounce);
            processDebounce = null;
        }

        const style = document.getElementById(STYLE_ID);
        if (style) style.remove();

        document.querySelectorAll('.tna-pin-btn').forEach(btn => btn.remove());

        const cards = document.querySelectorAll(`[${CARD_ATTR}]`);
        cards.forEach(card => {
            card.removeAttribute(CARD_ATTR);
            card.removeAttribute(PINNED_ATTR);
            card.removeAttribute('data-tna-offline');
            card.removeAttribute('draggable');
            card.style.order = '';

            const parent = card.parentElement;
            if (parent) {
                parent.style.display = '';
                parent.style.flexDirection = '';
            }
        });

        autoExpandAttempts = 0;
        console.log('[TwitchNoAds] sidebar-pins désactivé et nettoyé.');
    }

    // Listen for storage changes to support live toggling
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.enableSidebarPins) {
            const enabled = changes.enableSidebarPins.newValue ?? false;
            if (enabled) {
                init();
            } else {
                cleanup();
            }
        }
    });

    // Wait for the page to be ready, then add a small delay for React hydration
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(init, 700));
    } else {
        setTimeout(init, 700);
    }

})();
