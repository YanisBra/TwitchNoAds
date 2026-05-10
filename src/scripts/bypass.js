(function() {
    let settings = { bypassPreroll: true, bypassMidroll: true };

    window.addEventListener("message", (event) => {
        if (event.data && event.data.type === "UPDATE_SETTINGS") {
            settings = event.data.settings;
        }
    });

    // Interception des requêtes Fetch (méthode plus agressive)
    const origFetch = window.fetch;
    window.fetch = (url, init, ...args) => {
        if (typeof url === "string" && url.includes("/access_token")) {
            const isPreroll = !window.location.pathname.includes('/videos/');
            let shouldBypass = (isPreroll && settings.bypassPreroll) || (!isPreroll && settings.bypassMidroll);

            if (shouldBypass) {
                // 'thunderdome' est actuellement plus efficace que 'embed'
                const newUrl = url.replace("player_type=site", "player_type=thunderdome");
                if (newUrl !== url) {
                    console.log("[TwitchAdSwap] Bypass actif via Thunderdome Strategy");
                    window.postMessage({ type: "AD_BYPASS_SUCCESS" }, "*");
                    return origFetch(newUrl, init, ...args);
                }
            }
        }
        return origFetch(url, init, ...args);
    };

    // Interception GQL pour supprimer les drapeaux publicitaires dans les requêtes
    const origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(body) {
        if (body && typeof body === 'string' && body.includes('PlaybackAccessToken')) {
            // Ici on pourrait injecter des variables GQL pour forcer l'absence de pub
            // mais Thunderdome via fetch est déjà très puissant.
        }
        return origSend.apply(this, arguments);
    };
})();
