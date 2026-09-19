export interface AvatarItem {
  id: string;
  name: string;
  category: 'boys' | 'girls' | 'mascots';
  categoryLabel: string;
  url: string;
  isExclusive?: boolean;
}

export const AVATAR_LIST: AvatarItem[] = [
  // Exclusive Creator Avatar for Alem
  {
    id: 'alem-creator',
    name: 'Alem (VIP Creator)',
    category: 'mascots',
    categoryLabel: 'VIP Asoschi',
    url: '/avatars/alem-creator.jpg',
    isExclusive: true
  },
  // Boys
  {
    id: 'boy-1',
    name: 'Scholar Boy',
    category: 'boys',
    categoryLabel: 'Boys',
    url: '/avatars/boy-1.jpg'
  },
  {
    id: 'boy-2',
    name: 'Smart Boy',
    category: 'boys',
    categoryLabel: 'Boys',
    url: '/avatars/boy-2.jpg'
  },
  {
    id: 'boy-3',
    name: 'Gentleman',
    category: 'boys',
    categoryLabel: 'Boys',
    url: '/avatars/boy-3.jpg'
  },

  // Girls
  {
    id: 'girl-1',
    name: 'Smart Girl',
    category: 'girls',
    categoryLabel: 'Girls',
    url: '/avatars/girl-1.jpg'
  },
  {
    id: 'girl-2',
    name: 'Joyful Girl',
    category: 'girls',
    categoryLabel: 'Girls',
    url: '/avatars/girl-2.jpg'
  },
  {
    id: 'girl-3',
    name: 'Grace Girl',
    category: 'girls',
    categoryLabel: 'Girls',
    url: '/avatars/girl-3.jpg'
  },

  // Mascots
  {
    id: 'owl',
    name: 'Wise Owl',
    category: 'mascots',
    categoryLabel: 'Mascots',
    url: '/avatars/owl.jpg'
  },
  {
    id: 'robot',
    name: 'Cyber Robot',
    category: 'mascots',
    categoryLabel: 'Mascots',
    url: '/avatars/robot.jpg'
  },
  {
    id: 'fox',
    name: 'Clever Fox',
    category: 'mascots',
    categoryLabel: 'Mascots',
    url: '/avatars/fox.jpg'
  },
  {
    id: 'astronaut',
    name: 'Cosmo Explorer',
    category: 'mascots',
    categoryLabel: 'Mascots',
    url: '/avatars/astronaut.jpg'
  }
];

export function getAvatarUrl(avatarIdOrUrl?: string | null): string | null {
  if (!avatarIdOrUrl) return null;
  if (avatarIdOrUrl.startsWith('/') || avatarIdOrUrl.startsWith('http')) {
    return avatarIdOrUrl;
  }
  const found = AVATAR_LIST.find((a) => a.id === avatarIdOrUrl);
  return found ? found.url : null;
}
