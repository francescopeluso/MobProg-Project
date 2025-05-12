import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BookRatingCard,
  GenreChart,
  MonthlyReadingChart,
  ReadingProgressChart,
  SectionCard,
  StatBox
} from '@/components';

export default function ProfiloScreen() {
  const insets = useSafeAreaInsets();
  
  // Dati per il grafico a barre
  const barData = [
    { value: 10, label: 'Gen', frontColor: '#f4511e' },
    { value: 6, label: 'Feb', frontColor: '#f4511e' },
    { value: 8, label: 'Mar', frontColor: '#f4511e' },
    { value: 12, label: 'Apr', frontColor: '#f4511e' },
    { value: 4, label: 'Mag', frontColor: '#f4511e' },
    { value: 2, label: 'Giu', frontColor: '#f4511e' },
  ];
  
  // Dati per il grafico a torta
  const pieData = [
    { value: 50, color: '#f4511e', text: '50%', label: 'Narrativa' },
    { value: 30, color: '#ffb347', text: '30%', label: 'Saggistica' },
    { value: 20, color: '#4caf50', text: '20%', label: 'Fantasy' },
  ];

  // Dati per il grafico a linee (progressione letture)
  const lineData = [
    { value: 2, dataPointText: '2', label: 'Lun' },
    { value: 5, dataPointText: '5', label: 'Mar' },
    { value: 4, dataPointText: '4', label: 'Mer' },
    { value: 8, dataPointText: '8', label: 'Gio' },
    { value: 6, dataPointText: '6', label: 'Ven' },
    { value: 10, dataPointText: '10', label: 'Sab' },
  ];

  // Valutazioni di libri
  const bookRatings = [
    { 
      title: "Dune", 
      author: "Frank Herbert", 
      rating: 5,
      comment: "Un capolavoro della fantascienza, worldbuilding incredibile."
    },
    { 
      title: "1984", 
      author: "George Orwell", 
      rating: 4,
      comment: "Inquietante e sempre attuale, una lettura necessaria."
    },
    { 
      title: "Il nome della rosa", 
      author: "Umberto Eco", 
      rating: 4,
      comment: "Complesso ma affascinante. Richiede attenzione."
    },
    { 
      title: "Fahrenheit 451", 
      author: "Ray Bradbury", 
      rating: 3,
      comment: "Premesse interessanti ma ritmo altalenante."
    },
    { 
      title: "La storia infinita", 
      author: "Michael Ende", 
      rating: 5,
      comment: "Magico e coinvolgente, un classico senza tempo."
    }
  ];

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={[
          styles.contentContainer,
          {
            // Applica padding sui lati ma non in alto
            paddingTop: 0,
            paddingBottom: 16 + insets.bottom
          }
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { marginTop: insets.top }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>Profilo</Text>
              <Text style={styles.subtitle}>Track your reading journey</Text>
            </View>
            <TouchableOpacity 
              style={styles.settingsButton} 
              onPress={() => router.push('/(screens)/settings')}
            >
              <Ionicons name="settings-outline" size={24} color="#f4511e" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistiche di lettura */}
        <SectionCard title="Le tue statistiche">
          <View style={styles.statsRow}>
            <StatBox value={42} label="Libri letti" />
            <StatBox value={7} label="In corso" />
            <StatBox value={15} label="Da leggere" />
          </View>
          
          <MonthlyReadingChart data={barData} />
        </SectionCard>

        {/* Statistiche libreria */}
        <SectionCard title="La tua libreria">
          <GenreChart data={pieData} />
          
          <ReadingProgressChart data={lineData} />
        </SectionCard>

        {/* Valutazioni */}
        <SectionCard title="Valutazioni">
          <View style={styles.ratingBox}>
            <Text style={styles.ratingValue}>4.2</Text>
            <Text style={styles.ratingLabel}>/ 5</Text>
          </View>
          
          <Text style={styles.chartTitle}>Ultime 5 valutazioni</Text>
          <View style={styles.ratingsGrid}>
            {bookRatings.map((book, index) => (
              <BookRatingCard 
                key={index}
                title={book.title}
                author={book.author}
                rating={book.rating}
                comment={book.comment}
              />
            ))}
          </View>
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
    alignItems: 'flex-start'
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
  settingsButton: {
    padding: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 5,
  },
  ratingValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#f4511e',
  },
  ratingLabel: {
    fontSize: 20,
    color: '#555',
    marginLeft: 4,
  },
  ratingsGrid: {
    marginTop: 10,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
    color: '#555',
    textAlign: 'center',
  },
});
