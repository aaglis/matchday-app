import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, MatchdayTheme } from '@/constants/theme';

const ranking = [
  { place: '1', name: 'Voce', points: '126 pts', streak: '+8 XP' },
  { place: '2', name: 'Caio', points: '118 pts', streak: '+5 XP' },
  { place: '3', name: 'Bia', points: '111 pts', streak: '+3 XP' },
];

export default function ArenaScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.eyebrow}>Round 03</Text>
              <Text style={styles.title}>Sua arena esta viva.</Text>
            </View>
            <View style={styles.rankBadge}>
              <MaterialCommunityIcons name="trophy-award" size={18} color={MatchdayTheme.colors.slate900} />
              <Text style={styles.rankBadgeText}>Top 1</Text>
            </View>
          </View>

          <Text style={styles.heroText}>
            O foco do mobile agora e ranking, retorno por rodada e status visuais de progressao.
          </Text>

          <View style={styles.heroStatsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Seu XP</Text>
              <Text style={styles.statValue}>1.240</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Streak</Text>
              <Text style={styles.statValue}>6 jogos</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Deadline</Text>
              <Text style={styles.statValue}>18:30</Text>
            </View>
          </View>
        </View>

        <View style={styles.highlightCard}>
          <Image source={require('@/assets/players/player-2.png')} style={styles.playerImage} contentFit="cover" />
          <View style={styles.highlightCopy}>
            <Text style={styles.highlightEyebrow}>Missao da rodada</Text>
            <Text style={styles.highlightTitle}>Acertar o placar exato vale bonus.</Text>
            <Text style={styles.highlightText}>Suba no ranking com uma jogada precisa e abra distancia na liga.</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leaderboard da organizacao</Text>
          {ranking.map((item, index) => (
            <View key={item.name} style={styles.rankingRow}>
              <View style={styles.placeBubble}>
                <Text style={styles.placeText}>{item.place}</Text>
              </View>
              <View style={styles.rankingMeta}>
                <Text style={styles.rankingName}>{item.name}</Text>
                <Text style={styles.rankingPoints}>{item.points}</Text>
              </View>
              <View style={[styles.streakChip, index === 0 && styles.streakChipActive]}>
                <Text style={[styles.streakChipText, index === 0 && styles.streakChipTextActive]}>{item.streak}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pulso da competicao</Text>
          <View style={styles.metricsGrid}>
            {[
              { icon: 'flash-outline', label: 'XP extra', value: '3 desafios ativos' },
              { icon: 'time-outline', label: 'Prazo', value: '2h ate fechar' },
              { icon: 'people-outline', label: 'Rivais', value: '14 membros na liga' },
            ].map((item) => (
              <View key={item.label} style={styles.metricTile}>
                <Ionicons name={item.icon as never} size={18} color={MatchdayTheme.colors.mint400} />
                <Text style={styles.metricTileLabel}>{item.label}</Text>
                <Text style={styles.metricTileValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: MatchdayTheme.colors.night,
  },
  screen: {
    flex: 1,
    backgroundColor: MatchdayTheme.colors.night,
  },
  content: {
    gap: 18,
    padding: 20,
    paddingBottom: 28,
  },
  heroCard: {
    backgroundColor: MatchdayTheme.colors.blue900,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: MatchdayTheme.radii.xxl,
    borderWidth: 1,
    padding: 20,
  },
  heroTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: MatchdayTheme.colors.sky200,
    fontFamily: Fonts.sans,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  title: {
    color: MatchdayTheme.colors.white,
    fontFamily: Fonts.display,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1.3,
    lineHeight: 34,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  rankBadge: {
    alignItems: 'center',
    backgroundColor: MatchdayTheme.colors.lime300,
    borderRadius: MatchdayTheme.radii.pill,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  rankBadgeText: {
    color: MatchdayTheme.colors.slate900,
    fontFamily: Fonts.sans,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  heroText: {
    color: 'rgba(196,231,255,0.82)',
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 24,
    marginTop: 14,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    padding: 14,
  },
  statLabel: {
    color: MatchdayTheme.colors.sky200,
    fontFamily: Fonts.sans,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  statValue: {
    color: MatchdayTheme.colors.white,
    fontFamily: Fonts.sans,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  highlightCard: {
    alignItems: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: MatchdayTheme.radii.xxl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  playerImage: {
    height: 220,
    width: '100%',
  },
  highlightCopy: {
    padding: 18,
  },
  highlightEyebrow: {
    color: MatchdayTheme.colors.gold400,
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  highlightTitle: {
    color: MatchdayTheme.colors.white,
    fontFamily: Fonts.display,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 28,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  highlightText: {
    color: 'rgba(196,231,255,0.78)',
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: MatchdayTheme.colors.white,
    fontFamily: Fonts.display,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
    textTransform: 'uppercase',
  },
  rankingRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  placeBubble: {
    alignItems: 'center',
    backgroundColor: MatchdayTheme.colors.surfaceElevated,
    borderRadius: MatchdayTheme.radii.pill,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  placeText: {
    color: MatchdayTheme.colors.white,
    fontFamily: Fonts.display,
    fontSize: 20,
    fontWeight: '900',
  },
  rankingMeta: {
    flex: 1,
  },
  rankingName: {
    color: MatchdayTheme.colors.white,
    fontFamily: Fonts.sans,
    fontSize: 16,
    fontWeight: '700',
  },
  rankingPoints: {
    color: MatchdayTheme.colors.sky200,
    fontFamily: Fonts.sans,
    fontSize: 13,
    marginTop: 4,
  },
  streakChip: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: MatchdayTheme.radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  streakChipActive: {
    backgroundColor: MatchdayTheme.colors.lime300,
  },
  streakChipText: {
    color: MatchdayTheme.colors.sky200,
    fontFamily: Fonts.sans,
    fontSize: 12,
    fontWeight: '700',
  },
  streakChipTextActive: {
    color: MatchdayTheme.colors.slate900,
  },
  metricsGrid: {
    gap: 12,
  },
  metricTile: {
    backgroundColor: MatchdayTheme.colors.surfaceElevated,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  metricTileLabel: {
    color: MatchdayTheme.colors.sky200,
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  metricTileValue: {
    color: MatchdayTheme.colors.white,
    fontFamily: Fonts.sans,
    fontSize: 16,
    fontWeight: '700',
  },
});
