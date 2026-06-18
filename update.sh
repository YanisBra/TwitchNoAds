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

    echo -e "\033[32mMise à jour réussie avec succès !\033[0m"
    echo -e "\033[33mVeuillez rafraîchir l'extension dans chrome://extensions pour appliquer les changements.\033[0m"
else
    echo -e "\033[31mErreur : Le fichier téléchargé ne semble pas valide (version introuvable).\033[0m"
    exit 1
fi
