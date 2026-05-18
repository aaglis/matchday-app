import { Feather, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { MatchdayTheme } from '@/constants/theme';
import { changeEmail, resendVerificationEmail } from '@/lib/matchday-api';
import { BackgroundOrbs } from './background-orbs';
import { authStyles as s } from './styles';

export type SignInPayload = {
  email: string;
  password: string;
  rememberMe: boolean;
};

type Props = {
  isDesktop: boolean;
  stayConnected: boolean;
  setStayConnected: (value: boolean) => void;
  authError: string | null;
  authNotice: string | null;
  authLoading: boolean;
  onBack: () => void;
  onCreateAccount: () => void;
  onLogin: (payload: SignInPayload) => Promise<void>;
};

export function LoginScreen({
  isDesktop,
  stayConnected,
  setStayConnected,
  authError,
  authNotice,
  authLoading,
  onBack,
  onCreateAccount,
  onLogin,
}: Props) {
  return (
    <View style={s.shell}>
      <BackgroundOrbs />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        <LoginForm
          mobile={!isDesktop}
          stayConnected={stayConnected}
          setStayConnected={setStayConnected}
          authError={authError}
          authNotice={authNotice}
          authLoading={authLoading}
          onBack={onBack}
          onCreateAccount={onCreateAccount}
          onLogin={onLogin}
        />
      </ScrollView>
    </View>
  );
}

function LoginForm({
  mobile,
  stayConnected,
  setStayConnected,
  authError,
  authNotice,
  authLoading,
  onBack,
  onCreateAccount,
  onLogin,
}: {
  mobile: boolean;
  stayConnected: boolean;
  setStayConnected: (value: boolean) => void;
  authError: string | null;
  authNotice: string | null;
  authLoading: boolean;
  onBack: () => void;
  onCreateAccount: () => void;
  onLogin: (payload: SignInPayload) => Promise<void>;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resending, setResending] = useState(false);
  const [resendDone, setResendDone] = useState(false);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [changePassword, setChangePassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [changing, setChanging] = useState(false);
  const [changeError, setChangeError] = useState<string | null>(null);
  const [changeDone, setChangeDone] = useState(false);

  const isUnverified = authError === 'EMAIL_NOT_VERIFIED';
  const canSubmit = email.trim().length > 0 && password.length >= 6 && !authLoading;

  const submit = () => {
    if (!canSubmit) return;
    setResendDone(false);
    void onLogin({ email: email.trim(), password, rememberMe: stayConnected });
  };

  const resend = async () => {
    if (!email.trim() || resending) return;
    setResending(true);
    try {
      await resendVerificationEmail(email.trim());
      setResendDone(true);
    } catch {
      setResendDone(false);
    } finally {
      setResending(false);
    }
  };

  const submitChangeEmail = async () => {
    if (!email.trim() || !changePassword || !newEmail.trim() || changing) return;
    setChanging(true);
    setChangeError(null);
    try {
      await changeEmail(email.trim(), changePassword, newEmail.trim());
      setChangeDone(true);
      setShowChangeEmail(false);
    } catch (e) {
      setChangeError(e instanceof Error ? e.message : 'Erro ao alterar e-mail.');
    } finally {
      setChanging(false);
    }
  };

  return (
    <View style={[s.panel, mobile && s.panelMobile]}>
      <View style={s.contentWrap}>
        <View style={s.logoWrap}>
          <Image source={require('@/assets/branding/logo.png')} style={s.logo} contentFit="contain" />
        </View>

        <View style={s.card}>
          <Text style={s.eyebrow}>Login</Text>
          <Text style={s.title}>Entrar</Text>
          <Text style={s.subtitle}>Use seu e-mail e senha.</Text>

          <View style={s.formSection}>
            <View style={s.fieldBlock}>
              <Text style={s.fieldLabel}>E-mail</Text>
              <View style={s.inputShell}>
                <Feather name="mail" size={16} color={MatchdayTheme.colors.slate500} />
                <TextInput
                  placeholder="voce@empresa.com"
                  placeholderTextColor={MatchdayTheme.colors.slate500}
                  style={s.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!authLoading}
                  onChangeText={setEmail}
                  value={email}
                />
              </View>
            </View>

            <View style={s.fieldBlock}>
              <Text style={s.fieldLabel}>Senha</Text>
              <View style={s.inputShell}>
                <Feather name="lock" size={16} color={MatchdayTheme.colors.slate500} />
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor={MatchdayTheme.colors.slate500}
                  secureTextEntry
                  style={s.input}
                  autoComplete="password"
                  editable={!authLoading}
                  onChangeText={setPassword}
                  onSubmitEditing={submit}
                  value={password}
                />
              </View>
            </View>

            {authNotice ? <Text style={s.noticeText}>{authNotice}</Text> : null}

            {isUnverified ? (
              <View style={ls.unverifiedBox}>
                <View style={ls.unverifiedHeader}>
                  <Ionicons name="mail-unread-outline" size={18} color="#92400e" />
                  <Text style={ls.unverifiedTitle}>E-mail não verificado</Text>
                </View>
                <Text style={ls.unverifiedText}>
                  Sua conta ainda não foi confirmada. Verifique sua caixa de entrada ou reenvie o e-mail de confirmação.
                </Text>
                {resendDone || changeDone ? (
                  <View style={ls.resendSuccess}>
                    <Ionicons name="checkmark-circle" size={14} color="#166534" />
                    <Text style={ls.resendSuccessText}>
                      {changeDone
                        ? 'E-mail alterado! Verifique a nova caixa de entrada.'
                        : 'E-mail reenviado! Verifique sua caixa de entrada.'}
                    </Text>
                  </View>
                ) : (
                  <Pressable
                    style={[ls.resendBtn, (resending || !email.trim()) && ls.resendBtnDisabled]}
                    disabled={resending || !email.trim()}
                    onPress={resend}
                  >
                    {resending
                      ? <ActivityIndicator size="small" color="#92400e" />
                      : <Feather name="send" size={14} color="#92400e" />}
                    <Text style={ls.resendBtnText}>
                      {resending ? 'Enviando...' : 'Reenviar e-mail de confirmação'}
                    </Text>
                  </Pressable>
                )}

                {!resendDone && !changeDone && (
                  <>
                    <Pressable
                      style={ls.changeEmailToggle}
                      onPress={() => {
                        setShowChangeEmail((v) => !v);
                        setChangeError(null);
                        setChangePassword('');
                        setNewEmail('');
                      }}
                    >
                      <Feather name="edit-2" size={13} color="#92400e" />
                      <Text style={ls.changeEmailToggleText}>
                        {showChangeEmail ? 'Cancelar alteração' : 'E-mail errado? Alterar aqui'}
                      </Text>
                    </Pressable>

                    {showChangeEmail && (
                      <View style={ls.changeEmailForm}>
                        <View style={ls.changeEmailField}>
                          <Feather name="lock" size={14} color="#92400e" />
                          <TextInput
                            placeholder="Sua senha atual"
                            placeholderTextColor="#b45309"
                            secureTextEntry
                            style={ls.changeEmailInput}
                            value={changePassword}
                            onChangeText={setChangePassword}
                            editable={!changing}
                            autoComplete="password"
                          />
                        </View>
                        <View style={ls.changeEmailField}>
                          <Feather name="mail" size={14} color="#92400e" />
                          <TextInput
                            placeholder="Novo e-mail"
                            placeholderTextColor="#b45309"
                            style={ls.changeEmailInput}
                            value={newEmail}
                            onChangeText={setNewEmail}
                            editable={!changing}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            onSubmitEditing={submitChangeEmail}
                          />
                        </View>
                        {changeError ? (
                          <Text style={ls.changeEmailError}>{changeError}</Text>
                        ) : null}
                        <Pressable
                          style={[ls.changeEmailBtn, (!changePassword || !newEmail.trim() || changing) && ls.resendBtnDisabled]}
                          disabled={!changePassword || !newEmail.trim() || changing}
                          onPress={submitChangeEmail}
                        >
                          {changing
                            ? <ActivityIndicator size="small" color="#92400e" />
                            : <Feather name="check" size={14} color="#92400e" />}
                          <Text style={ls.resendBtnText}>
                            {changing ? 'Alterando...' : 'Confirmar novo e-mail'}
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </>
                )}
              </View>
            ) : authError ? (
              <Text style={s.errorText}>{authError}</Text>
            ) : null}

            <Pressable
              disabled={authLoading}
              style={s.checkboxRow}
              onPress={() => setStayConnected(!stayConnected)}
            >
              <View style={[s.checkbox, stayConnected && s.checkboxChecked]}>
                {stayConnected ? <Feather name="check" size={14} color={MatchdayTheme.colors.white} /> : null}
              </View>
              <Text style={s.checkboxText}>Manter-me conectado nesta maquina</Text>
            </Pressable>

            <Pressable
              disabled={!canSubmit}
              style={[s.submitButton, !canSubmit && s.submitButtonDisabled]}
              onPress={submit}
            >
              <Text style={s.submitButtonText}>{authLoading ? 'Entrando...' : 'Entrar'}</Text>
            </Pressable>
          </View>
        </View>

        <Pressable onPress={onCreateAccount} disabled={authLoading}>
          <Text style={s.footerText}>
            Nao tem conta? <Text style={s.footerLink}>Criar conta</Text>
          </Text>
        </Pressable>
        <Pressable onPress={onBack}>
          <Text style={s.backLink}>Voltar para a apresentacao</Text>
        </Pressable>
      </View>
    </View>
  );
}

const ls = StyleSheet.create({
  unverifiedBox: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  unverifiedHeader: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  unverifiedTitle: { color: '#92400e', fontSize: 14, fontWeight: '700' },
  unverifiedText: { color: '#78350f', fontSize: 13, lineHeight: 20 },
  resendBtn: {
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  resendBtnDisabled: { opacity: 0.5 },
  resendBtnText: { color: '#92400e', fontSize: 13, fontWeight: '700' },
  resendSuccess: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  resendSuccessText: { color: '#166534', fontSize: 13, fontWeight: '600' },
  changeEmailToggle: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  changeEmailToggleText: { color: '#92400e', fontSize: 12, fontWeight: '600', textDecorationLine: 'underline' },
  changeEmailForm: { gap: 10, marginTop: 2 },
  changeEmailField: {
    alignItems: 'center',
    backgroundColor: '#fef9ee',
    borderColor: '#fde68a',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 12,
  },
  changeEmailInput: { color: '#78350f', flex: 1, fontSize: 14 },
  changeEmailError: { color: '#b91c1c', fontSize: 12, fontWeight: '600' },
  changeEmailBtn: {
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
});
