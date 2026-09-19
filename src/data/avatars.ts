export interface AvatarItem {
  id: string;
  name: string;
  category: 'superheroes' | 'boys' | 'girls' | 'mascots';
  categoryLabel: string;
  url: string;
  requiredXp: number; // 0 = Free, 50 = Premium, 100 = Legendary, >100 = Marvel & DC Superheroes
  tier?: 'free' | 'premium' | 'legendary' | 'superhero';
  universe?: 'Marvel' | 'DC';
}

export const AVATAR_LIST: AvatarItem[] = [
  // ==========================================
  // MARVEL & DC SUPERHEROES (> 100 XP)
  // ==========================================
  {
    id: 'spider-man',
    name: 'Spider-Man',
    category: 'superheroes',
    categoryLabel: 'Marvel',
    url: '/avatars/spider-man.png',
    requiredXp: 120,
    tier: 'superhero',
    universe: 'Marvel'
  },
  {
    id: 'captain-america',
    name: 'Captain America',
    category: 'superheroes',
    categoryLabel: 'Marvel',
    url: '/avatars/captain-america.png',
    requiredXp: 120,
    tier: 'superhero',
    universe: 'Marvel'
  },
  {
    id: 'iron-man',
    name: 'Iron Man',
    category: 'superheroes',
    categoryLabel: 'Marvel',
    url: '/avatars/iron-man.png',
    requiredXp: 150,
    tier: 'superhero',
    universe: 'Marvel'
  },
  {
    id: 'thor',
    name: 'Thor',
    category: 'superheroes',
    categoryLabel: 'Marvel',
    url: '/avatars/thor.png',
    requiredXp: 150,
    tier: 'superhero',
    universe: 'Marvel'
  },
  {
    id: 'hulk',
    name: 'Hulk',
    category: 'superheroes',
    categoryLabel: 'Marvel',
    url: '/avatars/hulk.png',
    requiredXp: 150,
    tier: 'superhero',
    universe: 'Marvel'
  },
  {
    id: 'batman',
    name: 'Batman (The Dark Knight)',
    category: 'superheroes',
    categoryLabel: 'DC Comics',
    url: '/avatars/batman.jpg',
    requiredXp: 200,
    tier: 'superhero',
    universe: 'DC'
  },
  {
    id: 'superman',
    name: 'Superman (Man of Steel)',
    category: 'superheroes',
    categoryLabel: 'DC Comics',
    url: '/avatars/superman.jpg',
    requiredXp: 200,
    tier: 'superhero',
    universe: 'DC'
  },
  {
    id: 'joker',
    name: 'Joker',
    category: 'superheroes',
    categoryLabel: 'DC Comics',
    url: '/avatars/joker.png',
    requiredXp: 200,
    tier: 'superhero',
    universe: 'DC'
  },

  // ==========================================
  // BOYS (0 XP)
  // ==========================================
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

  // ==========================================
  // GIRLS (0 XP - 50 XP)
  // ==========================================
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

  // ==========================================
  // MASCOTS & 3D CREATURES (0 XP - 100 XP)
  // ==========================================
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
