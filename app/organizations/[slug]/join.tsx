import { Feather, Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackgroundOrbs } from '@/components/auth/background-orbs';
import { Fonts, MatchdayTheme } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { joinOrganizationBySlug } from '@/lib/matchday-api';

export default function JoinOrganizationScreen() {
  const params = useLocalSearchParams<{ slug?: string }>();
  const { refreshSession, user } = useAuth();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  const [state, setState] = useState<'idle' | 'joining' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const join = async () => {
    if (!slug || !user) return;
    setState('joining');
    setErrorMsg(null);
    try {
      await joinOrganizationBySlug(slug);
      await refreshSession();
      setState('success');
      setTimeout(() => router.replace('/(tabs)/organizations' as never), 1400);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Não foi possível entrar na organização.');
      setState('error');
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <BackgroundOrbs />

      <View style={s.shell}>
        <Pressable style={s.backButton} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}>
          <Feather name="arrow-left" size={20} color={MatchdayTheme.colors.blue800} />
        </Pressable>

        <View style={s.content}>
          {state === 'success' ? (
            <View style={s.centerBlock}>
              <View style={[s.iconWrap, s.successIcon]}>
                <Ionicons name="checkmark-circle" size={32} color={MatchdayTheme.colors.white} />
              </View>
              <Text style={s.successTitle}>Você entrou!</Text>
              <Text style={s.bodyText}>Bem-vindo à liga. Redirecionando...</Text>
            </View>
          ) : (
            <>
              <View style={s.eyebrowRow}>
                <View style={s.iconWrap}>
                  <Feather name="link" size={20} color={MatchdayTheme.colors.white} />
                </View>
                <Text style={s.eyebrow}>Link de convite</Text>
              </View>

              <View style={s.orgCard}>
                <View style={s.orgIconBig}>
                  <Ionicons name="people" size={28} color={MatchdayTheme.colors.white} />
                </View>
                <Text style={s.orgName}>{slug ?? 'organização'}</Text>
                <Text style={s.orgSlug}>/{slug}</Text>
                <View style={s.orgDivider} />
                <Text style={s.orgInviteText}>
                  Você foi convidado via link para participar desta liga.
                </Text>
              </View>

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
                  <Text style={s.notLoggedText}>Faça login para entrar nesta liga.</Text>
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
                  disabled={state === 'joining' || !slug}
                  style={[s.primaryButton, (state === 'joining' || !slug) && s.primaryButtonDisabled]}
                  onPress={join}
                >
                  {state === 'joining'
                    ? <ActivityIndicator size="small" color={MatchdayTheme.colors.white} />
                    : <Ionicons name="enter-outline" size={18} color={MatchdayTheme.colors.white} />}
                  <Text style={s.primaryButtonText}>
                    {state === 'joining' ? 'Entrando...' : 'Entrar na liga'}
                  </Text>
                </Pressable>
              ) : (
                <Pressable style={s.primaryButton} onPress={() => router.replace('/')}>
                  <Feather name="log-in" size={18} color={MatchdayTheme.colors.white} />
                  <Text style={s.primaryButtonText}>Fazer login para entrar</Text>
                </Pressable>
              )}
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
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
  eyebrowRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: MatchdayTheme.colors.blue800,
    borderRadius: MatchdayTheme.radii.pill,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  successIcon: { backgroundColor: MatchdayTheme.colors.lime300, height: 64, width: 64 },
  eyebrow: { color: MatchdayTheme.colors.blue700, fontFamily: Fonts.sans, fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  orgCard: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.blue900, borderRadius: MatchdayTheme.radii.xl, gap: 10, padding: 28 },
  orgIconBig: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: MatchdayTheme.radii.pill, height: 64, justifyContent: 'center', width: 64 },
  orgName: { color: MatchdayTheme.colors.white, fontFamily: Fonts.display, fontSize: 32, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase' },
  orgSlug: { color: MatchdayTheme.colors.sky200, fontFamily: Fonts.sans, fontSize: 14 },
  orgDivider: { backgroundColor: 'rgba(255,255,255,0.12)', height: 1, width: '100%' },
  orgInviteText: { color: 'rgba(196,231,255,0.82)', fontFamily: Fonts.sans, fontSize: 14, lineHeight: 22, textAlign: 'center' },
  userRow: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.surfaceElevated, borderColor: 'rgba(12,74,110,0.08)', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 14 },
  userAvatar: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.blue900, borderRadius: MatchdayTheme.radii.pill, height: 40, justifyContent: 'center', width: 40 },
  userAvatarText: { color: MatchdayTheme.colors.white, fontFamily: Fonts.display, fontSize: 16, fontWeight: '900' },
  userMeta: { flex: 1 },
  userName: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.sans, fontSize: 14, fontWeight: '700' },
  userEmail: { color: MatchdayTheme.colors.slate500, fontFamily: Fonts.sans, fontSize: 12 },
  loggedBadge: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  loggedBadgeText: { color: MatchdayTheme.colors.slate700, fontFamily: Fonts.sans, fontSize: 12, fontWeight: '700' },
  notLoggedCard: { alignItems: 'center', backgroundColor: 'rgba(255,193,7,0.08)', borderColor: 'rgba(255,193,7,0.25)', borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 10, padding: 14 },
  notLoggedText: { color: MatchdayTheme.colors.slate700, flex: 1, fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 },
  errorBanner: { alignItems: 'center', backgroundColor: '#fff1f2', borderColor: '#fecdd3', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingVertical: 12 },
  errorText: { color: MatchdayTheme.colors.danger, flex: 1, fontFamily: Fonts.sans, fontSize: 13, fontWeight: '600' },
  primaryButton: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.blue800, borderRadius: MatchdayTheme.radii.pill, flexDirection: 'row', gap: 10, justifyContent: 'center', minHeight: 58, paddingHorizontal: 20 },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: MatchdayTheme.colors.white, fontFamily: Fonts.sans, fontSize: 15, fontWeight: '800' },
  successTitle: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.display, fontSize: 36, fontWeight: '900', textTransform: 'uppercase' },
  bodyText: { color: MatchdayTheme.colors.slate700, fontFamily: Fonts.sans, fontSize: 15, lineHeight: 23, textAlign: 'center' },
});
