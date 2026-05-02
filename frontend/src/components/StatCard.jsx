export default function StatCard({ icon: Icon, label, value, color = 'teal', sub }) {
  const colorMap = {
    teal:   { bar: 'from-[#00B4D8] to-[#06D6A0]', icon: 'text-[#00B4D8]', bg: 'bg-[#00B4D8]/10' },
    mint:   { bar: 'from-[#06D6A0] to-[#00B4D8]', icon: 'text-[#06D6A0]', bg: 'bg-[#06D6A0]/10' },
    amber:  { bar: 'from-[#FFB703] to-[#FF9500]', icon: 'text-[#FFB703]', bg: 'bg-[#FFB703]/10' },
    coral:  { bar: 'from-[#FF6B6B] to-[#FF4757]', icon: 'text-[#FF6B6B]', bg: 'bg-[#FF6B6B]/10' },
  };
  const c = colorMap[color] || colorMap.teal;

  return (
    <div className="relative overflow-hidden bg-white/5 border border-white/8 rounded-2xl p-6 hover:border-white/15 transition-all group">
      {/* Top gradient bar */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${c.bar}`} />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-white/40 tracking-widest uppercase mb-3">{label}</p>
          <p className="text-3xl font-bold text-white" style={{ fontFamily: 'Noto Serif, serif' }}>{value}</p>
          {sub && <p className="text-xs text-white/30 mt-1.5">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl ${c.bg}`}>
          <Icon size={20} className={c.icon} />
        </div>
      </div>
    </div>
  );
}
