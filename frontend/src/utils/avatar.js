const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export function getAvatarUrl(userOrProfile) {
  // Handle both { profile: { avatarUrl } } and { avatarUrl }
  const profile = userOrProfile?.profile || userOrProfile;
  
  const avatarUrl = profile?.avatarUrl;

  // If it's already a full URL (Cloudinary), return it directly
  if (avatarUrl && (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://'))) {
    return avatarUrl;
  }
  
  // If it's a local legacy path, prepend the API base
  if (avatarUrl && avatarUrl.startsWith('/uploads')) {
    return `${API_BASE}${avatarUrl}`;
  }
  
  // Fallback to UI-Avatars initials
  const firstName = profile?.firstName || '';
  const lastName = profile?.lastName || '';
  const name = `${firstName}+${lastName}` || 'User';
  
  return `https://ui-avatars.com/api/?name=${name}&background=3B82F6&color=fff&size=128`;
}
