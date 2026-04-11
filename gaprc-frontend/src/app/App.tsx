import { RouterProvider } from "react-router";
import { useEffect } from "react";
import { router } from "./routes";
import { ReloadPrompt } from "./components/ui/ReloadPrompt";
import { db } from "../services/db";

export default function App() {

  // 🔄 ÉCOUTEUR GLOBAL DE RETOUR RÉSEAU (Issue 4 & Issue 7)
  useEffect(() => {
    const syncPendingReports = async () => {
      if (!navigator.onLine) return; // Toujours pas de Wi-Fi

      try {
        // On vérifie s'il y a des caisses coincées en local
        const pending = await db.pendingReports.toArray();
        if (pending.length === 0) return;

        console.log(`🌐 [GLOBAL] Wi-Fi revenu ! Synchronisation de ${pending.length} caisses en arrière-plan...`);

        for (const report of pending) {
          try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/shifts/close`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(report)
            });

            if (res.ok) {
              console.log(`✅ [GLOBAL] Caisse (ID Local: ${report.id}) envoyée en DB avec succès !`);
              await db.pendingReports.delete(report.id!); // On supprime la donnée locale
            } else {
               console.error(`❌ [GLOBAL] Le serveur a refusé la caisse ${report.id}`);
            }
          } catch (err) {
            console.error(`❌ [GLOBAL] Échec de synchro pour la caisse ${report.id}. On réessaiera plus tard.`);
          }
        }
      } catch (e) {
         console.error("Erreur lors de la lecture IndexedDB", e);
      }
    };

    // Dès que le navigateur détecte le retour du Wi-Fi, il lance la synchro
    window.addEventListener('online', syncPendingReports);
    
    // On tente aussi une synchro au premier chargement de l'application entière
    syncPendingReports();

    return () => window.removeEventListener('online', syncPendingReports);
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      <ReloadPrompt />
    </>
  );
}