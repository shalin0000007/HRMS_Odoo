import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../../components/AppLayout';
import Badge from '../../components/Badge';
import { ArrowLeft, Mail, Phone, Building, User, Calendar, CreditCard, Edit } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const EMPLOYEES = [
  { id: 1, firstName: 'Alice', lastName: 'Fernandes', empCode: 'OIALEN20220001', department: 'Engineering', designation: 'Software Engineer', email: 'alice@company.com', phone: '+91 98765 43210', status: 'active', doj: '2022-04-15', manager: 'Bob Sharma', ctc: '6,00,000', bankAc: 'HDFC ****3456', address: 'Mumbai, Maharashtra' },
  { id: 2, firstName: 'Bob',   lastName: 'Sharma',    empCode: 'OIBOSH20220002', department: 'Sales',       designation: 'Sales Manager',     email: 'bob@company.com',   phone: '+91 98765 43211', status: 'active', doj: '2022-01-10', manager: 'Admin',      ctc: '7,20,000', bankAc: 'SBI ****7890',  address: 'Delhi, NCR' },
  { id: 3, firstName: 'Priya', lastName: 'Nair',      empCode: 'OIPRNA20230001', department: 'HR',          designation: 'HR Executive',      email: 'priya@company.com', phone: '+91 98765 43212', status: 'active', doj: '2023-06-01', manager: null,         ctc: '5,40,000', bankAc: 'ICICI ****1234', address: 'Bangalore, Karnataka' },
  { id: 4, firstName: 'Raj',   lastName: 'Mehta',     empCode: 'OIRAME20230002', department: 'Finance',     designation: 'Finance Analyst',   email: 'raj@company.com',   phone: '+91 98765 43213', status: 'active', doj: '2023-09-15', manager: 'Bob Sharma', ctc: '5,04,000', bankAc: null,            address: 'Pune, Maharashtra' },
  { id: 5, firstName: 'Sara',  lastName: 'Khan',      empCode: 'OISAKH20240001', department: 'Product',     designation: 'Product Manager',   email: 'sara@company.com',  phone: '+91 98765 43214', status: 'inactive', doj: '2024-01-08', manager: 'Alice Fernandes', ctc: '6,60,000', bankAc: 'AXIS ****5678', address: 'Hyderabad, Telangana' },
];

export default function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const emp = EMPLOYEES.find(e => e.id === parseInt(id));
  const isAdmin = ['admin', 'hr_officer'].includes(user?.role);

  if (!emp) return <AppLayout><div className="p-8 text-[#9CA3AF]">Employee not found.</div></AppLayout>;

  const details = [
    { label: 'Email',       value: emp.email,       icon: Mail },
    { label: 'Phone',       value: emp.phone,       icon: Phone },
    { label: 'Department',  value: emp.department,  icon: Building },
    { label: 'Designation', value: emp.designation, icon: User },
    { label: 'Joined',      value: emp.doj,         icon: Calendar },
    { label: 'Manager',     value: emp.manager || 'Not assigned', icon: User },
    { label: 'Bank',        value: emp.bankAc || 'Not added',  icon: CreditCard },
    { label: 'Address',     value: emp.address,     icon: Building },
  ];

  return (
    <AppLayout>
      {/* Hero header */}
      <div className="bg-black px-6 lg:px-8 pt-6 pb-8">
        <div className="flex items-center gap-4 animate-fade-in-up">
          <button onClick={() => navigate('/employees')} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <ArrowLeft size={16} className="text-white" />
          </button>
          <div className="flex items-center gap-4 flex-1">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-[#3B82F6]/30">
              {emp.firstName[0]}{emp.lastName[0]}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white">{emp.firstName} {emp.lastName}</h1>
              <p className="text-[#9CA3AF] text-sm mt-0.5">{emp.designation} · {emp.department}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge status={emp.status} />
            {isAdmin && (
              <button className="flex items-center gap-2 border border-white/20 text-white/80 hover:text-white px-4 py-2 rounded-full text-xs font-semibold transition-all">
                <Edit size={13} /> Edit
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 lg:p-8 space-y-5">
        {/* Info cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {details.map((d, i) => (
            <div key={d.label} className={`bg-white rounded-2xl card-shadow p-5 flex items-start gap-4 animate-fade-in-up delay-${Math.min(i + 1, 6)}`}>
              <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/8 flex items-center justify-center shrink-0">
                <d.icon size={16} className="text-[#3B82F6]" />
              </div>
              <div>
                <p className="text-[10px] text-[#9CA3AF] uppercase tracking-widest font-semibold">{d.label}</p>
                <p className={`text-sm mt-1 ${d.value === 'Not assigned' || d.value === 'Not added' ? 'text-[#EF4444]' : 'text-[#111827]'} font-semibold`}>{d.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTC card */}
        <div className="bg-white rounded-2xl card-shadow p-6 animate-fade-in-up delay-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#9CA3AF] uppercase tracking-widest font-semibold">Annual CTC</p>
              <p className="text-3xl font-extrabold text-[#111827] mt-1">₹{emp.ctc}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#9CA3AF] uppercase tracking-widest font-semibold">Monthly Gross</p>
              <p className="text-xl font-extrabold text-[#3B82F6] mt-1">₹{Math.round(parseInt(emp.ctc.replace(/,/g, '')) / 12).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        {/* Employee Code */}
        <div className="bg-white rounded-2xl card-shadow p-6 animate-fade-in-up delay-6">
          <p className="text-xs text-[#9CA3AF] uppercase tracking-widest font-semibold mb-1">Employee Code / Login ID</p>
          <p className="text-lg font-mono font-bold text-[#111827] bg-[#F5F6F8] inline-block px-4 py-2 rounded-xl">{emp.empCode}</p>
        </div>
      </div>
    </AppLayout>
  );
}
