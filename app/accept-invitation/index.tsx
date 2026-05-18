import { Feather, Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackgroundOrbs } from '@/components/auth/background-orbs';
import { Fonts, MatchdayTheme } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { acceptInvitation, getInvitation, type InvitationPreview } from '@/lib/matchday-api';

export default function AcceptInvitationScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { refreshSession, user } = useAuth();
  const invitationId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [invitation, setInvitation] = useState<InvitationPreview | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'accepting' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!invitationId) {
      setState('error');
      setErrorMsg('Link de convite inválido ou expirado.');
      return;
    }
    setState('loading');
    getInvitation(invitationId)
      .then((data) => { setInvitation(data); setState('ready'); })
      .catch((e) => { setErrorMsg(e instanceof Error ? e.message : 'Convite inválido.'); setState('error'); });
  }, [invitationId]);

  const accept = async () => {
    if (!invitationId || !user) return;
    setState('accepting');
    setErrorMsg(null);
    try {
      await acceptInvitation(invitationId);
      await refreshSession();
      setState('success');
      setTimeout(() => router.replace('/(tabs)/organizations' as never), 1400);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Não foi possível aceitar o convite.');
      setState('error');
    }
  };

  const goToLogin = () => router.replace('/');

  return (
    <SafeAreaView style={s.safe}>
      <BackgroundOrbs />

      <View style={s.shell}>
        {/* top nav */}
        <Pressable style={s.backButton} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}>
          <Feather name="arrow-left" size={20} color={MatchdayTheme.colors.blue800} />
        </Pressable>

        <View style={s.content}>
          {state === 'loading' ? (
            <View style={s.centerBlock}>
              <ActivityIndicator size="large" color={MatchdayTheme.colors.blue800} />
              <Text style={s.loadingText}>Carregando convite...</Text>
            </View>
          ) : state === 'success' ? (
            <SuccessBlock orgName={invitation?.organizationName} />
          ) : state === 'error' && !invitation ? (
            <ErrorBlock message={errorMsg} onBack={() => router.replace('/(tabs)')} />
          ) : (
            <InvitationBlock
              invitation={invitation}
              user={user}
              accepting={state === 'accepting'}
              errorMsg={errorMsg}
              onAccept={accept}
              onLogin={goToLogin}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function InvitationBlock({ invitation, user, accepting, errorMsg, onAccept, onLogin }: {
  invitation: InvitationPreview | null;
  user: { email: string; name?: string | null } | null;
  accepting: boolean;
  errorMsg: string | null;
  onAccept: () => void;
  onLogin: () => void;
}) {
  return (
    <>
      {/* header */}
      <View style={s.eyebrowRow}>
        <View style={s.inviteIcon}>
          <Ionicons name="mail" size={22} color={MatchdayTheme.colors.white} />
        </View>
        <Text style={s.eyebrow}>Convite de organização</Text>
      </View>

      {/* org card */}
      <View style={s.orgCard}>
        <View style={s.orgIconBig}>
          <Ionicons name="people" size={28} color={MatchdayTheme.colors.white} />
        </View>
        <Text style={s.orgName}>{invitation?.organizationName ?? 'Organização'}</Text>
        {invitation?.organizationSlug ? (
          <Text style={s.orgSlug}>/{invitation.organizationSlug}</Text>
        ) : null}
        <View style={s.orgDivider} />
        <Text style={s.orgInviteText}>
          Você foi convidado para participar desta liga.
        </Text>
        {invitation?.email ? (
          <View style={s.inviteEmailRow}>
            <Feather name="mail" size={13} color={MatchdayTheme.colors.sky200} />
            <Text style={s.inviteEmail}>Convite para {invitation.email}</Text>
          </View>
        ) : null}
      </View>

      {/* user context */}
      {user ? (
        <View style={s.userRow}>
          <View style={s.userAvatar}>
            <Text style={s.userAvatarText}>
              {(user.name ?? user.email).slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={s.userMeta}>
            {user.name ? <Text style={s.userName}>{user.name}</Text> : null}
            <Text style={s.userEmail}>{user.email}</Text>
          </View>
          <View style={s.loggedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={MatchdayTheme.colors.lime300} />
            <Text style={s.loggedBadgeText}>Logado</Text>
          </View>
        </View>
      ) : (
        <View style={s.notLoggedCard}>
          <Ionicons name="alert-circle-outline" size={18} color={MatchdayTheme.colors.gold400} />
          <Text style={s.notLoggedText}>Faça login para aceitar este convite.</Text>
        </View>
      )}

      {errorMsg ? (
        <View style={s.errorBanner}>
          <Ionicons name="alert-circle-outline" size={15} color={MatchdayTheme.colors.danger} />
          <Text style={s.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

      {user ? (
        <Pressable
          disabled={accepting}
          style={[s.primaryButton, accepting && s.primaryButtonDisabled]}
          onPress={onAccept}
        >
          {accepting
            ? <ActivityIndicator size="small" color={MatchdayTheme.colors.white} />
            : <Ionicons name="checkmark-circle" size={18} color={MatchdayTheme.colors.white} />}
          <Text style={s.primaryButtonText}>{accepting ? 'Aceitando...' : 'Aceitar convite'}</Text>
        </Pressable>
      ) : (
        <Pressable style={s.primaryButton} onPress={onLogin}>
          <Feather name="log-in" size={18} color={MatchdayTheme.colors.white} />
          <Text style={s.primaryButtonText}>Fazer login para aceitar</Text>
        </Pressable>
      )}
    </>
  );
}

function SuccessBlock({ orgName }: { orgName?: string }) {
  return (
    <View style={s.centerBlock}>
      <View style={[s.inviteIcon, s.successIcon]}>
        <Ionicons name="checkmark-circle" size={32} color={MatchdayTheme.colors.white} />
      </View>
      <Text style={s.successTitle}>Você entrou!</Text>
      <Text style={s.successText}>
        Bem-vindo à {orgName ?? 'organização'}. Redirecionando...
      </Text>
    </View>
  );
}

function ErrorBlock({ message, onBack }: { message: string | null; onBack: () => void }) {
  return (
    <View style={s.centerBlock}>
      <View style={[s.inviteIcon, s.errorIcon]}>
        <Ionicons name="alert-circle" size={28} color={MatchdayTheme.colors.white} />
      </View>
      <Text style={s.errorTitle}>Convite inválido</Text>
      <Text style={s.successText}>{message ?? 'Este link expirou ou já foi utilizado.'}</Text>
      <Pressable style={s.primaryButton} onPress={onBack}>
        <Text style={s.primaryButtonText}>Voltar ao app</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: MatchdayTheme.colors.night },
  shell: { flex: 1 },
  backButton: {
    alignItems: 'center',
    backgroundColor: MatchdayTheme.colors.surfaceElevated,
    borderColor: 'rgba(12,74,110,0.10)',
    borderRadius: MatchdayTheme.radii.pill,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    margin: 20,
    width: 42,
  },
  content: { flex: 1, gap: 16, justifyContent: 'center', paddingHorizontal: 20, paddingBottom: 32 },
  centerBlock: { alignItems: 'center', gap: 14 },
  loadingText: { color: MatchdayTheme.colors.slate700, fontFamily: Fonts.sans, fontSize: 14 },
  eyebrowRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  inviteIcon: {
    alignItems: 'center',
    backgroundColor: MatchdayTheme.colors.blue800,
    borderRadius: MatchdayTheme.radii.pill,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  successIcon: { backgroundColor: MatchdayTheme.colors.lime300, height: 64, width: 64 },
  errorIcon: { backgroundColor: MatchdayTheme.colors.danger, height: 60, width: 60 },
  eyebrow: { color: MatchdayTheme.colors.blue700, fontFamily: Fonts.sans, fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  orgCard: {
    alignItems: 'center',
    backgroundColor: MatchdayTheme.colors.blue900,
    borderRadius: MatchdayTheme.radii.xl,
    gap: 10,
    padding: 28,
  },
  orgIconBig: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: MatchdayTheme.radii.pill,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  orgName: {
    color: MatchdayTheme.colors.white,
    fontFamily: Fonts.display,
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  orgSlug: { color: MatchdayTheme.colors.sky200, fontFamily: Fonts.sans, fontSize: 14 },
  orgDivider: { backgroundColor: 'rgba(255,255,255,0.12)', height: 1, width: '100%' },
  orgInviteText: { color: 'rgba(196,231,255,0.82)', fontFamily: Fonts.sans, fontSize: 14, lineHeight: 22, textAlign: 'center' },
  inviteEmailRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  inviteEmail: { color: MatchdayTheme.colors.sky200, fontFamily: Fonts.sans, fontSize: 13 },
  userRow: {
    alignItems: 'center',
    backgroundColor: MatchdayTheme.colors.surfaceElevated,
    borderColor: 'rgba(12,74,110,0.08)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  userAvatar: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.blue900, borderRadius: MatchdayTheme.radii.pill, height: 40, justifyContent: 'center', width: 40 },
  userAvatarText: { color: MatchdayTheme.colors.white, fontFamily: Fonts.display, fontSize: 16, fontWeight: '900' },
  userMeta: { flex: 1 },
  userName: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.sans, fontSize: 14, fontWeight: '700' },
  userEmail: { color: MatchdayTheme.colors.slate500, fontFamily: Fonts.sans, fontSize: 12 },
  loggedBadge: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  loggedBadgeText: { color: MatchdayTheme.colors.slate700, fontFamily: Fonts.sans, fontSize: 12, fontWeight: '700' },
  notLoggedCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,193,7,0.08)',
    borderColor: 'rgba(255,193,7,0.25)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 14,
  },
  notLoggedText: { color: MatchdayTheme.colors.slate700, flex: 1, fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 },
  errorBanner: {
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorText: { color: MatchdayTheme.colors.danger, flex: 1, fontFamily: Fonts.sans, fontSize: 13, fontWeight: '600' },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: MatchdayTheme.colors.blue800,
    borderRadius: MatchdayTheme.radii.pill,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    minHeight: 58,
    paddingHorizontal: 20,
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: MatchdayTheme.colors.white, fontFamily: Fonts.sans, fontSize: 15, fontWeight: '800' },
  successTitle: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.display, fontSize: 36, fontWeight: '900', textTransform: 'uppercase' },
  successText: { color: MatchdayTheme.colors.slate700, fontFamily: Fonts.sans, fontSize: 15, lineHeight: 23, textAlign: 'center' },
  errorTitle: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.display, fontSize: 30, fontWeight: '900', textTransform: 'uppercase' },
});
