// SessionButton.tsx – versione leggera: solo feedback aptico e coach‑mark al primo click

import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/styles';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
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

  /* Ripristina eventuale sessione attiva salvata */
  useEffect(() => {
    (async () => {
      const existing = await getActiveSessionId();
      if (existing) {
        setSessionId(existing);
        setActive(true);
      }
    })();
  }, []);

  /* -------------------------------- helpers -------------------------------- */
  const formatTime = (totalSeconds: number) => {
    if (totalSeconds < 60) {
      return `${totalSeconds} second${totalSeconds === 1 ? 'o' : 'i'}`;
    } else if (totalSeconds < 3600) {
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes} minut${minutes === 1 ? 'o' : 'i'}${seconds > 0 ? ` e ${seconds} second${seconds === 1 ? 'o' : 'i'}` : ''}`;
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

  /* ------------------------------ start/stop ------------------------------ */
  const startSessionOps = async () => {
    try {
      const id = await startSession();
      setSessionId(id);
      setActive(true);
    } catch (e) {
      console.error('startSession error', e);
      Alert.alert('Errore', 'Impossibile avviare la sessione.');
    }
  };

  const handleStartPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Coach‑mark solo la prima volta
    const seen = await AsyncStorage.getItem('session_intro_shown');
    if (!seen) {
      setShowIntro(true);
      return;
    }
    startSessionOps();
  };

  const confirmIntro = async () => {
    await AsyncStorage.setItem('session_intro_shown', 'true');
    setShowIntro(false);
    startSessionOps();
  };

  const onStop = async () => {
    if (!sessionId) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const seconds = await getDurationToNow(sessionId);
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

  const reset = () => {
    setActive(false);
    setSessionId(null);
  };

  /* --------------------------- associazione libro -------------------------- */
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

  /* -------------------------------- render -------------------------------- */
  if (variant === 'compact') {
    return (
      <>
        <TouchableOpacity onPress={active ? onStop : handleStartPress} hitSlop={10} style={{ marginLeft: 12 }}>
          <Ionicons
            name={active ? 'book' : 'book-outline'}
            size={24}
            color={active ? Colors.error : Colors.primary}
          />
        </TouchableOpacity>

        <Modal isVisible={showIntro} onBackdropPress={() => setShowIntro(false)}>
          <IntroCard onConfirm={confirmIntro} />
        </Modal>
      </>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.btn, active ? styles.stopBtn : styles.startBtn]}
        onPress={active ? onStop : handleStartPress}
      >
        <Ionicons
          name={active ? 'stop-circle-outline' : 'play-circle-outline'}
          size={22}
          color={Colors.textOnPrimary}
          style={styles.btnIcon}
        />
        <Text style={styles.txt}>{active ? 'Termina Sessione' : 'Inizia Sessione'}</Text>
      </TouchableOpacity>

      <Modal isVisible={showIntro} onBackdropPress={() => setShowIntro(false)}>
        <IntroCard onConfirm={confirmIntro} />
      </Modal>
    </>
  );
}

/* ------------------------------- Intro card ------------------------------- */
const IntroCard = ({ onConfirm }: { onConfirm: () => void }) => (
  <View style={styles.modalCard}>
    <Text style={styles.modalTitle}>Timer di Lettura</Text>
    <Text style={styles.modalBody}>
      Hai iniziato una sessione di lettura.
      Al termine, clicca nuovamente per interrompere e potrai associare la sessione a uno dei libri disponibili.
    </Text>
    <TouchableOpacity style={[styles.btn, styles.startBtn]} onPress={onConfirm}>
      <Text style={styles.txt}>Capito</Text>
    </TouchableOpacity>
  </View>
);

/* -------------------------------- styles -------------------------------- */
const styles = StyleSheet.create({
  btn: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.small,
    alignSelf: 'center',
    marginVertical: Spacing.lg,
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
    borderRadius: BorderRadius.md,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  modalBody: {
    fontSize: Typography.fontSize.md,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
});
