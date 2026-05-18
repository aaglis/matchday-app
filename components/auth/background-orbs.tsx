import { StyleSheet, View } from 'react-native';

export function BackgroundOrbs() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.vertical} />
      <View style={styles.horizontal} />
    </View>
  );
}

const styles = StyleSheet.create({
  vertical: {
    backgroundColor: 'rgba(12,74,110,0.06)',
    height: '100%',
    left: '18%',
    position: 'absolute',
    width: 1,
  },
  horizontal: {
    backgroundColor: 'rgba(12,74,110,0.06)',
    height: 1,
    position: 'absolute',
    top: '28%',
    width: '100%',
  },
});
