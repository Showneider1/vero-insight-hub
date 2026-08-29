const KEY = "vero.candidate.code";

export function storeCandidateCode(code: string) {
  try {
    localStorage.setItem(KEY, code.toUpperCase());
  } catch {
    /* ignore */
  }
}

export function readCandidateCode(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearCandidateCode() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
