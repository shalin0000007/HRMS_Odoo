import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../api/axiosInstance';
import AppLayout from '../../components/AppLayout';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Download, Filter, Calendar, Users, FileText } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function LeaveReport() {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    department: ''
  });

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['leave-report', filters],
    queryFn: () => axiosInstance.get('/leaves/reports/summary', { params: filters }),
    select: res => res.data.data
  });

  const handleExport = async () => {
    try {
      const res = await axiosInstance.get('/leaves/reports/export', { 
        params: { ...filters, format: 'csv' },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'leave_report.csv');
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      alert('Export failed');
    }
  };

  const chartData = reportData?.byType ? Object.entries(reportData.byType).map(([name, value]) => ({ name, value })) : [];
  const statusData = reportData?.byStatus ? Object.entries(reportData.byStatus).map(([name, value]) => ({ name, value })) : [];

  return (
    <AppLayout>
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-[#111827]">Leave Reporting</h1>
            <p className="text-[#6B7280] mt-1">Analyze leave patterns and workforce availability</p>
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-[#3B82F6]/20"
          >
            <Download size={18} /> Export Data
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-3xl p-6 card-shadow border border-[#F3F4F6] flex flex-wrap gap-6 items-end">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider ml-1">Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={16} />
              <input 
                type="date" 
                className="bg-[#F9FAFB] border-none rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#3B82F6] w-48"
                value={filters.startDate}
                onChange={e => setFilters({...filters, startDate: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider ml-1">End Date</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={16} />
              <input 
                type="date" 
                className="bg-[#F9FAFB] border-none rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#3B82F6] w-48"
                value={filters.endDate}
                onChange={e => setFilters({...filters, endDate: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider ml-1">Department</label>
            <div className="relative">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={16} />
              <select 
                className="bg-[#F9FAFB] border-none rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#3B82F6] w-48"
                value={filters.department}
                onChange={e => setFilters({...filters, department: e.target.value})}
              >
                <option value="">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="HR">HR</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
            <div className="bg-white h-80 rounded-3xl" />
            <div className="bg-white h-80 rounded-3xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* By Type Chart */}
            <div className="bg-white rounded-3xl p-8 card-shadow border border-[#F3F4F6]">
              <h3 className="text-lg font-bold text-[#111827] mb-8">Leave Distribution by Type</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tick={{fill: '#9CA3AF'}} />
                    <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{fill: '#9CA3AF'}} />
                    <Tooltip 
                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    />
                    <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* By Status Chart */}
            <div className="bg-white rounded-3xl p-8 card-shadow border border-[#F3F4F6]">
              <h3 className="text-lg font-bold text-[#111827] mb-8">Approval Status</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Recent Data Table */}
        <div className="bg-white rounded-3xl card-shadow border border-[#F3F4F6] overflow-hidden">
          <div className="px-8 py-6 border-b border-[#F3F4F6]">
            <h3 className="font-bold text-[#111827]">Recent Leave Requests</h3>
          </div>
          <table className="w-full">
            <thead className="bg-[#F9FAFB]">
              <tr className="text-left text-[10px] uppercase tracking-widest text-[#9CA3AF]">
                <th className="px-8 py-4 font-bold">Employee</th>
                <th className="px-8 py-4 font-bold">Type</th>
                <th className="px-8 py-4 font-bold">Duration</th>
                <th className="px-8 py-4 font-bold">Days</th>
                <th className="px-8 py-4 font-bold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {reportData?.recentLeaves?.map((l) => (
                <tr key={l.id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="px-8 py-4">
                    <p className="font-bold text-[#111827]">{l.employee.firstName} {l.employee.lastName}</p>
                    <p className="text-xs text-[#9CA3AF]">{l.employee.department}</p>
                  </td>
                  <td className="px-8 py-4">
                    <span className="text-xs font-bold bg-[#3B82F6]/10 text-[#3B82F6] px-2 py-1 rounded-lg uppercase">{l.leaveType}</span>
                  </td>
                  <td className="px-8 py-4 text-sm text-[#6B7280]">
                    {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-4 text-sm font-bold text-[#111827]">{l.daysCount}</td>
                  <td className="px-8 py-4 text-right">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                      l.status === 'approved' ? 'bg-[#10B981]/10 text-[#10B981]' : 
                      l.status === 'rejected' ? 'bg-[#EF4444]/10 text-[#EF4444]' : 
                      'bg-[#F59E0B]/10 text-[#F59E0B]'
                    }`}>
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
