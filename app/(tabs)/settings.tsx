import { Feather } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, MatchdayTheme } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';

const menuItems = [
  { icon: 'user' as const, title: 'Perfil', text: 'Dados da conta conectada.' },
  { icon: 'bell' as const, title: 'Notificações', text: 'Avisos de rodada, convite e ranking.' },
  { icon: 'shield' as const, title: 'Privacidade', text: 'Controle de dados e sessões ativas.' },
];

export default function SettingsScreen() {
  const { user, signOut, refreshSession } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshSession();
    } finally {
      setRefreshing(false);
    }
  }, [refreshSession]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? '??';

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={MatchdayTheme.colors.blue800}
            colors={[MatchdayTheme.colors.blue800]}
          />
        }
      >

        <View style={s.headerRow}>
          <Text style={s.heading}>Conta</Text>
        </View>

        <View style={s.profileCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <View style={s.profileMeta}>
            {user?.name ? <Text style={s.profileName}>{user.name}</Text> : null}
            <Text style={s.profileEmail}>{user?.email ?? '—'}</Text>
          </View>
          <View style={s.seasonBadge}>
            <Text style={s.seasonBadgeText}>Beta</Text>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Preferências</Text>
          {menuItems.map((item, i) => (
            <Pressable key={item.title} style={[s.menuRow, i > 0 && s.menuRowBorder]}>
              <View style={s.menuIconWrap}>
                <Feather name={item.icon} size={17} color={MatchdayTheme.colors.blue800} />
              </View>
              <View style={s.menuCopy}>
                <Text style={s.menuTitle}>{item.title}</Text>
                <Text style={s.menuText}>{item.text}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={MatchdayTheme.colors.slate300} />
            </Pressable>
          ))}
        </View>

        <Pressable disabled={signingOut} style={[s.logoutButton, signingOut && s.logoutButtonDisabled]} onPress={handleSignOut}>
          {signingOut
            ? <ActivityIndicator size="small" color={MatchdayTheme.colors.danger} />
            : <Feather name="log-out" size={17} color={MatchdayTheme.colors.danger} />}
          <Text style={s.logoutText}>{signingOut ? 'Saindo...' : 'Sair da conta'}</Text>
        </Pressable>

        <Text style={s.versionText}>Matchday · Season Beta</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: MatchdayTheme.colors.night },
  content: { gap: 16, padding: 20, paddingBottom: 40 },
  headerRow: { marginBottom: 4 },
  heading: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.display, fontSize: 34, fontWeight: '900', lineHeight: 36, textTransform: 'uppercase' },
  profileCard: {
    alignItems: 'center',
    backgroundColor: MatchdayTheme.colors.surfaceElevated,
    borderColor: 'rgba(12,74,110,0.08)',
    borderRadius: MatchdayTheme.radii.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 18,
    ...MatchdayTheme.shadows.soft,
  },
  avatar: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.blue900, borderRadius: MatchdayTheme.radii.pill, height: 52, justifyContent: 'center', width: 52 },
  avatarText: { color: MatchdayTheme.colors.white, fontFamily: Fonts.display, fontSize: 20, fontWeight: '900' },
  profileMeta: { flex: 1 },
  profileName: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.sans, fontSize: 16, fontWeight: '800' },
  profileEmail: { color: MatchdayTheme.colors.slate500, fontFamily: Fonts.sans, fontSize: 13, marginTop: 3 },
  seasonBadge: { backgroundColor: MatchdayTheme.colors.lime300, borderRadius: MatchdayTheme.radii.pill, paddingHorizontal: 12, paddingVertical: 6 },
  seasonBadgeText: { color: MatchdayTheme.colors.slate900, fontFamily: Fonts.sans, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  card: {
    backgroundColor: MatchdayTheme.colors.surfaceElevated,
    borderColor: 'rgba(12,74,110,0.08)',
    borderRadius: MatchdayTheme.radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingVertical: 4,
    ...MatchdayTheme.shadows.soft,
  },
  cardTitle: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.display, fontSize: 20, fontWeight: '900', paddingVertical: 16, textTransform: 'uppercase' },
  menuRow: { alignItems: 'center', flexDirection: 'row', gap: 14, paddingVertical: 16 },
  menuRowBorder: { borderTopColor: 'rgba(12,74,110,0.07)', borderTopWidth: 1 },
  menuIconWrap: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.surface, borderRadius: 12, height: 36, justifyContent: 'center', width: 36 },
  menuCopy: { flex: 1 },
  menuTitle: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.sans, fontSize: 15, fontWeight: '700' },
  menuText: { color: MatchdayTheme.colors.slate500, fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18, marginTop: 2 },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: MatchdayTheme.colors.surfaceElevated,
    borderColor: '#fecdd3',
    borderRadius: MatchdayTheme.radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    minHeight: 54,
  },
  logoutButtonDisabled: { opacity: 0.6 },
  logoutText: { color: MatchdayTheme.colors.danger, fontFamily: Fonts.sans, fontSize: 15, fontWeight: '700' },
  versionText: { color: MatchdayTheme.colors.slate300, fontFamily: Fonts.sans, fontSize: 12, textAlign: 'center' },
});
