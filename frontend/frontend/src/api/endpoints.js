import axiosInstance from './axiosInstance';

// ─── Auth ─────────────────────────────────────────────────────
export const authAPI = {
  login:         (data)  => axiosInstance.post('/auth/login', data),
  signUp:        (data)  => axiosInstance.post('/auth/register', data),
  logout:        ()      => axiosInstance.post('/auth/logout'),
  forgotPassword:(data)  => axiosInstance.post('/auth/forgot-password', data),
  resetPassword: (data)  => axiosInstance.post('/auth/reset-password', data),
};

// ─── Employees ────────────────────────────────────────────────
export const employeesAPI = {
  getAll:    ()       => axiosInstance.get('/employees'),
  getById:   (id)     => axiosInstance.get(`/employees/${id}`),
  create:    (data)   => axiosInstance.post('/employees', data),
  update:    (id, data) => axiosInstance.put(`/employees/${id}`, data),
  softDelete:(id)     => axiosInstance.delete(`/employees/${id}`),
};

// ─── Attendance ───────────────────────────────────────────────
export const attendanceAPI = {
  markToday:      ()              => axiosInstance.post('/attendance/mark'),
  getMyAttendance:(month, year)   => axiosInstance.get('/attendance/me', { params: { month, year } }),
  getEmployeeAttendance: (id, month, year) => axiosInstance.get(`/attendance/${id}`, { params: { month, year } }),
  override:       (id, data)      => axiosInstance.put(`/attendance/${id}/override`, data),
};

// ─── Leaves ───────────────────────────────────────────────────
export const leavesAPI = {
  apply:     (data)   => axiosInstance.post('/leaves', data),
  getMyLeaves: ()     => axiosInstance.get('/leaves/me'),
  getAll:    ()       => axiosInstance.get('/leaves'),
  approve:   (id)     => axiosInstance.put(`/leaves/${id}/approve`),
  reject:    (id, data) => axiosInstance.put(`/leaves/${id}/reject`, data),
};

// ─── Payroll ──────────────────────────────────────────────────
export const payrollAPI = {
  runPayroll:   (data)    => axiosInstance.post('/payroll/run', data),
  getPayrun:    (month, year) => axiosInstance.get(`/payroll/${month}/${year}`),
  getPayslip:   (employeeId) => axiosInstance.get(`/payroll/payslip/${employeeId}`),
  adjustPayrun: (id, data)   => axiosInstance.put(`/payroll/${id}/adjust`, data),
  downloadPDF:  (id)         => axiosInstance.get(`/payroll/payslip/${id}/download`, { responseType: 'blob' }),
};

// ─── Analytics ────────────────────────────────────────────────
export const analyticsAPI = {
  getSummary: () => axiosInstance.get('/analytics/summary'),
};
