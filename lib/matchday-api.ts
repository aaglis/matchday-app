import { Platform } from 'react-native';

export const AUTH_BASE_URL = (process.env.EXPO_PUBLIC_AUTH_BASE_URL ?? 'https://matchday-back.onrender.com').replace(/\/$/, '');

let _sessionExpiredHandler: (() => void) | null = null;
export function registerSessionExpiredHandler(handler: () => void) {
  _sessionExpiredHandler = handler;
}
const AUTH_ORIGIN = process.env.EXPO_PUBLIC_AUTH_ORIGIN ?? AUTH_BASE_URL;

export type User = {
  id: string;
  email: string;
  name?: string | null;
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
  const code = payload?.error?.code;
  const message = payload?.message ?? payload?.error?.message;

  if (code === 'MISSING_OR_NULL_ORIGIN') return 'Origem do app nao autorizada pela API.';
  if (code === 'INVALID_EMAIL_OR_PASSWORD') return 'E-mail ou senha invalidos.';
  if (code === 'EMAIL_NOT_VERIFIED' || message === 'Email not verified') return 'EMAIL_NOT_VERIFIED';
  if (status === 401) return 'Sessao expirada. Faca login novamente.';
  if (status === 403) return message ?? 'Voce nao tem permissao para essa acao.';
  if (status === 404) return message ?? 'Registro nao encontrado.';
  if (status === 409) return message ?? 'Esse registro ja existe.';
  return message ?? 'Erro na API. Tente novamente mais tarde.';
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}, skipExpiredHandler = false): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);

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
    throw new Error(isAbort ? 'A requisicao demorou muito. Verifique sua conexao.' : 'Nao foi possivel conectar com a API.');
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok || payload?.error) {
    if (response.status === 401 && !skipExpiredHandler) {
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
  });
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

export function changeEmail(currentEmail: string, password: string, newEmail: string) {
  return apiRequest<{ success: boolean; message: string }>('/users/change-email', {
    body: { currentEmail, password, newEmail },
    method: 'POST',
  }, true);
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
