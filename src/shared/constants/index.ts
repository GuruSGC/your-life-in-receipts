export const STORAGE_THEME_KEY = 'life-receipts:theme:v1'
export const DATA_BASE_PATH = '/data'
export const MINUTES_PER_DAY = 1440
export const MAX_SEARCH_LENGTH = 80

export const THEMES = [
  'music',
  'food',
  'travel',
  'home',
  'health',
  'shopping',
  'entertainment',
  'money',
  'family',
  'other',
] as const

export type Theme = (typeof THEMES)[number]

export const THEME_LABELS: Record<Theme, string> = {
  music: 'Music',
  food: 'Food',
  travel: 'Travel',
  home: 'Home',
  health: 'Health',
  shopping: 'Shopping',
  entertainment: 'Entertainment',
  money: 'Money moves',
  family: 'Family',
  other: 'Other',
}

/** Household ledger category (lower case) to theme. */
export const LEDGER_THEME: Record<string, Theme> = {
  food: 'food',
  transportation: 'travel',
  household: 'home',
  subscription: 'entertainment',
  health: 'health',
  family: 'family',
  apparel: 'shopping',
  investment: 'money',
  'recurring deposit': 'money',
  salary: 'money',
  'money transfer': 'money',
  'share market trading': 'money',
  'equity mutual fund b': 'money',
  gift: 'family',
  beauty: 'shopping',
  'social life': 'entertainment',
  culture: 'entertainment',
  education: 'other',
}

/** Card category to theme. */
export const CARD_THEME: Record<string, Theme> = {
  online_shopping: 'shopping',
  travel: 'travel',
  entertainment: 'entertainment',
  fitness_and_medical: 'health',
}
