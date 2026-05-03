import { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

export default function AppLayout({ children }) {
  // Set sidebar to open by default so text labels are visible
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F5F6F8]">
      {/* Sidebar - controlled by parent state */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#E5E7EB] sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-xl bg-[#F5F6F8] text-[#111827] hover:bg-[#E5E7EB] transition-colors"
            >
              <Menu size={20} />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#3B82F6] flex items-center justify-center">
                <span className="text-white font-black text-sm">E</span>
              </div>
              <span className="font-extrabold text-[#111827]">EmPay</span>
            </div>
          </div>
        </header>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
