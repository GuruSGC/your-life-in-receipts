/** The localStorage key that remembers the chosen theme. */
export const STORAGE_THEME_KEY = 'life-receipts:theme:v1'
/** Where the compiled data files are served from. */
export const DATA_BASE_PATH = '/data'
/** Minutes in a day, used to turn minute timestamps into day numbers. */
export const MINUTES_PER_DAY = 1440
/** The longest search text the interface accepts. */
export const MAX_SEARCH_LENGTH = 80

/** The kinds of life the receipts are grouped into. */
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

/** Human-readable names for each theme. */
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
  'small cap fund 1': 'money',
  'small cap fund 2': 'money',
  'equity mutual fund a': 'money',
  'equity mutual fund c': 'money',
  'equity mutual fund d': 'money',
  'equity mutual fund e': 'money',
  'equity mutual fund f': 'money',
  'public provident fund': 'money',
  'saving bank account 1': 'money',
  'saving bank account 2': 'money',
  'dividend earned on shares': 'money',
  interest: 'money',
  'life insurance': 'money',
  'tax refund': 'money',
  'share market': 'money',
  'maturity amount': 'money',
  'fixed deposit': 'money',
  bonus: 'money',
  'petty cash': 'money',
  'amazon pay cashback': 'money',
  'gpay reward': 'money',
  maid: 'home',
  cook: 'home',
  rent: 'home',
  'garbage disposal': 'home',
  'water (jar /tanker)': 'home',
  festivals: 'entertainment',
  tourism: 'travel',
  grooming: 'shopping',
  'self-development': 'other',
  documents: 'other',
  scrap: 'other',
  other: 'other',
  education: 'other',
}

/** Card category to theme. */
export const CARD_THEME: Record<string, Theme> = {
  online_shopping: 'shopping',
  travel: 'travel',
  entertainment: 'entertainment',
  fitness_and_medical: 'health',
}
