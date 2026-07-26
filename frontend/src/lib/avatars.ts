import { supabase } from '@/lib/supabase'

// Preset avatar images live in two Supabase storage buckets that MUST be
// configured as public ("Public bucket" toggle in Storage settings):
//
//   - preset-avatars        avatar-1.png … avatar-7.png (user profiles)
//   - preset-group-avatars  avatar-1.png … avatar-4.png (group pictures)
//
// getPublicUrl() builds the URL without checking the bucket's policy, so if
// a bucket is ever switched to private these render as broken images — that
// is the symptom to look for before debugging anything else.

export const PRESET_PROFILE_AVATARS = [1, 2, 3, 4, 5, 6, 7].map(
  (i) =>
    supabase.storage.from('preset-avatars').getPublicUrl(`avatar-${i}.png`).data
      .publicUrl
)

export const PRESET_GROUP_AVATARS = [1, 2, 3, 4].map(
  (i) =>
    supabase.storage.from('preset-group-avatars').getPublicUrl(`avatar-${i}.png`)
      .data.publicUrl
)
