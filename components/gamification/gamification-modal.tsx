import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { Fonts, MatchdayTheme } from '@/constants/theme';
import type { GamificationEvent } from '@/lib/matchday-api';
import { PitacoMascot } from './pitaco-mascot';

type Props = {
  event: GamificationEvent | null;
  leagueName?: string;
  onClose: () => void;
  onPrimaryAction?: () => void;
};

export function GamificationModal({ event, leagueName, onClose, onPrimaryAction }: Props) {
  useEffect(() => {
    if (!event) return;

    if (event.severity === 'negative') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
      return;
    }

    if (event.type === 'deadline_warning') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
      return;
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  }, [event]);

  if (!event) return null;

  const tone = getTone(event);
  const stats = getStats(event);

  return (
    <Modal animationType="fade" transparent visible onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(180)} style={s.overlay}>
        <Animated.View entering={ZoomIn.duration(260)} style={s.sheet}>
          <View style={[s.topRail, { backgroundColor: tone.accent }]} />

          <View style={s.closeRow}>
            <View style={[s.eventPill, { backgroundColor: tone.soft }]}>
              <Ionicons name={tone.icon} size={14} color={tone.fg} />
              <Text style={[s.eventPillText, { color: tone.fg }]}>{tone.label}</Text>
            </View>
            <Pressable hitSlop={10} style={s.closeButton} onPress={onClose}>
              <Feather name="x" size={18} color={MatchdayTheme.colors.slate500} />
            </Pressable>
          </View>

          <PitacoMascot animationKey={event.animationKey} severity={event.severity} />

          <Text style={s.title}>{event.title}</Text>
          <Text style={s.message}>{event.message}</Text>

          {stats ? (
            <View style={s.statsRow}>
              {stats.map((item) => (
                <View key={item.label} style={s.statTile}>
                  <Text style={s.statValue}>{item.value}</Text>
                  <Text style={s.statLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {leagueName ? <Text style={s.leagueName}>{leagueName}</Text> : null}

          <Pressable style={[s.primaryButton, { backgroundColor: tone.accent }]} onPress={onPrimaryAction ?? onClose}>
            <Text style={[s.primaryButtonText, { color: tone.buttonText }]}>{tone.action}</Text>
            <Feather name="arrow-right" size={16} color={tone.buttonText} />
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function getTone(event: GamificationEvent) {
  if (event.severity === 'negative') {
    return {
      accent: MatchdayTheme.colors.coral400,
      action: 'Ver próxima rodada',
      buttonText: MatchdayTheme.colors.white,
      fg: '#9f1239',
      icon: 'heart-outline' as const,
      label: 'Recuperação',
      soft: '#ffe4e6',
    };
  }

  if (event.type === 'invite_friends') {
    return {
      accent: MatchdayTheme.colors.blue500,
      action: 'Convidar amigos',
      buttonText: MatchdayTheme.colors.slate900,
      fg: MatchdayTheme.colors.blue800,
      icon: 'people-outline' as const,
      label: 'Convite',
      soft: MatchdayTheme.colors.sky200,
    };
  }

  if (event.type === 'empty_state') {
    return {
      accent: MatchdayTheme.colors.blue800,
      action: 'Ver ligas',
      buttonText: MatchdayTheme.colors.white,
      fg: MatchdayTheme.colors.blue800,
      icon: 'compass-outline' as const,
      label: 'Começar',
      soft: MatchdayTheme.colors.sky200,
    };
  }

  if (event.type === 'deadline_warning') {
    return {
      accent: MatchdayTheme.colors.gold400,
      action: 'Fazer palpites',
      buttonText: MatchdayTheme.colors.slate900,
      fg: '#92400e',
      icon: 'time-outline' as const,
      label: 'Prazo',
      soft: '#fef3c7',
    };
  }

  if (event.type === 'champion_round') {
    return {
      accent: MatchdayTheme.colors.gold400,
      action: 'Ver ranking',
      buttonText: MatchdayTheme.colors.slate900,
      fg: '#92400e',
      icon: 'trophy-outline' as const,
      label: 'Liderança',
      soft: '#fef3c7',
    };
  }

  if (event.type === 'achievement_unlocked') {
    return {
      accent: MatchdayTheme.colors.lime300,
      action: 'Ver conquistas',
      buttonText: MatchdayTheme.colors.slate900,
      fg: '#365314',
      icon: 'ribbon-outline' as const,
      label: 'Conquista',
      soft: '#ecfccb',
    };
  }

  return {
    accent: MatchdayTheme.colors.lime300,
    action: 'Ver ranking',
    buttonText: MatchdayTheme.colors.slate900,
    fg: '#365314',
    icon: 'flash-outline' as const,
    label: 'Boa rodada',
    soft: '#ecfccb',
  };
}

function getStats(event: GamificationEvent) {
  const metadata = event.metadata ?? {};
  const correctBets = typeof metadata.correctBets === 'number' ? metadata.correctBets : null;
  const matchCount = typeof metadata.matchCount === 'number' ? metadata.matchCount : null;
  const totalPoints = typeof metadata.totalPoints === 'number' ? metadata.totalPoints : null;
  const missingBets = typeof metadata.missingBets === 'number' ? metadata.missingBets : null;

  if (missingBets !== null) {
    return [{ label: 'faltando', value: String(missingBets) }];
  }

  return [
    correctBets !== null && matchCount !== null ? { label: 'acertos', value: `${correctBets}/${matchCount}` } : null,
    totalPoints !== null ? { label: 'pontos', value: `+${totalPoints}` } : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item));
}

const s = StyleSheet.create({
  overlay: { alignItems: 'center', backgroundColor: 'rgba(2, 6, 23, 0.62)', flex: 1, justifyContent: 'center', padding: 20 },
  sheet: { backgroundColor: MatchdayTheme.colors.surfaceElevated, borderRadius: 30, gap: 14, maxWidth: 420, overflow: 'hidden', padding: 20, width: '100%' },
  topRail: { height: 7, left: 0, position: 'absolute', right: 0, top: 0 },
  closeRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  eventPill: { alignItems: 'center', borderRadius: MatchdayTheme.radii.pill, flexDirection: 'row', gap: 6, paddingHorizontal: 11, paddingVertical: 7 },
  eventPillText: { fontFamily: Fonts.sans, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  closeButton: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.surface, borderRadius: MatchdayTheme.radii.pill, height: 34, justifyContent: 'center', width: 34 },
  title: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.display, fontSize: 34, fontWeight: '900', lineHeight: 36, textAlign: 'center', textTransform: 'uppercase' },
  message: { color: MatchdayTheme.colors.slate700, fontFamily: Fonts.sans, fontSize: 15, fontWeight: '700', lineHeight: 22, textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  statTile: { alignItems: 'center', backgroundColor: MatchdayTheme.colors.surface, borderColor: 'rgba(12,74,110,0.10)', borderRadius: 18, borderWidth: 1, minWidth: 96, paddingHorizontal: 14, paddingVertical: 12 },
  statValue: { color: MatchdayTheme.colors.blue900, fontFamily: Fonts.display, fontSize: 26, fontWeight: '900' },
  statLabel: { color: MatchdayTheme.colors.slate500, fontFamily: Fonts.sans, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  leagueName: { color: MatchdayTheme.colors.slate500, fontFamily: Fonts.sans, fontSize: 12, fontWeight: '800', textAlign: 'center', textTransform: 'uppercase' },
  primaryButton: { alignItems: 'center', borderRadius: MatchdayTheme.radii.pill, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 52 },
  primaryButtonText: { fontFamily: Fonts.sans, fontSize: 14, fontWeight: '900' },
});
