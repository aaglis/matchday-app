import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackgroundOrbs } from '@/components/auth/background-orbs';
import { Fonts, MatchdayTheme } from '@/constants/theme';
import { resetPassword } from '@/lib/matchday-api';

type State = 'form' | 'submitting' | 'success' | 'no-token';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [state, setState] = useState<State>(token ? 'form' : 'no-token');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!token) return;
    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    setError(null);
    setState('submitting');
    try {
      await resetPassword({ token, newPassword: password });
      setState('success');
      setTimeout(() => router.replace('/'), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'O link expirou ou já foi utilizado.');
      setState('form');
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <BackgroundOrbs />
      <View style={s.content}>
        {state === 'success' ? (
          <View style={s.block}>
            <View style={[s.iconWrap, s.successIcon]}>
              <Ionicons name="checkmark-circle" size={36} color={MatchdayTheme.colors.white} />
            </View>
            <Text style={s.title}>Senha redefinida!</Text>
            <Text style={s.subtitle}>Sua nova senha está pronta. Redirecionando para o login...</Text>
          </View>
        ) : state === 'no-token' ? (
          <View style={s.block}>
            <View style={[s.iconWrap, s.errorIcon]}>
              <Ionicons name="alert-circle" size={32} color={MatchdayTheme.colors.white} />
            </View>
            <Text style={s.title}>Link inválido</Text>
            <Text style={s.subtitle}>Este link de redefinição não contém um token válido. Solicite um novo no login.</Text>
            <Pressable style={s.button} onPress={() => router.replace('/')}>
              <Text style={s.buttonText}>Ir para o login</Text>
            </Pressable>
          </View>
        ) : (
          <View style={s.block}>
            <View style={[s.iconWrap, s.brandIcon]}>
              <Ionicons name="lock-closed" size={30} color={MatchdayTheme.colors.white} />
            </View>
            <Text style={s.title}>Nova senha</Text>
            <Text style={s.subtitle}>Escolha uma nova senha para acessar sua conta.</Text>

            <TextInput
              style={s.input}
              placeholder="Nova senha"
              placeholderTextColor={MatchdayTheme.colors.slate500}
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
              editable={state === 'form'}
            />
            <TextInput
              style={s.input}
              placeholder="Confirmar nova senha"
              placeholderTextColor={MatchdayTheme.colors.slate500}
              secureTextEntry
              autoCapitalize="none"
              value={confirm}
              onChangeText={setConfirm}
              editable={state === 'form'}
            />

            {error ? <Text style={s.errorText}>{error}</Text> : null}

            <Pressable
              style={[s.button, state === 'submitting' && s.buttonDisabled]}
              onPress={onSubmit}
              disabled={state === 'submitting'}
            >
              {state === 'submitting' ? (
                <ActivityIndicator color={MatchdayTheme.colors.white} />
              ) : (
                <Text style={s.buttonText}>Redefinir senha</Text>
              )}
            </Pressable>

            <Pressable onPress={() => router.replace('/')}>
              <Text style={s.linkText}>Voltar para o login</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: MatchdayTheme.colors.night },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  block: { alignItems: 'center', gap: 16, maxWidth: 360, width: '100%' },
  iconWrap: { alignItems: 'center', borderRadius: MatchdayTheme.radii.pill, height: 72, justifyContent: 'center', width: 72 },
  successIcon: { backgroundColor: MatchdayTheme.colors.lime300 },
  errorIcon: { backgroundColor: MatchdayTheme.colors.danger },
  brandIcon: { backgroundColor: MatchdayTheme.colors.blue800 },
  title: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.display, fontSize: 32, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase' },
  subtitle: { color: MatchdayTheme.colors.slate700, fontFamily: Fonts.sans, fontSize: 15, lineHeight: 23, textAlign: 'center' },
  input: {
    backgroundColor: MatchdayTheme.colors.surfaceElevated,
    borderColor: 'rgba(12,74,110,0.12)',
    borderRadius: 18,
    borderWidth: 1,
    color: MatchdayTheme.colors.blue900,
    fontFamily: Fonts.sans,
    fontSize: 15,
    minHeight: 52,
    paddingHorizontal: 16,
    width: '100%',
  },
  errorText: { color: MatchdayTheme.colors.danger, fontFamily: Fonts.sans, fontSize: 13, textAlign: 'center', width: '100%' },
  button: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.blue800, borderRadius: MatchdayTheme.radii.pill, justifyContent: 'center', minHeight: 54, paddingHorizontal: 24, width: '100%' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: MatchdayTheme.colors.white, fontFamily: Fonts.sans, fontSize: 15, fontWeight: '800' },
  linkText: { color: MatchdayTheme.colors.blue700, fontFamily: Fonts.sans, fontSize: 14, fontWeight: '700', marginTop: 4 },
});
