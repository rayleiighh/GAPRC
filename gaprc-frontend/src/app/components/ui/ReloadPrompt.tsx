import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, X, DownloadCloud } from 'lucide-react';

export function ReloadPrompt() {
  // Ce hook magique écoute le Service Worker de la PWA
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('✅ Service Worker enregistré !', r);
    },
    onRegisterError(error) {
      console.error('❌ Erreur Service Worker', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <AnimatePresence>
      {(offlineReady || needRefresh) && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            background: 'white', border: '1px solid #e5e7eb', borderRadius: 16,
            padding: 20, width: 320, boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {needRefresh ? <RefreshCw style={{ width: 18, height: 18, color: '#dc2626' }} /> : <DownloadCloud style={{ width: 18, height: 18, color: '#16a34a' }} />}
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#111827' }}>
                {needRefresh ? 'Mise à jour disponible' : 'Mode hors-ligne prêt'}
              </h3>
            </div>
            <button onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
              <X style={{ width: 18, height: 18 }} />
            </button>
          </div>
          
          <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: 16, lineHeight: 1.4 }}>
            {needRefresh 
              ? 'Une nouvelle version de Sports Center est disponible. Rafraîchissez pour l\'appliquer.' 
              : 'L\'application a été installée en cache. Elle fonctionnera désormais même sans connexion Wi-Fi !'}
          </p>

          {needRefresh && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => updateServiceWorker(true)}
              style={{
                width: '100%', padding: '10px', background: '#dc2626', color: 'white',
                border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.85rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
            >
              Mettre à jour maintenant
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}