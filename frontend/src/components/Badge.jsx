export default function Badge({ status }) {
  const styles = {
    approved:  'bg-[#10B981]/8  text-[#10B981] border-[#10B981]/15',
    rejected:  'bg-[#EF4444]/8  text-[#EF4444] border-[#EF4444]/15',
    pending:   'bg-[#F59E0B]/8  text-[#F59E0B] border-[#F59E0B]/15',
    present:   'bg-[#10B981]/8  text-[#10B981] border-[#10B981]/15',
    absent:    'bg-[#EF4444]/8  text-[#EF4444] border-[#EF4444]/15',
    late:      'bg-[#F59E0B]/8  text-[#F59E0B] border-[#F59E0B]/15',
    half_day:  'bg-[#8B5CF6]/8  text-[#8B5CF6] border-[#8B5CF6]/15',
    draft:     'bg-[#9CA3AF]/8  text-[#9CA3AF] border-[#9CA3AF]/15',
    finalized: 'bg-[#3B82F6]/8  text-[#3B82F6] border-[#3B82F6]/15',
    active:    'bg-[#10B981]/8  text-[#10B981] border-[#10B981]/15',
    inactive:  'bg-[#9CA3AF]/8  text-[#9CA3AF] border-[#9CA3AF]/15',
    paid:      'bg-[#3B82F6]/8  text-[#3B82F6] border-[#3B82F6]/15',
    sick:      'bg-[#EF4444]/8  text-[#EF4444] border-[#EF4444]/15',
    unpaid:    'bg-[#F59E0B]/8  text-[#F59E0B] border-[#F59E0B]/15',
    full_time: 'bg-[#3B82F6]/8  text-[#3B82F6] border-[#3B82F6]/15',
  };

  const label = status?.replace('_', ' ');
  const cls = styles[status?.toLowerCase()] || 'bg-[#9CA3AF]/8 text-[#9CA3AF] border-[#9CA3AF]/15';

  return (
    <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full border ${cls}`}>
      {label}
    </span>
  );
}
