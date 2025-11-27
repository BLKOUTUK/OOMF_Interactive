
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export const MAX_STORY_PAGES = 10;
export const BACK_COVER_PAGE = 11;
export const TOTAL_PAGES = 11;
export const INITIAL_PAGES = 2;
export const GATE_PAGE = 2;
export const BATCH_SIZE = 6;
export const DECISION_PAGES = [3];

// We replace Genres with Visual Styles since the Story is fixed
export const VISUAL_STYLES = [
    "Afrofuturist Cyberpunk",
    "Multiverse Halftone (Spiderverse Style)",
    "Vintage 97 Cel-Shaded (X-Men Style)",
    "Sharp Urban Anime (Boondocks Style)",
    "Neon Noir Graphic Novel",
    "Afro-Punk Collage",
    "Neon Graffiti Futurism",
    "Solarpunk Utopia",
    "Digital Glitch Art",
    "Cinematic Photorealism"
];

export const CITIES = [
    "London",
    "Manchester",
    "Birmingham",
    "Bristol",
    "Cardiff"
];

export const ROLES = [
    { id: 'fluxion', name: 'Fluxion (The Journalist)', power: 'Bends digital time & narratives' },
    { id: 'novacode', name: 'NovaCode (The Engineer)', power: 'Reconstructs corrupted data' },
    { id: 'lumina', name: 'Lumina (The Filmmaker)', power: 'Illuminates lost stories' },
    { id: 'vibrabolt', name: 'VibraBolt (The Organizer)', power: 'Amplifies silenced voices' }
];

export const TONES = [
    "RESILIENT (Determined, Focused)",
    "REBELLIOUS (Punk, Energetic)",
    "MYSTERIOUS (Shadowy, Calculated)",
    "HOPEFUL (Uplifting, Vibrant)"
];

export const LANGUAGES = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'ar-EG', name: 'Arabic (Egypt)' },
    { code: 'de-DE', name: 'German (Germany)' },
    { code: 'es-MX', name: 'Spanish (Mexico)' },
    { code: 'fr-FR', name: 'French (France)' },
    { code: 'ja-JP', name: 'Japanese (Japan)' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' },
    { code: 'zh-CN', name: 'Chinese (China)' }
];

export interface ComicFace {
  id: string;
  type: 'cover' | 'story' | 'back_cover';
  imageUrl?: string;
  narrative?: Beat;
  choices: string[];
  resolvedChoice?: string;
  isLoading: boolean;
  pageIndex?: number;
  isDecisionPage?: boolean;
}

export interface Beat {
  caption?: string;
  dialogue?: string;
  scene: string;
  choices: string[];
  focus_char: 'hero' | 'friend' | 'other';
}

export interface Persona {
  base64: string;
  desc: string;
}
