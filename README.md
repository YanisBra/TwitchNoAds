# 🚀 TwitchFreeTurbo

Extension Chrome en **Manifest V3** conçue pour contourner et bloquer 100 % des publicités sur Twitch sans altérer l'expérience utilisateur, en utilisant la méthode d'interception de Web Worker (`video-swap-new`).

---

## 🎯 Fonctionnalités
* **Blocage ultra-fiable :** Utilise la méthode `video-swap-new` pour intercepter les Web Workers Twitch au tout début du chargement de la page (`document_start`).
* **Vérification automatique des mises à jour :** Le popup de l'extension vérifie en temps réel s'il existe une nouvelle version du script de contournement sur le dépôt officiel.
* **Mise à jour en 1 clic :** Un script PowerShell (`update.ps1`) permet de mettre à jour le script de contournement en local instantanément.

---

## ⚙️ Installation (en moins de 60 secondes)

1. **Téléchargez** le projet en clonant le dépôt ou en téléchargeant le ZIP.
2. **Extrayez** l'archive dans un dossier sur votre ordinateur (si téléchargé en ZIP).
3. Ouvrez **Google Chrome** (ou tout navigateur Chromium) et rendez-vous sur `chrome://extensions/`.
4. Activez le **Mode développeur** (interrupteur en haut à droite).
5. Cliquez sur le bouton **Charger l'extension non empaquetée** (Load unpacked).
6. Sélectionnez le dossier du projet (celui qui contient le fichier `manifest.json`).
7. **Épinglez** l'icône de **TwitchFreeTurbo** à votre barre d'outils pour un accès facile !

---

## 🔄 Comment mettre à jour le script de contournement ?

L'extension vérifie automatiquement si une mise à jour est disponible lors de l'ouverture du popup. Si le script n'est plus à jour, un indicateur violet s'affiche et vous invite à lancer la mise à jour.

Pour effectuer la mise à jour :
1. Ouvrez un terminal (PowerShell) dans le dossier de l'extension.
2. Exécutez la commande suivante :
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\update.ps1
   ```
   *(Vous pouvez copier cette commande en un clic directement depuis le popup de l'extension)*
3. Allez dans `chrome://extensions` et cliquez sur l'icône **Actualiser** (flèche circulaire) sur la carte de l'extension **TwitchFreeTurbo** pour appliquer les changements.
