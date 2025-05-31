import { SectionCard } from '@/components';
import { Colors, CommonStyles } from '@/constants/styles';
import { createTables, dropTables, getDBConnection } from '@/utils/database';
import { populateWithDemoDataFromAPI } from '@/utils/demoInitialize';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const db = getDBConnection();
  const insets = useSafeAreaInsets();

  return (
    <View style={CommonStyles.container}>
      <ScrollView 
        contentContainerStyle={[
          CommonStyles.contentContainer,
          {
            // Applica padding sui lati ma non in alto
            paddingTop: 0,
            paddingBottom: 16 + insets.bottom,
          }
        ]}
      >
        <View style={[CommonStyles.header, { marginTop: insets.top }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity 
              style={CommonStyles.iconButton} 
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.secondary} />
            </TouchableOpacity>
            <Text style={CommonStyles.title}>Impostazioni</Text>
            <View style={{width: 24}} />
          </View>
        </View>
         <SectionCard title="Gestione Database">
            <Text style={styles.description}>
            La reinizializzazione del database ripristina la struttura delle tabelle dell&apos;applicazione.
            </Text>
          <TouchableOpacity 
            style={[CommonStyles.secondaryButton, styles.dangerButton]}
            onPress={() => {
              Alert.alert(
          "Conferma reinizializzazione",
          "Sei sicuro? Tutti i dati esistenti verranno eliminati e il database sarà ripristinato.",
          [
            { text: "Annulla", style: "cancel" },
            { 
              text: "Conferma",
              style: "destructive",
              onPress: async () => {
                try {
            await dropTables(db);
            await createTables(db);
            Alert.alert('Successo', 'Database reinizializzato con successo.');
                } catch (error) {
            console.error('Errore durante la reinizializzazione del database:', error);
            Alert.alert('Errore', 'Errore durante la reinizializzazione del database.');
                }
              }
            }
          ]
              );
            }}
          >
            <Ionicons name="refresh-outline" size={22} color="#fff" />
            <Text style={CommonStyles.secondaryButtonText}>Reinizializza Database</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[CommonStyles.primaryButton, { marginTop: 8 }]}
            onPress={() => {
              Alert.alert(
                'Popola con libri demo',
                'Vuoi popolare il database con dati demo? Questa operazione può richiedere alcuni minuti.',
                [
                  { text: 'Annulla', style: 'cancel' },
                  {
                    text: "Conferma",
                    onPress: async () => {
                      try {
                        // Mostra un alert di caricamento senza pulsanti
                        Alert.alert(
                          'In corso...',
                          'Sto scaricando i dati dai server di Google Books. Attendere...',
                          [], // Nessun pulsante
                          { cancelable: false } // Non può essere chiuso toccando fuori
                        );
                        await populateWithDemoDataFromAPI();
                        Alert.alert('Successo', 'Database popolato con libri demo!');
                      } catch (error) {
                        console.error('Errore durante il popolamento API:', error);
                        Alert.alert('Errore', 'Errore durante il popolamento del database.');
                      }
                    }
                  }
                ]
              );
            }}
          >
            <Ionicons name="library-outline" size={22} color="#fff" />
            <Text style={CommonStyles.primaryButtonText}>Popola con libri demo</Text>
          </TouchableOpacity>
        </SectionCard>

        <SectionCard title="Informazioni App">
          <Text style={styles.description}>
            Readit è un&apos;applicazione per gestire la tua libreria personale, e tenere
            traccia dei tuoi progressi di lettura.
          </Text>
          <Text style={styles.description}>
            Sviluppata con React Native su framework Expo, e con database SQLite, per il corso
            di Mobile Programming, A.A. 2024/25.
          </Text>
          <Text style={styles.authors}>
            App creata da Gennaro, Elettra e Francesco 🧑🏻‍💻
          </Text>
        </SectionCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 22,
  },
  dangerButton: {
    backgroundColor: Colors.error,
  },
  authors: {
    fontSize: 14,
    marginTop: 8,
    lineHeight: 22,
    textAlign: 'center',
    fontStyle: 'italic',
    color: Colors.textSecondary,
  },
});
