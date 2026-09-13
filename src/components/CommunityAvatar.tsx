import React from 'react';

const faceSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#84cc16"/><circle cx="50" cy="50" r="38" fill="#fffdf2"/><circle cx="36" cy="43" r="5" fill="#263447"/><circle cx="64" cy="43" r="5" fill="#263447"/><circle cx="27" cy="58" r="6" fill="#f9a8d4" opacity=".8"/><circle cx="73" cy="58" r="6" fill="#f9a8d4" opacity=".8"/><path d="M34 60c8 11 24 11 32 0" fill="none" stroke="#263447" stroke-width="5" stroke-linecap="round"/></svg>`;

export const DEFAULT_COMMUNITY_AVATAR = `data:image/svg+xml,${encodeURIComponent(faceSvg)}`;

interface CommunityAvatarProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string;
}

export const CommunityAvatar: React.FC<CommunityAvatarProps> = ({ src, onError, ...props }) => (
  <img
    {...props}
    src={src || DEFAULT_COMMUNITY_AVATAR}
    onError={(event) => {
      event.currentTarget.onerror = null;
      event.currentTarget.src = DEFAULT_COMMUNITY_AVATAR;
      onError?.(event);
    }}
  />
);
