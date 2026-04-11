import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setMessage(''); setError('');

        if (newPassword !== confirmPassword) {
            setLoading(false);
            return setError("Les mots de passe ne correspondent pas.");
        }

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword })
            });
            const data = await res.json();
            if (res.ok) {
                setMessage(data.message);
                setTimeout(() => navigate('/admin/login'), 3000);
            } else {
                setError(data.error || "Une erreur est survenue.");
            }
        } catch (err) {
            setError("Impossible de contacter le serveur.");
        } finally {
            setLoading(false);
        }
    };

    if (!token) return <div className="min-h-screen flex items-center justify-center font-bold text-red-500">Jeton de sécurité manquant.</div>;

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
                <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Nouveau mot de passe</h1>
                    <p className="text-gray-500 font-medium mb-8">Choisissez un mot de passe fort pour sécuriser votre compte.</p>

                    {message && (
                        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm font-bold mb-6">
                            <CheckCircle2 size={18} /> {message} (Redirection...)
                        </div>
                    )}
                    {error && (
                        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-bold mb-6">
                            <AlertCircle size={18} /> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                            <input 
                                type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3 px-12 outline-none focus:border-red-600 transition-all font-medium"
                                placeholder="Nouveau mot de passe"
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                            <input 
                                type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3 px-12 outline-none focus:border-red-600 transition-all font-medium"
                                placeholder="Confirmer le mot de passe"
                            />
                        </div>
                        <button disabled={loading} type="submit" className="w-full bg-gradient-to-br from-green-600 to-green-700 text-white font-bold py-4 rounded-xl shadow-lg mt-4 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                            {loading ? <Loader2 className="animate-spin" /> : "Réinitialiser et se connecter"}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}