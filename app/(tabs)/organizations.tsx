import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, MatchdayTheme } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { createOrganization, getOrgPreview, joinOrganizationBySlug, listOrganizations, type Organization, slugifyOrganizationName } from '@/lib/matchday-api';

export default function OrganizationsScreen() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await listOrganizations();
      setOrganizations(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar suas ligas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const onCreated = (org: Organization) => {
    setOrganizations((prev) => [org, ...prev.filter((o) => o.id !== org.id)]);
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={MatchdayTheme.colors.blue800} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={s.headerRow}>
          <View>
            <Text style={s.eyebrow}>Suas ligas</Text>
            <Text style={s.heading}>Organizações</Text>
          </View>
        </View>

        {error ? (
          <View style={s.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color={MatchdayTheme.colors.danger} />
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : null}

        {loading && organizations.length === 0 ? (
          <View style={s.loadingBlock}>
            <ActivityIndicator color={MatchdayTheme.colors.blue800} />
          </View>
        ) : organizations.length > 0 ? (
          <View style={s.card}>
            <Text style={s.cardTitle}>Minhas ligas</Text>
            <View style={s.orgList}>
              {organizations.map((org) => (
                <Pressable
                  key={org.id}
                  style={s.orgRow}
                  onPress={() => router.push(`/organization/${org.id}?name=${encodeURIComponent(org.name)}`)}
                >
                  <View style={s.orgIcon}>
                    <Ionicons name="people" size={18} color={MatchdayTheme.colors.white} />
                  </View>
                  <View style={s.orgMeta}>
                    <Text style={s.orgName}>{org.name}</Text>
                    <Text style={s.orgSlug}>/{org.slug}</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={MatchdayTheme.colors.slate300} />
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <View style={s.emptyCard}>
            <View style={s.emptyIcon}>
              <Ionicons name="flag-outline" size={26} color={MatchdayTheme.colors.white} />
            </View>
            <Text style={s.emptyTitle}>Crie sua primeira liga</Text>
            <Text style={s.emptyText}>Monte um grupo privado e convide a turma para competir.</Text>
          </View>
        )}

        {user?.email ? (
          <Text style={s.footerNote}>Logado como {user.email}</Text>
        ) : null}
      </ScrollView>

      <View style={s.fabGroup}>
        <Pressable style={s.fabSecondary} onPress={() => setJoinModalVisible(true)}>
          <Feather name="hash" size={20} color={MatchdayTheme.colors.blue800} />
          <Text style={s.fabSecondaryText}>Código</Text>
        </Pressable>
        <Pressable style={s.fab} onPress={() => setModalVisible(true)}>
          <Feather name="plus" size={24} color={MatchdayTheme.colors.white} />
        </Pressable>
      </View>

      <CreateOrgModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreated={onCreated}
      />
      <JoinByCodeModal
        visible={joinModalVisible}
        onClose={() => setJoinModalVisible(false)}
        onJoined={(org) => {
          setOrganizations((prev) => (prev.some((o) => o.id === org.id) ? prev : [org, ...prev]));
          setJoinModalVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

function CreateOrgModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: (org: Organization) => void;
}) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generatedSlug = useMemo(() => slugifyOrganizationName(name), [name]);
  const canCreate = name.trim().length >= 3 && (slug.trim() || generatedSlug).length >= 3 && !saving;

  const reset = () => {
    setName('');
    setSlug('');
    setError(null);
    setSaving(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    if (!canCreate) return;
    setSaving(true);
    setError(null);
    try {
      const org = await createOrganization({
        name: name.trim(),
        slug: slugifyOrganizationName(slug.trim() || generatedSlug),
      });
      reset();
      onCreated(org);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível criar a liga.');
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={s.modalSafe}>
          <ScrollView contentContainerStyle={s.modalContent} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets showsVerticalScrollIndicator={false}>

            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Nova liga</Text>
              <Pressable style={s.closeButton} onPress={handleClose}>
                <Feather name="x" size={20} color={MatchdayTheme.colors.blue800} />
              </Pressable>
            </View>

            <Text style={s.modalSubtitle}>Limite: 3 ligas · 10 membros cada.</Text>

            <View style={s.formSection}>
              <View style={s.fieldBlock}>
                <Text style={s.fieldLabel}>Nome da liga</Text>
                <View style={s.inputShell}>
                  <Feather name="flag" size={16} color={MatchdayTheme.colors.slate500} />
                  <TextInput
                    placeholder="Ex: Liga da Sexta"
                    placeholderTextColor={MatchdayTheme.colors.slate500}
                    style={s.input}
                    value={name}
                    onChangeText={setName}
                    editable={!saving}
                    returnKeyType="next"
                    autoFocus
                  />
                </View>
              </View>

              <View style={s.fieldBlock}>
                <Text style={s.fieldLabel}>Slug do convite</Text>
                <View style={s.inputShell}>
                  <Feather name="link" size={16} color={MatchdayTheme.colors.slate500} />
                  <TextInput
                    placeholder={generatedSlug || 'liga-da-sexta'}
                    placeholderTextColor={MatchdayTheme.colors.slate500}
                    style={s.input}
                    value={slug}
                    onChangeText={setSlug}
                    autoCapitalize="none"
                    editable={!saving}
                    returnKeyType="done"
                    onSubmitEditing={submit}
                  />
                </View>
                {name.trim().length >= 3 ? (
                  <Text style={s.slugHint}>pitacoapp://organizations/{slug.trim() || generatedSlug}/join</Text>
                ) : null}
              </View>

              {error ? (
                <View style={s.errorBanner}>
                  <Ionicons name="alert-circle-outline" size={15} color={MatchdayTheme.colors.danger} />
                  <Text style={s.errorText}>{error}</Text>
                </View>
              ) : null}

              <Pressable
                disabled={!canCreate}
                style={[s.submitButton, !canCreate && s.submitButtonDisabled]}
                onPress={submit}
              >
                {saving
                  ? <ActivityIndicator size="small" color={MatchdayTheme.colors.white} />
                  : <Feather name="check" size={17} color={MatchdayTheme.colors.white} />}
                <Text style={s.submitButtonText}>{saving ? 'Criando...' : 'Criar liga'}</Text>
              </Pressable>
            </View>
          </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

type OrgPreview = { id: string; name: string; slug: string; memberCount: number };

function JoinByCodeModal({
  visible,
  onClose,
  onJoined,
}: {
  visible: boolean;
  onClose: () => void;
  onJoined: (org: Organization) => void;
}) {
  const [code, setCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [preview, setPreview] = useState<OrgPreview | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const reset = () => {
    setCode('');
    setPreview(null);
    setSearchError(null);
    setJoinError(null);
    setSearching(false);
    setJoining(false);
  };

  const search = async () => {
    const slug = slugifyOrganizationName(code.trim());
    if (!slug) return;
    setSearching(true);
    setPreview(null);
    setSearchError(null);
    setJoinError(null);
    try {
      const data = await getOrgPreview(slug);
      setPreview(data);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : 'Código inválido ou organização não encontrada.');
    } finally {
      setSearching(false);
    }
  };

  const join = async () => {
    if (!preview || joining) return;
    setJoining(true);
    setJoinError(null);
    try {
      const result = await joinOrganizationBySlug(preview.slug);
      onJoined(result.organization);
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : 'Não foi possível entrar na liga.');
      setJoining(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { reset(); onClose(); }}>
      <SafeAreaView style={s.modalSafe}>
        <ScrollView contentContainerStyle={s.modalContent} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets showsVerticalScrollIndicator={false}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Código</Text>
            <Pressable style={s.closeButton} onPress={() => { reset(); onClose(); }}>
              <Feather name="x" size={20} color={MatchdayTheme.colors.blue800} />
            </Pressable>
          </View>
          <Text style={s.modalSubtitle}>Digite o código/slug da liga para entrar.</Text>

          <View style={s.formSection}>
            <View style={s.fieldBlock}>
              <Text style={s.fieldLabel}>Código da liga</Text>
              <View style={s.inputShell}>
                <Feather name="hash" size={16} color={MatchdayTheme.colors.slate500} />
                <TextInput
                  placeholder="ex: liga-da-sexta"
                  placeholderTextColor={MatchdayTheme.colors.slate500}
                  style={s.input}
                  value={code}
                  onChangeText={(v) => { setCode(v); setPreview(null); setSearchError(null); setJoinError(null); }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  onSubmitEditing={search}
                  editable={!searching && !joining}
                />
              </View>
            </View>

            <Pressable
              style={[s.submitButton, (!code.trim() || searching || joining) && s.submitButtonDisabled]}
              disabled={!code.trim() || searching || joining}
              onPress={search}
            >
              {searching
                ? <ActivityIndicator size="small" color={MatchdayTheme.colors.white} />
                : <Feather name="search" size={17} color={MatchdayTheme.colors.white} />}
              <Text style={s.submitButtonText}>{searching ? 'Buscando...' : 'Buscar liga'}</Text>
            </Pressable>

            {searchError ? (
              <View style={s.errorBanner}>
                <Ionicons name="alert-circle-outline" size={15} color={MatchdayTheme.colors.danger} />
                <Text style={s.errorText}>{searchError}</Text>
              </View>
            ) : null}

            {preview ? (
              <View style={js.previewCard}>
                <View style={js.previewIcon}>
                  <Ionicons name="people" size={22} color={MatchdayTheme.colors.white} />
                </View>
                <View style={js.previewInfo}>
                  <Text style={js.previewName}>{preview.name}</Text>
                  <Text style={js.previewSlug}>/{preview.slug}</Text>
                  <Text style={js.previewMembers}>{preview.memberCount} / 10 membros</Text>
                </View>
              </View>
            ) : null}

            {joinError ? (
              <View style={s.errorBanner}>
                <Ionicons name="alert-circle-outline" size={15} color={MatchdayTheme.colors.danger} />
                <Text style={s.errorText}>{joinError}</Text>
              </View>
            ) : null}

            {preview ? (
              <Pressable
                style={[s.submitButton, joining && s.submitButtonDisabled]}
                disabled={joining}
                onPress={join}
              >
                {joining
                  ? <ActivityIndicator size="small" color={MatchdayTheme.colors.white} />
                  : <Feather name="user-plus" size={17} color={MatchdayTheme.colors.white} />}
                <Text style={s.submitButtonText}>{joining ? 'Entrando...' : 'Entrar na liga'}</Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const js = StyleSheet.create({
  previewCard: {
    alignItems: 'center',
    backgroundColor: MatchdayTheme.colors.blue900,
    borderRadius: 20,
    flexDirection: 'row',
    gap: 14,
    padding: 18,
  },
  previewIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 40,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  previewInfo: { flex: 1, gap: 3 },
  previewName: { color: MatchdayTheme.colors.white, fontFamily: Fonts.display, fontSize: 20, fontWeight: '900', textTransform: 'uppercase' },
  previewSlug: { color: 'rgba(196,231,255,0.7)', fontFamily: Fonts.sans, fontSize: 12 },
  previewMembers: { color: 'rgba(196,231,255,0.85)', fontFamily: Fonts.sans, fontSize: 13, fontWeight: '600', marginTop: 2 },
});

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: MatchdayTheme.colors.night },
  content: { gap: 16, padding: 20, paddingBottom: 110 },
  headerRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  eyebrow: { color: MatchdayTheme.colors.blue700, fontFamily: Fonts.sans, fontSize: 12, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  heading: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.display, fontSize: 34, fontWeight: '900', lineHeight: 36, textTransform: 'uppercase' },
  fabGroup: {
    alignItems: 'center',
    bottom: 28,
    flexDirection: 'row',
    gap: 12,
    position: 'absolute',
    right: 24,
  },
  fabSecondary: {
    alignItems: 'center',
    backgroundColor: MatchdayTheme.colors.surfaceElevated,
    borderColor: 'rgba(12,74,110,0.14)',
    borderRadius: MatchdayTheme.radii.pill,
    borderWidth: 1,
    elevation: 4,
    flexDirection: 'row',
    gap: 6,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  fabSecondaryText: { color: MatchdayTheme.colors.blue800, fontFamily: Fonts.sans, fontSize: 13, fontWeight: '800' },
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
  loadingBlock: { alignItems: 'center', padding: 40 },
  errorBanner: { alignItems: 'center', backgroundColor: '#fff1f2', borderColor: '#fecdd3', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingVertical: 12 },
  errorText: { color: MatchdayTheme.colors.danger, flex: 1, fontFamily: Fonts.sans, fontSize: 13, fontWeight: '600' },
  card: { backgroundColor: MatchdayTheme.colors.surfaceElevated, borderColor: 'rgba(12,74,110,0.08)', borderRadius: MatchdayTheme.radii.xl, borderWidth: 1, gap: 4, padding: 20, ...MatchdayTheme.shadows.soft },
  cardTitle: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.display, fontSize: 20, fontWeight: '900', textTransform: 'uppercase' },
  orgList: { gap: 10, marginTop: 12 },
  orgRow: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.surface, borderColor: 'rgba(12,74,110,0.08)', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 12, minHeight: 64, paddingHorizontal: 14, paddingVertical: 10 },
  orgIcon: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.blue800, borderRadius: MatchdayTheme.radii.pill, height: 40, justifyContent: 'center', width: 40 },
  orgMeta: { flex: 1 },
  orgName: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.sans, fontSize: 15, fontWeight: '800' },
  orgSlug: { color: MatchdayTheme.colors.slate500, fontFamily: Fonts.sans, fontSize: 12, marginTop: 3 },
  emptyCard: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.blue900, borderRadius: MatchdayTheme.radii.xl, gap: 10, paddingHorizontal: 24, paddingVertical: 32 },
  emptyIcon: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: MatchdayTheme.radii.pill, height: 56, justifyContent: 'center', width: 56 },
  emptyTitle: { color: MatchdayTheme.colors.white, fontFamily: Fonts.display, fontSize: 24, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase' },
  emptyText: { color: 'rgba(196,231,255,0.78)', fontFamily: Fonts.sans, fontSize: 14, lineHeight: 22, textAlign: 'center' },
  footerNote: { color: MatchdayTheme.colors.slate500, fontFamily: Fonts.sans, fontSize: 12, textAlign: 'center' },
  // modal
  modalSafe: { flex: 1, backgroundColor: MatchdayTheme.colors.night },
  modalContent: { gap: 8, padding: 24, paddingBottom: 48 },
  modalHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  modalTitle: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.display, fontSize: 30, fontWeight: '900', textTransform: 'uppercase' },
  modalSubtitle: { color: MatchdayTheme.colors.slate500, fontFamily: Fonts.sans, fontSize: 13, marginBottom: 8 },
  closeButton: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.surface, borderColor: 'rgba(12,74,110,0.10)', borderRadius: MatchdayTheme.radii.pill, borderWidth: 1, height: 40, justifyContent: 'center', width: 40 },
  formSection: { gap: 18 },
  fieldBlock: { gap: 8 },
  fieldLabel: { color: MatchdayTheme.colors.blue700, fontFamily: Fonts.sans, fontSize: 14, fontWeight: '600' },
  inputShell: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.surface, borderColor: 'rgba(12,74,110,0.12)', borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 10, minHeight: 56, paddingHorizontal: 16 },
  input: { color: MatchdayTheme.colors.blue900, flex: 1, fontFamily: Fonts.sans, fontSize: 15 },
  slugHint: { color: MatchdayTheme.colors.slate500, fontFamily: Fonts.sans, fontSize: 11, marginTop: 2 },
  submitButton: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.blue800, borderRadius: MatchdayTheme.radii.pill, flexDirection: 'row', gap: 10, justifyContent: 'center', minHeight: 56, paddingHorizontal: 18 },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: MatchdayTheme.colors.white, fontFamily: Fonts.sans, fontSize: 15, fontWeight: '800' },
});
