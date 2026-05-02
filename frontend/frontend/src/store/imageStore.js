import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Image store for managing uploaded images (avatars, logos).
 *
 * Strategy:
 *  1. Employee avatars: Stored as base64 data URIs in localStorage (small thumbnails only, <200KB).
 *     In production, these would be uploaded to an S3-compatible bucket via the backend.
 *  2. Company logo: Same approach — persisted locally, uploaded to backend when Engineer A's
 *     file upload endpoint is ready.
 *  3. Backend integration: When /api/uploads endpoint is available, the ImageUpload component
 *     will POST the file as FormData and store the returned URL instead of base64.
 */
const useImageStore = create(
  persist(
    (set, get) => ({
      // Map of entityId -> imageDataURL
      avatars: {},       // { 'employee-1': 'data:image/jpeg;base64,...' }
      companyLogo: null, // 'data:image/png;base64,...'

      setAvatar: (employeeId, dataUrl) =>
        set((state) => ({
          avatars: { ...state.avatars, [employeeId]: dataUrl },
        })),

      removeAvatar: (employeeId) =>
        set((state) => {
          const { [employeeId]: _, ...rest } = state.avatars;
          return { avatars: rest };
        }),

      getAvatar: (employeeId) => get().avatars[employeeId] || null,

      setCompanyLogo: (dataUrl) => set({ companyLogo: dataUrl }),
      removeCompanyLogo: () => set({ companyLogo: null }),
    }),
    {
      name: 'empay-images',
    }
  )
);

export default useImageStore;
