// Shared validation for session codes (6 chars, no ambiguous 0/O/1/I/L).
// The server-side generator lives in supabase/migrations/0001_init.sql.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
export const SESSION_CODE_LENGTH = 6

export function isValidSessionCode(input: string): boolean {
  if (input.length !== SESSION_CODE_LENGTH) return false
  for (const ch of input) {
    if (!ALPHABET.includes(ch)) return false
  }
  return true
}

export function normalizeSessionCode(input: string): string {
  return input.trim().toUpperCase()
}
