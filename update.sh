#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Target paths
REMOTE_URL="https://raw.githubusercontent.com/pixeltris/TwitchAdSolutions/master/video-swap-new/video-swap-new-ublock-origin.js"
DEST_PATH="src/scripts/video-swap.js"

echo -e "\033[36mTéléchargement de la dernière version du script de contournement...\033[0m"

# Download using curl or wget
if command -v curl >/dev/null 2>&1; then
    CONTENT=$(curl -sSL "$REMOTE_URL")
elif command -v wget >/dev/null 2>&1; then
    CONTENT=$(wget -qO- "$REMOTE_URL")
else
    echo -e "\033[31mErreur : curl ou wget doit être installé pour télécharger le script.\033[0m"
    exit 1
fi

# Basic validation: check if it contains the version variable
if [[ "$CONTENT" == *"ourTwitchAdSolutionsVersion"* ]]; then
    # Clean the uBlock Origin header if present (starts with twitch-videoad.js)
    if [[ "$CONTENT" =~ ^twitch-videoad\.js ]]; then
        # tail -n +2 is highly portable across macOS (BSD) and Linux (GNU) to remove the first line
        CONTENT=$(echo "$CONTENT" | tail -n +2)
        echo -e "\033[33mEn-tête uBlock détecté et nettoyé.\033[0m"
    fi

    # Ensure the destination directory exists
    mkdir -p "$(dirname "$DEST_PATH")"

    # Save to target path
    echo "$CONTENT" > "$DEST_PATH"

    # Apply French Toast notice and counter patch
    if command -v python3 >/dev/null 2>&1; then
        python3 -c '
import re
path = "src/scripts/video-swap.js"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

notice_patch = """    let adToastTimeout = null;
    let wasAdPlaying = false;

    function updateAdblockBanner(data) {
        const playerRootDiv = document.querySelector(\x27.video-player\x27);
        if (playerRootDiv != null) {
            let adBlockDiv = null;
            adBlockDiv = playerRootDiv.querySelector(\x27.adblock-overlay\x27);
            if (adBlockDiv == null) {
                adBlockDiv = document.createElement(\x27div\x27);
                adBlockDiv.className = \x27adblock-overlay\x27;
                adBlockDiv.style.pointerEvents = \x27none\x27;
                adBlockDiv.innerHTML = `
                <div class="player-adblock-notice" style="
                    position:absolute;
                    top:20px;
                    left:50%;
                    transform:translateX(-50%) translateY(-50px);
                    background:#1f1f23;
                    color:white;
                    padding:12px 20px;
                    border-radius:4px;
                    font-family:Inter,sans-serif;
                    font-size:13px;
                    font-weight:600;
                    z-index:1000000;
                    box-shadow:0 4px 12px rgba(0,0,0,0.5);
                    border-left:4px solid #9147ff;
                    transition:transform 0.4s,opacity 0.3s;
                    opacity:0;
                    white-space:nowrap;
                    display:flex;
                    align-items:center;
                    gap:10px;
                    pointer-events:none;
                ">
                    <span id="tna-title">\u2705 Publicit\u00e9 Contourn\u00e9e (Mode 360p)</span>
                </div>`;
                playerRootDiv.appendChild(adBlockDiv);
            }
            if (adBlockDiv != null) {
                if (!twitchPlayerAndState?.player?.core || !twitchPlayerAndState?.state) {
                    twitchPlayerAndState = getPlayerAndState();
                }
                const isLive = twitchPlayerAndState?.state?.props?.content?.type === \x27live\x27;
                
                const noticeEl = adBlockDiv.querySelector(\x27.player-adblock-notice\x27);
                const titleEl = adBlockDiv.querySelector(\x27#tna-title\x27);

                if (data.hasAds && isLive) {
                    if (!wasAdPlaying) {
                        wasAdPlaying = true;
                        
                        if (titleEl) {
                            titleEl.textContent = \x27\u2705 Publicit\u00e9 Contourn\u00e9e (Mode 360p)\x27;
                        }
                        
                        window.postMessage({ type: \x27TNA_AD_BYPASSED\x27 }, \x27*\x27);
                        
                        void noticeEl.offsetWidth; // Force reflow
                        
                        noticeEl.style.opacity = \x271\x27;
                        noticeEl.style.transform = \x27translateX(-50%) translateY(0)\x27;
                        
                        if (adToastTimeout) clearTimeout(adToastTimeout);
                        
                        adToastTimeout = setTimeout(() => {
                            noticeEl.style.opacity = \x270\x27;
                            noticeEl.style.transform = \x27translateX(-50%) translateY(-50px)\x27;
                        }, 10000);
                    }
                } else {
                    wasAdPlaying = false;
                    if (noticeEl && noticeEl.style.opacity !== \x270\x27) {
                        noticeEl.style.opacity = \x270\x27;
                        noticeEl.style.transform = \x27translateX(-50%) translateY(-50px)\x27;
                    }
                }
            }
        }
    }"""

regex = re.compile(r"function updateAdblockBanner\(data\)\s*\{.*?\}\s*(?=function monitorLiveStatus\(\))", re.DOTALL)
if regex.search(content):
    content = regex.sub(notice_patch, content)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("\033[32mPatch français appliqué avec succès !\033[0m")
else:
    print("\033[33mWarning: Impossible d\x27appliquer le patch français (fonction non trouvée).\033[0m")
'
    fi

    echo -e "\033[32mMise à jour réussie avec succès !\033[0m"
    echo -e "\033[33mVeuillez rafraîchir l'extension dans chrome://extensions pour appliquer les changements.\033[0m"
else
    echo -e "\033[31mErreur : Le fichier téléchargé ne semble pas valide (version introuvable).\033[0m"
    exit 1
fi
