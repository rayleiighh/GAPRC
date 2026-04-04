import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export function RevenueChart({ shifts }: { shifts: any[] }) {
  const chartData = useMemo(() => {
    const grouped: Record<string, { date: string, reel: number }> = {};
    const sortedShifts = [...shifts].sort((a, b) => a.date.localeCompare(b.date));

    sortedShifts.forEach(shift => {
      const [, m, d] = shift.date.split('-');
      const shortDate = `${d}/${m}`;

      if (!grouped[shortDate]) {
        grouped[shortDate] = { date: shortDate, reel: 0 };
      }
      grouped[shortDate].reel += shift.reel; // On ne garde que l'argent réel
    });

    return Object.values(grouped);
  }, [shifts]);

  if (chartData.length === 0) return (
    <div style={{ padding: 40, textAlign: "center", background: "white", borderRadius: 20, marginBottom: 24 }}>
      <p style={{ color: "#9ca3af", fontWeight: 600 }}>Pas assez de données pour afficher le graphique.</p>
    </div>
  );

  return (
    <div style={{ 
      background: "white", borderRadius: 20, padding: "24px 28px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.03), 0 24px 48px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.05)",
      height: 300, display: "flex", flexDirection: "column", marginBottom: 24
    }}>
      <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#111827", marginBottom: 20, letterSpacing: "-0.025em" }}>
        Évolution du Chiffre d'Affaires
      </h3>
      
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorReel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#15803d" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#15803d" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 600 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 600 }} dx={-10} tickFormatter={(val) => `${val}€`} />
            <Tooltip 
              contentStyle={{ borderRadius: 14, border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.15)", fontWeight: 600, fontSize: "0.85rem", padding: "12px 16px" }}
              formatter={(value: number) => [`${value.toFixed(2)} €`]}
              labelStyle={{ color: "#9ca3af", marginBottom: 8, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}
            />
            <Area type="monotone" dataKey="reel" name="Encaissé" stroke="#15803d" strokeWidth={3} fillOpacity={1} fill="url(#colorReel)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}