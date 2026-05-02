import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// creates store 
const useAuthStore = create(
  //saves data in browser storage (so login stays after refresh)
  persist(
    (set, get) => ({
      user: null,
      token: null,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      // we set user and token when logging in
      login: (token, user) => set({ token, user }),
      // we set user and token to null when logging out
      logout: () => {
        set({ user: null, token: null });
      },
      // check authentication
      isAuthenticated: () => !!get().token,

      /** Helper: is the current user admin or hr_officer? */
      isAdmin: () => {
        const role = get().user?.role?.toLowerCase();
        return ['admin', 'hr_officer'].includes(role);
      },

      /** Helper: is the current user management-level? */
      isManagement: () => {
        const role = get().user?.role?.toLowerCase();
        return ['admin', 'hr_officer', 'payroll_officer'].includes(role);
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

export default useAuthStore;
