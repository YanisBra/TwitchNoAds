# 🚀 TwitchNoAds

Chrome extension in **Manifest V3** designed to bypass and block 100% of ads on Twitch without altering the user experience, using the Web Worker interception method (`video-swap-new`).

---

## 🎯 Features
* **Ultra-Reliable Ad Blocking:** Uses the `video-swap-new` method to intercept Twitch Web Workers at the very beginning of page loading (`document_start`), guaranteeing 100% blocking without purple screens.
* **Quick Rewind & Live Buttons:**
  * Perfectly integrated into the Twitch video player, naturally positioned between the Play/Pause button and the Volume control.
  * **Customizable Rewind Duration:** Easily adjust the rewind duration from **10s to 30s** (in 5s increments) using a slider in the extension popup. Updates in real-time on the player without refreshing the page!
  * **Go Live:** Instantly catch up to the live stream with a single click.
  * **Twitch-native design:** Transparent buttons (no borders), translucent grey hover circles, tactile click feedback, and Twitch-style tooltips ("Rewind Xs", "Go Live").
* **Automatic Channel Points Claimer:**
  * Automatically claims channel points as soon as they appear in the chat.
  * Multi-language support, compatible with French and English Twitch chats.
  * Configurable via an on/off toggle directly from the extension popup.
* **CPU, GPU & Data Saver (Background Saver):**
  * Automatically lowers the video quality to `160p` (or equivalent) and hides the chat when the Twitch tab is hidden for more than 10 seconds.
  * Instantly restores the original quality (or auto mode) and displays the chat as soon as the tab comes back to the foreground.
  * **Significant Performance Savings:** Hiding the chat completely stops layout/paint and emoticon rendering calculations. Switching to 160p reduces video decoding overhead and bandwidth usage.
  * Full control via an on/off toggle in the popup.
* **Sidebar Streamer Pins:**
  * Pin your favorite channels to the top of the sidebar.
  * Drag and drop to reorder pinned streamers.
  * Configurable via an on/off toggle in the popup (**disabled by default**).
* **Update Checker:** The popup checks in real-time if a new version of the bypass script is available on the GitHub repository.
* **1-Click Update:** Dedicated scripts (PowerShell `update.ps1` for Windows and Bash `update.sh` for macOS/Linux) let you instantly update the bypass script.

---

## ⚙️ Installation (Under 60 seconds)

1. **Download** the project by cloning the repository or downloading the ZIP.
2. **Extract** the archive into a folder on your computer (if downloaded as a ZIP).
3. Open **Google Chrome** (or any Chromium-based browser) and go to `chrome://extensions/`.
4. Enable **Developer mode** (toggle in the top right corner).
5. Click the **Load unpacked** button.
6. Select the project folder (the one containing the `manifest.json` file).
7. **Pin** the **TwitchNoAds** icon to your toolbar for easy access!

---

## 🔄 How to update the bypass script?

The extension automatically checks if an update is available when you open the popup. If the script is outdated, a purple indicator will appear prompting you to run the update.

To perform the update:

* **On Windows (PowerShell):**
  1. Open a terminal in the extension folder.
  2. Run the following command:
     ```powershell
     powershell -ExecutionPolicy Bypass -File .\update.ps1
     ```
     *(You can copy this command with one click directly from the extension popup)*

* **On macOS and Linux (Bash):**
  1. Open a terminal in the extension folder.
  2. Make the script executable (first time only):
     ```bash
     chmod +x update.sh
     ```
  3. Run the script:
     ```bash
     ./update.sh
     ```

3. Go to `chrome://extensions` and click the **Refresh** icon (circular arrow) on the **TwitchNoAds** extension card to apply the changes.

---

# 🚀 TwitchNoAds (Version Française)

Extension Chrome en **Manifest V3** conçue pour contourner et bloquer 100 % des publicités sur Twitch sans altérer l'expérience utilisateur, en utilisant la méthode d'interception de Web Worker (`video-swap-new`).

---

## 🎯 Fonctionnalités
* **Blocage de publicités ultra-fiable :** Utilise la méthode `video-swap-new` pour intercepter les Web Workers Twitch au tout début du chargement de la page (`document_start`), garantissant 100 % de blocage sans écran violet.
* **Boutons de Retour Rapide & Direct (Live) :**
  * Parfaitement intégrés au lecteur vidéo Twitch, positionnés de façon naturelle entre le bouton Play/Pause et le contrôle de Volume.
  * **Durée de retour arrière personnalisable :** Ajustez facilement la durée de retour en arrière de **10s à 30s** (par paliers de 5s) via un curseur dans le popup de l'extension. Se met à jour en temps réel sur le lecteur sans rafraîchir la page !
  * **Retour au direct :** Revenez instantanément au live d'un seul clic.
  * **Fidélité visuelle Twitch :** Boutons transparents (sans bordures), survol circulaire gris de style Twitch, retours tactiles au clic, et info-bulles de style Twitch ("Reculer de Xs", "Retour au direct").
* **Collecte automatique des Points de Chaîne :**
  * Clique automatiquement sur les coffres de points bonus du chat dès qu'ils apparaissent.
  * Multi-langues et compatible avec les différents sélecteurs de Twitch (Français, Anglais).
  * Contrôle complet via un bouton marche/arrêt dans la popup.
* **Économiseur de CPU, GPU & Données (Background Saver) :**
  * Abaisse automatiquement la qualité vidéo à `160p` (ou équivalent) et masque le chat Twitch lorsque l'onglet Twitch est masqué pendant plus de 10 secondes.
  * Restaure instantanément la qualité d'origine (ou mode auto) et réaffiche le chat dès que l'onglet revient au premier plan.
  * **Économie CPU & GPU drastique :** Le masquage du chat stoppe complètement les calculs de rendu (layout/paint) et d'émoticônes du chat Twitch. Le passage à 160p réduit à la fois le décodage vidéo et la bande passante (4G/5G).
  * Contrôle complet via un bouton marche/arrêt dans la popup.
* **Épingler des streamers (Sidebar Pins) :**
  * Épinglez vos chaînes favorites en haut de la barre latérale.
  * Glissez-déposez pour réordonner les streamers épinglés.
  * Configurable via un interrupteur dans le popup (**désactivé par défaut**).
* **Vérification des mises à jour :** La popup vérifie en temps réel s'il existe une nouvelle version du script de contournement sur le dépôt GitHub.
* **Mise à jour en 1 clic :** Des scripts dédiés (PowerShell `update.ps1` pour Windows et Bash `update.sh` pour macOS/Linux) permettent de mettre à jour instantanément le code de contournement.

---

## ⚙️ Installation (en moins de 60 secondes)

1. **Téléchargez** le projet en clonant le dépôt ou en téléchargeant le ZIP.
2. **Extrayez** l'archive dans un dossier sur votre ordinateur (si téléchargé en ZIP).
3. Ouvrez **Google Chrome** (ou tout navigateur Chromium) et rendez-vous sur `chrome://extensions/`.
4. Activez le **Mode développeur** (interrupteur en haut à droite).
5. Cliquez sur le bouton **Charger l'extension non empaquetée** (Load unpacked).
6. Sélectionnez le dossier du projet (celui qui contient le fichier `manifest.json`).
7. **Épinglez** l'icône de **TwitchNoAds** à votre barre d'outils pour un accès facile !

---

## 🔄 Comment mettre à jour le script de contournement ?

L'extension vérifie automatiquement si une mise à jour est disponible lors de l'ouverture du popup. Si le script n'est plus à jour, un indicateur violet s'affiche et vous invite à lancer la mise à jour.

Pour effectuer la mise à jour :

* **Sur Windows (PowerShell) :**
  1. Ouvrez un terminal dans le dossier de l'extension.
  2. Exécutez la commande suivante :
     ```powershell
     powershell -ExecutionPolicy Bypass -File .\update.ps1
     ```
     *(Vous pouvez copier cette commande en un clic directement depuis le popup de l'extension)*

* **Sur macOS et Linux (Bash) :**
  1. Ouvrez un terminal dans le dossier de l'extension.
  2. Rendez le script exécutable (la première fois) :
     ```bash
     chmod +x update.sh
     ```
  3. Exécutez le script :
     ```bash
     ./update.sh
     ```

3. Allez dans `chrome://extensions` et cliquez sur l'icône **Actualiser** (flèche circulaire) sur la carte de l'extension **TwitchNoAds** pour appliquer les changements.
