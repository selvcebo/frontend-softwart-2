export const PIE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6']

export function getIgnored(key: string): number[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]') } catch { return [] }
}

export function persistIgnored(key: string, ids: number[]): void {
  localStorage.setItem(key, JSON.stringify(ids))
}
