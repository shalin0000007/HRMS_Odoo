import { Inbox } from 'lucide-react';

export default function EmptyState({ 
  icon: Icon = Inbox, 
  title = 'No Data Found', 
  message = 'There is currently no information to display here.',
  actionText,
  onAction
}) {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center animate-fade-in">
      <div className="w-16 h-16 bg-[#F5F6F8] rounded-full flex items-center justify-center mb-4 text-[#9CA3AF]">
        <Icon size={24} strokeWidth={1.5} />
      </div>
      <h3 className="text-[#111827] font-bold text-lg mb-1">{title}</h3>
      <p className="text-[#6B7280] text-sm max-w-sm mb-6">{message}</p>
      
      {actionText && onAction && (
        <button 
          onClick={onAction}
          className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-5 py-2.5 rounded-full text-sm font-bold transition-colors shadow-lg shadow-[#3B82F6]/25"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
