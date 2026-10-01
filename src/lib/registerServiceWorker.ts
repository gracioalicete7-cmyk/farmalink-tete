export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // Proactively check for service worker updates on load
          registration.update().catch(() => {});

          // Check for service worker updates
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('FarmaLink Tete: Nova versão em cache pronta.');
                  } else {
                    console.log('FarmaLink Tete: Conteúdo em cache para uso offline.');
                  }
                }
              };
            }
          };
        })
        .catch((error) => {
          console.warn('FarmaLink Tete: Falha ao registar Service Worker:', error);
        });
    });
  }
}
