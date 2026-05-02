import axiosInstance from './axiosInstance';

// ─── Auth ─────────────────────────────────────────────────────
// These endpoints handle user authentication and session management
export const authAPI = {
  // Registers a new user and sends verification email
  register:       (data)  => axiosInstance.post('/auth/register', data),
  // Verifies email address using token from email link
  verifyEmail:    (token) => axiosInstance.get('/auth/verify-email', { params: { token } }),
  // Resends verification email
  resendVerification: (data) => axiosInstance.post('/auth/resend-verification', data),
  // Sends email and password to backend, returns JWT token on success
  login:          (data)  => axiosInstance.post('/auth/login', data),
  // Validates the current JWT token and returns the user's profile
  getMe:          ()      => axiosInstance.get('/auth/me'),
  // Allows the user to securely change their password
  changePassword: (data)  => axiosInstance.post('/auth/change-password', data),
};

// ─── Employees ────────────────────────────────────────────────
// These endpoints handle CRUD operations for employee records and profiles
export const employeesAPI = {
  // Fetches a paginated list of all employees (Admin/HR only)
  getAll:        (params)    => axiosInstance.get('/employees', { params }),
  // Fetches detailed profile of a single employee by their UUID
  getById:       (id)        => axiosInstance.get(`/employees/${id}`),
  // Creates a new employee record and auto-generates their leave balances
  create:        (data)      => axiosInstance.post('/employees', data),
  // Updates basic profile information (name, department, phone, etc.)
  update:        (id, data)  => axiosInstance.put(`/employees/${id}`, data),
  // Soft-deletes an employee by setting isActive to false
  deactivate:    (id)        => axiosInstance.delete(`/employees/${id}`),
  // Fetches the specific salary structure (CTC, PF, basic %) for an employee
  getSalary:     (id)        => axiosInstance.get(`/employees/${id}/salary`),
  // Updates or creates the salary structure for an employee
  updateSalary:  (id, data)  => axiosInstance.put(`/employees/${id}/salary`, data),
  // Uploads a profile picture using FormData (multipart/form-data)
  uploadAvatar:  (id, file)  => {
    const fd = new FormData();
    fd.append('avatar', file);
    return axiosInstance.post(`/employees/${id}/avatar`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ─── Attendance ───────────────────────────────────────────────
// Handles daily check-ins, check-outs, and manager overrides
export const attendanceAPI = {
  // Records the current timestamp as the employee's clock-in time
  clockIn:        ()                    => axiosInstance.post('/attendance/clock-in'),
  // Records the current timestamp as the employee's clock-out time
  clockOut:       ()                    => axiosInstance.post('/attendance/clock-out'),
  // Checks if the user has already clocked in or out today
  getTodayStatus: ()                    => axiosInstance.get('/attendance/today'),
  // Retrieves the attendance history for a specific month and year for the logged-in user
  getMyAttendance:(month, year)         => axiosInstance.get(`/attendance/my/${month}/${year}`),
  // Retrieves attendance logs for all employees (Admin only)
  getAll:         (params)              => axiosInstance.get('/attendance', { params }),
  // Allows an admin to manually fix or override an employee's attendance record
  override:       (id, data)            => axiosInstance.put(`/attendance/${id}/override`, data),
};

// ─── Leaves ───────────────────────────────────────────────────
// Handles leave applications, approvals, and balance tracking
export const leavesAPI = {
  // Submits a new leave request (sick, casual, earned)
  apply:          (data)      => axiosInstance.post('/leaves', data),
  // Fetches all past and current leave requests for the logged-in user
  getMyLeaves:    (params)    => axiosInstance.get('/leaves/my', { params }),
  // Fetches leave requests for all employees (Admin/HR only)
  getAll:         (params)    => axiosInstance.get('/leaves', { params }),
  // Fetches all leave requests currently awaiting approval
  getPending:     ()          => axiosInstance.get('/leaves/pending'),
  // Approves a leave request and officially deducts from the user's leave balance
  approve:        (id, data)  => axiosInstance.patch(`/leaves/${id}/approve`, data),
  // Rejects a leave request and leaves the balance untouched
  reject:         (id, data)  => axiosInstance.patch(`/leaves/${id}/reject`, data),
  // Retrieves the total available and consumed leave days for a specific year
  getBalances:    (userId, year) => axiosInstance.get(`/leaves/balances/${userId}`, { params: { year } }),
  // Manually overrides or allocates new leave balances (Admin only)
  allocate:       (userId, data) => axiosInstance.put(`/leaves/balances/${userId}`, data),
};

// ─── Payroll ──────────────────────────────────────────────────
// Handles salary calculations, payruns, and payslip PDF generation
export const payrollAPI = {
  // Calculates salaries for all active employees for a specific month
  runPayroll:   (data)          => axiosInstance.post('/payroll/runs', data),
  // Retrieves a history of all previously executed payruns
  getPayruns:   ()              => axiosInstance.get('/payroll/runs'),
  // Fetches details and all individual payslips for a specific payrun
  getPayrun:    (id)            => axiosInstance.get(`/payroll/runs/${id}`),
  // Locks a payrun so no further edits can be made
  finalizePayrun: (id)          => axiosInstance.patch(`/payroll/runs/${id}/finalize`),
  // Retrieves all generated payslips for the logged-in employee
  getMyPayslips:()              => axiosInstance.get('/payroll/payslips/my'),
  // Fetches detailed calculations for a single payslip
  getPayslip:   (id)            => axiosInstance.get(`/payroll/payslips/${id}`),
  // Downloads the server-generated PDF version of the payslip as a Blob
  downloadPDF:  (id)            => axiosInstance.get(`/payroll/payslips/${id}/pdf`, { responseType: 'blob' }),
};

// ─── Analytics ────────────────────────────────────────────────
// Feeds aggregated statistics and charts to the Dashboard UI
export const analyticsAPI = {
  // Returns high-level company stats (headcount, total payroll, etc.) for Admin Dashboard
  getDashboard:   ()       => axiosInstance.get('/analytics/dashboard'),
  // Returns aggregated attendance trends
  getAttendance:  (params) => axiosInstance.get('/analytics/attendance', { params }),
  // Returns aggregated payroll expenditure over time
  getPayroll:     (params) => axiosInstance.get('/analytics/payroll', { params }),
  // Returns aggregated leave usage statistics
  getLeaves:      (params) => axiosInstance.get('/analytics/leaves', { params }),
  // Returns personal stats (my attendance, my leaves) for the Standard Employee Dashboard
  getMyStats:     ()       => axiosInstance.get('/analytics/me'),
};
