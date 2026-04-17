import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, MatchdayTheme } from '@/constants/theme';

const achievements = [
  { icon: 'shield-check', title: 'Liga blindada', text: 'Convites e participantes centralizados na sua organizacao.' },
  { icon: 'target', title: 'Palpite cirurgico', text: 'Bonus por acerto exato e streak ativa por rodada.' },
  { icon: 'trending-up', title: 'Escalada de ranking', text: 'Mudancas de posicao ficam sempre visiveis e tensas.' },
];

export default function LeagueScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.panel}>
          <Text style={styles.eyebrow}>Sua liga</Text>
          <Text style={styles.title}>Gameficacao com identidade do produto.</Text>
          <Text style={styles.subtitle}>
            Aqui o mobile passa a carregar os mesmos pilares da web: competicao privada, clareza de ranking e atmosfera de campeonato.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Conquistas principais</Text>
            <MaterialCommunityIcons name="medal-outline" size={20} color={MatchdayTheme.colors.gold400} />
          </View>
          <View style={styles.stack}>
            {achievements.map((item) => (
              <View key={item.title} style={styles.achievementRow}>
                <View style={styles.iconBubble}>
                  <Feather name={item.icon as never} size={18} color={MatchdayTheme.colors.mint400} />
                </View>
                <View style={styles.achievementCopy}>
                  <Text style={styles.achievementTitle}>{item.title}</Text>
                  <Text style={styles.achievementText}>{item.text}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Estrutura portada da web</Text>
          <View style={styles.stack}>
            {[
              'Azul profundo como base estrutural',
              'Areas claras para autenticacao e formularios',
              'Acentos em lime, sky e gold para estados competitivos',
              'Bordas arredondadas grandes e cards com contraste forte',
            ].map((item) => (
              <View key={item} style={styles.bulletRow}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>{item}</Text>
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
    gap: 16,
    padding: 20,
    paddingBottom: 28,
  },
  panel: {
    backgroundColor: MatchdayTheme.colors.surfaceElevated,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: MatchdayTheme.radii.xxl,
    borderWidth: 1,
    padding: 20,
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
    letterSpacing: -1.2,
    lineHeight: 34,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  subtitle: {
    color: 'rgba(196,231,255,0.78)',
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 24,
    marginTop: 12,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: MatchdayTheme.radii.xxl,
    borderWidth: 1,
    padding: 18,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: MatchdayTheme.colors.white,
    fontFamily: Fonts.display,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.8,
    textTransform: 'uppercase',
  },
  stack: {
    gap: 12,
    marginTop: 14,
  },
  achievementRow: {
    alignItems: 'flex-start',
    backgroundColor: MatchdayTheme.colors.surfaceElevated,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  iconBubble: {
    alignItems: 'center',
    backgroundColor: MatchdayTheme.colors.surface,
    borderRadius: MatchdayTheme.radii.pill,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  achievementCopy: {
    flex: 1,
  },
  achievementTitle: {
    color: MatchdayTheme.colors.white,
    fontFamily: Fonts.sans,
    fontSize: 15,
    fontWeight: '700',
  },
  achievementText: {
    color: MatchdayTheme.colors.sky200,
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 5,
  },
  bulletRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  bullet: {
    backgroundColor: MatchdayTheme.colors.lime300,
    borderRadius: MatchdayTheme.radii.pill,
    height: 8,
    width: 8,
  },
  bulletText: {
    color: MatchdayTheme.colors.white,
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 22,
  },
});
