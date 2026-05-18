import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, MatchdayTheme } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';

const ranking = [
  { place: 1, name: 'Voce', points: '126 pts', xp: '+8 XP', isMe: true },
  { place: 2, name: 'Caio', points: '118 pts', xp: '+5 XP', isMe: false },
  { place: 3, name: 'Bia', points: '111 pts', xp: '+3 XP', isMe: false },
];

const pulso = [
  { icon: 'flash-outline', label: 'XP extra', value: '3 ativos' },
  { icon: 'time-outline', label: 'Deadline', value: '2h rest.' },
  { icon: 'people-outline', label: 'Rivais', value: '14 na liga' },
];

export default function ArenaScreen() {
  const { user, refreshSession } = useAuth();
  const firstName = user?.name?.split(' ')[0] ?? 'Jogador';
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshSession();
    } finally {
      setRefreshing(false);
    }
  }, [refreshSession]);

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
          <View>
            <Text style={s.greeting}>Bom jogo, {firstName}</Text>
            <Text style={s.headingLabel}>Arena</Text>
          </View>
          <View style={s.topBadge}>
            <MaterialCommunityIcons name="trophy-award" size={15} color={MatchdayTheme.colors.slate900} />
            <Text style={s.topBadgeText}>Top 1</Text>
          </View>
        </View>

        <View style={s.heroCard}>
          <View style={s.heroTopRow}>
            <View style={s.roundPill}>
              <Text style={s.roundPillText}>Round 03</Text>
            </View>
            <Text style={s.heroDeadline}>Fecha em 2h</Text>
          </View>
          <Text style={s.heroTitle}>Sua arena{'\n'}está viva.</Text>
          <Text style={s.heroSubtitle}>Rankings, streaks e palpites em tempo real.</Text>
          <View style={s.heroStats}>
            {[
              { label: 'Seu XP', value: '1.240' },
              { label: 'Streak', value: '6 jogos' },
              { label: 'Pos.', value: '#1' },
            ].map((item) => (
              <View key={item.label} style={s.heroStatItem}>
                <Text style={s.heroStatLabel}>{item.label}</Text>
                <Text style={s.heroStatValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.missionCard}>
          <Image source={require('@/assets/players/player-2.png')} style={StyleSheet.absoluteFill} contentFit="cover" />
          <View style={s.missionOverlay} pointerEvents="none">
            {([0, 0.3, 0.7, 0.92] as const).map((a, i) => (
              <View key={i} style={{ flex: 1, backgroundColor: `rgba(8,47,73,${a})` }} />
            ))}
          </View>
          <View style={s.missionContent}>
            <View style={s.missionEyebrowRow}>
              <Ionicons name="star" size={13} color={MatchdayTheme.colors.gold400} />
              <Text style={s.missionEyebrow}>Missão da rodada</Text>
            </View>
            <Text style={s.missionTitle}>Acertar o placar exato vale bônus duplo.</Text>
            <Text style={s.missionText}>Abra distância no ranking com uma jogada cirúrgica.</Text>
          </View>
        </View>

        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>Leaderboard</Text>
            <Feather name="bar-chart-2" size={18} color={MatchdayTheme.colors.blue700} />
          </View>
          <View style={s.rankList}>
            {ranking.map((item) => (
              <View key={item.name} style={[s.rankRow, item.isMe && s.rankRowMe]}>
                <View style={[s.placeBubble, item.place === 1 && s.placeBubbleGold]}>
                  <Text style={[s.placeText, item.place === 1 && s.placeTextGold]}>{item.place}</Text>
                </View>
                <View style={s.rankMeta}>
                  <Text style={[s.rankName, item.isMe && s.rankNameMe]}>{item.name}</Text>
                  <Text style={s.rankPoints}>{item.points}</Text>
                </View>
                <View style={[s.xpChip, item.isMe && s.xpChipMe]}>
                  <Text style={[s.xpChipText, item.isMe && s.xpChipTextMe]}>{item.xp}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>Pulso</Text>
            <Ionicons name="pulse" size={18} color={MatchdayTheme.colors.blue700} />
          </View>
          <View style={s.pulsoGrid}>
            {pulso.map((item) => (
              <View key={item.label} style={s.pulsoTile}>
                <Ionicons name={item.icon as never} size={20} color={MatchdayTheme.colors.blue800} />
                <Text style={s.pulsoLabel}>{item.label}</Text>
                <Text style={s.pulsoValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: MatchdayTheme.colors.night },
  content: { gap: 16, padding: 20, paddingBottom: 32 },
  headerRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  greeting: { color: MatchdayTheme.colors.slate500, fontFamily: Fonts.sans, fontSize: 13, fontWeight: '600' },
  headingLabel: {
    color: MatchdayTheme.colors.blue900,
    fontFamily: Fonts.display,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 36,
    textTransform: 'uppercase',
  },
  topBadge: {
    alignItems: 'center',
    backgroundColor: MatchdayTheme.colors.lime300,
    borderRadius: MatchdayTheme.radii.pill,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  topBadgeText: { color: MatchdayTheme.colors.slate900, fontFamily: Fonts.sans, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  heroCard: { backgroundColor: MatchdayTheme.colors.blue900, borderRadius: MatchdayTheme.radii.xl, gap: 14, padding: 22 },
  heroTopRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  roundPill: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: MatchdayTheme.radii.pill, paddingHorizontal: 12, paddingVertical: 6 },
  roundPillText: { color: MatchdayTheme.colors.sky200, fontFamily: Fonts.sans, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  heroDeadline: { color: MatchdayTheme.colors.gold400, fontFamily: Fonts.sans, fontSize: 13, fontWeight: '700' },
  heroTitle: { color: MatchdayTheme.colors.white, fontFamily: Fonts.display, fontSize: 40, fontWeight: '900', lineHeight: 40, textTransform: 'uppercase' },
  heroSubtitle: { color: 'rgba(196,231,255,0.78)', fontFamily: Fonts.sans, fontSize: 14, lineHeight: 22 },
  heroStats: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 4,
  },
  heroStatItem: { alignItems: 'center', flex: 1, paddingVertical: 14 },
  heroStatLabel: { color: MatchdayTheme.colors.sky200, fontFamily: Fonts.sans, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  heroStatValue: { color: MatchdayTheme.colors.white, fontFamily: Fonts.sans, fontSize: 18, fontWeight: '800', marginTop: 6 },
  missionCard: { borderRadius: MatchdayTheme.radii.xl, height: 210, overflow: 'hidden' },
  missionOverlay: { ...StyleSheet.absoluteFillObject, flexDirection: 'column' },
  missionContent: { bottom: 0, gap: 6, left: 0, paddingBottom: 20, paddingHorizontal: 18, paddingTop: 16, position: 'absolute', right: 0 },
  missionEyebrowRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  missionEyebrow: { color: MatchdayTheme.colors.gold400, fontFamily: Fonts.sans, fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  missionTitle: { color: MatchdayTheme.colors.white, fontFamily: Fonts.display, fontSize: 22, fontWeight: '900', lineHeight: 24, textTransform: 'uppercase' },
  missionText: { color: 'rgba(196,231,255,0.82)', fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },
  card: {
    backgroundColor: MatchdayTheme.colors.surfaceElevated,
    borderColor: 'rgba(12,74,110,0.08)',
    borderRadius: MatchdayTheme.radii.xl,
    borderWidth: 1,
    gap: 14,
    padding: 18,
    ...MatchdayTheme.shadows.soft,
  },
  cardHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  cardTitle: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.display, fontSize: 22, fontWeight: '900', textTransform: 'uppercase' },
  rankList: { gap: 10 },
  rankRow: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.surface, borderColor: 'rgba(12,74,110,0.08)', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 12 },
  rankRowMe: { backgroundColor: 'rgba(12,74,110,0.05)', borderColor: MatchdayTheme.colors.blue700 },
  placeBubble: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.night, borderColor: 'rgba(12,74,110,0.12)', borderRadius: MatchdayTheme.radii.pill, borderWidth: 1, height: 40, justifyContent: 'center', width: 40 },
  placeBubbleGold: { backgroundColor: MatchdayTheme.colors.gold400, borderColor: MatchdayTheme.colors.gold400 },
  placeText: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.display, fontSize: 18, fontWeight: '900' },
  placeTextGold: { color: MatchdayTheme.colors.slate900 },
  rankMeta: { flex: 1 },
  rankName: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.sans, fontSize: 15, fontWeight: '700' },
  rankNameMe: { color: MatchdayTheme.colors.blue800 },
  rankPoints: { color: MatchdayTheme.colors.slate500, fontFamily: Fonts.sans, fontSize: 12, marginTop: 3 },
  xpChip: { backgroundColor: MatchdayTheme.colors.surface, borderColor: 'rgba(12,74,110,0.10)', borderRadius: MatchdayTheme.radii.pill, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  xpChipMe: { backgroundColor: MatchdayTheme.colors.lime300, borderColor: MatchdayTheme.colors.lime300 },
  xpChipText: { color: MatchdayTheme.colors.slate700, fontFamily: Fonts.sans, fontSize: 12, fontWeight: '700' },
  xpChipTextMe: { color: MatchdayTheme.colors.slate900 },
  pulsoGrid: { flexDirection: 'row', gap: 10 },
  pulsoTile: { backgroundColor: MatchdayTheme.colors.surface, borderColor: 'rgba(12,74,110,0.08)', borderRadius: 18, borderWidth: 1, flex: 1, gap: 6, paddingHorizontal: 12, paddingVertical: 14 },
  pulsoLabel: { color: MatchdayTheme.colors.blue700, fontFamily: Fonts.sans, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  pulsoValue: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.sans, fontSize: 13, fontWeight: '700', lineHeight: 18 },
});
