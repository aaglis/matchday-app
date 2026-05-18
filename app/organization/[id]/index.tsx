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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackgroundOrbs } from '@/components/auth/background-orbs';
import { Fonts, MatchdayTheme } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import {
  type Competition,
  getOrgCompetition,
  getOrgFull,
  listCompetitions,
  type OrgFull,
  setOrgCompetition,
} from '@/lib/matchday-api';

export default function OrganizationDetailScreen() {
  const params = useLocalSearchParams<{ id?: string; name?: string }>();
  const orgId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { user } = useAuth();

  const [org, setOrg] = useState<OrgFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [fabOpen, setFabOpen] = useState(false);
  const [compModalOpen, setCompModalOpen] = useState(false);
  const fabAnim = useRef(new Animated.Value(0)).current;

  const myRole = org?.members.find((m) => m.userId === user?.id)?.role ?? 'member';
  const isAdmin = myRole === 'admin' || myRole === 'owner';

  const load = useCallback(async () => {
    if (!orgId) return;
    setError(null);
    try {
      const [full, compResult, comps] = await Promise.all([
        getOrgFull(orgId),
        getOrgCompetition(orgId).catch(() => ({ competition: null })),
        listCompetitions().catch(() => [] as Competition[]),
      ]);
      setOrg(full);
      setCompetition(compResult.competition);
      setCompetitions(comps);
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
              <OrgHeader org={org} isAdmin={isAdmin} myRole={myRole} />
              <CompetitionCard competition={competition} />
              <MembersSection members={org.members} currentUserId={user?.id} />
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
                  onChanged={(c) => { setCompetition(c); setCompModalOpen(false); }}
                />
              </>
            )}
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function OrgHeader({ org, isAdmin, myRole }: { org: OrgFull; isAdmin: boolean; myRole: string }) {
  return (
    <View style={s.orgHeader}>
      <View style={s.orgIconLg}>
        <Ionicons name="people" size={28} color={MatchdayTheme.colors.white} />
      </View>
      <View style={s.orgHeaderMeta}>
        <Text style={s.orgName}>{org.name}</Text>
        <Text style={s.orgSlug}>/{org.slug}</Text>
      </View>
      <View style={[s.roleBadge, isAdmin && s.roleBadgeAdmin]}>
        <Text style={[s.roleBadgeText, isAdmin && s.roleBadgeTextAdmin]}>
          {myRole === 'owner' ? 'Dono' : isAdmin ? 'Admin' : 'Membro'}
        </Text>
      </View>
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
  orgHeader: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.blue900, borderRadius: MatchdayTheme.radii.xl, flexDirection: 'row', gap: 14, padding: 18 },
  orgIconLg: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: MatchdayTheme.radii.pill, height: 52, justifyContent: 'center', width: 52 },
  orgHeaderMeta: { flex: 1 },
  orgName: { color: MatchdayTheme.colors.white, fontFamily: Fonts.display, fontSize: 22, fontWeight: '900', textTransform: 'uppercase' },
  orgSlug: { color: MatchdayTheme.colors.sky200, fontFamily: Fonts.sans, fontSize: 13, marginTop: 2 },
  roleBadge: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: MatchdayTheme.radii.pill, paddingHorizontal: 12, paddingVertical: 6 },
  roleBadgeAdmin: { backgroundColor: MatchdayTheme.colors.lime300 },
  roleBadgeText: { color: MatchdayTheme.colors.sky200, fontFamily: Fonts.sans, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  roleBadgeTextAdmin: { color: MatchdayTheme.colors.slate900 },
  card: { backgroundColor: MatchdayTheme.colors.surfaceElevated, borderColor: 'rgba(12,74,110,0.08)', borderRadius: MatchdayTheme.radii.xl, borderWidth: 1, gap: 12, padding: 18, ...MatchdayTheme.shadows.soft },
  cardHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  cardTitle: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.display, fontSize: 20, fontWeight: '900', textTransform: 'uppercase' },
  cardSubtitle: { color: MatchdayTheme.colors.slate500, fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },
  countChip: { backgroundColor: MatchdayTheme.colors.surface, borderColor: 'rgba(12,74,110,0.10)', borderRadius: MatchdayTheme.radii.pill, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  countChipText: { color: MatchdayTheme.colors.blue800, fontFamily: Fonts.sans, fontSize: 12, fontWeight: '800' },
  currentComp: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  currentCompName: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.sans, fontSize: 15, fontWeight: '700' },
  currentCompSub: { color: MatchdayTheme.colors.slate500, fontFamily: Fonts.sans, fontSize: 12, marginTop: 2 },
  emptyCompText: { color: MatchdayTheme.colors.slate500, fontFamily: Fonts.sans, fontSize: 13 },
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
