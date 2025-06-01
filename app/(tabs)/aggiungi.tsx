import { SectionCard } from '@/components';
import { getTabContentBottomPadding } from '@/constants/layout';
import { Colors, CommonStyles } from '@/constants/styles';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AggiungiScreen() {
  const insets = useSafeAreaInsets();
  
  // Add haptic feedback when tab is focused
  useFocusEffect(
    useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, [])
  );

  // Haptic feedback wrapper functions
  const handleAddBook = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/add-book');
  };

  const handleScanBook = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/scan');
  };
  
  return (
    <View style={CommonStyles.container}>
      <ScrollView
        contentContainerStyle={[
          CommonStyles.contentContainer,
          {
            paddingTop: 0,
            paddingBottom: getTabContentBottomPadding(insets.bottom)
          }
        ]}
      >
        {/* Header */}
        <View style={[CommonStyles.header, { marginTop: insets.top }]}>
          <View style={CommonStyles.headerTop}>
            <View>
              <Text style={CommonStyles.title}>Aggiungi</Text>
              <Text style={CommonStyles.subtitle}>Arricchisci la tua collezione</Text>
            </View>
          </View>
        </View>

        <SectionCard title="Nuovo libro">
          <Text style={styles.description}>
            Aggiungi un nuovo libro alla tua collezione tramite ricerca o inserimento manuale.
          </Text>
          <TouchableOpacity 
            style={CommonStyles.secondaryButton}
            onPress={handleAddBook}
          >
            <Ionicons name="add-outline" size={22} color={Colors.textOnPrimary} />
            <Text style={CommonStyles.secondaryButtonText}>Aggiungi Libro</Text>
          </TouchableOpacity>
        </SectionCard>
        
        <SectionCard title="Scansiona">
          <Text style={styles.description}>
            Scansiona il codice a barre di un libro per aggiungerlo rapidamente.
          </Text>
          <TouchableOpacity 
            style={CommonStyles.primaryButton}
            onPress={handleScanBook}
          >
            <Ionicons name="barcode-outline" size={22} color={Colors.textOnPrimary} />
            <Text style={CommonStyles.primaryButtonText}>Scansiona Codice</Text>
          </TouchableOpacity>
        </SectionCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 22,
  },
});
