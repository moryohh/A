import React from 'react';
import { DEFAULT_FACE_AVATAR } from '../data/cartoonAvatars';

export const DEFAULT_COMMUNITY_AVATAR = DEFAULT_FACE_AVATAR;

interface CommunityAvatarProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string;
}

export const CommunityAvatar: React.FC<CommunityAvatarProps> = ({ src, onError, ...props }) => (
  <img
    {...props}
    src={src?.trim() || DEFAULT_COMMUNITY_AVATAR}
    onError={(event) => {
      event.currentTarget.onerror = null;
      event.currentTarget.src = DEFAULT_COMMUNITY_AVATAR;
      onError?.(event);
    }}
  />
);
