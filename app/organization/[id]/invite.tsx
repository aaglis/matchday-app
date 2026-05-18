import { Feather, Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackgroundOrbs } from '@/components/auth/background-orbs';
import { Fonts, MatchdayTheme } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { cancelInvitation, getOrgFull, inviteMember, type OrgFull } from '@/lib/matchday-api';

export default function InviteScreen() {
  const params = useLocalSearchParams<{ id?: string; name?: string }>();
  const orgId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { user } = useAuth();

  const [org, setOrg] = useState<OrgFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const myRole = org?.members.find((m) => m.userId === user?.id)?.role ?? 'member';
  const isAdmin = myRole === 'admin' || myRole === 'owner';

  const load = useCallback(async () => {
    if (!orgId) return;
    setError(null);
    try {
      setOrg(await getOrgFull(orgId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dados de convite.');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { void load(); }, [load]);

  if (!orgId) return null;

  return (
    <SafeAreaView style={s.safe}>
      <BackgroundOrbs />
      <View style={s.shell}>
        <View style={s.topBar}>
          <Pressable style={s.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={20} color={MatchdayTheme.colors.blue800} />
          </Pressable>
          <Text style={s.topBarTitle} numberOfLines={1}>Convidar</Text>
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
          <ScrollView
            contentContainerStyle={s.content}
            automaticallyAdjustKeyboardInsets
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <InviteCodeSection slug={org.slug} orgName={org.name} />

            {isAdmin && (
              <EmailInviteSection orgId={orgId} onInvited={load} />
            )}

            {isAdmin && org.invitations.filter((i) => i.status === 'pending').length > 0 && (
              <PendingInvitationsSection
                invitations={org.invitations.filter((i) => i.status === 'pending')}
                onCancelled={load}
              />
            )}
          </ScrollView>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function InviteCodeSection({ slug, orgName }: { slug: string; orgName: string }) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    await Share.share({ message: slug, title: 'Código da liga' }).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareInvite = () =>
    Share.share({
      message: `Entre na liga "${orgName}" no Matchday! Código: ${slug}`,
      title: 'Convite para liga',
    });

  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>Código da liga</Text>
      <Text style={s.cardSubtitle}>
        Compartilhe o código abaixo. Qualquer pessoa pode entrar em "Organizações → Código".
      </Text>
      <View style={s.codeBox}>
        <Text style={s.codeText}>{slug}</Text>
        <Pressable style={s.codeCopyBtn} onPress={copyCode} hitSlop={8}>
          <Feather name={copied ? 'check' : 'copy'} size={16} color="rgba(196,231,255,0.9)" />
          <Text style={s.codeCopyText}>{copied ? 'Copiado!' : 'Copiar'}</Text>
        </Pressable>
      </View>
      <Pressable style={s.shareBtn} onPress={shareInvite}>
        <Feather name="share-2" size={16} color={MatchdayTheme.colors.white} />
        <Text style={s.shareBtnText}>Compartilhar convite</Text>
      </Pressable>
    </View>
  );
}

function EmailInviteSection({ orgId, onInvited }: { orgId: string; onInvited: () => void }) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const send = async () => {
    if (!email.trim().includes('@') || sending) return;
    setSending(true);
    setMessage(null);
    try {
      await inviteMember(orgId, email.trim());
      setEmail('');
      setMessage({ text: 'Convite enviado!', ok: true });
      onInvited();
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : 'Erro ao enviar convite.', ok: false });
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>Convidar por e-mail</Text>
      <Text style={s.cardSubtitle}>O convidado recebe um e-mail para entrar na liga.</Text>
      <View style={s.inviteRow}>
        <View style={s.inviteInput}>
          <Feather name="mail" size={16} color={MatchdayTheme.colors.slate500} />
          <TextInput
            style={s.input}
            placeholder="email@exemplo.com"
            placeholderTextColor={MatchdayTheme.colors.slate500}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={send}
            returnKeyType="send"
            editable={!sending}
          />
        </View>
        <Pressable
          style={[s.sendBtn, (!email.includes('@') || sending) && s.sendBtnDisabled]}
          disabled={!email.includes('@') || sending}
          onPress={send}
        >
          {sending
            ? <ActivityIndicator size="small" color={MatchdayTheme.colors.white} />
            : <Feather name="send" size={16} color={MatchdayTheme.colors.white} />}
        </Pressable>
      </View>
      {message ? (
        <Text style={[s.feedbackText, message.ok ? s.feedbackOk : s.feedbackErr]}>
          {message.text}
        </Text>
      ) : null}
    </View>
  );
}

function PendingInvitationsSection({
  invitations,
  onCancelled,
}: {
  invitations: OrgFull['invitations'];
  onCancelled: () => void;
}) {
  const cancel = (id: string, email: string) => {
    Alert.alert('Cancelar convite', `Cancelar convite para ${email}?`, [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Cancelar convite',
        style: 'destructive',
        onPress: async () => {
          try { await cancelInvitation(id); onCancelled(); } catch {}
        },
      },
    ]);
  };

  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>Convites pendentes</Text>
      <View style={s.list}>
        {invitations.map((inv) => (
          <View key={inv.id} style={s.inviteListRow}>
            <Feather name="mail" size={16} color={MatchdayTheme.colors.slate500} />
            <Text style={s.inviteEmail}>{inv.email}</Text>
            <Pressable onPress={() => cancel(inv.id, inv.email)} style={s.cancelBtn}>
              <Feather name="x" size={14} color={MatchdayTheme.colors.danger} />
            </Pressable>
          </View>
        ))}
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
  card: { backgroundColor: MatchdayTheme.colors.surfaceElevated, borderColor: 'rgba(12,74,110,0.08)', borderRadius: MatchdayTheme.radii.xl, borderWidth: 1, gap: 12, padding: 18, ...MatchdayTheme.shadows.soft },
  cardTitle: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.display, fontSize: 20, fontWeight: '900', textTransform: 'uppercase' },
  cardSubtitle: { color: MatchdayTheme.colors.slate500, fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },
  codeBox: {
    alignItems: 'center',
    backgroundColor: MatchdayTheme.colors.blue900,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  codeText: { color: MatchdayTheme.colors.white, flex: 1, fontFamily: Fonts.display, fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  codeCopyBtn: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  codeCopyText: { color: 'rgba(196,231,255,0.9)', fontFamily: Fonts.sans, fontSize: 12, fontWeight: '700' },
  shareBtn: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.blue800, borderRadius: MatchdayTheme.radii.pill, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 48, paddingHorizontal: 16 },
  shareBtnText: { color: MatchdayTheme.colors.white, fontFamily: Fonts.sans, fontSize: 14, fontWeight: '800' },
  inviteRow: { flexDirection: 'row', gap: 10 },
  inviteInput: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.surface, borderColor: 'rgba(12,74,110,0.12)', borderRadius: 14, borderWidth: 1, flex: 1, flexDirection: 'row', gap: 8, minHeight: 52, paddingHorizontal: 14 },
  input: { color: MatchdayTheme.colors.blue900, flex: 1, fontFamily: Fonts.sans, fontSize: 14 },
  sendBtn: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.blue800, borderRadius: 14, height: 52, justifyContent: 'center', width: 52 },
  sendBtnDisabled: { opacity: 0.45 },
  feedbackText: { fontFamily: Fonts.sans, fontSize: 13, fontWeight: '600' },
  feedbackOk: { color: '#166534' },
  feedbackErr: { color: MatchdayTheme.colors.danger },
  list: { gap: 10 },
  inviteListRow: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.surface, borderColor: 'rgba(12,74,110,0.08)', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 10, padding: 12 },
  inviteEmail: { color: MatchdayTheme.colors.slate700, flex: 1, fontFamily: Fonts.sans, fontSize: 13 },
  cancelBtn: { padding: 4 },
});
