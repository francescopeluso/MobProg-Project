// src/components/SessionButton.tsx
import React, { useEffect, useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  startSession,
  endSession,
  deleteSession,
  saveSessionWithBook,
  getEligibleBooks,
  getDurationToNow,
  getActiveSessionId,
} from '../services/profileService';

interface Props {
  variant?: 'default' | 'compact';
}

export default function SessionButton({ variant = 'default' }: Props) {
  const [active, setActive] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);

  /* ───────── restore active session on mount ───────── */
  useEffect(() => {
    (async () => {
      const existing = await getActiveSessionId();
      if (existing) {
        setSessionId(existing);
        setActive(true);
      }
    })();
  }, []);

  const reset = () => {
    setActive(false);
    setSessionId(null);
  };

  /* ──────────────── start ──────────────── */
  const onStart = async () => {
    try {
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
      const seconds = await getDurationToNow(sessionId);
      Alert.alert('Termina sessione', `Hai letto per ${seconds} secondi.`, [
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
  if (variant === 'compact') {
    return (
      <TouchableOpacity onPress={active ? onStop : onStart} hitSlop={10} style={{ marginLeft: 12 }}>
        <Ionicons
          name={active ? 'book' : 'book-outline'}
          size={24}
          color={active ? '#D0021B' : '#4A90E2'}
        />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.btn, active ? styles.stopBtn : styles.startBtn]}
      onPress={active ? onStop : onStart}
    >
      <Text style={styles.txt}>{active ? 'Termina Sessione' : 'Inizia Sessione'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { padding: 12, borderRadius: 8, alignSelf: 'center', marginVertical: 16 },
  startBtn: { backgroundColor: '#4A90E2' },
  stopBtn: { backgroundColor: '#D0021B' },
  txt: { color: '#fff', fontWeight: 'bold' },
});