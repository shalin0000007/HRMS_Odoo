export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="w-full animate-pulse">
      <div className="h-10 bg-[#F5F6F8] rounded-t-xl mb-2 w-full" />
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-4 px-5 border-b border-[#F5F6F8]">
          <div className="w-8 h-8 rounded-full bg-[#E5E7EB] shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-[#E5E7EB] rounded w-1/3" />
            <div className="h-2 bg-[#F5F6F8] rounded w-1/4" />
          </div>
          <div className="w-20 h-3 bg-[#E5E7EB] rounded shrink-0 hidden md:block" />
          <div className="w-16 h-4 bg-[#E5E7EB] rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-5 card-shadow animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#F5F6F8]" />
        <div className="w-12 h-3 rounded bg-[#E5E7EB]" />
      </div>
      <div className="w-20 h-6 bg-[#E5E7EB] rounded mb-2" />
      <div className="w-32 h-3 bg-[#F5F6F8] rounded" />
    </div>
  );
}
