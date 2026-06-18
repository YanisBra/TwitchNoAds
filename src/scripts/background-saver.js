// src/scripts/background-saver.js

(function() {
    'use strict';

    console.log('[TwitchNoAds] background-saver.js chargé en mode MAIN');

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
        console.log('[TwitchNoAds] Exécution du script de passage à 160p...');
        const player = getTwitchPlayer();
        
        if (player && typeof player.getQualities === 'function') {
            const qualities = player.getQualities();
            console.log('[TwitchNoAds] Player trouvé. Qualités :', qualities.map(q => q.name || q.group));
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
                console.log('[TwitchNoAds] Qualité baissée à 160p. (Auto-qualité était :', window.tnaWasAutoQuality, ')');
            } else {
                console.log('[TwitchNoAds] Qualité 160p indisponible pour ce stream.');
            }
        } else {
            console.log('[TwitchNoAds] Objet player Twitch introuvable pour passer à 160p.');
        }
    }

    function restoreOriginalQuality() {
        console.log('[TwitchNoAds] Exécution du script de restauration de qualité...');
        const player = getTwitchPlayer();
        
        if (player) {
            if (window.tnaWasAutoQuality) {
                if (typeof player.setAutoQualityMode === 'function') {
                    player.setAutoQualityMode(true);
                    console.log('[TwitchNoAds] Qualité restaurée en mode AUTO.');
                }
            } else if (window.tnaLastQualityName) {
                const qualities = player.getQualities();
                const targetQ = qualities.find(q => q.name === window.tnaLastQualityName || q.group === window.tnaLastQualityName);
                if (targetQ) {
                    player.setQuality(targetQ);
                    console.log('[TwitchNoAds] Qualité fixe restaurée à :', window.tnaLastQualityName);
                } else if (typeof player.setAutoQualityMode === 'function') {
                    player.setAutoQualityMode(true);
                }
            } else {
                if (typeof player.setAutoQualityMode === 'function') {
                    player.setAutoQualityMode(true);
                    console.log('[TwitchNoAds] Restauration par défaut en mode AUTO.');
                }
            }
            
            // Clean temp variables
            delete window.tnaWasAutoQuality;
            delete window.tnaLastQualityName;
        } else {
            console.log('[TwitchNoAds] Objet player Twitch introuvable pour restaurer la qualité.');
        }
    }

    let bgSaverTimeout = null;
    let isCurrently160p = false;

    function handleStateChange(state) {
        if (lastState === state) return;
        lastState = state;

        console.log('[TwitchNoAds] Changement de visibilité reçu de l\'ISOLATED :', state, '| Option active ?', autoBackgroundSaverEnabled);
        if (!autoBackgroundSaverEnabled) return;

        if (state === 'hidden') {
            if (bgSaverTimeout) clearTimeout(bgSaverTimeout);
            
            console.log('[TwitchNoAds] Passage en arrière-plan détecté. Qualité abaissée dans 10 secondes...');
            bgSaverTimeout = setTimeout(() => {
                apply160pQuality();
                isCurrently160p = true;
                bgSaverTimeout = null;
            }, 10000); // 10 secondes
            
        } else if (state === 'visible') {
            if (bgSaverTimeout) {
                clearTimeout(bgSaverTimeout);
                bgSaverTimeout = null;
                console.log('[TwitchNoAds] Retour au premier plan rapide (avant 10s) : transition annulée.');
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
            console.log('[TwitchNoAds] autoBackgroundSaver mis à jour en mode MAIN :', autoBackgroundSaverEnabled);
            
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
