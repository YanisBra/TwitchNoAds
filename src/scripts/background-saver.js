// src/scripts/background-saver.js

(function() {
    'use strict';

    console.log('[TwitchNoAds] background-saver.js chargé en mode MAIN');

    // Inject styles to hide the chat column and chat rooms under the tna-hidden class
    const style = document.createElement('style');
    style.id = 'tna-bg-saver-styles';
    style.textContent = `
        html.tna-hidden section[data-a-target="chat-room"],
        html.tna-hidden .right-column,
        html.tna-hidden .stream-chat {
            display: none !important;
        }
    `;
    (document.head || document.documentElement).appendChild(style);

    let autoBackgroundSaverEnabled = true;
    let lastState = 'visible';

    // React Fiber traversal helper functions
    function findReactNode(root, constraint) {
        if (root.stateNode && constraint(root.stateNode)) {
            return root.stateNode;
        }
        let node = root.child;
        while (node) {
            const result = findReactNode(node, constraint);
            if (result) {
                return result;
            }
            node = node.sibling;
        }
        return null;
    }

    function findReactRootNode() {
        let reactRootNode = null;
        const rootNode = document.querySelector('#root');
        if (rootNode && rootNode._reactRootContainer && rootNode._reactRootContainer._internalRoot && rootNode._reactRootContainer._internalRoot.current) {
            reactRootNode = rootNode._reactRootContainer._internalRoot.current;
        }
        if (reactRootNode == null && rootNode != null) {
            const containerName = Object.keys(rootNode).find(x => x.startsWith('__reactContainer'));
            if (containerName != null) {
                reactRootNode = rootNode[containerName];
            }
        }
        return reactRootNode;
    }

    function getTwitchPlayer() {
        const reactRootNode = findReactRootNode();
        if (!reactRootNode) return null;

        let player = findReactNode(reactRootNode, node => node.setPlayerActive && node.props && node.props.mediaPlayerInstance);
        player = player && player.props && player.props.mediaPlayerInstance ? player.props.mediaPlayerInstance : null;
        if (player?.playerInstance) {
            player = player.playerInstance;
        }
        return player;
    }

    // Main action functions
    function apply160pQuality() {
        // Hide Twitch chat by adding the class
        document.documentElement.classList.add('tna-hidden');

        const player = getTwitchPlayer();
        
        if (player && typeof player.getQualities === 'function') {
            const qualities = player.getQualities();
            const quality160p = qualities.find(q => {
                const name = q.name || q.group || '';
                return name.startsWith('160p');
            });
            
            if (quality160p) {
                // Save state (auto quality mode or current fixed quality)
                window.tnaWasAutoQuality = typeof player.isAutoQualityMode === 'function' ? player.isAutoQualityMode() : true;
                if (!window.tnaWasAutoQuality) {
                    const currentQ = player.getQuality();
                    window.tnaLastQualityName = currentQ ? (currentQ.name || currentQ.group) : null;
                }
                
                player.setQuality(quality160p);
                console.log('[TwitchNoAds] Économiseur d\'arrière-plan : qualité abaissée à 160p, chat masqué.');
            } else {
                console.log('[TwitchNoAds] Économiseur d\'arrière-plan : chat masqué (qualité 160p indisponible).');
            }
        } else {
            console.log('[TwitchNoAds] Économiseur d\'arrière-plan : chat masqué (lecteur vidéo introuvable).');
        }
    }

    function restoreOriginalQuality() {
        // Show Twitch chat by removing the class
        document.documentElement.classList.remove('tna-hidden');

        const player = getTwitchPlayer();
        
        if (player) {
            let restored = false;
            if (window.tnaWasAutoQuality) {
                if (typeof player.setAutoQualityMode === 'function') {
                    player.setAutoQualityMode(true);
                    restored = true;
                }
            } else if (window.tnaLastQualityName) {
                const qualities = player.getQualities();
                const targetQ = qualities.find(q => q.name === window.tnaLastQualityName || q.group === window.tnaLastQualityName);
                if (targetQ) {
                    player.setQuality(targetQ);
                    restored = true;
                } else if (typeof player.setAutoQualityMode === 'function') {
                    player.setAutoQualityMode(true);
                    restored = true;
                }
            } else {
                if (typeof player.setAutoQualityMode === 'function') {
                    player.setAutoQualityMode(true);
                    restored = true;
                }
            }
            
            if (restored) {
                console.log('[TwitchNoAds] Économiseur d\'arrière-plan : qualité d\'origine et chat restaurés.');
            } else {
                console.log('[TwitchNoAds] Économiseur d\'arrière-plan : chat restauré.');
            }
            
            // Clean temp variables
            delete window.tnaWasAutoQuality;
            delete window.tnaLastQualityName;
        } else {
            console.log('[TwitchNoAds] Économiseur d\'arrière-plan : chat restauré (lecteur vidéo introuvable).');
        }
    }

    let bgSaverTimeout = null;
    let isCurrently160p = false;

    function handleStateChange(state) {
        if (lastState === state) return;
        lastState = state;

        if (!autoBackgroundSaverEnabled) return;

        if (state === 'hidden') {
            if (bgSaverTimeout) clearTimeout(bgSaverTimeout);
            
            bgSaverTimeout = setTimeout(() => {
                apply160pQuality();
                isCurrently160p = true;
                bgSaverTimeout = null;
            }, 10000); // 10 secondes
            
        } else if (state === 'visible') {
            if (bgSaverTimeout) {
                clearTimeout(bgSaverTimeout);
                bgSaverTimeout = null;
            }
            
            if (isCurrently160p) {
                restoreOriginalQuality();
                isCurrently160p = false;
            }
        }
    }

    // Listen to messages from content-bridge
    window.addEventListener('message', (event) => {
        if (event.source !== window) return;

        // Settings updates
        if (event.data && event.data.type === 'TNA_BG_SAVER_SETTING') {
            autoBackgroundSaverEnabled = event.data.enabled;
            
            if (!autoBackgroundSaverEnabled) {
                if (bgSaverTimeout) {
                    clearTimeout(bgSaverTimeout);
                    bgSaverTimeout = null;
                }
                if (isCurrently160p) {
                    restoreOriginalQuality();
                    isCurrently160p = false;
                }
            }
        }

        // Visibility events forwarded by ISOLATED world
        if (event.data && event.data.type === 'TNA_VISIBILITY_CHANGE') {
            handleStateChange(event.data.state);
        }
    });

    // Request initial setting on load
    window.postMessage({ type: 'TNA_GET_BG_SAVER_SETTING' }, '*');

})();
