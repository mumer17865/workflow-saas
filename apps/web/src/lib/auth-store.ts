/**
 * The access token lives in memory only — never in localStorage — so it is not
 * exposed to XSS-persisted storage. The refresh token is an httpOnly cookie
 * managed by the API and is never readable from JS.
 */
let accessToken: string | null = null;
let activeOrgId: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}

/** The organization the client is currently acting on (sent as a header). */
export function getActiveOrgId(): string | null {
  return activeOrgId;
}

export function setActiveOrgId(id: string | null): void {
  activeOrgId = id;
}
