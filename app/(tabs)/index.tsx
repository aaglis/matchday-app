import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GamificationModal } from '@/components/gamification/gamification-modal';
import { Fonts, MatchdayTheme } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import {
  getOrganizationFeed,
  listOrganizationGamificationEvents,
  listOrganizations,
  markOrganizationGamificationEventSeen,
  type GamificationEvent,
  type Organization,
  type OrganizationFeed,
} from '@/lib/matchday-api';

type LeagueFeed = {
  organization: Organization;
  feed: OrganizationFeed | null;
  error: string | null;
};

type PendingGamificationEvent = {
  event: GamificationEvent;
  organization: Organization;
  preview?: boolean;
};

type PreviewEventType =
  | 'perfect_round'
  | 'great_round'
  | 'champion_round'
  | 'achievement_unlocked'
  | 'bad_round'
  | 'deadline_warning'
  | 'invite_friends'
  | 'empty_state';

const previewEvents: { label: string; type: PreviewEventType }[] = [
  { label: 'Placar exato', type: 'perfect_round' },
  { label: 'Muitos acertos', type: 'great_round' },
  { label: 'Campeão', type: 'champion_round' },
  { label: 'Conquista', type: 'achievement_unlocked' },
  { label: 'Analisando', type: 'deadline_warning' },
  { label: 'Rodada ruim', type: 'bad_round' },
  { label: 'Convite', type: 'invite_friends' },
  { label: 'Sem liga', type: 'empty_state' },
];

const previewAssets: Record<PreviewEventType, number> = {
  achievement_unlocked: require('@/assets/images/pita-conquista-desbloqueada.png'),
  bad_round: require('@/assets/images/pita-triste.png'),
  champion_round: require('@/assets/images/pita-campeao-rodada.png'),
  deadline_warning: require('@/assets/images/pita-analisando-jogos.png'),
  empty_state: require('@/assets/images/pita-nenhum-bolao-encontrado.png'),
  great_round: require('@/assets/images/pita-acertou-muitos-palpites.png'),
  invite_friends: require('@/assets/images/pita-convidando-amigos.png'),
  perfect_round: require('@/assets/images/pita-placar-exato.png'),
};

export default function ArenaScreen() {
  const { user, refreshSession } = useAuth();
  const firstName = user?.name?.split(' ')[0] ?? 'Jogador';
  const [leagues, setLeagues] = useState<LeagueFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingEvents, setPendingEvents] = useState<PendingGamificationEvent[]>([]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const organizations = await listOrganizations();
      const settled = await Promise.allSettled(
        organizations.map(async (organization) => ({
          organization,
          feed: await getOrganizationFeed(organization.id),
          error: null,
        })),
      );

      const nextLeagues = settled.map((result, index) => {
          if (result.status === 'fulfilled') return result.value;
          return {
            organization: organizations[index],
            feed: null,
            error: result.reason instanceof Error ? result.reason.message : 'Não foi possível carregar a liga.',
          };
        });

      setLeagues(nextLeagues);

      const eventSettled = await Promise.allSettled(
        nextLeagues.map(async (league) => {
          const result = await listOrganizationGamificationEvents(league.organization.id);
          return result.events.map((event) => ({ event, organization: league.organization }));
        }),
      );
      setPendingEvents(eventSettled.flatMap((result) => (result.status === 'fulfilled' ? result.value : [])));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar sua arena.');
      setLeagues([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshSession(), load()]);
    } finally {
      setRefreshing(false);
    }
  }, [load, refreshSession]);

  const activeLeague = useMemo(() => {
    return leagues.find((league) => league.feed?.matches.some((match) => !match.bettingLocked))
      ?? leagues.find((league) => league.feed?.round)
      ?? leagues[0]
      ?? null;
  }, [leagues]);
  const openMatches = useMemo(
    () => leagues.reduce((total, league) => total + (league.feed?.matches.filter((match) => !match.bettingLocked).length ?? 0), 0),
    [leagues],
  );
  const nextDeadline = useMemo(() => findNextDeadline(leagues), [leagues]);
  const totalPoints = useMemo(
    () => leagues.reduce((total, league) => {
      const me = league.feed?.ranking.find((entry) => entry.userId === user?.id);
      return total + (me?.totalPoints ?? 0);
    }, 0),
    [leagues, user?.id],
  );
  const activeEvent = pendingEvents[0] ?? null;

  const dismissGamificationEvent = useCallback(async () => {
    const current = pendingEvents[0];
    if (!current) return;

    setPendingEvents((events) => events.slice(1));
    if (current.preview) return;

    try {
      await markOrganizationGamificationEventSeen(current.organization.id, current.event.id);
    } catch {
      // Non-blocking: if this fails, the event can be shown again next session.
    }
  }, [pendingEvents]);

  const openEventLeague = useCallback(() => {
    const current = pendingEvents[0];
    if (!current) return;

    if (current.preview) {
      void dismissGamificationEvent();
      return;
    }

    router.push(`/organization/${current.organization.id}?name=${encodeURIComponent(current.organization.name)}`);
    void dismissGamificationEvent();
  }, [dismissGamificationEvent, pendingEvents]);

  const previewGamification = useCallback((type: PreviewEventType) => {
    const organization = activeLeague?.organization ?? createPreviewOrganization();
    setPendingEvents((events) => [
      {
        event: createPreviewEvent(type, organization.id, user?.id ?? 'preview-user'),
        organization,
        preview: true,
      },
      ...events,
    ]);
  }, [activeLeague?.organization, user?.id]);

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
            <Text style={s.topBadgeText}>{leagues.length}/3 ligas</Text>
          </View>
        </View>

        {__DEV__ ? (
          <View style={s.previewCard}>
            <View style={s.previewHeader}>
              <View>
                <Text style={s.previewEyebrow}>Preview · DEV</Text>
                <Text style={s.previewTitle}>Modais gamificados</Text>
              </View>
              <Ionicons name="game-controller-outline" size={18} color={MatchdayTheme.colors.blue800} />
            </View>
            <View style={s.previewActions}>
              {previewEvents.map((item) => (
                <Pressable key={item.type} style={s.previewButton} onPress={() => previewGamification(item.type)}>
                  <Image source={previewAssets[item.type]} style={s.previewMascot} contentFit="contain" />
                  <Text style={s.previewButtonText}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {loading ? (
          <View style={s.loadingBlock}>
            <ActivityIndicator color={MatchdayTheme.colors.blue800} />
          </View>
        ) : error ? (
          <View style={s.emptyCard}>
            <Ionicons name="alert-circle-outline" size={26} color={MatchdayTheme.colors.danger} />
            <Text style={s.emptyTitle}>Arena indisponível</Text>
            <Text style={s.emptyText}>{error}</Text>
            <Pressable style={s.primaryButton} onPress={load}>
              <Text style={s.primaryButtonText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : leagues.length === 0 ? (
          <View style={s.emptyCard}>
            <View style={s.emptyIcon}>
              <Ionicons name="people-outline" size={26} color={MatchdayTheme.colors.white} />
            </View>
            <Text style={s.emptyTitle}>Entre em uma liga</Text>
            <Text style={s.emptyText}>Crie ou participe de uma organização para liberar rodadas, palpites e ranking.</Text>
            <Pressable style={s.primaryButton} onPress={() => router.push('/(tabs)/organizations')}>
              <Text style={s.primaryButtonText}>Ver ligas</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={s.heroCard}>
              <View style={s.heroTopRow}>
                <View style={s.roundPill}>
                  <Text style={s.roundPillText}>Resumo geral</Text>
                </View>
                <Text style={s.heroDeadline}>{nextDeadline ? deadlineLabel(nextDeadline) : 'Sem prazo aberto'}</Text>
              </View>
              <Text style={s.heroTitle}>Suas ligas</Text>
              <Text style={s.heroSubtitle}>Acompanhe prazos, palpites e ranking separadamente em cada liga.</Text>
              <View style={s.heroStats}>
                <Metric label="Ligas" value={String(leagues.length)} />
                <Metric label="Abertos" value={String(openMatches)} />
                <Metric label="Pontos" value={String(totalPoints)} />
              </View>
              {activeLeague ? (
                <Pressable style={s.heroAction} onPress={() => router.push(`/organization/${activeLeague.organization.id}?name=${encodeURIComponent(activeLeague.organization.name)}`)}>
                  <Text style={s.heroActionText}>Abrir próxima liga</Text>
                  <Feather name="arrow-right" size={16} color={MatchdayTheme.colors.slate900} />
                </Pressable>
              ) : null}
            </View>

            <View style={s.card}>
              <View style={s.cardHeader}>
                <Text style={s.cardTitle}>Minhas ligas</Text>
                <Feather name="grid" size={18} color={MatchdayTheme.colors.blue700} />
              </View>
              <View style={s.leagueList}>
                {leagues.map((league) => {
                  const me = league.feed?.ranking.find((entry) => entry.userId === user?.id);
                  const openCount = league.feed?.matches.filter((match) => !match.bettingLocked).length ?? 0;

                  return (
                    <Pressable
                      key={league.organization.id}
                      style={s.leagueRow}
                      onPress={() => router.push(`/organization/${league.organization.id}?name=${encodeURIComponent(league.organization.name)}`)}
                    >
                      <View style={s.leagueIcon}>
                        <Ionicons name="people" size={17} color={MatchdayTheme.colors.white} />
                      </View>
                      <View style={s.leagueMeta}>
                        <Text style={s.leagueName} numberOfLines={1}>{league.organization.name}</Text>
                        <Text style={s.leagueSub} numberOfLines={1}>{leagueSubtitle(league)}</Text>
                        <Text style={s.leagueStatus}>
                          {openCount} palpites abertos · {me ? `${me.totalPoints} pts` : 'sem pontos'}
                        </Text>
                      </View>
                      <View style={[s.rankChip, me && s.rankChipActive]}>
                        <Text style={[s.rankChipText, me && s.rankChipTextActive]}>{me ? `Top ${me.position}` : '--'}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </ScrollView>
      <GamificationModal
        event={activeEvent?.event ?? null}
        leagueName={activeEvent?.organization.name}
        onClose={dismissGamificationEvent}
        onPrimaryAction={openEventLeague}
      />
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.heroStatItem}>
      <Text style={s.heroStatLabel}>{label}</Text>
      <Text style={s.heroStatValue}>{value}</Text>
    </View>
  );
}

function findNextDeadline(leagues: LeagueFeed[]) {
  const dates = leagues
    .flatMap((league) => league.feed?.matches ?? [])
    .filter((match) => !match.bettingLocked)
    .map((match) => new Date(match.scheduledAt))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  return dates[0] ?? null;
}

function deadlineLabel(date: Date) {
  const diffMs = date.getTime() - Date.now();
  if (diffMs <= 0) return 'Fecha agora';
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `Fecha em ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Fecha em ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Fecha em ${days}d`;
}

function leagueSubtitle(league: LeagueFeed) {
  if (league.error) return league.error;
  if (!league.feed?.competition) return 'Sem competição configurada';
  if (!league.feed.round) return league.feed.competition.name;
  return `${league.feed.competition.name} · ${league.feed.round.name}`;
}

function createPreviewOrganization(): Organization {
  return {
    id: 'preview-org',
    name: 'Liga Preview',
    slug: 'liga-preview',
  };
}

function createPreviewEvent(type: PreviewEventType, organizationId: string, userId: string): GamificationEvent {
  const base = {
    createdAt: new Date().toISOString(),
    id: `preview-${type}-${Date.now()}`,
    organizationId,
    roundId: 'preview-round',
    seenAt: null,
    userId,
  };

  if (type === 'perfect_round') {
    return {
      ...base,
      animationKey: 'pita-placar-exato',
      eventKey: 'preview:perfect_round',
      message: 'Você hitou hoje: 23/23 palpites certos e +69 pontos.',
      metadata: { betsCount: 23, correctBets: 23, exactScores: 8, matchCount: 23, roundName: 'Rodada Preview', totalPoints: 69 },
      severity: 'positive',
      title: 'Rodada perfeita',
      type,
    };
  }

  if (type === 'great_round') {
    return {
      ...base,
      animationKey: 'pita-acertou-muitos-palpites',
      eventKey: 'preview:great_round',
      message: 'Você acertou 15 de 18 palpites. Hoje foi atuação de líder.',
      metadata: { betsCount: 18, correctBets: 15, exactScores: 4, matchCount: 18, roundName: 'Rodada Preview', totalPoints: 41 },
      severity: 'positive',
      title: 'Hoje foi goleada',
      type,
    };
  }

  if (type === 'champion_round') {
    return {
      ...base,
      animationKey: 'pita-campeao-rodada',
      eventKey: 'preview:champion_round',
      message: 'Você assumiu a liderança da rodada. Segura essa pressão agora.',
      metadata: { betsCount: 10, correctBets: 9, exactScores: 3, matchCount: 10, roundName: 'Rodada Preview', totalPoints: 32 },
      severity: 'positive',
      title: 'Novo líder',
      type,
    };
  }

  if (type === 'achievement_unlocked') {
    return {
      ...base,
      animationKey: 'pita-conquista-desbloqueada',
      eventKey: 'preview:achievement_unlocked',
      message: 'Você desbloqueou uma conquista por manter a sequência de palpites.',
      metadata: { totalPoints: 12 },
      severity: 'positive',
      title: 'Conquista desbloqueada',
      type,
    };
  }

  if (type === 'bad_round') {
    return {
      ...base,
      animationKey: 'pita-triste',
      eventKey: 'preview:bad_round',
      message: '3 de 16 palpites bateram. Respira: a próxima rodada é recuperação.',
      metadata: { betsCount: 16, correctBets: 3, exactScores: 0, matchCount: 16, roundName: 'Rodada Preview', totalPoints: 3 },
      severity: 'negative',
      title: 'Rodada dura',
      type,
    };
  }

  if (type === 'invite_friends') {
    return {
      ...base,
      animationKey: 'pita-convidando-amigos',
      eventKey: 'preview:invite_friends',
      message: 'Chame a galera para competir na sua liga e deixar o ranking mais vivo.',
      metadata: null,
      severity: 'neutral',
      title: 'Convide seus amigos',
      type,
    };
  }

  if (type === 'empty_state') {
    return {
      ...base,
      animationKey: 'pita-nenhum-bolao-encontrado',
      eventKey: 'preview:empty_state',
      message: 'Você ainda não entrou em nenhuma liga. Comece criando ou usando um código.',
      metadata: null,
      severity: 'neutral',
      title: 'Nada por aqui',
      type,
    };
  }

  return {
    ...base,
    animationKey: 'pita-analisando-jogos',
    eventKey: 'preview:deadline_warning',
    message: 'Faltam 5 palpites antes do próximo jogo da rodada.',
    metadata: { missingBets: 5, roundName: 'Rodada Preview' },
    severity: 'neutral',
    title: 'A bola vai rolar',
    type,
  };
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
  previewCard: { backgroundColor: MatchdayTheme.colors.surfaceElevated, borderColor: 'rgba(12,74,110,0.08)', borderRadius: MatchdayTheme.radii.xl, borderWidth: 1, gap: 12, padding: 16 },
  previewHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  previewEyebrow: { color: MatchdayTheme.colors.slate500, fontFamily: Fonts.sans, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  previewTitle: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.display, fontSize: 18, fontWeight: '900', textTransform: 'uppercase' },
  previewActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  previewButton: {
    alignItems: 'center',
    backgroundColor: MatchdayTheme.colors.surface,
    borderColor: 'rgba(12,74,110,0.10)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 10,
    paddingVertical: 7,
    width: '47%',
  },
  previewButtonText: { color: MatchdayTheme.colors.blue800, flex: 1, fontFamily: Fonts.sans, fontSize: 11, fontWeight: '900', lineHeight: 14 },
  previewMascot: { height: 36, width: 48 },
  loadingBlock: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.surfaceElevated, borderRadius: MatchdayTheme.radii.xl, minHeight: 180, justifyContent: 'center' },
  heroCard: { backgroundColor: MatchdayTheme.colors.blue900, borderRadius: MatchdayTheme.radii.xl, gap: 14, padding: 22 },
  heroTopRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  roundPill: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: MatchdayTheme.radii.pill, maxWidth: 180, paddingHorizontal: 12, paddingVertical: 6 },
  roundPillText: { color: MatchdayTheme.colors.sky200, fontFamily: Fonts.sans, fontSize: 11, fontWeight: '800', letterSpacing: 0, textTransform: 'uppercase' },
  heroDeadline: { color: MatchdayTheme.colors.gold400, fontFamily: Fonts.sans, fontSize: 13, fontWeight: '800' },
  heroTitle: { color: MatchdayTheme.colors.white, fontFamily: Fonts.display, fontSize: 34, fontWeight: '900', lineHeight: 36, textTransform: 'uppercase' },
  heroSubtitle: { color: 'rgba(196,231,255,0.82)', fontFamily: Fonts.sans, fontSize: 14, lineHeight: 22 },
  heroStats: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 4,
  },
  heroStatItem: { alignItems: 'center', flex: 1, paddingVertical: 14 },
  heroStatLabel: { color: MatchdayTheme.colors.sky200, fontFamily: Fonts.sans, fontSize: 10, fontWeight: '700', letterSpacing: 0, textTransform: 'uppercase' },
  heroStatValue: { color: MatchdayTheme.colors.white, fontFamily: Fonts.sans, fontSize: 18, fontWeight: '800', marginTop: 6 },
  heroAction: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: MatchdayTheme.colors.lime300, borderRadius: MatchdayTheme.radii.pill, flexDirection: 'row', gap: 8, marginTop: 2, paddingHorizontal: 16, paddingVertical: 11 },
  heroActionText: { color: MatchdayTheme.colors.slate900, fontFamily: Fonts.sans, fontSize: 13, fontWeight: '900' },
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
  leagueList: { gap: 10 },
  leagueRow: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.surface, borderColor: 'rgba(12,74,110,0.08)', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 12 },
  leagueIcon: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.blue900, borderRadius: MatchdayTheme.radii.pill, height: 38, justifyContent: 'center', width: 38 },
  leagueMeta: { flex: 1 },
  leagueName: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.sans, fontSize: 15, fontWeight: '800' },
  leagueSub: { color: MatchdayTheme.colors.slate500, fontFamily: Fonts.sans, fontSize: 12, marginTop: 3 },
  leagueStatus: { color: MatchdayTheme.colors.blue700, fontFamily: Fonts.sans, fontSize: 11, fontWeight: '700', marginTop: 4 },
  rankChip: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.surfaceElevated, borderColor: 'rgba(12,74,110,0.10)', borderRadius: MatchdayTheme.radii.pill, borderWidth: 1, minWidth: 62, paddingHorizontal: 10, paddingVertical: 7 },
  rankChipActive: { backgroundColor: '#ecfccb', borderColor: 'rgba(101,163,13,0.28)' },
  rankChipText: { color: MatchdayTheme.colors.slate500, fontFamily: Fonts.sans, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  rankChipTextActive: { color: '#365314' },
  emptyCard: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.surfaceElevated, borderColor: 'rgba(12,74,110,0.08)', borderRadius: MatchdayTheme.radii.xl, borderWidth: 1, gap: 12, padding: 22 },
  emptyIcon: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.blue900, borderRadius: MatchdayTheme.radii.pill, height: 52, justifyContent: 'center', width: 52 },
  emptyTitle: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.display, fontSize: 22, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase' },
  emptyText: { color: MatchdayTheme.colors.slate500, fontFamily: Fonts.sans, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  primaryButton: { backgroundColor: MatchdayTheme.colors.blue800, borderRadius: MatchdayTheme.radii.pill, paddingHorizontal: 18, paddingVertical: 12 },
  primaryButtonText: { color: MatchdayTheme.colors.white, fontFamily: Fonts.sans, fontSize: 13, fontWeight: '900' },
});
