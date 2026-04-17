import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, MatchdayTheme } from '@/constants/theme';

type Slide = {
  id: string;
  title: string;
  subtitle: string;
  kicker: string;
  badge: string;
  image: number;
  stats: { label: string; value: string }[];
};

const slides: Slide[] = [
  {
    id: 'organization',
    kicker: 'Etapa 1',
    title: 'Crie sua organizacao e arme o campo da disputa.',
    subtitle:
      'Monte uma liga privada, convide a turma e defina a competicao. O app vira a sede oficial da brincadeira.',
    badge: 'XP Start +120',
    image: require('@/assets/players/player-1.jpeg'),
    stats: [
      { label: 'Organizacao', value: 'Privada' },
      { label: 'Convites', value: 'Centralizados' },
      { label: 'Modo', value: 'Captain' },
    ],
  },
  {
    id: 'predictions',
    kicker: 'Etapa 2',
    title: 'Faca seu palpite antes da rodada fechar.',
    subtitle:
      'Cada jogo vale posicionamento, streak e pressao no ranking. A experiencia precisa convidar voce a voltar antes de cada partida.',
    badge: 'Combo de palpites',
    image: require('@/assets/players/player-3.png'),
    stats: [
      { label: 'Deadline', value: '18:30' },
      { label: 'Bonus', value: '+3 streak' },
      { label: 'Status', value: 'Round Live' },
    ],
  },
  {
    id: 'leaderboard',
    kicker: 'Etapa 3',
    title: 'Ganhe dos seus amigos e suba no leaderboard.',
    subtitle:
      'A pontuacao e o ranking precisam ser claros, tensos e recompensadores. E esse e o centro da identidade do app.',
    badge: 'Top 1 desbloqueado',
    image: require('@/assets/players/player-5.png'),
    stats: [
      { label: 'Ranking', value: 'Tempo real' },
      { label: 'Clima', value: 'Provocacao boa' },
      { label: 'Retencao', value: 'Toda rodada' },
    ],
  },
];

const accentMetrics = [
  { icon: 'flash-outline', label: 'XP por rodada' },
  { icon: 'trophy-outline', label: 'Leaderboard vivo' },
  { icon: 'people-outline', label: 'Duelo entre amigos' },
];

export default function MatchdayEntryScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1100;
  const listRef = useRef<FlatList<Slide>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<'onboarding' | 'login'>('onboarding');
  const [stayConnected, setStayConnected] = useState(true);

  useEffect(() => {
    if (mode !== 'onboarding') return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev === slides.length - 1 ? 0 : prev + 1;
        listRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4200);

    return () => clearInterval(timer);
  }, [mode]);

  const goToLogin = () => setMode('login');
  const nextSlide = () => {
    if (currentIndex === slides.length - 1) {
      goToLogin();
      return;
    }

    const next = currentIndex + 1;
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setCurrentIndex(next);
  };

  const cardWidth = Math.min(width - 40, 420);

  return (
    <SafeAreaView style={styles.safeArea}>
      {mode === 'onboarding' ? (
        <View style={styles.onboardingShell}>
          <BackgroundOrbs />
          <ScrollView
            contentContainerStyle={[
              styles.onboardingContent,
              { paddingHorizontal: isDesktop ? 32 : MatchdayTheme.spacing.screen },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <Header />

            <View style={[styles.heroBlock, isDesktop && styles.heroBlockDesktop]}>
              <View style={[styles.copyColumn, isDesktop && { maxWidth: 520 }]}>
                <View style={styles.eyebrowPill}>
                  <Text style={styles.eyebrowText}>Private competition mode</Text>
                </View>

                <Text style={[styles.heroTitle, isDesktop && styles.heroTitleDesktop]}>
                  O bolao da sua galera com cara de campeonato oficial.
                </Text>
                <Text style={styles.heroSubtitle}>
                  Matchday para mobile precisa parecer vivo, competitivo e viciante na medida certa:
                  rounds, pontos, ranking, status e recompensa visual em cada toque.
                </Text>

                <View style={styles.metricRow}>
                  {accentMetrics.map((item) => (
                    <View key={item.label} style={styles.metricChip}>
                      <Ionicons name={item.icon as never} size={16} color={MatchdayTheme.colors.lime300} />
                      <Text style={styles.metricChipText}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.carouselColumn}>
                <Animated.FlatList
                  ref={listRef}
                  data={slides}
                  keyExtractor={(item) => item.id}
                  horizontal
                  pagingEnabled
                  snapToAlignment="center"
                  decelerationRate="fast"
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.x / cardWidth);
                    setCurrentIndex(index);
                  }}
                  onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                    useNativeDriver: false,
                  })}
                  scrollEventThrottle={16}
                  contentContainerStyle={{ gap: 0 }}
                  renderItem={({ item, index }) => {
                    const inputRange = [(index - 1) * cardWidth, index * cardWidth, (index + 1) * cardWidth];
                    const scale = scrollX.interpolate({
                      inputRange,
                      outputRange: [0.92, 1, 0.92],
                      extrapolate: 'clamp',
                    });
                    const translateY = scrollX.interpolate({
                      inputRange,
                      outputRange: [24, 0, 24],
                      extrapolate: 'clamp',
                    });

                    return (
                      <Animated.View style={[styles.slideCardShell, { width: cardWidth, transform: [{ scale }, { translateY }] }]}>
                        <View style={styles.slideCard}>
                          <View style={styles.slideImageWrap}>
                            <Image source={item.image} style={styles.slideImage} contentFit="cover" />
                            <View style={styles.imageBadge}>
                              <MaterialCommunityIcons name="sword-cross" size={15} color={MatchdayTheme.colors.slate900} />
                              <Text style={styles.imageBadgeText}>{item.badge}</Text>
                            </View>
                            <View style={styles.imageFloatingCard}>
                              <Text style={styles.imageFloatingKicker}>{item.kicker}</Text>
                              <Text style={styles.imageFloatingTitle}>Modo carreira social</Text>
                            </View>
                          </View>

                          <View style={styles.slideBody}>
                            <Text style={styles.slideKicker}>{item.kicker}</Text>
                            <Text style={styles.slideTitle}>{item.title}</Text>
                            <Text style={styles.slideSubtitle}>{item.subtitle}</Text>

                            <View style={styles.statsGrid}>
                              {item.stats.map((stat) => (
                                <View key={stat.label} style={styles.statCard}>
                                  <Text style={styles.statLabel}>{stat.label}</Text>
                                  <Text style={styles.statValue}>{stat.value}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        </View>
                      </Animated.View>
                    );
                  }}
                />

                <View style={styles.carouselFooter}>
                  <View style={styles.paginationRow}>
                    {slides.map((slide, index) => (
                      <Pressable key={slide.id} onPress={() => {
                        listRef.current?.scrollToIndex({ index, animated: true });
                        setCurrentIndex(index);
                      }}>
                        <View style={[styles.paginationDot, currentIndex === index && styles.paginationDotActive]} />
                      </Pressable>
                    ))}
                  </View>

                  <View style={styles.carouselActions}>
                    <Pressable style={styles.secondaryButton} onPress={goToLogin}>
                      <Text style={styles.secondaryButtonText}>Pular intro</Text>
                    </Pressable>
                    <Pressable style={styles.primaryButton} onPress={nextSlide}>
                      <Text style={styles.primaryButtonText}>
                        {currentIndex === slides.length - 1 ? 'Ir para login' : 'Proximo round'}
                      </Text>
                      <Feather name="arrow-right" size={18} color={MatchdayTheme.colors.slate900} />
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      ) : (
        <LoginScreen
          isDesktop={isDesktop}
          stayConnected={stayConnected}
          setStayConnected={setStayConnected}
          onBack={(): void => setMode('onboarding')}
          onLogin={(): void => router.replace('/(tabs)')}
        />
      )}
    </SafeAreaView>
  );
}

function Header() {
  return (
    <View style={styles.headerRow}>
      <View style={styles.logoWrap}>
        <Image source={require('@/assets/branding/logo.png')} style={styles.logo} contentFit="contain" />
      </View>
      <View style={styles.headerBadge}>
        <Text style={styles.headerBadgeText}>Season beta</Text>
      </View>
    </View>
  );
}

function BackgroundOrbs() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.orbBlue} />
      <View style={styles.orbGreen} />
      <View style={styles.orbCoral} />
      <View style={styles.gridLineVertical} />
      <View style={styles.gridLineHorizontal} />
    </View>
  );
}

function LoginScreen({
  isDesktop,
  stayConnected,
  setStayConnected,
  onBack,
  onLogin,
}: {
  isDesktop: boolean;
  stayConnected: boolean;
  setStayConnected: (value: boolean) => void;
  onBack: () => void;
  onLogin: () => void;
}) {
  return (
    <View style={styles.loginShell}>
      {isDesktop ? (
        <View style={styles.loginDesktopGrid}>
          <AuthPanel />
          <LoginPanel stayConnected={stayConnected} setStayConnected={setStayConnected} onBack={onBack} onLogin={onLogin} />
        </View>
      ) : (
        <ScrollView style={styles.loginScroll} contentContainerStyle={styles.loginScrollContent} showsVerticalScrollIndicator={false}>
          <AuthPanel compact />
          <LoginPanel stayConnected={stayConnected} setStayConnected={setStayConnected} onBack={onBack} onLogin={onLogin} mobile />
        </ScrollView>
      )}
    </View>
  );
}

function AuthPanel({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.authPanel, compact && styles.authPanelCompact]}>
      <BackgroundOrbs />
      <View style={styles.authPanelInner}>
        <View style={styles.authLogoWrap}>
          <Image source={require('@/assets/branding/logo.png')} style={styles.authLogo} contentFit="contain" />
        </View>

        <View style={styles.authBadge}>
          <Text style={styles.authBadgeText}>Acesso a organizacoes privadas</Text>
        </View>

        <Text style={[styles.authTitle, compact && styles.authTitleCompact]}>
          Entre e volte para a disputa.
        </Text>
        <Text style={styles.authSubtitle}>Acesse sua conta para continuar sua competicao.</Text>

        <View style={styles.authPulseRow}>
          <View style={styles.liveDot} />
          <View style={styles.liveLine} />
        </View>

        <View style={styles.pulseCard}>
          <View style={styles.pulseCardHeader}>
            <View>
              <Text style={styles.pulseEyebrow}>Matchday Pulse</Text>
              <Text style={styles.pulseTitle}>Sua liga entra em campo daqui.</Text>
            </View>
            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>Live</Text>
            </View>
          </View>

          <View style={styles.pulseGrid}>
            <View style={styles.roundCard}>
              <Text style={styles.roundLabel}>Round status</Text>
              <Text style={styles.roundNumber}>03</Text>
              <Text style={styles.roundText}>
                A rodada fecha, o ranking vira assunto e a competicao continua viva.
              </Text>
            </View>

            <View style={styles.pulseInfoColumn}>
              {['Organizacao privada', 'Convites centralizados', 'Ranking claro'].map((item, index) => (
                <View key={item} style={styles.infoCard}>
                  <Text style={styles.infoCardLabel}>{['Ambiente', 'Fluxo', 'Retencao'][index]}</Text>
                  <Text style={styles.infoCardText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function LoginPanel({
  stayConnected,
  setStayConnected,
  onBack,
  onLogin,
  mobile = false,
}: {
  stayConnected: boolean;
  setStayConnected: (value: boolean) => void;
  onBack: () => void;
  onLogin: () => void;
  mobile?: boolean;
}) {
  return (
    <View style={[styles.loginPanel, mobile && styles.loginPanelMobile]}>
      <View style={styles.loginContentWrap}>
        <View style={styles.loginCard}>
          <Text style={styles.loginEyebrow}>Login</Text>
          <Text style={styles.loginTitle}>Entrar</Text>
          <Text style={styles.loginSubtitle}>Use seu e-mail e senha.</Text>

          <View style={styles.formSection}>
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>E-mail</Text>
              <View style={styles.inputShell}>
                <Feather name="mail" size={16} color={MatchdayTheme.colors.slate500} />
                <TextInput
                  placeholder="voce@empresa.com"
                  placeholderTextColor={MatchdayTheme.colors.slate500}
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Senha</Text>
              <View style={styles.inputShell}>
                <Feather name="lock" size={16} color={MatchdayTheme.colors.slate500} />
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor={MatchdayTheme.colors.slate500}
                  secureTextEntry
                  style={styles.input}
                />
              </View>
            </View>

            <Pressable style={styles.checkboxRow} onPress={() => setStayConnected(!stayConnected)}>
              <View style={[styles.checkbox, stayConnected && styles.checkboxChecked]}>
                {stayConnected ? <Feather name="check" size={14} color={MatchdayTheme.colors.white} /> : null}
              </View>
              <Text style={styles.checkboxText}>Manter-me conectado nesta maquina</Text>
            </Pressable>

            <Pressable style={styles.loginButton} onPress={onLogin}>
              <Text style={styles.loginButtonText}>Entrar</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.footerText}>
          Nao tem conta? <Text style={styles.footerLink}>Criar conta</Text>
        </Text>
        <Pressable onPress={onBack}>
          <Text style={styles.backLink}>Voltar para a apresentacao</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: MatchdayTheme.colors.night,
  },
  onboardingShell: {
    flex: 1,
    backgroundColor: MatchdayTheme.colors.night,
  },
  onboardingContent: {
    paddingBottom: 32,
    paddingTop: 12,
    gap: 24,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logoWrap: {
    height: 54,
    width: 142,
  },
  logo: {
    height: '100%',
    width: '100%',
  },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: MatchdayTheme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  headerBadgeText: {
    color: MatchdayTheme.colors.sky200,
    fontFamily: Fonts.sans,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  heroBlock: {
    gap: 24,
  },
  heroBlockDesktop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  copyColumn: {
    gap: 18,
  },
  eyebrowPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: MatchdayTheme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  eyebrowText: {
    color: MatchdayTheme.colors.sky200,
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.7,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: MatchdayTheme.colors.white,
    fontFamily: Fonts.display,
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1.5,
    lineHeight: 44,
    textTransform: 'uppercase',
  },
  heroTitleDesktop: {
    fontSize: 62,
    lineHeight: 62,
    maxWidth: 560,
  },
  heroSubtitle: {
    color: 'rgba(196,231,255,0.82)',
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 27,
    maxWidth: 560,
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricChip: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: MatchdayTheme.radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  metricChipText: {
    color: MatchdayTheme.colors.white,
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '600',
  },
  carouselColumn: {
    alignSelf: 'center',
    gap: 20,
    width: '100%',
  },
  slideCardShell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: MatchdayTheme.radii.xxl,
    borderWidth: 1,
    overflow: 'hidden',
    width: '92%',
    ...MatchdayTheme.shadows.card,
  },
  slideImageWrap: {
    height: 340,
    position: 'relative',
  },
  slideImage: {
    height: '100%',
    width: '100%',
  },
  imageBadge: {
    alignItems: 'center',
    backgroundColor: MatchdayTheme.colors.gold400,
    borderRadius: MatchdayTheme.radii.pill,
    flexDirection: 'row',
    gap: 8,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
    position: 'absolute',
    top: 16,
  },
  imageBadgeText: {
    color: MatchdayTheme.colors.slate900,
    fontFamily: Fonts.sans,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  imageFloatingCard: {
    backgroundColor: 'rgba(7,9,18,0.84)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 22,
    borderWidth: 1,
    bottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    position: 'absolute',
    right: 16,
  },
  imageFloatingKicker: {
    color: MatchdayTheme.colors.mint400,
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  imageFloatingTitle: {
    color: MatchdayTheme.colors.white,
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  slideBody: {
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  slideKicker: {
    color: MatchdayTheme.colors.mint400,
    fontFamily: Fonts.sans,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  slideTitle: {
    color: MatchdayTheme.colors.white,
    fontFamily: Fonts.display,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 30,
    textTransform: 'uppercase',
  },
  slideSubtitle: {
    color: 'rgba(196,231,255,0.82)',
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
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
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },
  carouselFooter: {
    gap: 16,
  },
  paginationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  paginationDot: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: MatchdayTheme.radii.pill,
    height: 10,
    width: 10,
  },
  paginationDotActive: {
    backgroundColor: MatchdayTheme.colors.mint400,
    width: 28,
  },
  carouselActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: MatchdayTheme.radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    color: MatchdayTheme.colors.white,
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: MatchdayTheme.colors.lime300,
    borderRadius: MatchdayTheme.radii.pill,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    color: MatchdayTheme.colors.slate900,
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  orbBlue: {
    backgroundColor: 'rgba(56,189,248,0.16)',
    borderRadius: 220,
    height: 220,
    left: 12,
    position: 'absolute',
    top: 24,
    width: 220,
  },
  orbGreen: {
    backgroundColor: 'rgba(190,242,100,0.1)',
    borderRadius: 240,
    height: 240,
    position: 'absolute',
    right: 10,
    top: 180,
    width: 240,
  },
  orbCoral: {
    backgroundColor: 'rgba(255,122,102,0.08)',
    borderRadius: 260,
    bottom: 60,
    height: 260,
    left: 40,
    position: 'absolute',
    width: 260,
  },
  gridLineVertical: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    height: '100%',
    left: '18%',
    position: 'absolute',
    width: 1,
  },
  gridLineHorizontal: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    height: 1,
    position: 'absolute',
    top: '28%',
    width: '100%',
  },
  loginShell: {
    flex: 1,
    backgroundColor: '#eef6ff',
  },
  loginDesktopGrid: {
    flex: 1,
    flexDirection: 'row',
  },
  loginScroll: {
    flex: 1,
  },
  loginScrollContent: {
    backgroundColor: '#eef6ff',
    paddingBottom: 24,
  },
  authPanel: {
    backgroundColor: MatchdayTheme.colors.blue900,
    flex: 1.08,
    overflow: 'hidden',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  authPanelCompact: {
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    minHeight: 520,
  },
  authPanelInner: {
    flex: 1,
    gap: 20,
    justifyContent: 'center',
    maxWidth: 640,
    width: '100%',
  },
  authLogoWrap: {
    height: 58,
    width: 160,
  },
  authLogo: {
    height: '100%',
    width: '100%',
  },
  authBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: MatchdayTheme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  authBadgeText: {
    color: MatchdayTheme.colors.sky200,
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  authTitle: {
    color: MatchdayTheme.colors.white,
    fontFamily: Fonts.display,
    fontSize: 58,
    fontWeight: '900',
    letterSpacing: -2.2,
    lineHeight: 56,
    maxWidth: 520,
    textTransform: 'uppercase',
  },
  authTitleCompact: {
    fontSize: 40,
    lineHeight: 40,
  },
  authSubtitle: {
    color: 'rgba(196,231,255,0.82)',
    fontFamily: Fonts.sans,
    fontSize: 17,
    lineHeight: 28,
    maxWidth: 420,
  },
  authPulseRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  liveDot: {
    backgroundColor: MatchdayTheme.colors.lime300,
    borderRadius: MatchdayTheme.radii.pill,
    height: 10,
    width: 10,
  },
  liveLine: {
    backgroundColor: 'rgba(190,242,100,0.6)',
    height: 1,
    width: 100,
  },
  pulseCard: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: MatchdayTheme.radii.xxl,
    borderWidth: 1,
    maxWidth: 560,
    overflow: 'hidden',
    padding: 18,
    ...MatchdayTheme.shadows.card,
  },
  pulseCardHeader: {
    alignItems: 'center',
    borderBottomColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  pulseEyebrow: {
    color: MatchdayTheme.colors.sky200,
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  pulseTitle: {
    color: MatchdayTheme.colors.white,
    fontFamily: Fonts.sans,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 6,
  },
  liveBadge: {
    backgroundColor: MatchdayTheme.colors.lime300,
    borderRadius: MatchdayTheme.radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  liveBadgeText: {
    color: MatchdayTheme.colors.slate900,
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  pulseGrid: {
    gap: 12,
    marginTop: 16,
  },
  roundCard: {
    backgroundColor: '#0a2d44',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  roundLabel: {
    color: 'rgba(196,231,255,0.75)',
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  roundNumber: {
    color: MatchdayTheme.colors.white,
    fontFamily: Fonts.display,
    fontSize: 64,
    fontWeight: '900',
    letterSpacing: -2.4,
    marginTop: 8,
  },
  roundText: {
    color: 'rgba(196,231,255,0.76)',
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  pulseInfoColumn: {
    gap: 10,
  },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  infoCardLabel: {
    color: 'rgba(196,231,255,0.78)',
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  infoCardText: {
    color: MatchdayTheme.colors.white,
    fontFamily: Fonts.sans,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 6,
  },
  loginPanel: {
    backgroundColor: '#f8fbff',
    flex: 0.92,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  loginPanelMobile: {
    paddingTop: 18,
  },
  loginContentWrap: {
    alignSelf: 'center',
    maxWidth: 420,
    width: '100%',
  },
  loginCard: {
    backgroundColor: MatchdayTheme.colors.white,
    borderColor: '#e0ecf8',
    borderRadius: MatchdayTheme.radii.xxl,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
    ...MatchdayTheme.shadows.soft,
  },
  loginEyebrow: {
    color: MatchdayTheme.colors.blue700,
    fontFamily: Fonts.sans,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.7,
    textTransform: 'uppercase',
  },
  loginTitle: {
    color: MatchdayTheme.colors.blue900,
    fontFamily: Fonts.display,
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -1.6,
    marginTop: 10,
    textTransform: 'uppercase',
  },
  loginSubtitle: {
    color: MatchdayTheme.colors.slate500,
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 10,
  },
  formSection: {
    gap: 18,
    marginTop: 28,
  },
  fieldBlock: {
    gap: 8,
  },
  fieldLabel: {
    color: MatchdayTheme.colors.slate700,
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '600',
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: MatchdayTheme.colors.slate100,
    borderColor: MatchdayTheme.colors.slate200,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  input: {
    color: MatchdayTheme.colors.slate900,
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 15,
  },
  checkboxRow: {
    alignItems: 'center',
    backgroundColor: MatchdayTheme.colors.slate100,
    borderColor: MatchdayTheme.colors.slate200,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  checkbox: {
    alignItems: 'center',
    backgroundColor: MatchdayTheme.colors.white,
    borderColor: MatchdayTheme.colors.slate300,
    borderRadius: 8,
    borderWidth: 1,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  checkboxChecked: {
    backgroundColor: MatchdayTheme.colors.blue900,
    borderColor: MatchdayTheme.colors.blue900,
  },
  checkboxText: {
    color: MatchdayTheme.colors.slate700,
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 14,
  },
  loginButton: {
    alignItems: 'center',
    backgroundColor: MatchdayTheme.colors.blue900,
    borderRadius: MatchdayTheme.radii.pill,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
  },
  loginButtonText: {
    color: MatchdayTheme.colors.white,
    fontFamily: Fonts.sans,
    fontSize: 15,
    fontWeight: '700',
  },
  footerText: {
    color: MatchdayTheme.colors.slate500,
    fontFamily: Fonts.sans,
    fontSize: 14,
    marginTop: 20,
    textAlign: 'center',
  },
  footerLink: {
    color: MatchdayTheme.colors.blue900,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  backLink: {
    color: MatchdayTheme.colors.blue900,
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
});
