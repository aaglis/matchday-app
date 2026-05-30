import Constants from 'expo-constants';
import { Platform } from 'react-native';

const configuredAuthBaseUrl = (process.env.EXPO_PUBLIC_AUTH_BASE_URL ?? 'https://matchday-back.onrender.com').replace(/\/$/, '');

function expoHostUri() {
  const constants = Constants as typeof Constants & {
    manifest?: { debuggerHost?: string };
    manifest2?: { extra?: { expoClient?: { hostUri?: string } } };
  };

  return [
    Constants.expoConfig?.hostUri,
    constants.manifest2?.extra?.expoClient?.hostUri,
    constants.manifest?.debuggerHost,
  ].find((value): value is string => typeof value === 'string' && value.length > 0);
}

function cleanHostUri(hostUri: string) {
  return hostUri.replace(/^[a-z]+:\/\//, '').replace(/\/.*$/, '');
}

function hostFromUrl(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function isPrivateDevHost(host: string) {
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.startsWith('10.') ||
    host.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  );
}

function resolveAuthBaseUrl() {
  const expoHost = expoHostUri();
  const configuredHost = hostFromUrl(configuredAuthBaseUrl);

  if (!__DEV__ || !expoHost || !configuredHost || !isPrivateDevHost(configuredHost)) {
    return configuredAuthBaseUrl;
  }

  const currentHost = cleanHostUri(expoHost).split(':')[0];
  if (!currentHost || configuredHost === currentHost) {
    return configuredAuthBaseUrl;
  }

  try {
    const url = new URL(configuredAuthBaseUrl);
    url.hostname = currentHost;
    return url.toString().replace(/\/$/, '');
  } catch {
    return configuredAuthBaseUrl;
  }
}

function resolveAuthOrigin() {
  const configuredOrigin = process.env.EXPO_PUBLIC_AUTH_ORIGIN;
  const expoHost = expoHostUri();

  if (__DEV__ && expoHost) {
    return `http://${cleanHostUri(expoHost)}`;
  }

  return configuredOrigin ?? AUTH_BASE_URL;
}

export const AUTH_BASE_URL = resolveAuthBaseUrl();

let _sessionExpiredHandler: (() => void) | null = null;
export function registerSessionExpiredHandler(handler: () => void) {
  _sessionExpiredHandler = handler;
}
const AUTH_ORIGIN = resolveAuthOrigin();

export type User = {
  id: string;
  email: string;
  name?: string | null;
  emailVerified?: boolean;
  image?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type SessionPayload = {
  user: User;
  session?: {
    id?: string;
    activeOrganizationId?: string | null;
  };
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  metadata?: Record<string, unknown> | null;
  role?: string;
  memberCount?: number;
};

export type InvitationPreview = {
  id?: string;
  email?: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  status?: string;
};

type RequestOptions = Omit<RequestInit, 'body' | 'headers'> & {
  body?: unknown;
  headers?: Record<string, string>;
};

function requestHeaders(extra?: Record<string, string>) {
  const headers: Record<string, string> = { ...(extra ?? {}) };
  if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
  if (Platform.OS !== 'web') headers.Origin = AUTH_ORIGIN;
  return headers;
}

function errorMessage(status: number, payload: any) {
  const code = payload?.code ?? payload?.error?.code;
  const message = payload?.message ?? payload?.error?.message ?? (typeof payload?.error === 'string' ? payload.error : null);
  const normalizedMessage = typeof message === 'string' ? message.toLowerCase() : '';

  if (code === 'MISSING_OR_NULL_ORIGIN') return 'Origem do app nao autorizada pela API.';
  if (
    code === 'INVALID_EMAIL_OR_PASSWORD' ||
    code === 'INVALID_PASSWORD' ||
    normalizedMessage.includes('invalid password') ||
    normalizedMessage.includes('invalid email') ||
    normalizedMessage.includes('email or password')
  ) {
    return 'E-mail ou senha invalidos.';
  }
  if (code === 'EMAIL_NOT_VERIFIED' || message === 'Email not verified') return 'EMAIL_NOT_VERIFIED';
  if (status === 401) return 'Sessao expirada. Faca login novamente.';
  if (status === 403) return message ?? 'Voce nao tem permissao para essa acao.';
  if (status === 404) return message ?? 'Registro nao encontrado.';
  if (status === 409) return message ?? 'Esse registro ja existe.';
  return message ?? 'Erro na API. Tente novamente mais tarde.';
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}, skipExpiredHandler = false): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);

  let response: Response;
  try {
    response = await fetch(`${AUTH_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: 'include',
      headers: requestHeaders(options.headers),
    });
  } catch (err: unknown) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    throw new Error(isAbort ? 'A API demorou para responder. Tente novamente.' : 'Nao foi possivel conectar com a API.');
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text();
  let payload: any = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { message: text || null };
  }

  if (!response.ok || payload?.error) {
    if (response.status === 401 && !skipExpiredHandler && path !== '/auth/sign-in/email') {
      _sessionExpiredHandler?.();
    }
    throw new Error(errorMessage(response.status, payload));
  }

  return payload as T;
}

export function signInWithEmail(payload: { email: string; password: string; rememberMe: boolean }) {
  return apiRequest<SessionPayload>('/auth/sign-in/email', {
    body: payload,
    method: 'POST',
  }, true);
}

export function signUpWithEmail(payload: { name: string; email: string; password: string; callbackURL?: string }) {
  return apiRequest<SessionPayload | { user?: User; token?: string } | null>('/auth/sign-up/email', {
    body: payload,
    method: 'POST',
  });
}

export function getSession() {
  return apiRequest<SessionPayload | null>('/auth/get-session', { method: 'GET' }, true);
}

export function signOut() {
  return apiRequest<null>('/auth/sign-out', { method: 'POST' });
}

export function requestEmailChangeCode(payload: { newEmail: string; password: string }) {
  return apiRequest<{ success: boolean; message: string }>('/users/change-email/request-code', {
    body: payload,
    method: 'POST',
  });
}

export function confirmEmailChangeCode(payload: { code: string }) {
  return apiRequest<{ success: boolean; message: string; user: User }>('/users/change-email/confirm', {
    body: payload,
    method: 'POST',
  });
}

export function getUserProfile() {
  return apiRequest<{ user: User }>('/users/me/profile', { method: 'GET' });
}

export function updateUserProfile(payload: { name?: string; image?: string | null }) {
  return apiRequest<{ user: User }>('/users/me/profile', {
    body: payload,
    method: 'PATCH',
  });
}

export function requestPasswordChangeCode(payload: { currentPassword: string }) {
  return apiRequest<{ success: boolean; message: string }>('/users/change-password/request-code', {
    body: payload,
    method: 'POST',
  });
}

export function confirmPasswordChangeCode(payload: {
  code: string;
  currentPassword: string;
  newPassword: string;
  revokeOtherSessions?: boolean;
}) {
  return apiRequest<{ success: boolean; message: string }>('/users/change-password/confirm', {
    body: payload,
    method: 'POST',
  });
}

export function resendVerificationEmail(email: string) {
  return apiRequest<null>('/auth/send-verification-email', {
    body: { email },
    method: 'POST',
  }, true);
}

export function verifyEmail(token: string) {
  return apiRequest<{ status: string } | null>(`/auth/verify-email?token=${encodeURIComponent(token)}`, { method: 'GET' }, true);
}

export function listOrganizations() {
  return apiRequest<Organization[]>('/auth/organization/list', { method: 'GET' });
}

export function createOrganization(payload: { name: string; slug: string }) {
  return apiRequest<Organization>('/auth/organization/create', {
    body: payload,
    method: 'POST',
  });
}

export function getInvitation(id: string) {
  return apiRequest<InvitationPreview>(`/auth/organization/get-invitation?id=${encodeURIComponent(id)}`, { method: 'GET' });
}

export function acceptInvitation(invitationId: string) {
  return apiRequest<Organization | null>('/auth/organization/accept-invitation', {
    body: { invitationId },
    method: 'POST',
  });
}

export type OrgMember = {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
  user: { name?: string | null; email: string; image?: string | null };
};

export type OrgInvitation = {
  id: string;
  email: string;
  role: string | null;
  status: string;
  expiresAt: string;
};

export type OrgFull = Organization & {
  members: OrgMember[];
  invitations: OrgInvitation[];
};

export type Competition = {
  id: string;
  name: string;
  slug: string;
  country?: string | null;
  sport?: string | null;
};

export type OrganizationBet = {
  id: string;
  organizationId: string | null;
  userId: string;
  matchId: string;
  predictedHomeScore: number;
  predictedAwayScore: number;
  points: number;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationFeedMatch = {
  id: string;
  roundId: string;
  scheduledAt: string;
  status: 'scheduled' | 'live' | 'finished' | 'postponed' | 'canceled';
  homeScore: number | null;
  awayScore: number | null;
  venueName: string | null;
  homeTeamName: string;
  homeTeamShortName: string | null;
  awayTeamName: string;
  awayTeamShortName: string | null;
  bettingStatus: 'open' | 'locked';
  bettingLocked: boolean;
  bet: OrganizationBet | null;
};

export type OrganizationRankingEntry = {
  position: number;
  userId: string;
  memberId: string;
  role: string;
  user: { name: string | null; email: string; image: string | null };
  totalPoints: number;
  betsCount: number;
  exactScores: number;
  correctOutcomes: number;
};

export type OrganizationFeed = {
  organization: Pick<Organization, 'id' | 'name' | 'slug' | 'logo'> & { competitionId: string | null };
  competition: Competition | null;
  season: { id: string; name: string; year: number } | null;
  round: { id: string; name: string; number: number; status: 'empty' | 'open' | 'locked' | 'live' | 'finished' } | null;
  matches: OrganizationFeedMatch[];
  ranking: OrganizationRankingEntry[];
};

export type GamificationEvent = {
  id: string;
  organizationId: string;
  userId: string;
  roundId: string | null;
  eventKey: string;
  type: 'perfect_round' | 'great_round' | 'bad_round' | 'deadline_warning' | string;
  title: string;
  message: string;
  severity: 'positive' | 'neutral' | 'negative' | string;
  animationKey: string;
  metadata?: Record<string, unknown> | null;
  seenAt: string | null;
  createdAt: string;
};

export function getOrgFull(organizationId: string) {
  return apiRequest<OrgFull>(`/auth/organization/get-full-organization?organizationId=${encodeURIComponent(organizationId)}`, {
    method: 'GET',
  });
}

export function inviteMember(organizationId: string, email: string, role = 'member') {
  return apiRequest<{ id: string }>('/auth/organization/invite-member', {
    body: { organizationId, email, role },
    method: 'POST',
  });
}

export function cancelInvitation(invitationId: string) {
  return apiRequest<null>('/auth/organization/cancel-invitation', {
    body: { invitationId },
    method: 'POST',
  });
}

export function getOrgCompetition(orgId: string) {
  return apiRequest<{ competition: Competition | null }>(`/organizations/${orgId}/competition`, { method: 'GET' });
}

export function getOrganizationFeed(orgId: string) {
  return apiRequest<OrganizationFeed>(`/organizations/${orgId}/feed`, { method: 'GET' });
}

export function getOrganizationRanking(orgId: string) {
  return apiRequest<{ organization: OrganizationFeed['organization']; ranking: OrganizationRankingEntry[] }>(
    `/organizations/${orgId}/ranking`,
    { method: 'GET' },
  );
}

export function listOrganizationGamificationEvents(orgId: string) {
  return apiRequest<{ events: GamificationEvent[] }>(`/organizations/${orgId}/gamification/events`, { method: 'GET' });
}

export function markOrganizationGamificationEventSeen(orgId: string, eventId: string) {
  return apiRequest<{ success: boolean }>(`/organizations/${orgId}/gamification/events/${eventId}/seen`, {
    method: 'POST',
  });
}

export function submitOrganizationBet(
  orgId: string,
  matchId: string,
  payload: { predictedHomeScore: number; predictedAwayScore: number },
) {
  return apiRequest<{ bet: OrganizationBet }>(`/organizations/${orgId}/matches/${matchId}/bets`, {
    body: payload,
    method: 'POST',
  });
}

export function setOrgCompetition(orgId: string, competitionId: string | null) {
  return apiRequest<{ success: boolean; competitionId: string | null }>(`/organizations/${orgId}/competition`, {
    body: { competitionId },
    method: 'PATCH',
  });
}

export function listCompetitions() {
  return apiRequest<Competition[]>('/competitions', { method: 'GET' });
}

export function getOrgPreview(slug: string) {
  return apiRequest<{ id: string; name: string; slug: string; memberCount: number }>(
    `/organizations/${encodeURIComponent(slug)}/preview`,
    { method: 'GET' },
  );
}

export function joinOrganizationBySlug(slug: string) {
  return apiRequest<{ success: boolean; message: string; organization: Organization }>(`/organizations/${encodeURIComponent(slug)}/join`, {
    method: 'POST',
  });
}

export function slugifyOrganizationName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}
