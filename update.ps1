# Script de mise à jour automatique pour TwitchNoAds
$ErrorActionPreference = "Stop"

$RemoteUrl = "https://raw.githubusercontent.com/pixeltris/TwitchAdSolutions/master/video-swap-new/video-swap-new-ublock-origin.js"
$DestPath = Join-Path $PSScriptRoot "src\scripts\video-swap-new.js"

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
