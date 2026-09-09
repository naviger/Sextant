import React from 'react'

interface UserAvatarProps {
  username?: string
  displayName?: string | null
  avatarDataUrl?: string | null
  sizeClassName?: string
}

const initialsFromName = (username?: string, displayName?: string | null): string => {
  const source = (displayName || username || '').trim()
  if (!source) {
    return 'U'
  }

  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  username,
  displayName,
  avatarDataUrl,
  sizeClassName = 'h-10 w-10',
}) => {
  if (avatarDataUrl) {
    return (
      <img
        src={avatarDataUrl}
        alt={`${displayName || username || 'User'} avatar`}
        className={`${sizeClassName} rounded-full border border-white/70 object-cover shadow-[0_10px_26px_rgba(37,55,70,0.22)]`}
      />
    )
  }

  return (
    <div
      className={`${sizeClassName} flex items-center justify-center rounded-full border border-white/70 bg-[linear-gradient(135deg,var(--north-atlantic-blue),var(--horizon-teal))] text-xs font-semibold uppercase tracking-[0.08em] text-white shadow-[0_10px_26px_rgba(37,55,70,0.22)]`}
      aria-label="User avatar"
    >
      {initialsFromName(username, displayName)}
    </div>
  )
}
