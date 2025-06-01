import type { RecommendedBook } from '@/services/onboardingService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

/**
 * Legge da AsyncStorage la chiave 'firstLaunchRecommendations'. 
 * Se esistono libri consigliati, li restituisce e li rimuove immediatamente.
 * Ritorna `null` nel caso in cui non ci fossero consigli salvati.
 */
export function useFirstLaunchRecommendations() {
  const [recs, setRecs] = useState<RecommendedBook[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const json = await AsyncStorage.getItem('firstLaunchRecommendations');
        if (json) {
          const parsed: RecommendedBook[] = JSON.parse(json);
          
          // Verifica che tutti i libri abbiano tutti i campi necessari
          const validRecs = parsed.filter(book => 
            book.thumbnail && 
            book.thumbnail.trim() !== '' && 
            book.thumbnail.startsWith('http') &&
            book.description &&
            book.description.trim().length > 20 &&
            book.title &&
            book.authors
          );
          
          if (validRecs.length >= 3) {
            setRecs(validRecs);
            // Rimuovo subito la chiave per non ripetere la show
            await AsyncStorage.removeItem('firstLaunchRecommendations');
          } else {
            console.warn('Not enough valid complete recommendations found, removing from storage');
            await AsyncStorage.removeItem('firstLaunchRecommendations');
            setRecs(null);
          }
        } else {
          setRecs(null);
        }
      } catch (error) {
        console.warn('Errore nel leggere i firstLaunchRecommendations:', error);
        setRecs(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return { recommendations: recs, isLoading };
}
