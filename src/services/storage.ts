/** The only file that touches localStorage. Reads are guarded and validated; failures fall back silently. */
export function readJson<T>(key: string, isValid: (value: unknown) => value is T, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    const parsed: unknown = JSON.parse(raw)
    return isValid(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage can be full or blocked; the app keeps working in memory.
  }
}
