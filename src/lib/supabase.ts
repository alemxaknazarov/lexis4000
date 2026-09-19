import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://edxexhujreeckecqbryy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ha2IXQ54aPfxHLDSW6RQnA_8Miju1HS';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Book {
  id: number;
  book_number: number;
  title: string;
  total_units: number;
}

export interface Word {
  id: string;
  book_number: number;
  unit_number: number;
  word: string;
  phonetic: string;
  part_of_speech: string;
  translation_uz: string;
  definition_en: string;
  example_en: string;
  example_uz?: string;
  image_url: string;
  audio_url: string;
}

export interface UserProfile {
  id: string;
  telegram_id?: number;
  phone_number?: string;
  username?: string;
  full_name: string;
  avatar_url?: string;
  total_xp: number;
  streak_days: number;
  last_study_date?: string;
  created_at?: string;
}

export interface UnitProgress {
  book_number: number;
  unit_number: number;
  accuracy_percentage: number;
  is_completed: boolean;
  learned_words_count?: number;
}
