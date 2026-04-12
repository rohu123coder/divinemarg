let cachedToken: string | null = null;

export function setToken(t: string | null): void {
  cachedToken = t;
}

export function getToken(): string | null {
  return cachedToken;
}
