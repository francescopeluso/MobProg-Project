// SessionButton.tsx – versione completa con alone “breathing” e coach‑mark

import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/styles';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Modal from 'react-native-modal';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  deleteSession,
  endSession,
  getActiveSessionId,
  getDurationToNow,
  getEligibleBooks,
  saveSessionWithBook,
  startSession,
} from '../services/profileService';

interface Props {
  variant?: 'default' | 'compact';
}

export default function SessionButton({ variant = 'default' }: Props) {
  const [active, setActive] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [showIntro, setShowIntro] = useState(false);

  /* ───── breathing animation value (0 → 1) ───── */
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    /* restore active session on mount */
    (async () => {
      const existing = await getActiveSessionId();
      if (existing) {
        setSessionId(existing);
        setActive(true);
      }
    })();

    /* show coach‑mark only once */
    (async () => {
      const already = await AsyncStorage.getItem('session_intro_shown');
      if (!already) {
        setShowIntro(true);
      }
    })();
  }, []);

  /* ───── start pulsing when active, stop otherwise ───── */
  useEffect(() => {
    if (active) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(0);
    }
  }, [active]);

  const reset = () => {
    setActive(false);
    setSessionId(null);
  };

  /* ──────────────── start ──────────────── */
  const onStart = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const id = await startSession();
      setSessionId(id);
      setActive(true);
    } catch (e) {
      console.error('startSession error', e);
      Alert.alert('Errore', 'Impossibile avviare la sessione.');
    }
  };

  /* ──────────────── stop / manage ──────────────── */
  const onStop = async () => {
    if (!sessionId) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const seconds = await getDurationToNow(sessionId);
      const formatTime = (totalSeconds: number) => {
        if (totalSeconds < 60) {
          return `${totalSeconds} second${totalSeconds === 1 ? 'o' : 'i'}`;
        } else if (totalSeconds < 3600) {
          const minutes = Math.floor(totalSeconds / 60);
          const seconds = totalSeconds % 60;
          return `${minutes} minut${minutes === 1 ? 'o' : 'i'}$${seconds > 0 ? ` e ${seconds} second${seconds === 1 ? 'o' : 'i'}` : ''}`;
        } else {
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          const seconds = totalSeconds % 60;
          let result = `${hours} or${hours === 1 ? 'a' : 'e'}`;
          if (minutes > 0) result += ` ${minutes} minut${minutes === 1 ? 'o' : 'i'}`;
          if (seconds > 0) result += ` e ${seconds} second${seconds === 1 ? 'o' : 'i'}`;
          return result;
        }
      };

      Alert.alert('Termina sessione', `Hai letto per ${formatTime(seconds)}.`, [
        { text: 'Continua', style: 'cancel' },
        {
          text: 'Salva',
          onPress: async () => {
            await endSession(sessionId);
            reset();
          },
        },
        {
          text: 'Associa libro',
          onPress: () => showBookPicker(seconds),
        },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            await deleteSession(sessionId);
            reset();
          },
        },
      ]);
    } catch (e) {
      console.error('onStop error', e);
      Alert.alert('Errore', 'Impossibile terminare la sessione.');
    }
  };

  /* ─────────── associate book ─────────── */
  const showBookPicker = async (seconds: number) => {
    if (!sessionId) return;
    try {
      const books = await getEligibleBooks();
      if (books.length === 0) {
        await endSession(sessionId);
        Alert.alert('Sessione salvata', `${seconds} secondi registrati.`);
        reset();
        return;
      }
      const handle = async (book: any, markCompleted = false) => {
        await endSession(sessionId);
        await saveSessionWithBook(sessionId, book.id, markCompleted);
        reset();
      };
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: [...books.map((b) => b.title), 'Annulla'],
            cancelButtonIndex: books.length,
          },
          (idx) => {
            if (idx === books.length) return;
            const book = books[idx];
            if (book.status === 'reading') {
              Alert.alert('Libro in lettura', 'Hai finito di leggerlo?', [
                { text: 'No', onPress: () => handle(book, false) },
                { text: 'Sì', onPress: () => handle(book, true) },
              ]);
            } else {
              handle(book, false);
            }
          }
        );
      } else {
        const first = books[0];
        Alert.alert('Associa libro', `Associare “${first.title}”?`, [
          { text: 'No', style: 'cancel' },
          { text: 'Sì', onPress: () => handle(first, first.status === 'reading') },
        ]);
      }
    } catch (e) {
      console.error('showBookPicker error', e);
      Alert.alert('Errore', 'Impossibile associare il libro.');
    }
  };

  /* ──────────────── render ──────────────── */
  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  if (variant === 'compact') {
    return (
      <TouchableOpacity onPress={active ? onStop : onStart} hitSlop={10} style={{ marginLeft: 12 }}>
        <Ionicons
          name={active ? 'book' : 'book-outline'}
          size={24}
          color={active ? Colors.error : Colors.primary}
        />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* Pulsing ring */}
      {active && (
        <Animated.View
          pointerEvents="none"
          style={[styles.pulseRing, { transform: [{ scale: ringScale }], opacity: ringOpacity }]}
        />
      )}

      {/* Main button */}
      <TouchableOpacity
        style={[styles.btn, active ? styles.stopBtn : styles.startBtn]}
        onPress={active ? onStop : onStart}
      >
        <Ionicons
          name={active ? 'stop-circle-outline' : 'play-circle-outline'}
          size={22}
          color={Colors.textOnPrimary}
          style={styles.btnIcon}
        />
        <Text style={styles.txt}>{active ? 'Termina Sessione' : 'Inizia Sessione'}</Text>
      </TouchableOpacity>

      {/* Intro coach‑mark */}
      <Modal isVisible={showIntro} onBackdropPress={() => setShowIntro(false)}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Timer di Lettura</Text>
          <Text style={styles.modalBody}>
            Premi "Inizia" per registrare quanto tempo dedichi alla lettura. Puoi interrompere
            in qualsiasi momento e associare la sessione a un libro. Consigliato: attiva la
            Focus Mode per evitare distrazioni!
          </Text>
          <TouchableOpacity
            style={[styles.btn, styles.startBtn, { alignSelf: 'stretch' }]}
            onPress={async () => {
              setShowIntro(false);
              await AsyncStorage.setItem('session_intro_shown', 'true');
            }}
          >
            <Text style={[styles.txt, { textAlign: 'center' }]}>Capito</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
    marginVertical: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.primary,
  },
  btn: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.small,
    width: 140,
  },
  startBtn: { backgroundColor: Colors.primary },
  stopBtn: { backgroundColor: Colors.error },
  btnIcon: {
    marginRight: Spacing.sm,
  },
  txt: {
    color: Colors.textOnPrimary,
    fontWeight: Typography.fontWeight.bold,
    fontSize: Typography.fontSize.lg,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.md,
  },
  modalBody: {
    fontSize: Typography.fontSize.md,
    marginBottom: Spacing.lg,
  },
});
