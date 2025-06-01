import { Colors, Spacing, Typography } from '@/constants/styles';
import { prepareInitialRecommendations } from '@/services/onboardingService';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
// @ts-ignore
import Onboarding from 'react-native-onboarding-swiper';


const AVAILABLE_GENRES = [
  'Fiction', 'Fantasy', 'Sci-Fi', 'Mystery', 'Romance', 'Thriller',
  'Horror', 'Biography', 'History', 'Self-Help', 'Science', 'Philosophy',
  'Classic', 'Young Adult', 'Children'
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  // Callback per completare l'onboarding
  const finish = async () => {
    await AsyncStorage.setItem('hasSeenIntro', 'true');

    if (selectedGenres.length > 0) {
      await prepareInitialRecommendations(selectedGenres);
    }
    router.replace('/(tabs)');
  };

  return (
    <Onboarding
      onSkip={finish}
      onDone={finish}
      containerStyles={{ paddingBottom: 40 }}
      pages={[
        // Pagina 1 - Benvenuto
        {
          backgroundColor: '#ffffff',
          title: (
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/images/logo-long.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.welcomeTitle}>Benvenuto su Readit!</Text>
            </View>
          ),
          subtitle: (
            <View style={styles.subtitleContainer}>
              <Text style={styles.welcomeSubtitle}>La tua libreria digitale a portata di mano</Text>
              <View style={styles.welcomeFeatures}>
                <View style={styles.welcomeFeature}>
                  <Ionicons name="book" size={24} color={Colors.primary} />
                  <Text style={styles.welcomeFeatureText}>Organizza i tuoi libri</Text>
                </View>
                <View style={styles.welcomeFeature}>
                  <MaterialIcons name="timer" size={24} color={Colors.primary} />
                  <Text style={styles.welcomeFeatureText}>Traccia il tempo di lettura</Text>
                </View>
                <View style={styles.welcomeFeature}>
                  <Feather name="trending-up" size={24} color={Colors.primary} />
                  <Text style={styles.welcomeFeatureText}>Statistiche personali</Text>
                </View>
              </View>
            </View>
          ),
        },
        // Pagina 2 - Organizzazione
        {
          backgroundColor: Colors.primaryLight,
          image: (
            <View style={styles.iconPageContainer}>
              <Ionicons name="library" size={120} color={Colors.background} />
            </View>
          ),
          title: 'Tieniti organizzato',
          subtitle: 'Aggiungi, ordina e filtra i tuoi libri in un attimo.',
        },
        // Pagina 3 - Funzionalità
        {
          backgroundColor: '#ffffff',
          image: (
            <View style={styles.iconPageContainer}>
              <MaterialIcons name="auto-stories" size={120} color={Colors.primary} />
            </View>
          ),
          title: 'Un compagno di lettura',
          subtitle:
            'Cerca titoli online, scannerizza ISBN o aggiungili manualmente.\n\n'
            + 'Premi il pulsante "Sessione" in alto a destra nella schermata '
            + 'principale prima di iniziare a leggere e ricliccalo quando hai finito: '
            + 'Readit terrà traccia del tempo per mostrarti statistiche sempre più ricche!',
        },
        // Pagina 4 - Selezione generi
        {
          backgroundColor: Colors.primaryLight,
          subtitle: (
            <KeyboardAvoidingView
              behavior={Platform.select({ ios: 'padding', android: undefined })}
              style={styles.keyboardContainer}
            >
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    Seleziona i generi che ti interessano
                  </Text>
                  <Text style={styles.inputDescription}>
                    Ti mostreremo libri fantastici basati sui tuoi gusti
                  </Text>
                  
                  <View style={styles.genresContainer}>
                    {AVAILABLE_GENRES.map((genre) => (
                      <TouchableOpacity
                        key={genre}
                        style={[
                          styles.genreButton,
                          selectedGenres.includes(genre) && styles.genreButtonSelected
                        ]}
                        onPress={() => toggleGenre(genre)}
                      >
                        <Text style={[
                          styles.genreText,
                          selectedGenres.includes(genre) && styles.genreTextSelected
                        ]}>
                          {genre}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {selectedGenres.length > 0 && (
                    <View style={styles.helperContainer}>
                      <View style={styles.iconContainer}>
                        <Text style={styles.iconText}>✨</Text>
                      </View>
                      <Text style={styles.helper}>
                        Perfetto! Hai selezionato {selectedGenres.length} genere{selectedGenres.length > 1 ? 'i' : ''}. 
                        Ti mostreremo subito libri fantastici che potrebbero interessarti!
                      </Text>
                    </View>
                  )}

                  <View style={styles.featuresContainer}>
                    <View style={styles.feature}>
                      <Text style={styles.featureIcon}>📚</Text>
                      <Text style={styles.featureText}>Consigli personalizzati</Text>
                    </View>
                    <View style={styles.feature}>
                      <Text style={styles.featureIcon}>🎯</Text>
                      <Text style={styles.featureText}>Libri completi con copertina</Text>
                    </View>
                    <View style={styles.feature}>
                      <Text style={styles.featureIcon}>⭐</Text>
                      <Text style={styles.featureText}>Scopri il tuo prossimo capolavoro</Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          ),
        },
      ]}
    />
  );
}

// Styles
const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    marginTop: -40, // Sposta il logo più in alto
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: Spacing.md,
  },
  welcomeTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.primary, // Assicurati che sia visibile su sfondo bianco
    textAlign: 'center',
  },
  iconPageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xl,
  },
  subtitleContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  welcomeSubtitle: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  welcomeFeatures: {
    width: '100%',
    gap: Spacing.md,
  },
  welcomeFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 70, 229, 0.05)',
    padding: Spacing.md,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  welcomeFeatureText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    marginLeft: Spacing.md,
    fontWeight: '500',
  },
  keyboardContainer: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  inputContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  inputLabel: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  inputDescription: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    width: '100%',
  },
  genreButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 2,
    borderColor: Colors.border,
    marginBottom: Spacing.xs,
  },
  genreButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  genreText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  genreTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  helperContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.lg,
    width: '100%',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  iconText: {
    fontSize: 16,
  },
  helper: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  featuresContainer: {
    width: '100%',
    gap: Spacing.md,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: Spacing.md,
    borderRadius: 10,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: Spacing.md,
  },
  featureText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
