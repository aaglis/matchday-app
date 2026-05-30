import { Feather, Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackgroundOrbs } from '@/components/auth/background-orbs';
import { Fonts, MatchdayTheme } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import {
  type Competition,
  getOrganizationFeed,
  getOrgFull,
  listCompetitions,
  type OrgFull,
  type OrganizationFeed,
  type OrganizationFeedMatch,
  submitOrganizationBet,
  setOrgCompetition,
} from '@/lib/matchday-api';

type OrgTab = 'palpites' | 'ranking' | 'membros';

export default function OrganizationDetailScreen() {
  const params = useLocalSearchParams<{ id?: string; name?: string }>();
  const orgId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { user } = useAuth();

  const [org, setOrg] = useState<OrgFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [feed, setFeed] = useState<OrganizationFeed | null>(null);
  const [betDrafts, setBetDrafts] = useState<Record<string, { home: string; away: string }>>({});
  const [savingBetId, setSavingBetId] = useState<string | null>(null);
  const [fabOpen, setFabOpen] = useState(false);
  const [compModalOpen, setCompModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<OrgTab>('palpites');
  const fabAnim = useRef(new Animated.Value(0)).current;

  const myRole = org?.members.find((m) => m.userId === user?.id)?.role ?? 'member';
  const isAdmin = myRole === 'admin' || myRole === 'owner';

  const load = useCallback(async () => {
    if (!orgId) return;
    setError(null);
    try {
      const [full, feedResult, comps] = await Promise.all([
        getOrgFull(orgId),
        getOrganizationFeed(orgId),
        listCompetitions().catch(() => [] as Competition[]),
      ]);
      setOrg(full);
      setFeed(feedResult);
      setCompetition(feedResult.competition);
      setCompetitions(comps);
      setBetDrafts(createBetDrafts(feedResult.matches));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar a organização.');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { void load(); }, [load]);

  const toggleFab = () => {
    const toValue = fabOpen ? 0 : 1;
    Animated.spring(fabAnim, { toValue, useNativeDriver: true, tension: 120, friction: 8 }).start();
    setFabOpen((v) => !v);
  };

  const closeFab = () => {
    Animated.spring(fabAnim, { toValue: 0, useNativeDriver: true, tension: 120, friction: 8 }).start();
    setFabOpen(false);
  };

  const updateDraft = (matchId: string, side: 'home' | 'away', value: string) => {
    const numeric = value.replace(/[^0-9]/g, '').slice(0, 2);
    setBetDrafts((current) => ({
      ...current,
      [matchId]: {
        home: current[matchId]?.home ?? '',
        away: current[matchId]?.away ?? '',
        [side]: numeric,
      },
    }));
  };

  const saveBet = async (matchId: string) => {
    if (!orgId) return;

    const draft = betDrafts[matchId];
    const predictedHomeScore = Number.parseInt(draft?.home ?? '', 10);
    const predictedAwayScore = Number.parseInt(draft?.away ?? '', 10);

    if (!Number.isInteger(predictedHomeScore) || !Number.isInteger(predictedAwayScore)) {
      Alert.alert('Palpite', 'Informe os dois placares antes de salvar.');
      return;
    }

    setSavingBetId(matchId);
    try {
      await submitOrganizationBet(orgId, matchId, { predictedHomeScore, predictedAwayScore });
      const nextFeed = await getOrganizationFeed(orgId);
      setFeed(nextFeed);
      setCompetition(nextFeed.competition);
      setBetDrafts(createBetDrafts(nextFeed.matches));
    } catch (e) {
      Alert.alert('Palpite', e instanceof Error ? e.message : 'Não foi possível salvar seu palpite.');
    } finally {
      setSavingBetId(null);
    }
  };

  if (!orgId) return null;

  return (
    <SafeAreaView style={s.safe}>
      <BackgroundOrbs />
      <View style={s.shell}>
        <View style={s.topBar}>
          <Pressable style={s.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={20} color={MatchdayTheme.colors.blue800} />
          </Pressable>
          <Text style={s.topBarTitle} numberOfLines={1}>
            {org?.name ?? params.name ?? ''}
          </Text>
          <View style={{ width: 42 }} />
        </View>

        {loading ? (
          <View style={s.centerBlock}>
            <ActivityIndicator size="large" color={MatchdayTheme.colors.blue800} />
          </View>
        ) : error ? (
          <View style={s.centerBlock}>
            <Text style={s.errorText}>{error}</Text>
            <Pressable style={s.retryBtn} onPress={load}>
              <Text style={s.retryBtnText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : org ? (
          <>
            <ScrollView
              contentContainerStyle={[s.content, isAdmin && { paddingBottom: 110 }]}
              automaticallyAdjustKeyboardInsets
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <LeagueTabs
                active={activeTab}
                memberCount={org.members.length}
                openMatches={feed?.matches.filter((match) => !match.bettingLocked).length ?? 0}
                rankingCount={feed?.ranking.length ?? 0}
                onChange={setActiveTab}
              />

              {activeTab === 'palpites' ? (
                <>
                  <CompetitionCard competition={competition} />
                  <PredictionsSection
                    feed={feed}
                    drafts={betDrafts}
                    savingBetId={savingBetId}
                    onChangeDraft={updateDraft}
                    onSaveBet={saveBet}
                  />
                </>
              ) : activeTab === 'ranking' ? (
                <RankingSection ranking={feed?.ranking ?? []} currentUserId={user?.id} />
              ) : (
                <MembersSection members={org.members} currentUserId={user?.id} />
              )}
            </ScrollView>

            {isAdmin && (
              <>
                {fabOpen && <Pressable style={s.fabBackdrop} onPress={closeFab} />}

                <View style={s.fabArea}>
                  <Animated.View style={[
                    s.fabMenu,
                    {
                      opacity: fabAnim,
                      transform: [{ translateY: fabAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                      pointerEvents: fabOpen ? 'auto' : 'none',
                    },
                  ]}>
                    <Pressable
                      style={s.fabMenuItem}
                      onPress={() => { closeFab(); setCompModalOpen(true); }}
                    >
                      <Ionicons name="trophy-outline" size={18} color={MatchdayTheme.colors.blue800} />
                      <Text style={s.fabMenuText}>Competição</Text>
                    </Pressable>
                    <Pressable
                      style={s.fabMenuItem}
                      onPress={() => {
                        closeFab();
                        router.push(`/organization/${orgId}/invite?name=${encodeURIComponent(org.name)}`);
                      }}
                    >
                      <Feather name="users" size={18} color={MatchdayTheme.colors.blue800} />
                      <Text style={s.fabMenuText}>Convidar</Text>
                    </Pressable>
                  </Animated.View>

                  <Pressable style={[s.fab, fabOpen && s.fabActive]} onPress={toggleFab}>
                    <Animated.View style={{
                      transform: [{ rotate: fabAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }],
                    }}>
                      <Feather name="settings" size={22} color={MatchdayTheme.colors.white} />
                    </Animated.View>
                  </Pressable>
                </View>

                <CompetitionModal
                  visible={compModalOpen}
                  orgId={orgId}
                  competitions={competitions}
                  current={competition}
                  onClose={() => setCompModalOpen(false)}
                  onChanged={(c) => { setCompetition(c); setCompModalOpen(false); void load(); }}
                />
              </>
            )}
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function LeagueTabs({
  active,
  memberCount,
  openMatches,
  rankingCount,
  onChange,
}: {
  active: OrgTab;
  memberCount: number;
  openMatches: number;
  rankingCount: number;
  onChange: (tab: OrgTab) => void;
}) {
  const tabs: { icon: keyof typeof Ionicons.glyphMap; id: OrgTab; label: string; meta: string }[] = [
    { icon: 'football-outline', id: 'palpites', label: 'Palpites', meta: `${openMatches} abertos` },
    { icon: 'podium-outline', id: 'ranking', label: 'Ranking', meta: `${rankingCount} jogadores` },
    { icon: 'people-outline', id: 'membros', label: 'Membros', meta: `${memberCount}/10` },
  ];

  return (
    <View style={s.tabsCard}>
      {tabs.map((tab) => {
        const selected = active === tab.id;
        return (
          <Pressable
            key={tab.id}
            style={[s.tabButton, selected && s.tabButtonActive]}
            onPress={() => onChange(tab.id)}
          >
            <Ionicons
              name={tab.icon}
              size={18}
              color={selected ? MatchdayTheme.colors.white : MatchdayTheme.colors.blue800}
            />
            <Text style={[s.tabLabel, selected && s.tabLabelActive]}>{tab.label}</Text>
            <Text style={[s.tabMeta, selected && s.tabMetaActive]}>{tab.meta}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function CompetitionCard({ competition }: { competition: Competition | null }) {
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.cardTitle}>Competição</Text>
        <Ionicons name="trophy" size={16} color={MatchdayTheme.colors.gold400} />
      </View>
      {competition ? (
        <View style={s.currentComp}>
          <View style={{ flex: 1 }}>
            <Text style={s.currentCompName}>{competition.name}</Text>
            {(competition.country || competition.sport) ? (
              <Text style={s.currentCompSub}>
                {[competition.country, competition.sport].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
          </View>
        </View>
      ) : (
        <Text style={s.emptyCompText}>Nenhuma competição configurada ainda.</Text>
      )}
    </View>
  );
}

function PredictionsSection({
  feed,
  drafts,
  savingBetId,
  onChangeDraft,
  onSaveBet,
}: {
  feed: OrganizationFeed | null;
  drafts: Record<string, { home: string; away: string }>;
  savingBetId: string | null;
  onChangeDraft: (matchId: string, side: 'home' | 'away', value: string) => void;
  onSaveBet: (matchId: string) => void;
}) {
  if (!feed?.competition) {
    return (
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Text style={s.cardTitle}>Palpites</Text>
          <Ionicons name="football-outline" size={17} color={MatchdayTheme.colors.blue800} />
        </View>
        <Text style={s.cardSubtitle}>Configure uma competição para liberar os palpites desta liga.</Text>
      </View>
    );
  }

  if (!feed.round || feed.matches.length === 0) {
    return (
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Text style={s.cardTitle}>Palpites</Text>
          <Ionicons name="football-outline" size={17} color={MatchdayTheme.colors.blue800} />
        </View>
        <Text style={s.cardSubtitle}>Ainda não há rodada com partidas cadastradas para esta competição.</Text>
      </View>
    );
  }

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View>
          <Text style={s.cardTitle}>Palpites</Text>
          <Text style={s.cardSubtitle}>{feed.round.name} · {roundStatusLabel(feed.round.status)}</Text>
        </View>
        <View style={s.roundBadge}>
          <Text style={s.roundBadgeText}>R{feed.round.number}</Text>
        </View>
      </View>

      <View style={s.matchList}>
        {feed.matches.map((match) => {
          const draft = drafts[match.id] ?? { home: '', away: '' };
          const locked = match.bettingLocked;
          const saving = savingBetId === match.id;

          return (
            <View key={match.id} style={s.matchRow}>
              <View style={s.matchHeader}>
                <Text style={s.matchDate}>{formatMatchDate(match.scheduledAt)}</Text>
                <View style={[s.matchStatusPill, locked ? s.matchStatusLocked : s.matchStatusOpen]}>
                  <Text style={[s.matchStatusText, locked ? s.matchStatusTextLocked : s.matchStatusTextOpen]}>
                    {locked ? 'Fechado' : 'Aberto'}
                  </Text>
                </View>
              </View>

              <View style={s.teamsRow}>
                <Text style={s.teamName} numberOfLines={1}>{match.homeTeamShortName ?? match.homeTeamName}</Text>
                <Text style={s.versus}>x</Text>
                <Text style={[s.teamName, s.teamNameRight]} numberOfLines={1}>{match.awayTeamShortName ?? match.awayTeamName}</Text>
              </View>

              <View style={s.betRow}>
                <TextInput
                  value={draft.home}
                  onChangeText={(value) => onChangeDraft(match.id, 'home', value)}
                  editable={!locked && !saving}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="-"
                  placeholderTextColor={MatchdayTheme.colors.slate300}
                  style={[s.scoreInput, locked && s.scoreInputLocked]}
                />
                <Text style={s.scoreSeparator}>:</Text>
                <TextInput
                  value={draft.away}
                  onChangeText={(value) => onChangeDraft(match.id, 'away', value)}
                  editable={!locked && !saving}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="-"
                  placeholderTextColor={MatchdayTheme.colors.slate300}
                  style={[s.scoreInput, locked && s.scoreInputLocked]}
                />
                <Pressable
                  style={[s.saveBetBtn, (locked || saving) && s.saveBetBtnDisabled]}
                  disabled={locked || saving}
                  onPress={() => onSaveBet(match.id)}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={MatchdayTheme.colors.white} />
                  ) : (
                    <Text style={s.saveBetText}>{match.bet ? 'Atualizar' : 'Salvar'}</Text>
                  )}
                </Pressable>
              </View>

              {match.status === 'finished' ? (
                <Text style={s.matchResult}>
                  Final: {match.homeScore ?? '-'} x {match.awayScore ?? '-'} · {match.bet ? `${match.bet.points} pts` : 'sem palpite'}
                </Text>
              ) : match.bet ? (
                <Text style={s.matchResult}>Seu palpite: {match.bet.predictedHomeScore} x {match.bet.predictedAwayScore}</Text>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function RankingSection({ ranking, currentUserId }: { ranking: OrganizationFeed['ranking']; currentUserId?: string }) {
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.cardTitle}>Ranking</Text>
        <Ionicons name="podium" size={17} color={MatchdayTheme.colors.gold400} />
      </View>
      {ranking.length === 0 ? (
        <Text style={s.cardSubtitle}>O ranking aparece assim que a liga tiver membros.</Text>
      ) : (
        <View style={s.rankingList}>
          {ranking.map((entry) => {
            const isMe = entry.userId === currentUserId;
            return (
              <View key={entry.userId} style={[s.rankingRow, isMe && s.rankingRowMe]}>
                <View style={s.rankingPosition}>
                  <Text style={s.rankingPositionText}>{entry.position}</Text>
                </View>
                <View style={s.rankingMeta}>
                  <Text style={s.rankingName} numberOfLines={1}>{entry.user.name ?? entry.user.email}</Text>
                  <Text style={s.rankingStats}>{entry.exactScores} exatos · {entry.correctOutcomes} resultados</Text>
                </View>
                <Text style={s.rankingPoints}>{entry.totalPoints}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function MembersSection({ members, currentUserId }: { members: OrgFull['members']; currentUserId?: string }) {
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.cardTitle}>Membros</Text>
        <View style={s.countChip}>
          <Text style={s.countChipText}>{members.length}/10</Text>
        </View>
      </View>
      <View style={s.list}>
        {members.map((m) => (
          <View key={m.id} style={s.memberRow}>
            <View style={s.memberAvatar}>
              <Text style={s.memberAvatarText}>
                {(m.user.name ?? m.user.email).slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={s.memberMeta}>
              {m.user.name ? <Text style={s.memberName}>{m.user.name}</Text> : null}
              <Text style={s.memberEmail}>{m.user.email}</Text>
            </View>
            <View style={s.memberRolePill}>
              <Text style={s.memberRoleText}>{m.role}</Text>
            </View>
            {m.userId === currentUserId ? (
              <View style={s.meBadge}><Text style={s.meBadgeText}>Você</Text></View>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

function CompetitionModal({
  visible,
  orgId,
  competitions,
  current,
  onClose,
  onChanged,
}: {
  visible: boolean;
  orgId: string;
  competitions: Competition[];
  current: Competition | null;
  onClose: () => void;
  onChanged: (c: Competition | null) => void;
}) {
  const [saving, setSaving] = useState(false);

  const pick = (comp: Competition) => {
    Alert.alert('Competição', `Vincular "${comp.name}" a esta liga?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          setSaving(true);
          try {
            await setOrgCompetition(orgId, comp.id);
            onChanged(comp);
          } catch {}
          setSaving(false);
        },
      },
    ]);
  };

  const remove = () => {
    Alert.alert('Remover competição', 'Deseja desvincular a competição desta liga?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            await setOrgCompetition(orgId, null);
            onChanged(null);
          } catch {}
          setSaving(false);
        },
      },
    ]);
  };

  if (!visible) return null;

  return (
    <View style={s.modalOverlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={s.modalSheet}>
        <View style={s.modalHandle} />
        <View style={s.modalHeaderRow}>
          <Text style={s.modalTitle}>Competição</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Feather name="x" size={20} color={MatchdayTheme.colors.slate500} />
          </Pressable>
        </View>
        <Text style={s.modalSubtitle}>Escolha a competição dos palpites desta liga.</Text>

        {saving ? (
          <ActivityIndicator color={MatchdayTheme.colors.blue800} style={{ padding: 24 }} />
        ) : (
          <View style={s.compList}>
            {competitions.length === 0 ? (
              <Text style={s.cardSubtitle}>Nenhuma competição disponível.</Text>
            ) : (
              competitions.map((comp) => {
                const isCurrent = comp.id === current?.id;
                return (
                  <Pressable
                    key={comp.id}
                    style={[s.compRow, isCurrent && s.compRowActive]}
                    onPress={() => isCurrent ? remove() : pick(comp)}
                  >
                    <Ionicons
                      name={isCurrent ? 'trophy' : 'trophy-outline'}
                      size={18}
                      color={isCurrent ? MatchdayTheme.colors.gold400 : MatchdayTheme.colors.blue700}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[s.compName, isCurrent && s.compNameActive]}>{comp.name}</Text>
                      {(comp.country || comp.sport) ? (
                        <Text style={s.compSub}>{[comp.country, comp.sport].filter(Boolean).join(' · ')}</Text>
                      ) : null}
                    </View>
                    {isCurrent && <Feather name="check" size={16} color={MatchdayTheme.colors.blue800} />}
                  </Pressable>
                );
              })
            )}
          </View>
        )}
      </View>
    </View>
  );
}

function createBetDrafts(matches: OrganizationFeedMatch[]) {
  return Object.fromEntries(
    matches.map((match) => [
      match.id,
      {
        home: match.bet ? String(match.bet.predictedHomeScore) : '',
        away: match.bet ? String(match.bet.predictedAwayScore) : '',
      },
    ]),
  );
}

function formatMatchDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

function roundStatusLabel(status: NonNullable<OrganizationFeed['round']>['status']) {
  if (status === 'finished') return 'finalizada';
  if (status === 'live') return 'em andamento';
  if (status === 'locked') return 'fechada';
  if (status === 'open') return 'aberta';
  return 'sem partidas';
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: MatchdayTheme.colors.night },
  shell: { flex: 1 },
  topBar: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between', padding: 16 },
  backBtn: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.surfaceElevated, borderColor: 'rgba(12,74,110,0.10)', borderRadius: MatchdayTheme.radii.pill, borderWidth: 1, height: 42, justifyContent: 'center', width: 42 },
  topBarTitle: { color: MatchdayTheme.colors.blue900, flex: 1, fontFamily: Fonts.display, fontSize: 18, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase' },
  centerBlock: { alignItems: 'center', flex: 1, gap: 16, justifyContent: 'center', padding: 24 },
  errorText: { color: MatchdayTheme.colors.danger, fontFamily: Fonts.sans, fontSize: 14, textAlign: 'center' },
  retryBtn: { backgroundColor: MatchdayTheme.colors.blue800, borderRadius: MatchdayTheme.radii.pill, paddingHorizontal: 20, paddingVertical: 10 },
  retryBtnText: { color: MatchdayTheme.colors.white, fontFamily: Fonts.sans, fontSize: 14, fontWeight: '700' },
  content: { gap: 16, padding: 16, paddingBottom: 48 },
  tabsCard: {
    backgroundColor: MatchdayTheme.colors.surfaceElevated,
    borderColor: 'rgba(12,74,110,0.08)',
    borderRadius: MatchdayTheme.radii.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 8,
    ...MatchdayTheme.shadows.soft,
  },
  tabButton: {
    alignItems: 'center',
    backgroundColor: MatchdayTheme.colors.surface,
    borderColor: 'rgba(12,74,110,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: 3,
    minHeight: 78,
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  tabButtonActive: { backgroundColor: MatchdayTheme.colors.blue800, borderColor: MatchdayTheme.colors.blue800 },
  tabLabel: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.sans, fontSize: 12, fontWeight: '900' },
  tabLabelActive: { color: MatchdayTheme.colors.white },
  tabMeta: { color: MatchdayTheme.colors.slate500, fontFamily: Fonts.sans, fontSize: 10, fontWeight: '800', textAlign: 'center' },
  tabMetaActive: { color: MatchdayTheme.colors.sky200 },
  card: { backgroundColor: MatchdayTheme.colors.surfaceElevated, borderColor: 'rgba(12,74,110,0.08)', borderRadius: MatchdayTheme.radii.xl, borderWidth: 1, gap: 12, padding: 18, ...MatchdayTheme.shadows.soft },
  cardHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  cardTitle: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.display, fontSize: 20, fontWeight: '900', textTransform: 'uppercase' },
  cardSubtitle: { color: MatchdayTheme.colors.slate500, fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },
  roundBadge: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.blue900, borderRadius: MatchdayTheme.radii.pill, height: 38, justifyContent: 'center', width: 38 },
  roundBadgeText: { color: MatchdayTheme.colors.white, fontFamily: Fonts.display, fontSize: 13, fontWeight: '900' },
  countChip: { backgroundColor: MatchdayTheme.colors.surface, borderColor: 'rgba(12,74,110,0.10)', borderRadius: MatchdayTheme.radii.pill, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  countChipText: { color: MatchdayTheme.colors.blue800, fontFamily: Fonts.sans, fontSize: 12, fontWeight: '800' },
  currentComp: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  currentCompName: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.sans, fontSize: 15, fontWeight: '700' },
  currentCompSub: { color: MatchdayTheme.colors.slate500, fontFamily: Fonts.sans, fontSize: 12, marginTop: 2 },
  emptyCompText: { color: MatchdayTheme.colors.slate500, fontFamily: Fonts.sans, fontSize: 13 },
  matchList: { gap: 12 },
  matchRow: { backgroundColor: MatchdayTheme.colors.surface, borderColor: 'rgba(12,74,110,0.08)', borderRadius: 18, borderWidth: 1, gap: 10, padding: 12 },
  matchHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  matchDate: { color: MatchdayTheme.colors.slate500, fontFamily: Fonts.sans, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  matchStatusPill: { borderRadius: MatchdayTheme.radii.pill, paddingHorizontal: 9, paddingVertical: 4 },
  matchStatusOpen: { backgroundColor: '#ecfccb' },
  matchStatusLocked: { backgroundColor: MatchdayTheme.colors.slate200 },
  matchStatusText: { fontFamily: Fonts.sans, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  matchStatusTextOpen: { color: '#365314' },
  matchStatusTextLocked: { color: MatchdayTheme.colors.slate700 },
  teamsRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  teamName: { color: MatchdayTheme.colors.blue900, flex: 1, fontFamily: Fonts.sans, fontSize: 14, fontWeight: '800' },
  teamNameRight: { textAlign: 'right' },
  versus: { color: MatchdayTheme.colors.slate500, fontFamily: Fonts.display, fontSize: 14, fontWeight: '900' },
  betRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  scoreInput: { backgroundColor: MatchdayTheme.colors.white, borderColor: 'rgba(12,74,110,0.16)', borderRadius: 12, borderWidth: 1, color: MatchdayTheme.colors.blue900, fontFamily: Fonts.display, fontSize: 20, fontWeight: '900', height: 46, textAlign: 'center', width: 52 },
  scoreInputLocked: { backgroundColor: MatchdayTheme.colors.slate100, color: MatchdayTheme.colors.slate500 },
  scoreSeparator: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.display, fontSize: 18, fontWeight: '900' },
  saveBetBtn: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.blue800, borderRadius: MatchdayTheme.radii.pill, flex: 1, height: 44, justifyContent: 'center' },
  saveBetBtnDisabled: { backgroundColor: MatchdayTheme.colors.slate300 },
  saveBetText: { color: MatchdayTheme.colors.white, fontFamily: Fonts.sans, fontSize: 13, fontWeight: '900' },
  matchResult: { color: MatchdayTheme.colors.slate500, fontFamily: Fonts.sans, fontSize: 12, fontWeight: '700' },
  rankingList: { gap: 9 },
  rankingRow: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.surface, borderColor: 'rgba(12,74,110,0.08)', borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 10, padding: 12 },
  rankingRowMe: { backgroundColor: '#f7fee7', borderColor: 'rgba(101,163,13,0.32)' },
  rankingPosition: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.blue900, borderRadius: MatchdayTheme.radii.pill, height: 34, justifyContent: 'center', width: 34 },
  rankingPositionText: { color: MatchdayTheme.colors.white, fontFamily: Fonts.display, fontSize: 13, fontWeight: '900' },
  rankingMeta: { flex: 1 },
  rankingName: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.sans, fontSize: 14, fontWeight: '800' },
  rankingStats: { color: MatchdayTheme.colors.slate500, fontFamily: Fonts.sans, fontSize: 11, marginTop: 2 },
  rankingPoints: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.display, fontSize: 24, fontWeight: '900' },
  list: { gap: 10 },
  memberRow: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.surface, borderColor: 'rgba(12,74,110,0.08)', borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 10, padding: 12 },
  memberAvatar: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.blue900, borderRadius: MatchdayTheme.radii.pill, height: 38, justifyContent: 'center', width: 38 },
  memberAvatarText: { color: MatchdayTheme.colors.white, fontFamily: Fonts.display, fontSize: 14, fontWeight: '900' },
  memberMeta: { flex: 1 },
  memberName: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.sans, fontSize: 14, fontWeight: '700' },
  memberEmail: { color: MatchdayTheme.colors.slate500, fontFamily: Fonts.sans, fontSize: 12 },
  memberRolePill: { backgroundColor: MatchdayTheme.colors.night, borderRadius: MatchdayTheme.radii.pill, paddingHorizontal: 10, paddingVertical: 4 },
  memberRoleText: { color: MatchdayTheme.colors.blue700, fontFamily: Fonts.sans, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  meBadge: { backgroundColor: MatchdayTheme.colors.lime300, borderRadius: MatchdayTheme.radii.pill, paddingHorizontal: 8, paddingVertical: 3 },
  meBadgeText: { color: MatchdayTheme.colors.slate900, fontFamily: Fonts.sans, fontSize: 10, fontWeight: '800' },
  // FAB speed-dial
  fabBackdrop: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
  fabArea: { alignItems: 'flex-end', bottom: 28, position: 'absolute', right: 24, zIndex: 20 },
  fabMenu: { alignItems: 'flex-end', gap: 10, marginBottom: 14 },
  fabMenuItem: {
    alignItems: 'center',
    backgroundColor: MatchdayTheme.colors.surfaceElevated,
    borderColor: 'rgba(12,74,110,0.12)',
    borderRadius: MatchdayTheme.radii.pill,
    borderWidth: 1,
    elevation: 4,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  fabMenuText: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.sans, fontSize: 14, fontWeight: '700' },
  fab: {
    alignItems: 'center',
    backgroundColor: MatchdayTheme.colors.blue800,
    borderRadius: MatchdayTheme.radii.pill,
    elevation: 6,
    height: 58,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    width: 58,
  },
  fabActive: { backgroundColor: MatchdayTheme.colors.blue900 },
  // Competition bottom sheet
  modalOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 50 },
  modalSheet: {
    backgroundColor: MatchdayTheme.colors.surfaceElevated,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    gap: 12,
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  modalHandle: { alignSelf: 'center', backgroundColor: 'rgba(12,74,110,0.15)', borderRadius: 4, height: 4, marginBottom: 8, width: 40 },
  modalHeaderRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  modalTitle: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.display, fontSize: 24, fontWeight: '900', textTransform: 'uppercase' },
  modalSubtitle: { color: MatchdayTheme.colors.slate500, fontFamily: Fonts.sans, fontSize: 13 },
  compList: { gap: 8 },
  compRow: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.surface, borderColor: 'rgba(12,74,110,0.08)', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 14 },
  compRowActive: { backgroundColor: '#eff6ff', borderColor: MatchdayTheme.colors.blue800 },
  compName: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.sans, fontSize: 14, fontWeight: '700' },
  compNameActive: { color: MatchdayTheme.colors.blue800 },
  compSub: { color: MatchdayTheme.colors.slate500, fontFamily: Fonts.sans, fontSize: 12, marginTop: 2 },
});
