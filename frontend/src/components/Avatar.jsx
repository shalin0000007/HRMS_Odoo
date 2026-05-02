import { useState } from 'react';
import { getAvatarUrl } from '../utils/avatar';

export default function Avatar({ src, user, className = "w-10 h-10", alt = "Avatar" }) {
  const [hasError, setHasError] = useState(false);
  const avatarUrl = src || getAvatarUrl(user);
  
  const initials = user?.profile
    ? `${user.profile.firstName?.charAt(0) || ''}${user.profile.lastName?.charAt(0) || ''}`
    : user?.firstName?.charAt(0) || 'U';

  return (
    <div className={`${className} rounded-full overflow-hidden bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-xs shadow-sm`}>
      {!hasError ? (
        <img 
          src={avatarUrl} 
          alt={alt} 
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <span>{initials.toUpperCase()}</span>
      )}
    </div>
  );
}
