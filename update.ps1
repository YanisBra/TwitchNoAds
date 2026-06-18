# Script de mise à jour automatique pour TwitchNoAds
$ErrorActionPreference = "Stop"

$RemoteUrl = "https://raw.githubusercontent.com/pixeltris/TwitchAdSolutions/master/video-swap-new/video-swap-new-ublock-origin.js"
$DestPath = Join-Path $PSScriptRoot "src\scripts\video-swap.js"

Write-Host "Téléchargement de la dernière version du script de contournement..." -ForegroundColor Cyan

try {
    # Téléchargement du script
    $Content = Invoke-RestMethod -Uri $RemoteUrl -UseBasicParsing
    
    # Validation basique pour s'assurer qu'il contient la variable de version
    if ($Content -match "ourTwitchAdSolutionsVersion") {
        # Nettoyage de l'en-tête spécifique à uBlock Origin s'il est présent
        if ($Content -match "^twitch-videoad\.js") {
            $Content = $Content -replace "^twitch-videoad\.js[^\n]*\r?\n", ""
            Write-Host "En-tête uBlock détecté et nettoyé." -ForegroundColor Yellow
        }
        
        # Appliquer le patch français pour la notification et le compteur
        $NoticePatch = @'
    let adToastTimeout = null;
    let wasAdPlaying = false;

    function updateAdblockBanner(data) {
        const playerRootDiv = document.querySelector('.video-player');
        if (playerRootDiv != null) {
            let adBlockDiv = null;
            adBlockDiv = playerRootDiv.querySelector('.adblock-overlay');
            if (adBlockDiv == null) {
                adBlockDiv = document.createElement('div');
                adBlockDiv.className = 'adblock-overlay';
                adBlockDiv.style.pointerEvents = 'none';
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
                const isLive = twitchPlayerAndState?.state?.props?.content?.type === 'live';
                
                const noticeEl = adBlockDiv.querySelector('.player-adblock-notice');
                const titleEl = adBlockDiv.querySelector('#tna-title');

                if (data.hasAds && isLive) {
                    if (!wasAdPlaying) {
                        wasAdPlaying = true;
                        
                        if (titleEl) {
                            titleEl.textContent = '\u2705 Publicit\u00e9 Contourn\u00e9e (Mode 360p)';
                        }
                        
                        window.postMessage({ type: 'TNA_AD_BYPASSED' }, '*');
                        
                        void noticeEl.offsetWidth; // Force reflow
                        
                        noticeEl.style.opacity = '1';
                        noticeEl.style.transform = 'translateX(-50%) translateY(0)';
                        
                        if (adToastTimeout) clearTimeout(adToastTimeout);
                        
                        adToastTimeout = setTimeout(() => {
                            noticeEl.style.opacity = '0';
                            noticeEl.style.transform = 'translateX(-50%) translateY(-50px)';
                        }, 10000);
                    }
                } else {
                    wasAdPlaying = false;
                    if (noticeEl && noticeEl.style.opacity !== '0') {
                        noticeEl.style.opacity = '0';
                        noticeEl.style.transform = 'translateX(-50%) translateY(-50px)';
                    }
                }
            }
        }
    }
'@

        # Remplacement regex dans le contenu téléchargé
        $Regex = '(?s)function updateAdblockBanner\(data\)\s*\{.*?\}\s*(?=function monitorLiveStatus\(\))'
        if ($Content -match $Regex) {
            $Content = $Content -replace $Regex, $NoticePatch
            Write-Host "Patch français de notification et de compteur appliqué avec succès !" -ForegroundColor Green
        } else {
            Write-Warning "Impossible d'appliquer le patch français (fonction de notification non trouvée)."
        }

        # Enregistrement local au format UTF-8
        [System.IO.File]::WriteAllText($DestPath, $Content, [System.Text.Encoding]::UTF8)
        
        Write-Host "Mise à jour réussie avec succès !" -ForegroundColor Green
        Write-Host "Veuillez rafraîchir l'extension dans chrome://extensions pour appliquer les changements." -ForegroundColor Yellow
    } else {
        Write-Error "Le fichier téléchargé ne semble pas valide (version introuvable)."
    }
}
catch {
    Write-Host "Erreur lors de la mise à jour : $_" -ForegroundColor Red
}
