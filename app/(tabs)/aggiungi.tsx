import { SectionCard } from '@/components';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AggiungiScreen() {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingTop: 0,
            paddingBottom: 16 + insets.bottom
          }
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { marginTop: insets.top }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>Aggiungi</Text>
              <Text style={styles.subtitle}>Arricchisci la tua collezione</Text>
            </View>
          </View>
        </View>

        <SectionCard title="Nuovo libro">
          <Text style={styles.description}>
            Aggiungi un nuovo libro alla tua collezione tramite ricerca o inserimento manuale.
          </Text>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/add-book')}
          >
            <Ionicons name="add-outline" size={22} color="#fff" />
            <Text style={styles.buttonText}>Aggiungi Libro</Text>
          </TouchableOpacity>
        </SectionCard>
        
        <SectionCard title="Scansiona">
          <Text style={styles.description}>
            Scansiona il codice a barre di un libro per aggiungerlo rapidamente.
          </Text>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {/* Implementa la funzionalità di scansione */}}
          >
            <Ionicons name="barcode-outline" size={22} color="#fff" />
            <Text style={styles.buttonText}>Scansiona Codice</Text>
          </TouchableOpacity>
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
  contentContainer: {
    padding: 16,
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4511e',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 10,
    flex: 1,
    marginHorizontal: 4,
  },
  secondaryButton: {
    backgroundColor: '#4A90E2',
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
});
