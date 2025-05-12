// src/components/SessionButton.tsx
import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import {
  startSession,
  endSession,
  deleteSession,
  getDuration,
  saveSessionWithBook,
  getEligibleBooks,
} from '../services/profileService';
import { getDBConnection } from '../../utils/database';

export default function SessionButton() {
  const [active, setActive] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);

  /* ------------------------- helper common ------------------------- */
  const reset = () => {
    setActive(false);
    setSessionId(null);
  };

  /* ----------------------------- start ----------------------------- */
  const onStart = async () => {
    try {
      const id = await startSession();
      setSessionId(id);
      setActive(true);
    } catch (err) {
      console.error('startSession error', err);
      Alert.alert('Errore', 'Impossibile avviare la sessione.');
    }
  };

  /* ------------------------------ end ------------------------------ */
  const onEndPress = async () => {
    if (sessionId === null) return;
    const seconds = await getDuration(sessionId);

    Alert.alert('Termina sessione', `Hai letto per ${seconds} secondi.`, [
      {
        text: 'Continua lettura',
        style: 'cancel', // chiude alert, continua la sessione
      },
      {
        text: 'Termina e salva',
        onPress: async () => {
          try {
            await endSession(sessionId);
            reset();
          } catch (e) {
            console.error(e);
            Alert.alert('Errore', 'Impossibile terminare la sessione.');
          }
        },
      },
      {
        text: 'Termina e associa libro',
        onPress: () => showBookPicker(seconds),
      },
      {
        text: 'Elimina sessione',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSession(sessionId);
            reset();
          } catch (e) {
            console.error(e);
            Alert.alert('Errore', 'Impossibile eliminare la sessione.');
          }
        },
      },
    ]);
  };

  /* ------------------------ associazione libro ------------------------ */
  const showBookPicker = async (seconds: number) => {
    if (sessionId === null) return;
    try {
      const books = await getEligibleBooks();
      if (books.length === 0) {
        await endSession(sessionId);
        Alert.alert('Sessione salvata', `${seconds} secondi registrati.`);
        reset();
        return;
      }

      const handleBook = async (book: any, markCompleted = false) => {
        await endSession(sessionId);
        await saveSessionWithBook(sessionId!, book.id, markCompleted);
        reset();
      };

      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: [...books.map((b) => b.title), 'Annulla'],
            cancelButtonIndex: books.length,
          },
          async (idx) => {
            if (idx === books.length) return; // user cancelled
            const book = books[idx];
            if (book.status === 'reading') {
              Alert.alert('Libro in lettura', 'Hai finito di leggerlo?', [
                { text: 'No', onPress: () => handleBook(book, false) },
                { text: 'Sì', onPress: () => handleBook(book, true) },
              ]);
            } else {
              await handleBook(book, false);
            }
          }
        );
      } else {
        const first = books[0];
        Alert.alert('Associa libro', `Associare "${first.title}"?`, [
          { text: 'No', style: 'cancel' },
          {
            text: 'Sì',
            onPress: () => handleBook(first, first.status === 'reading'),
          },
        ]);
      }
    } catch (err) {
      console.error('bookPicker error', err);
      Alert.alert('Errore', 'Impossibile associare il libro.');
    }
  };

  /* ---------------------------- render ---------------------------- */
  return (
    <TouchableOpacity
      style={[styles.btn, active ? styles.stopBtn : styles.startBtn]}
      onPress={active ? onEndPress : onStart}
    >
      <Text style={styles.txt}>{active ? 'Termina Sessione' : 'Inizia Sessione'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    padding: 12,
    borderRadius: 8,
    alignSelf: 'center',
    marginVertical: 16,
  },
  startBtn: { backgroundColor: '#4A90E2' },
  stopBtn: { backgroundColor: '#D0021B' },
  txt: { color: '#fff', fontWeight: 'bold' },
});
