import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeesAPI } from '../../api/endpoints';
import AppLayout from '../../components/AppLayout';
import Badge from '../../components/Badge';
import { ArrowLeft, Mail, Phone, Building, User, Calendar, CreditCard, Edit, Camera, Loader2, Save, X } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function EmployeeProfile() {
  // ==========================================
  // 1. ROUTING & PERMISSIONS
  // ==========================================
  // We extract the 'id' parameter from the URL to know which employee to fetch.
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Get the logged-in user to check permissions.
  // Admins can edit anyone, employees can only edit their own profile (avatar).
  const { user } = useAuthStore();
  const isAdmin = ['admin', 'hr_officer'].includes(user?.role);
  const isSelf = user?.id === id;
  const canEdit = isAdmin || isSelf;

  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  
  const [salaryForm, setSalaryForm] = useState({
    ctcAnnual: '',
    basicPct: 40,
    hraPct: 50,
  });

  // ==========================================
  // 2. FETCH EMPLOYEE DATA
  // ==========================================
  // Fetches the full profile including salary structure from the backend.
  const { data: empResponse, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      const res = await employeesAPI.getById(id);
      return res.data;
    }
  });

  // ==========================================
  // 3. AVATAR UPLOAD MUTATION
  // ==========================================
  // Handles uploading an image file using FormData (multipart/form-data).
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file) => {
      setIsUploading(true);
      const res = await employeesAPI.uploadAvatar(id, file);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['employee', id]); // Refreshes the profile to show new image
      setIsUploading(false);
    },
    onError: (err) => {
      setIsUploading(false);
      alert('Failed to upload image: ' + (err.response?.data?.message || err.message));
    }
  });

  // ==========================================
  // 4. SALARY UPDATE MUTATION
  // ==========================================
  // Admins can update the Annual CTC and percentage splits.
  const updateSalaryMutation = useMutation({
    mutationFn: async (data) => {
      const res = await employeesAPI.updateSalary(id, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['employee', id]);
      setShowSalaryModal(false);
    },
    onError: (err) => {
      alert('Failed to update salary: ' + (err.response?.data?.message || err.message));
    }
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size should be less than 5MB");
        return;
      }
      uploadAvatarMutation.mutate(file);
    }
  };

  const handleSalarySubmit = (e) => {
    e.preventDefault();
    updateSalaryMutation.mutate({
      ctcAnnual: Number(salaryForm.ctcAnnual),
      basicPct: Number(salaryForm.basicPct),
      hraPct: Number(salaryForm.hraPct),
    });
  };

  const openSalaryModal = () => {
    setSalaryForm({
      ctcAnnual: emp?.profile?.salaryStructure?.ctcAnnual || '',
      basicPct: emp?.profile?.salaryStructure?.basicPct || 40,
      hraPct: emp?.profile?.salaryStructure?.hraPct || 50,
    });
    setShowSalaryModal(true);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-[#9CA3AF]" /></div>
      </AppLayout>
    );
  }

  const emp = empResponse?.data;
  if (!emp) return <AppLayout><div className="p-8 text-[#9CA3AF]">Employee not found.</div></AppLayout>;

  const profile = emp.profile || {};
  const salary = profile.salaryStructure;

  const details = [
    { label: 'Email',       value: emp.email,       icon: Mail },
    { label: 'Phone',       value: profile.phone || 'Not added',       icon: Phone },
    { label: 'Department',  value: profile.department || 'Not added',  icon: Building },
    { label: 'Designation', value: profile.designation || 'Not added', icon: User },
    { label: 'Joined',      value: profile.joiningDate ? new Date(profile.joiningDate).toLocaleDateString() : 'Not added', icon: Calendar },
    { label: 'Gender',      value: profile.gender || 'Not added', icon: User },
  ];

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const avatarUrl = profile.avatarUrl ? `${API_URL.replace('/api', '')}${profile.avatarUrl}` : null;

  return (
    <AppLayout>
      {/* Hero header */}
      <div className="bg-black px-6 lg:px-8 pt-6 pb-8">
        <div className="flex items-center gap-4 animate-fade-in-up flex-wrap">
          <button onClick={() => navigate('/employees')} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <ArrowLeft size={16} className="text-white" />
          </button>
          
          <div className="flex items-center gap-4 flex-1 min-w-[250px]">
            <div className="relative group">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover shadow-lg shadow-[#3B82F6]/30 bg-white" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-[#3B82F6]/30">
                  {profile.firstName?.[0]}{profile.lastName?.[0]}
                </div>
              )}
              
              {canEdit && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {isUploading ? <Loader2 size={20} className="text-white animate-spin" /> : <Camera size={20} className="text-white" />}
                </button>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>

            <div>
              <h1 className="text-2xl font-extrabold text-white">{profile.firstName} {profile.lastName}</h1>
              <p className="text-[#9CA3AF] text-sm mt-0.5">{profile.designation || 'No Designation'} · {profile.department || 'No Department'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge status={emp.isActive ? 'active' : 'inactive'} />
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
                <p className={`text-sm mt-1 ${d.value === 'Not added' ? 'text-[#EF4444]' : 'text-[#111827]'} font-semibold capitalize`}>{d.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTC card */}
        <div className="bg-white rounded-2xl card-shadow p-6 animate-fade-in-up delay-5 relative group">
          {isAdmin && (
             <button onClick={openSalaryModal} className="absolute top-4 right-4 text-[#9CA3AF] hover:text-[#3B82F6] transition-colors p-2 bg-[#F5F6F8] rounded-lg">
                <Edit size={14} />
             </button>
          )}
          <div className="flex items-center justify-between mt-2">
            <div>
              <p className="text-xs text-[#9CA3AF] uppercase tracking-widest font-semibold">Annual CTC</p>
              <p className="text-3xl font-extrabold text-[#111827] mt-1">₹{Number(salary?.ctcAnnual || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#9CA3AF] uppercase tracking-widest font-semibold">Monthly Gross</p>
              <p className="text-xl font-extrabold text-[#3B82F6] mt-1">₹{Math.round(Number(salary?.ctcAnnual || 0) / 12).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        {/* Employee Code */}
        <div className="bg-white rounded-2xl card-shadow p-6 animate-fade-in-up delay-6">
          <p className="text-xs text-[#9CA3AF] uppercase tracking-widest font-semibold mb-1">Employee Code / Login ID</p>
          <p className="text-lg font-mono font-bold text-[#111827] bg-[#F5F6F8] inline-block px-4 py-2 rounded-xl">{profile.employeeCode || 'Not Assigned'}</p>
        </div>
      </div>

      {/* Salary Edit Modal */}
      {showSalaryModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowSalaryModal(false)}>
          <div className="bg-white rounded-2xl card-shadow-lg p-6 w-full max-w-md animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-extrabold text-[#111827]">Edit Salary Structure</h3>
              <button onClick={() => setShowSalaryModal(false)} className="text-[#9CA3AF] hover:text-[#111827]"><X size={18}/></button>
            </div>
            
            <form onSubmit={handleSalarySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">Annual CTC (₹)</label>
                <input 
                  type="number" 
                  value={salaryForm.ctcAnnual} 
                  onChange={e => setSalaryForm({...salaryForm, ctcAnnual: e.target.value})}
                  className="w-full bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3B82F6] text-[#111827] rounded-xl px-4 py-3 text-sm outline-none"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">Basic %</label>
                  <input 
                    type="number" 
                    value={salaryForm.basicPct} 
                    onChange={e => setSalaryForm({...salaryForm, basicPct: e.target.value})}
                    className="w-full bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3B82F6] text-[#111827] rounded-xl px-4 py-3 text-sm outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">HRA %</label>
                  <input 
                    type="number" 
                    value={salaryForm.hraPct} 
                    onChange={e => setSalaryForm({...salaryForm, hraPct: e.target.value})}
                    className="w-full bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3B82F6] text-[#111827] rounded-xl px-4 py-3 text-sm outline-none"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={updateSalaryMutation.isPending}
                className="w-full mt-4 flex justify-center items-center gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold py-3 rounded-xl text-sm shadow-lg shadow-[#3B82F6]/25 transition-all disabled:opacity-50">
                {updateSalaryMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save Changes</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
