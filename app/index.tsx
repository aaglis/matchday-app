import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackgroundOrbs } from '@/components/auth/background-orbs';
import { LoginScreen, type SignInPayload } from '@/components/auth/login-screen';
import { RegisterScreen, type SignUpPayload } from '@/components/auth/register-screen';
import { Fonts, MatchdayTheme } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';

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
const AUTO_SLIDE_INTERVAL_MS = 4200;

export default function MatchdayEntryScreen() {
  const { loading: sessionLoading, signIn, signUp, user } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1100;
  const listRef = useRef<FlatList<Slide>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const autoSlideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<'onboarding' | 'login' | 'register'>('onboarding');
  const [stayConnected, setStayConnected] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const horizontalPadding = isDesktop ? MatchdayTheme.spacing.screenLg : MatchdayTheme.spacing.screen;
  const cardWidth = Math.max(260, Math.min(width - horizontalPadding * 2, isDesktop ? 440 : 380));

  const clearAutoSlideTimer = useCallback(() => {
    if (!autoSlideTimerRef.current) return;
    clearTimeout(autoSlideTimerRef.current);
    autoSlideTimerRef.current = null;
  }, []);

  const scheduleAutoSlide = useCallback(() => {
    clearAutoSlideTimer();
    if (mode !== 'onboarding') return;

    autoSlideTimerRef.current = setTimeout(() => {
      setCurrentIndex((prev) => {
        const next = prev === slides.length - 1 ? 0 : prev + 1;
        listRef.current?.scrollToOffset({ offset: next * cardWidth, animated: true });
        return next;
      });
    }, AUTO_SLIDE_INTERVAL_MS);
  }, [cardWidth, clearAutoSlideTimer, mode]);

  useEffect(() => {
    scheduleAutoSlide();
    return clearAutoSlideTimer;
  }, [clearAutoSlideTimer, scheduleAutoSlide]);

  useEffect(() => {
    if (!sessionLoading && user) {
      router.replace('/(tabs)');
    }
  }, [sessionLoading, user]);

  useEffect(() => {
    if (mode !== 'onboarding') return;
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: currentIndex * cardWidth, animated: false });
    });
  }, [cardWidth, currentIndex, mode]);

  const goToLogin = () => {
    setAuthError(null);
    setAuthNotice(null);
    setMode('login');
  };
  const goToRegister = () => {
    setAuthError(null);
    setAuthNotice(null);
    setMode('register');
  };
  const handleLogin = async (payload: SignInPayload) => {
    setAuthError(null);
    setAuthNotice(null);
    setAuthLoading(true);

    try {
      await signIn(payload);
      router.replace('/(tabs)');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Erro ao entrar. Tente novamente mais tarde.');
    } finally {
      setAuthLoading(false);
    }
  };
  const handleRegister = async (payload: SignUpPayload) => {
    setAuthError(null);
    setAuthNotice(null);
    setAuthLoading(true);

    try {
      await signUp(payload);
      setAuthNotice('Conta criada! Verifique seu e-mail e toque no link para ativar.');
      setMode('login');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Erro ao criar conta. Tente novamente mais tarde.');
    } finally {
      setAuthLoading(false);
    }
  };
  const nextSlide = () => {
    clearAutoSlideTimer();
    if (currentIndex === slides.length - 1) {
      goToLogin();
      return;
    }

    const next = currentIndex + 1;
    listRef.current?.scrollToOffset({ offset: next * cardWidth, animated: true });
    setCurrentIndex(next);
    scheduleAutoSlide();
  };
  const updateCurrentIndex = (offsetX: number) => {
    const rawIndex = Math.round(offsetX / cardWidth);
    const nextIndex = Math.max(0, Math.min(slides.length - 1, rawIndex));
    setCurrentIndex((prev) => (prev === nextIndex ? prev : nextIndex));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {mode === 'onboarding' ? (
        <View style={styles.onboardingShell}>
          <BackgroundOrbs />
          <ScrollView
            contentContainerStyle={[
              styles.onboardingContent,
              { paddingHorizontal: horizontalPadding },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <Header />

            <View style={[styles.heroBlock, isDesktop && styles.heroBlockDesktop]}>
              <View style={[styles.copyColumn, isDesktop ? { maxWidth: 520 } : { display: 'none' }]}>
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
                  style={{ width: cardWidth }}
                  getItemLayout={(_, index) => ({ length: cardWidth, offset: cardWidth * index, index })}
                  initialNumToRender={slides.length}
                  maxToRenderPerBatch={slides.length}
                  windowSize={3}
                  snapToInterval={cardWidth}
                  snapToAlignment="start"
                  decelerationRate={0.92}
                  showsHorizontalScrollIndicator={false}
                  onScrollBeginDrag={clearAutoSlideTimer}
                  onMomentumScrollEnd={(event) => {
                    updateCurrentIndex(event.nativeEvent.contentOffset.x);
                    scheduleAutoSlide();
                  }}
                  onScrollEndDrag={(event) => {
                    const velocity = event.nativeEvent.velocity?.x ?? 1;
                    if (Math.abs(velocity) < 0.1) {
                      updateCurrentIndex(event.nativeEvent.contentOffset.x);
                      scheduleAutoSlide();
                    }
                  }}
                  onScrollToIndexFailed={(info) => {
                    requestAnimationFrame(() => {
                      listRef.current?.scrollToOffset({ offset: info.index * cardWidth, animated: true });
                    });
                  }}
                  onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                    useNativeDriver: true,
                  })}
                  scrollEventThrottle={16}
                  contentContainerStyle={{ gap: 0 }}
                  renderItem={({ item, index }) => {
                    const inputRange = [(index - 1) * cardWidth, index * cardWidth, (index + 1) * cardWidth];
                    const opacity = scrollX.interpolate({
                      inputRange,
                      outputRange: [0.72, 1, 0.72],
                      extrapolate: 'clamp',
                    });
                    const translateY = scrollX.interpolate({
                      inputRange,
                      outputRange: [10, 0, 10],
                      extrapolate: 'clamp',
                    });

                    return (
                      <Animated.View style={[styles.slideCardShell, { opacity, transform: [{ translateY }], width: cardWidth }]}>
                        <View style={[styles.slideCard, !isDesktop && { height: 550 }]}>
                          <Image source={item.image} style={StyleSheet.absoluteFill} contentFit="cover" />

                          {/* gradient overlay — 6-step fade from transparent to dark */}
                          <View style={styles.slideGradient} pointerEvents="none">
                            {([0, 0.04, 0.14, 0.34, 0.58, 0.80] as const).map((a, i) => (
                              <View key={i} style={{ flex: 1, backgroundColor: `rgba(4,20,40,${a})` }} />
                            ))}
                          </View>

                          <View style={styles.imageBadge}>
                            <MaterialCommunityIcons name="sword-cross" size={15} color={MatchdayTheme.colors.slate900} />
                            <Text style={styles.imageBadgeText}>{item.badge}</Text>
                          </View>

                          <View style={styles.slideOverlayContent}>
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
                    {slides.map((slide, index) => {
                      const dotInputRange = [(index - 1) * cardWidth, index * cardWidth, (index + 1) * cardWidth];
                      const dotOpacity = scrollX.interpolate({ inputRange: dotInputRange, outputRange: [0.28, 1, 0.28], extrapolate: 'clamp' });
                      return (
                        <Pressable key={slide.id} onPress={() => {
                          clearAutoSlideTimer();
                          listRef.current?.scrollToOffset({ offset: index * cardWidth, animated: true });
                          setCurrentIndex(index);
                          scheduleAutoSlide();
                        }}>
                          <Animated.View style={[styles.paginationDot, currentIndex === index && styles.paginationDotActive, { opacity: dotOpacity }]} />
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={styles.carouselActions}>
                    <Pressable style={styles.secondaryButton} onPress={goToLogin}>
                      <Text style={styles.secondaryButtonText}>Pular intro</Text>
                    </Pressable>
                    <Pressable style={styles.primaryButton} onPress={nextSlide}>
                      <Text style={styles.primaryButtonText}>
                        {currentIndex === slides.length - 1 ? 'Ir para login' : 'Próximo'}
                      </Text>
                      <Feather name="arrow-right" size={18} color={MatchdayTheme.colors.white} />
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      ) : mode === 'login' ? (
        <LoginScreen
          isDesktop={isDesktop}
          stayConnected={stayConnected}
          setStayConnected={setStayConnected}
          authError={authError}
          authNotice={authNotice}
          authLoading={authLoading}
          onBack={(): void => setMode('onboarding')}
          onCreateAccount={goToRegister}
          onLogin={handleLogin}
        />
      ) : (
        <RegisterScreen
          isDesktop={isDesktop}
          authError={authError}
          authLoading={authLoading}
          onBack={(): void => setMode('onboarding')}
          onLogin={goToLogin}
          onRegister={handleRegister}
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
    paddingBottom: 28,
    paddingTop: 10,
    gap: 24,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logoWrap: {
    backgroundColor: MatchdayTheme.colors.blue900,
    borderColor: MatchdayTheme.colors.blue700,
    borderRadius: 18,
    borderWidth: 1,
    height: 58,
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: 158,
  },
  logo: {
    height: '100%',
    width: '100%',
  },
  headerBadge: {
    backgroundColor: MatchdayTheme.colors.blue900,
    borderColor: MatchdayTheme.colors.blue700,
    borderRadius: MatchdayTheme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  headerBadgeText: {
    color: MatchdayTheme.colors.white,
    fontFamily: Fonts.sans,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0,
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
    backgroundColor: 'rgba(12,74,110,0.08)',
    borderColor: 'rgba(12,74,110,0.12)',
    borderRadius: MatchdayTheme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  eyebrowText: {
    color: MatchdayTheme.colors.blue800,
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: MatchdayTheme.colors.blue900,
    fontFamily: Fonts.display,
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 44,
    textTransform: 'uppercase',
  },
  heroTitleDesktop: {
    fontSize: 62,
    lineHeight: 62,
    maxWidth: 560,
  },
  heroSubtitle: {
    color: MatchdayTheme.colors.slate700,
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
    backgroundColor: MatchdayTheme.colors.surface,
    borderColor: 'rgba(12,74,110,0.12)',
    borderRadius: MatchdayTheme.radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  metricChipText: {
    color: MatchdayTheme.colors.blue900,
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
    paddingHorizontal: 8,
  },
  slideCard: {
    backgroundColor: MatchdayTheme.colors.surfaceElevated,
    borderColor: 'rgba(12,74,110,0.08)',
    borderRadius: MatchdayTheme.radii.xl,
    borderWidth: 1,
    height: 590,
    overflow: 'hidden',
    width: '100%',
    ...MatchdayTheme.shadows.card,
  },
  slideGradient: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
  },
  slideOverlayContent: {
    bottom: 0,
    gap: 10,
    left: 0,
    paddingBottom: 22,
    paddingHorizontal: 18,
    paddingTop: 20,
    position: 'absolute',
    right: 0,
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
  slideKicker: {
    color: MatchdayTheme.colors.lime300,
    fontFamily: Fonts.sans,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  slideTitle: {
    color: MatchdayTheme.colors.white,
    fontFamily: Fonts.display,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 30,
    textTransform: 'uppercase',
  },
  slideSubtitle: {
    color: 'rgba(220,237,255,0.82)',
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 21,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    marginTop: 4,
  },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  statLabel: {
    color: MatchdayTheme.colors.sky200,
    fontFamily: Fonts.sans,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  statValue: {
    color: MatchdayTheme.colors.white,
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
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
    backgroundColor: MatchdayTheme.colors.blue900,
    borderRadius: MatchdayTheme.radii.pill,
    height: 10,
    width: 10,
  },
  paginationDotActive: {
    width: 28,
  },
  carouselActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: MatchdayTheme.colors.surface,
    borderColor: 'rgba(12,74,110,0.12)',
    borderRadius: MatchdayTheme.radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    color: MatchdayTheme.colors.blue900,
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: MatchdayTheme.colors.blue800,
    borderRadius: MatchdayTheme.radii.pill,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    color: MatchdayTheme.colors.white,
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});
