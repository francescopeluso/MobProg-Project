import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Animated,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function BookFlipCard() {
  const rotation = useRef(new Animated.Value(0)).current;
  const [flipped, setFlipped] = useState(false);

  const frontInterpolate = rotation.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = rotation.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const flipCard = () => {
    if (flipped) {
      Animated.timing(rotation, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start(() => setFlipped(false));
    } else {
      Animated.timing(rotation, {
        toValue: 180,
        duration: 800,
        useNativeDriver: true,
      }).start(() => setFlipped(true));
    }
  };

  return (
    <Pressable onPress={flipCard} style={styles.container}>
      <View>
        <Animated.View style={[styles.card, styles.front, { transform: [{ rotateY: frontInterpolate }] }]}>
          <Text style={styles.title}>📘 Copertina</Text>
        </Animated.View>

        <Animated.View style={[styles.card, styles.back, { transform: [{ rotateY: backInterpolate }] }]}>
          <Text style={styles.content}>📖 Pagina interna del libro</Text>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF3E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 180,
    height: 240,
    borderRadius: 12,
    position: 'absolute',
    backfaceVisibility: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  front: {
    backgroundColor: '#A1C4FD',
  },
  back: {
    backgroundColor: '#FCD9F6',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    fontSize: 16,
    color: '#222',
    padding: 10,
    textAlign: 'center',
  },
});
