import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackgroundOrbs } from '@/components/auth/background-orbs';
import { Fonts, MatchdayTheme } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { verifyEmail } from '@/lib/matchday-api';

type State = 'verifying' | 'success' | 'error' | 'no-token';

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams<{ token?: string; verified?: string }>();
  const { refreshSession } = useAuth();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const alreadyVerified = params.verified === 'true';

  const [state, setState] = useState<State>(
    alreadyVerified ? 'success' : token ? 'verifying' : 'no-token',
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (alreadyVerified) {
      void refreshSession();
      const t = setTimeout(() => router.replace('/'), 2500);
      return () => clearTimeout(t);
    }
    if (!token) return;
    verifyEmail(token)
      .then(async () => {
        await refreshSession();
        setState('success');
        setTimeout(() => router.replace('/'), 2500);
      })
      .catch((e) => {
        setErrorMsg(e instanceof Error ? e.message : 'Link inválido ou expirado.');
        setState('error');
      });
  }, [token, alreadyVerified, refreshSession]);

  return (
    <SafeAreaView style={s.safe}>
      <BackgroundOrbs />
      <View style={s.content}>

        {state === 'verifying' && (
          <View style={s.block}>
            <ActivityIndicator size="large" color={MatchdayTheme.colors.blue800} />
            <Text style={s.label}>Verificando seu e-mail...</Text>
          </View>
        )}

        {state === 'success' && (
          <View style={s.block}>
            <View style={[s.iconWrap, s.successIcon]}>
              <Ionicons name="checkmark-circle" size={36} color={MatchdayTheme.colors.white} />
            </View>
            <Text style={s.title}>E-mail confirmado!</Text>
            <Text style={s.subtitle}>Sua conta está ativa. Redirecionando para o login...</Text>
          </View>
        )}

        {(state === 'error' || state === 'no-token') && (
          <View style={s.block}>
            <View style={[s.iconWrap, s.errorIcon]}>
              <Ionicons name="alert-circle" size={32} color={MatchdayTheme.colors.white} />
            </View>
            <Text style={s.title}>
              {state === 'no-token' ? 'Link inválido' : 'Falha na verificação'}
            </Text>
            <Text style={s.subtitle}>
              {state === 'no-token'
                ? 'Este link de verificação não contém um token válido.'
                : errorMsg ?? 'O link expirou ou já foi utilizado.'}
            </Text>
            <Pressable style={s.button} onPress={() => router.replace('/')}>
              <Text style={s.buttonText}>Ir para o login</Text>
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
  block: { alignItems: 'center', gap: 16, maxWidth: 340, width: '100%' },
  iconWrap: { alignItems: 'center', borderRadius: MatchdayTheme.radii.pill, height: 72, justifyContent: 'center', width: 72 },
  successIcon: { backgroundColor: MatchdayTheme.colors.lime300 },
  errorIcon: { backgroundColor: MatchdayTheme.colors.danger },
  label: { color: MatchdayTheme.colors.slate700, fontFamily: Fonts.sans, fontSize: 15 },
  title: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.display, fontSize: 32, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase' },
  subtitle: { color: MatchdayTheme.colors.slate700, fontFamily: Fonts.sans, fontSize: 15, lineHeight: 23, textAlign: 'center' },
  button: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.blue800, borderRadius: MatchdayTheme.radii.pill, justifyContent: 'center', minHeight: 54, paddingHorizontal: 24, width: '100%' },
  buttonText: { color: MatchdayTheme.colors.white, fontFamily: Fonts.sans, fontSize: 15, fontWeight: '800' },
});
