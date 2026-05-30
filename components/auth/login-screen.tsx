import { Feather, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { MatchdayTheme } from '@/constants/theme';
import { resendVerificationEmail } from '@/lib/matchday-api';
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
                {resendDone ? (
                  <View style={ls.resendSuccess}>
                    <Ionicons name="checkmark-circle" size={14} color="#166534" />
                    <Text style={ls.resendSuccessText}>E-mail reenviado! Verifique sua caixa de entrada.</Text>
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

                {!resendDone ? (
                  <Text style={ls.unverifiedHint}>Se o e-mail estiver errado, crie uma nova conta com o endereço correto.</Text>
                ) : null}
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
  unverifiedHint: { color: '#78350f', fontSize: 12, fontWeight: '600', lineHeight: 17 },
});
