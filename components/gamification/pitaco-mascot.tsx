import { ImageSourcePropType, StyleSheet, View } from 'react-native';
import Animated, { BounceIn, FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';

import { MatchdayTheme } from '@/constants/theme';

type PitaVariant =
  | 'happy'
  | 'sad'
  | 'thinking'
  | 'champion'
  | 'invite'
  | 'empty'
  | 'exact'
  | 'achievement'
  | 'waiting'
  | 'firstAccess';

type Props = {
  animationKey: string;
  severity?: string;
};

const pitaImages: Record<PitaVariant, ImageSourcePropType> = {
  achievement: require('../../assets/images/pita-conquista-desbloqueada.png'),
  champion: require('../../assets/images/pita-campeao-rodada.png'),
  empty: require('../../assets/images/pita-nenhum-bolao-encontrado.png'),
  exact: require('../../assets/images/pita-placar-exato.png'),
  firstAccess: require('../../assets/images/pita-primeiro-acesso.png'),
  happy: require('../../assets/images/pita-acertou-muitos-palpites.png'),
  invite: require('../../assets/images/pita-convidando-amigos.png'),
  sad: require('../../assets/images/pita-triste.png'),
  thinking: require('../../assets/images/pita-analisando-jogos.png'),
  waiting: require('../../assets/images/pita-esperando-resultados.png'),
};

const confetti = [
  { color: MatchdayTheme.colors.lime300, delay: 60, left: 34, rotate: '18deg', top: 42 },
  { color: MatchdayTheme.colors.gold400, delay: 120, left: 64, rotate: '-14deg', top: 22 },
  { color: MatchdayTheme.colors.blue500, delay: 180, left: 102, rotate: '28deg', top: 36 },
  { color: MatchdayTheme.colors.coral400, delay: 240, left: 134, rotate: '-22deg', top: 58 },
  { color: MatchdayTheme.colors.gold400, delay: 300, left: 180, rotate: '12deg', top: 30 },
  { color: MatchdayTheme.colors.lime300, delay: 360, left: 218, rotate: '-30deg', top: 52 },
];

export function PitacoMascot({ animationKey, severity }: Props) {
  const variant = resolveVariant(animationKey, severity);
  const showConfetti = ['happy', 'exact', 'champion', 'achievement'].includes(variant);

  return (
    <View style={s.stage}>
      {showConfetti ? (
        <View pointerEvents="none" style={s.confettiLayer}>
          {confetti.map((piece) => (
            <Animated.View
              entering={FadeInDown.delay(piece.delay).duration(700)}
              key={`${piece.left}-${piece.top}`}
              style={[
                s.confettiPiece,
                {
                  backgroundColor: piece.color,
                  left: piece.left,
                  top: piece.top,
                  transform: [{ rotate: piece.rotate }],
                },
              ]}
            />
          ))}
        </View>
      ) : null}

      <Animated.Image
        entering={enteringForVariant(variant)}
        key={`${variant}-${animationKey}`}
        resizeMode="contain"
        source={pitaImages[variant]}
        style={s.image}
      />
    </View>
  );
}

function resolveVariant(animationKey: string, severity?: string): PitaVariant {
  const key = animationKey.toLowerCase();

  if (key.includes('campeao') || key.includes('champion') || key.includes('leader')) return 'champion';
  if (key.includes('placar') || key.includes('exact') || key.includes('perfect')) return 'exact';
  if (key.includes('conquista') || key.includes('achievement') || key.includes('unlock')) return 'achievement';
  if (key.includes('invite') || key.includes('convite') || key.includes('convid')) return 'invite';
  if (key.includes('empty') || key.includes('nenhum') || key.includes('vazio')) return 'empty';
  if (key.includes('first') || key.includes('primeiro')) return 'firstAccess';
  if (key.includes('waiting') || key.includes('esperando') || key.includes('resultados')) return 'waiting';
  if (key.includes('deadline') || key.includes('thinking') || key.includes('analisando') || key.includes('prazo')) return 'thinking';
  if (severity === 'negative' || key.includes('bad') || key.includes('sad') || key.includes('triste')) return 'sad';

  return 'happy';
}

function enteringForVariant(variant: PitaVariant) {
  if (variant === 'sad') return FadeInDown.duration(500);
  if (variant === 'champion') return ZoomIn.duration(700);
  if (variant === 'thinking' || variant === 'waiting' || variant === 'empty') return FadeIn.duration(500);
  return BounceIn.duration(650);
}

const s = StyleSheet.create({
  confettiLayer: {
    height: 150,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 0,
  },
  confettiPiece: {
    borderRadius: 4,
    height: 16,
    position: 'absolute',
    width: 9,
  },
  image: {
    height: 210,
    width: 315,
    zIndex: 1,
  },
  stage: {
    alignItems: 'center',
    height: 220,
    justifyContent: 'center',
    marginTop: 2,
    overflow: 'visible',
    width: '100%',
  },
});
