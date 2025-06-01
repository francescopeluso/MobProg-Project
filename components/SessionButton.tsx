import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/styles';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
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
      
      // Richiedi attivazione modalità Focus/Non Disturbare
      await requestFocusMode();
    } catch (e) {
      console.error('startSession error', e);
      Alert.alert('Errore', 'Impossibile avviare la sessione.');
    }
  };

  /* ─────────── Focus Mode Management ─────────── */
  const requestFocusMode = async () => {
    if (Platform.OS === 'ios') {
      Alert.alert(
        'Modalità Lettura',
        'Vuoi attivare la modalità Focus per concentrarti sulla lettura? Questo ridurrà le distrazioni.',
        [
          { text: 'No, grazie', style: 'cancel' },
          { 
            text: 'Attiva Focus', 
            onPress: async () => {
              try {
                // Richiedi permessi per le notifiche se non già concessi
                const { status } = await Notifications.requestPermissionsAsync();
                if (status === 'granted') {
                  // Programma una notifica silenziosa che indica la modalità lettura attiva
                  await Notifications.scheduleNotificationAsync({
                    content: {
                      title: '📚 Sessione di lettura attiva',
                      body: 'Focus mode attivato - Buona lettura!',
                      sound: false,
                      priority: Notifications.AndroidNotificationPriority.LOW,
                    },
                    trigger: null, // Mostra immediatamente
                  });
                }
                
                // Su iOS, possiamo suggerire all'utente di attivare manualmente Focus
                Alert.alert(
                  'Attiva Focus manualmente',
                  'Apri il Centro di Controllo (scorri dall\'alto a destra) e tocca "Focus" per attivare la modalità Non Disturbare o Lettura.',
                  [{ text: 'OK' }]
                );
              } catch (error) {
                console.error('Error setting up focus mode:', error);
              }
            }
          }
        ]
      );
    }
  };

  const clearFocusMode = async () => {
    try {
      // Cancella tutte le notifiche programmate da questa app
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      if (Platform.OS === 'ios') {
        Alert.alert(
          'Sessione terminata',
          'Ricordati di disattivare la modalità Focus dal Centro di Controllo se l\'hai attivata.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error clearing focus mode:', error);
    }
  };

  /* ──────────────── stop / manage ──────────────── */
  const onStop = async () => {
    if (!sessionId) return;
    try {      
      const seconds = await getDurationToNow(sessionId);
      // Helper function to format time
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

      // Pulisci la modalità Focus
      await clearFocusMode();

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
    <TouchableOpacity
      style={[styles.btn, active ? styles.stopBtn : styles.startBtn]}
      onPress={active ? onStop : onStart}
    >
      <Ionicons 
        name={active ? "stop-circle-outline" : "play-circle-outline"} 
        size={22} 
        color={Colors.textOnPrimary} 
        style={styles.btnIcon} 
      />
      <Text style={styles.txt}>{active ? 'Termina Sessione' : 'Inizia Sessione'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { 
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignSelf: 'center', 
    marginVertical: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.small,
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
});