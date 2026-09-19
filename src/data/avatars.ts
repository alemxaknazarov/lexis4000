export interface AvatarItem {
  id: string;
  name: string;
  category: 'boys' | 'girls' | 'mascots';
  categoryLabel: string;
  url: string;
  requiredXp: number; // 0 = Free, 50 = Premium, 100 = Legendary Premium
  tier?: 'free' | 'premium' | 'legendary';
}

export const AVATAR_LIST: AvatarItem[] = [
  // --- BOYS ---
  {
    id: 'boy-1',
    name: 'Bilimdon Yigit',
    category: 'boys',
    categoryLabel: 'O‘g‘il bolalar',
    url: '/avatars/boy-1.jpg',
    requiredXp: 0,
    tier: 'free'
  },
  {
    id: 'boy-2',
    name: 'Zukko Yigit',
    category: 'boys',
    categoryLabel: 'O‘g‘il bolalar',
    url: '/avatars/boy-2.jpg',
    requiredXp: 0,
    tier: 'free'
  },
  {
    id: 'boy-3',
    name: 'Gentleman',
    category: 'boys',
    categoryLabel: 'O‘g‘il bolalar',
    url: '/avatars/boy-3.jpg',
    requiredXp: 0,
    tier: 'free'
  },
  {
    id: 'super-boy',
    name: 'Super Qahramon',
    category: 'boys',
    categoryLabel: 'O‘g‘il bolalar',
    url: '/avatars/super-boy.jpg',
    requiredXp: 100,
    tier: 'legendary'
  },

  // --- GIRLS ---
  {
    id: 'girl-1',
    name: 'Zukko Qiz',
    category: 'girls',
    categoryLabel: 'Qizlar',
    url: '/avatars/girl-1.jpg',
    requiredXp: 0,
    tier: 'free'
  },
  {
    id: 'girl-2',
    name: 'Quvnoq Qiz',
    category: 'girls',
    categoryLabel: 'Qizlar',
    url: '/avatars/girl-2.jpg',
    requiredXp: 0,
    tier: 'free'
  },
  {
    id: 'girl-3',
    name: 'Nafis Qiz',
    category: 'girls',
    categoryLabel: 'Qizlar',
    url: '/avatars/girl-3.jpg',
    requiredXp: 0,
    tier: 'free'
  },
  {
    id: 'wizard-girl',
    name: 'Sehrgar Qiz',
    category: 'girls',
    categoryLabel: 'Qizlar',
    url: '/avatars/wizard-girl.jpg',
    requiredXp: 50,
    tier: 'premium'
  },

  // --- MASCOTS & LEGENDS ---
  {
    id: 'fox',
    name: 'Ziyrak Tulki',
    category: 'mascots',
    categoryLabel: 'Qahramonlar',
    url: '/avatars/fox.jpg',
    requiredXp: 0,
    tier: 'free'
  },
  {
    id: 'owl',
    name: 'Dono Boyo‘g‘li',
    category: 'mascots',
    categoryLabel: 'Qahramonlar',
    url: '/avatars/owl.jpg',
    requiredXp: 0,
    tier: 'free'
  },
  {
    id: 'robot',
    name: 'Kiber Robot',
    category: 'mascots',
    categoryLabel: 'Qahramonlar',
    url: '/avatars/robot.jpg',
    requiredXp: 50,
    tier: 'premium'
  },
  {
    id: 'ninja-cat',
    name: 'Ninja Mushuk',
    category: 'mascots',
    categoryLabel: 'Qahramonlar',
    url: '/avatars/ninja-cat.jpg',
    requiredXp: 50,
    tier: 'premium'
  },
  {
    id: 'astronaut',
    name: 'Koinot Sayyohi',
    category: 'mascots',
    categoryLabel: 'Qahramonlar',
    url: '/avatars/astronaut.jpg',
    requiredXp: 50,
    tier: 'premium'
  },
  {
    id: 'cyber-bear',
    name: 'Geymer Oq Ayiq',
    category: 'mascots',
    categoryLabel: 'Qahramonlar',
    url: '/avatars/cyber-bear.jpg',
    requiredXp: 50,
    tier: 'premium'
  },
  {
    id: 'cosmic-kitty',
    name: 'Yulduzli Mushukcha',
    category: 'mascots',
    categoryLabel: 'Qahramonlar',
    url: '/avatars/cosmic-kitty.jpg',
    requiredXp: 100,
    tier: 'legendary'
  },
  {
    id: 'baby-dragon',
    name: 'Kichik Ajdarho',
    category: 'mascots',
    categoryLabel: 'Qahramonlar',
    url: '/avatars/baby-dragon.jpg',
    requiredXp: 100,
    tier: 'legendary'
  },
  {
    id: 'lion-king',
    name: 'Qirol Sher',
    category: 'mascots',
    categoryLabel: 'Qahramonlar',
    url: '/avatars/lion-king.jpg',
    requiredXp: 100,
    tier: 'legendary'
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
