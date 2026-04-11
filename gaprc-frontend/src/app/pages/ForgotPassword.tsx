import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Mail, Loader2, AlertCircle, CheckCircle2, ChevronLeft } from 'lucide-react';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setMessage(''); setError('');

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (res.ok) setMessage(data.message);
            else setError(data.error || "Une erreur est survenue.");
        } catch (err) {
            setError("Impossible de contacter le serveur.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
                <div className="relative bg-white p-8 rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100">
                    
                    <button 
                        onClick={() => navigate('/admin/login')} 
                        className="absolute top-8 left-8 text-gray-400 hover:text-gray-800 transition-colors"
                        aria-label="Retour"
                    >
                        <ChevronLeft size={26} strokeWidth={2.5} />
                    </button>

                    <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2 mt-10">Récupération</h1>
                    <p className="text-gray-500 font-medium mb-8">Entrez votre email pour recevoir un lien de réinitialisation.</p>

                    {message && (
                        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm font-bold mb-6">
                            <CheckCircle2 size={18} /> {message}
                        </div>
                    )}
                    {error && (
                        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-bold mb-6">
                            <AlertCircle size={18} /> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                            <input 
                                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3 px-12 outline-none focus:border-red-600 transition-all font-medium"
                                placeholder="directeur@gaprc.be"
                            />
                        </div>
                        <button disabled={loading} type="submit" className="w-full bg-gradient-to-br from-red-600 to-red-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                            {loading ? <Loader2 className="animate-spin" /> : "Envoyer le lien"}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}