import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Lock, Mail, Loader2, AlertCircle, ChevronLeft } from "lucide-react";

export function AdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || "Erreur de connexion");

            // Sauvegarde du Token et des infos admin
            localStorage.setItem("adminToken", data.token);
            localStorage.setItem("adminUser", JSON.stringify(data.admin));

            navigate("/dashboard");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
            <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-black/5 overflow-hidden"
            >
                <div className="h-2 bg-gradient-to-r from-red-600 to-red-800" />
                <div className="p-8">
                    <button onClick={() => navigate("/")} className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors mb-8 text-sm font-medium">
                        <ChevronLeft size={16} /> Retour au Kiosque
                    </button>

                    <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Espace Direction</h1>
                    <p className="text-gray-400 text-sm mb-8">Veuillez vous authentifier pour accéder aux rapports.</p>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Email Professionnel</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                <input 
                                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3 px-12 outline-none focus:border-red-600 transition-all font-medium"
                                    placeholder="admin@gaprc.be"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Mot de passe</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                <input 
                                    type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3 px-12 outline-none focus:border-red-600 transition-all font-medium"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold">
                                <AlertCircle size={14} /> {error}
                            </div>
                        )}

                        <button 
                            disabled={loading} type="submit"
                            className="w-full bg-gradient-to-br from-red-600 to-red-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "Se connecter"}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}