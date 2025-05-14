import { SectionCard } from '@/components';
import { createTables, dropTables, getDBConnection } from '@/utils/database';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const db = getDBConnection();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContainer,
          {
            // Applica padding sui lati ma non in alto
            paddingTop: 0,
            paddingBottom: 16 + insets.bottom,
            paddingHorizontal: 16
          }
        ]}
      >
        <View style={[styles.header, { marginTop: insets.top }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#f4511e" />
            </TouchableOpacity>
            <Text style={styles.title}>Impostazioni</Text>
            <View style={{width: 24}} />
          </View>
        </View>
        
        <SectionCard title="Gestione Database">
          <Text style={styles.description}>
            Inizializza il database per creare tutte le tabelle necessarie per l&apos;applicazione.
          </Text>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={async () => {
              try {
                await createTables(db);
                alert('Database inizializzato con successo.');
              } catch (error) {
                console.error('Errore durante l\'inizializzazione del database:', error);
                alert('Errore durante l\'inizializzazione del database.');
              }
            }}
          >
            <Ionicons name="refresh-outline" size={22} color="#fff" />
            <Text style={styles.buttonText}>Inizializza Database</Text>
          </TouchableOpacity>
        </SectionCard>
        
        <SectionCard title="Reset Database">
          <Text style={styles.description}>
            ATTENZIONE: Questa operazione eliminerà tutti i dati dal database. 
            L&apos;azione non può essere annullata.
          </Text>
          <TouchableOpacity 
            style={[styles.actionButton, styles.dangerButton]}
            onPress={() => {
              Alert.alert(
                "Conferma reset",
                "Sei sicuro? Tutti i dati verranno eliminati permanentemente.",
                [
                  { text: "Annulla", style: "cancel" },
                  { 
                    text: "Conferma", 
                    style: "destructive",
                    onPress: async () => {
                      try {
                        await dropTables(db);
                        Alert.alert('Successo', 'Database resettato con successo.');
                      } catch (error) {
                        console.error('Errore durante il reset del database:', error);
                        Alert.alert('Errore', 'Errore durante il reset del database.');
                      }
                    }
                  }
                ]
              );
            }}
          >
            <Ionicons name="trash-outline" size={22} color="#fff" />
            <Text style={styles.buttonText}>Cancella Database</Text>
          </TouchableOpacity>
        </SectionCard>

        <SectionCard title="Informazioni App">
          <Text style={styles.description}>
            BookTrack è un&apos;applicazione per gestire la tua libreria personale, e tenere
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
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    lineHeight: 22,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4511e',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
  authors: {
    fontSize: 14,
    marginTop: 8,
    lineHeight: 22,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
