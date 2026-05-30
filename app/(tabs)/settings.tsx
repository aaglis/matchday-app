import { Feather, Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import {
  confirmEmailChangeCode,
  confirmPasswordChangeCode,
  getUserProfile,
  requestEmailChangeCode,
  requestPasswordChangeCode,
  updateUserProfile,
  type User,
} from '@/lib/matchday-api';

type AccountSection = 'profile' | 'email' | 'password';

export default function SettingsScreen() {
  const { user, signOut, refreshSession, updateUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(user);
  const [name, setName] = useState(user?.name ?? '');
  const [image, setImage] = useState(user?.image ?? '');
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordCode, setPasswordCode] = useState('');
  const [passwordCodeSent, setPasswordCodeSent] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState<AccountSection>('profile');

  const loadProfile = useCallback(async () => {
    const result = await getUserProfile();
    setProfile(result.user);
    setName(result.user.name ?? '');
    setImage(result.user.image ?? '');
    return result.user;
  }, []);

  useEffect(() => {
    void loadProfile().catch(() => undefined);
  }, [loadProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshSession(), loadProfile()]);
    } finally {
      setRefreshing(false);
    }
  }, [loadProfile, refreshSession]);

  const saveProfile = async () => {
    if (savingProfile) return;
    setSavingProfile(true);
    try {
      const result = await updateUserProfile({ name: name.trim(), image: image.trim() || null });
      setProfile(result.user);
      updateUser(result.user);
      await refreshSession();
      Alert.alert('Perfil', 'Dados atualizados.');
    } catch (e) {
      Alert.alert('Perfil', e instanceof Error ? e.message : 'Não foi possível atualizar seu perfil.');
    } finally {
      setSavingProfile(false);
    }
  };

  const requestEmailChange = async () => {
    if (!profile?.email || savingEmail) return;
    setSavingEmail(true);
    try {
      const result = await requestEmailChangeCode({ newEmail: newEmail.trim(), password: emailPassword });
      Alert.alert('E-mail', result.message);
      setEmailCode('');
      setEmailCodeSent(true);
    } catch (e) {
      Alert.alert('E-mail', e instanceof Error ? e.message : 'Não foi possível enviar o código.');
    } finally {
      setSavingEmail(false);
    }
  };

  const confirmEmailChange = async () => {
    if (savingEmail) return;
    setSavingEmail(true);
    try {
      const result = await confirmEmailChangeCode({ code: emailCode.trim() });
      setProfile(result.user);
      updateUser(result.user);
      setNewEmail('');
      setEmailPassword('');
      setEmailCode('');
      setEmailCodeSent(false);
      await refreshSession();
      Alert.alert('E-mail', result.message);
    } catch (e) {
      Alert.alert('E-mail', e instanceof Error ? e.message : 'Não foi possível confirmar o código.');
    } finally {
      setSavingEmail(false);
    }
  };

  const requestPasswordCode = async () => {
    if (savingPassword) return;
    if (newPassword !== confirmPassword) {
      Alert.alert('Senha', 'A confirmação não confere com a nova senha.');
      return;
    }

    setSavingPassword(true);
    try {
      const result = await requestPasswordChangeCode({ currentPassword });
      setPasswordCode('');
      setPasswordCodeSent(true);
      Alert.alert('Senha', result.message);
    } catch (e) {
      Alert.alert('Senha', e instanceof Error ? e.message : 'Não foi possível enviar o código.');
    } finally {
      setSavingPassword(false);
    }
  };

  const savePassword = async () => {
    if (savingPassword) return;
    if (newPassword !== confirmPassword) {
      Alert.alert('Senha', 'A confirmação não confere com a nova senha.');
      return;
    }

    setSavingPassword(true);
    try {
      await confirmPasswordChangeCode({
        code: passwordCode.trim(),
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordCode('');
      setPasswordCodeSent(false);
      await refreshSession();
      Alert.alert('Senha', 'Senha atualizada.');
    } catch (e) {
      Alert.alert('Senha', e instanceof Error ? e.message : 'Não foi possível alterar sua senha.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  const initials = profile?.name
    ? profile.name.split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase()
    : profile?.email?.slice(0, 2).toUpperCase() ?? '??';
  const canSaveProfile = name.trim().length >= 2 && !savingProfile;
  const canRequestEmailCode = newEmail.trim().length >= 5 && emailPassword.length >= 6 && !savingEmail;
  const canConfirmEmail = emailCode.trim().length === 6 && emailCodeSent && !savingEmail;
  const canRequestPasswordCode = currentPassword.length >= 6 && newPassword.length >= 8 && confirmPassword.length >= 8 && !savingPassword;
  const canChangePassword = canRequestPasswordCode && passwordCode.trim().length === 6 && passwordCodeSent;

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.keyboard}>
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={MatchdayTheme.colors.blue800}
              colors={[MatchdayTheme.colors.blue800]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={s.headerRow}>
            <Text style={s.heading}>Conta</Text>
            <View style={s.statusPill}>
              <Ionicons
                name={profile?.emailVerified ? 'shield-checkmark' : 'mail-unread-outline'}
                size={14}
                color={profile?.emailVerified ? MatchdayTheme.colors.slate900 : MatchdayTheme.colors.blue800}
              />
              <Text style={s.statusPillText}>{profile?.emailVerified ? 'Verificada' : 'Pendente'}</Text>
            </View>
          </View>

          <View style={s.profileCard}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initials}</Text>
            </View>
            <View style={s.profileMeta}>
              <Text style={s.profileName}>{profile?.name ?? 'Jogador'}</Text>
              <Text style={s.profileEmail}>{profile?.email ?? user?.email ?? '-'}</Text>
            </View>
          </View>

          <AccountTabs active={activeSection} onChange={setActiveSection} />

          {activeSection === 'profile' ? (
            <View style={s.panel}>
              <SectionHeader icon="user" title="Perfil" text="Dados públicos usados nas ligas." />
              <Field label="Nome">
                <TextInput
                  autoCapitalize="words"
                  editable={!savingProfile}
                  onChangeText={setName}
                  placeholder="Seu nome"
                  placeholderTextColor={MatchdayTheme.colors.slate500}
                  returnKeyType="done"
                  style={s.input}
                  value={name}
                />
              </Field>
              <Field label="Imagem">
                <TextInput
                  autoCapitalize="none"
                  editable={!savingProfile}
                  keyboardType="url"
                  onChangeText={setImage}
                  placeholder="https://..."
                  placeholderTextColor={MatchdayTheme.colors.slate500}
                  returnKeyType="done"
                  style={s.input}
                  value={image}
                />
              </Field>
              <PrimaryButton disabled={!canSaveProfile} loading={savingProfile} loadingLabel="Salvando..." label="Salvar perfil" onPress={saveProfile} />
            </View>
          ) : activeSection === 'email' ? (
            <View style={s.panel}>
              <SectionHeader icon="mail" title="E-mail" text="Confirme a troca no novo endereço." />
              <View style={s.currentEmailBox}>
                <Text style={s.currentEmailLabel}>E-mail atual</Text>
                <Text style={s.currentEmailText}>{profile?.email ?? '-'}</Text>
              </View>
              <Field label="Novo e-mail">
                <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!savingEmail}
                  keyboardType="email-address"
                  onChangeText={(value) => {
                    setNewEmail(value);
                    setEmailCodeSent(false);
                    setEmailCode('');
                  }}
                  placeholder="novo@email.com"
                  placeholderTextColor={MatchdayTheme.colors.slate500}
                  style={s.input}
                  value={newEmail}
                />
              </Field>
              <Field label="Senha atual">
                <TextInput
                  editable={!savingEmail}
                  onChangeText={(value) => {
                    setEmailPassword(value);
                    setEmailCodeSent(false);
                    setEmailCode('');
                  }}
                  placeholder="Sua senha"
                  placeholderTextColor={MatchdayTheme.colors.slate500}
                  secureTextEntry
                  style={s.input}
                  value={emailPassword}
                />
              </Field>
              {emailCodeSent ? (
                <>
                  <CodeNotice text="Digite o código de 6 dígitos enviado para o novo e-mail." />
                  <Field label="Código">
                    <TextInput
                      editable={!savingEmail}
                      keyboardType="number-pad"
                      maxLength={6}
                      onChangeText={(value) => setEmailCode(value.replace(/[^0-9]/g, '').slice(0, 6))}
                      placeholder="000000"
                      placeholderTextColor={MatchdayTheme.colors.slate500}
                      style={s.codeInput}
                      value={emailCode}
                    />
                  </Field>
                  <PrimaryButton disabled={!canConfirmEmail} loading={savingEmail} loadingLabel="Confirmando..." label="Confirmar e-mail" onPress={confirmEmailChange} />
                  <SecondaryButton disabled={!canRequestEmailCode} label="Reenviar código" onPress={requestEmailChange} />
                </>
              ) : (
                <PrimaryButton disabled={!canRequestEmailCode} loading={savingEmail} loadingLabel="Enviando..." label="Enviar código" onPress={requestEmailChange} />
              )}
            </View>
          ) : (
            <View style={s.panel}>
              <SectionHeader icon="lock" title="Senha" text="Outras sessões serão encerradas." />
              <Field label="Senha atual">
                <TextInput
                  editable={!savingPassword}
                  onChangeText={(value) => {
                    setCurrentPassword(value);
                    setPasswordCodeSent(false);
                    setPasswordCode('');
                  }}
                  placeholder="Senha atual"
                  placeholderTextColor={MatchdayTheme.colors.slate500}
                  secureTextEntry
                  style={s.input}
                  value={currentPassword}
                />
              </Field>
              <Field label="Nova senha">
                <TextInput
                  editable={!savingPassword}
                  onChangeText={(value) => {
                    setNewPassword(value);
                    setPasswordCodeSent(false);
                    setPasswordCode('');
                  }}
                  placeholder="Mínimo 8 caracteres"
                  placeholderTextColor={MatchdayTheme.colors.slate500}
                  secureTextEntry
                  style={s.input}
                  value={newPassword}
                />
              </Field>
              <Field label="Confirmar nova senha">
                <TextInput
                  editable={!savingPassword}
                  onChangeText={(value) => {
                    setConfirmPassword(value);
                    setPasswordCodeSent(false);
                    setPasswordCode('');
                  }}
                  placeholder="Repita a nova senha"
                  placeholderTextColor={MatchdayTheme.colors.slate500}
                  secureTextEntry
                  style={s.input}
                  value={confirmPassword}
                />
              </Field>
              {passwordCodeSent ? (
                <>
                  <CodeNotice text="Digite o código enviado para o e-mail atual da conta." />
                  <Field label="Código">
                    <TextInput
                      editable={!savingPassword}
                      keyboardType="number-pad"
                      maxLength={6}
                      onChangeText={(value) => setPasswordCode(value.replace(/[^0-9]/g, '').slice(0, 6))}
                      placeholder="000000"
                      placeholderTextColor={MatchdayTheme.colors.slate500}
                      style={s.codeInput}
                      value={passwordCode}
                    />
                  </Field>
                  <PrimaryButton disabled={!canChangePassword} loading={savingPassword} loadingLabel="Alterando..." label="Confirmar senha" onPress={savePassword} />
                  <SecondaryButton disabled={!canRequestPasswordCode} label="Reenviar código" onPress={requestPasswordCode} />
                </>
              ) : (
                <PrimaryButton disabled={!canRequestPasswordCode} loading={savingPassword} loadingLabel="Enviando..." label="Enviar código" onPress={requestPasswordCode} />
              )}
            </View>
          )}

          <Pressable disabled={signingOut} style={[s.logoutButton, signingOut && s.logoutButtonDisabled]} onPress={handleSignOut}>
            {signingOut
              ? <ActivityIndicator size="small" color={MatchdayTheme.colors.danger} />
              : <Feather name="log-out" size={17} color={MatchdayTheme.colors.danger} />}
            <Text style={s.logoutText}>{signingOut ? 'Saindo...' : 'Sair da conta'}</Text>
          </Pressable>

          <Text style={s.versionText}>Matchday · Season Beta</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function AccountTabs({ active, onChange }: { active: AccountSection; onChange: (section: AccountSection) => void }) {
  const items: { icon: ComponentProps<typeof Feather>['name']; id: AccountSection; label: string }[] = [
    { icon: 'user', id: 'profile', label: 'Perfil' },
    { icon: 'mail', id: 'email', label: 'E-mail' },
    { icon: 'lock', id: 'password', label: 'Senha' },
  ];

  return (
    <View style={s.tabsCard}>
      {items.map((item) => {
        const selected = active === item.id;
        return (
          <Pressable key={item.id} style={[s.tabButton, selected && s.tabButtonActive]} onPress={() => onChange(item.id)}>
            <Feather name={item.icon} size={17} color={selected ? MatchdayTheme.colors.white : MatchdayTheme.colors.blue800} />
            <Text style={[s.tabButtonText, selected && s.tabButtonTextActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SectionHeader({ icon, title, text }: { icon: ComponentProps<typeof Feather>['name']; title: string; text: string }) {
  return (
    <View style={s.sectionHeader}>
      <View style={s.menuIconWrap}>
        <Feather name={icon} size={17} color={MatchdayTheme.colors.blue800} />
      </View>
      <View style={s.sectionCopy}>
        <Text style={s.cardTitle}>{title}</Text>
        <Text style={s.cardText}>{text}</Text>
      </View>
    </View>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={s.fieldBlock}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.inputShell}>{children}</View>
    </View>
  );
}

function CodeNotice({ text }: { text: string }) {
  return (
    <View style={s.codeNotice}>
      <Feather name="shield" size={16} color={MatchdayTheme.colors.blue800} />
      <Text style={s.codeNoticeText}>{text}</Text>
    </View>
  );
}

function PrimaryButton({ disabled, label, loading, loadingLabel, onPress }: { disabled: boolean; label: string; loading: boolean; loadingLabel: string; onPress: () => void }) {
  return (
    <Pressable disabled={disabled} style={[s.primaryButton, disabled && s.primaryButtonDisabled]} onPress={onPress}>
      {loading ? <ActivityIndicator size="small" color={MatchdayTheme.colors.white} /> : <Feather name="check" size={17} color={MatchdayTheme.colors.white} />}
      <Text style={s.primaryButtonText}>{loading ? loadingLabel : label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ disabled, label, onPress }: { disabled: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable disabled={disabled} style={[s.secondaryButton, disabled && s.secondaryButtonDisabled]} onPress={onPress}>
      <Feather name="refresh-cw" size={16} color={MatchdayTheme.colors.blue800} />
      <Text style={s.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: MatchdayTheme.colors.night },
  keyboard: { flex: 1 },
  content: { gap: 16, padding: 20, paddingBottom: 40 },
  headerRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  heading: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.display, fontSize: 34, fontWeight: '900', lineHeight: 36, textTransform: 'uppercase' },
  statusPill: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.surfaceElevated, borderColor: 'rgba(12,74,110,0.10)', borderRadius: MatchdayTheme.radii.pill, borderWidth: 1, flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 8 },
  statusPillText: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.sans, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  profileCard: {
    alignItems: 'center',
    backgroundColor: MatchdayTheme.colors.blue900,
    borderRadius: MatchdayTheme.radii.xl,
    flexDirection: 'row',
    gap: 14,
    padding: 18,
  },
  avatar: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: MatchdayTheme.radii.pill, height: 56, justifyContent: 'center', width: 56 },
  avatarText: { color: MatchdayTheme.colors.white, fontFamily: Fonts.display, fontSize: 20, fontWeight: '900' },
  profileMeta: { flex: 1 },
  profileName: { color: MatchdayTheme.colors.white, fontFamily: Fonts.sans, fontSize: 17, fontWeight: '900' },
  profileEmail: { color: MatchdayTheme.colors.sky200, fontFamily: Fonts.sans, fontSize: 13, marginTop: 4 },
  tabsCard: {
    backgroundColor: MatchdayTheme.colors.surfaceElevated,
    borderColor: 'rgba(12,74,110,0.08)',
    borderRadius: MatchdayTheme.radii.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 8,
  },
  tabButton: {
    alignItems: 'center',
    backgroundColor: MatchdayTheme.colors.surface,
    borderColor: 'rgba(12,74,110,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 8,
  },
  tabButtonActive: { backgroundColor: MatchdayTheme.colors.blue800, borderColor: MatchdayTheme.colors.blue800 },
  tabButtonText: { color: MatchdayTheme.colors.blue800, fontFamily: Fonts.sans, fontSize: 12, fontWeight: '900' },
  tabButtonTextActive: { color: MatchdayTheme.colors.white },
  panel: {
    backgroundColor: MatchdayTheme.colors.surfaceElevated,
    borderColor: 'rgba(12,74,110,0.08)',
    borderRadius: MatchdayTheme.radii.xl,
    borderWidth: 1,
    gap: 14,
    padding: 18,
    ...MatchdayTheme.shadows.soft,
  },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  sectionCopy: { flex: 1 },
  cardTitle: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.display, fontSize: 20, fontWeight: '900', textTransform: 'uppercase' },
  cardText: { color: MatchdayTheme.colors.slate500, fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18, marginTop: 2 },
  menuIconWrap: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.surface, borderRadius: 12, height: 38, justifyContent: 'center', width: 38 },
  fieldBlock: { gap: 7 },
  fieldLabel: { color: MatchdayTheme.colors.blue800, fontFamily: Fonts.sans, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  inputShell: { backgroundColor: MatchdayTheme.colors.surface, borderColor: 'rgba(12,74,110,0.10)', borderRadius: 16, borderWidth: 1, minHeight: 50, paddingHorizontal: 14 },
  input: { color: MatchdayTheme.colors.blue900, flex: 1, fontFamily: Fonts.sans, fontSize: 15, fontWeight: '700' },
  codeInput: { color: MatchdayTheme.colors.blue900, flex: 1, fontFamily: Fonts.display, fontSize: 22, fontWeight: '900', letterSpacing: 6, textAlign: 'center' },
  codeNotice: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.sky200, borderColor: 'rgba(12,74,110,0.10)', borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 10, padding: 12 },
  codeNoticeText: { color: MatchdayTheme.colors.blue800, flex: 1, fontFamily: Fonts.sans, fontSize: 12, fontWeight: '800', lineHeight: 17 },
  currentEmailBox: { backgroundColor: MatchdayTheme.colors.surface, borderColor: 'rgba(12,74,110,0.08)', borderRadius: 16, borderWidth: 1, gap: 4, padding: 14 },
  currentEmailLabel: { color: MatchdayTheme.colors.slate500, fontFamily: Fonts.sans, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  currentEmailText: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.sans, fontSize: 14, fontWeight: '800' },
  primaryButton: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.blue800, borderRadius: MatchdayTheme.radii.pill, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 50 },
  primaryButtonDisabled: { backgroundColor: MatchdayTheme.colors.slate300 },
  primaryButtonText: { color: MatchdayTheme.colors.white, fontFamily: Fonts.sans, fontSize: 14, fontWeight: '900' },
  secondaryButton: { alignItems: 'center', alignSelf: 'center', flexDirection: 'row', gap: 8, minHeight: 42, paddingHorizontal: 12 },
  secondaryButtonDisabled: { opacity: 0.45 },
  secondaryButtonText: { color: MatchdayTheme.colors.blue800, fontFamily: Fonts.sans, fontSize: 13, fontWeight: '900' },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: MatchdayTheme.colors.surfaceElevated,
    borderColor: '#fecdd3',
    borderRadius: MatchdayTheme.radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    minHeight: 54,
  },
  logoutButtonDisabled: { opacity: 0.6 },
  logoutText: { color: MatchdayTheme.colors.danger, fontFamily: Fonts.sans, fontSize: 15, fontWeight: '700' },
  versionText: { color: MatchdayTheme.colors.slate300, fontFamily: Fonts.sans, fontSize: 12, textAlign: 'center' },
});
