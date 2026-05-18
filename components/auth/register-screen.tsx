import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { MatchdayTheme } from '@/constants/theme';
import { BackgroundOrbs } from './background-orbs';
import { authStyles as s } from './styles';

export type SignUpPayload = {
  name: string;
  email: string;
  password: string;
};

type Props = {
  isDesktop: boolean;
  authError: string | null;
  authLoading: boolean;
  onBack: () => void;
  onLogin: () => void;
  onRegister: (payload: SignUpPayload) => Promise<void>;
};

export function RegisterScreen({ isDesktop, authError, authLoading, onBack, onLogin, onRegister }: Props) {
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
        <RegisterForm
          mobile={!isDesktop}
          authError={authError}
          authLoading={authLoading}
          onBack={onBack}
          onLogin={onLogin}
          onRegister={onRegister}
        />
      </ScrollView>
    </View>
  );
}

function RegisterForm({
  mobile,
  authError,
  authLoading,
  onBack,
  onLogin,
  onRegister,
}: {
  mobile: boolean;
  authError: string | null;
  authLoading: boolean;
  onBack: () => void;
  onLogin: () => void;
  onRegister: (payload: SignUpPayload) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const canSubmit =
    name.trim().length >= 2 && email.trim().includes('@') && password.length >= 6 && !authLoading;

  const submit = () => {
    if (!canSubmit) return;
    void onRegister({ name: name.trim(), email: email.trim(), password });
  };

  return (
    <View style={[s.panel, mobile && s.panelMobile]}>
      <View style={s.contentWrap}>
        <View style={s.logoWrap}>
          <Image source={require('@/assets/branding/logo.png')} style={s.logo} contentFit="contain" />
        </View>

        <View style={s.card}>
          <Text style={s.eyebrow}>Cadastro</Text>
          <Text style={s.title}>Criar conta</Text>
          <Text style={s.subtitle}>Depois de cadastrar, confirme o e-mail para liberar o login.</Text>

          <View style={s.formSection}>
            <View style={s.fieldBlock}>
              <Text style={s.fieldLabel}>Nome</Text>
              <View style={s.inputShell}>
                <Feather name="user" size={16} color={MatchdayTheme.colors.slate500} />
                <TextInput
                  placeholder="Seu nome"
                  placeholderTextColor={MatchdayTheme.colors.slate500}
                  style={s.input}
                  autoComplete="name"
                  editable={!authLoading}
                  onChangeText={setName}
                  value={name}
                />
              </View>
            </View>

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
                  placeholder="Minimo 6 caracteres"
                  placeholderTextColor={MatchdayTheme.colors.slate500}
                  secureTextEntry
                  style={s.input}
                  autoComplete="new-password"
                  editable={!authLoading}
                  onChangeText={setPassword}
                  onSubmitEditing={submit}
                  value={password}
                />
              </View>
            </View>

            {authError ? <Text style={s.errorText}>{authError}</Text> : null}

            <Pressable
              disabled={!canSubmit}
              style={[s.submitButton, !canSubmit && s.submitButtonDisabled]}
              onPress={submit}
            >
              <Text style={s.submitButtonText}>{authLoading ? 'Criando...' : 'Criar conta'}</Text>
            </Pressable>
          </View>
        </View>

        <Pressable onPress={onLogin} disabled={authLoading}>
          <Text style={s.footerText}>
            Ja tem conta? <Text style={s.footerLink}>Entrar</Text>
          </Text>
        </Pressable>
        <Pressable onPress={onBack}>
          <Text style={s.backLink}>Voltar para a apresentacao</Text>
        </Pressable>
      </View>
    </View>
  );
}
