import { SectionCard } from '@/components';
import { getTabContentBottomPadding } from '@/constants/layout';
import { Colors, CommonStyles } from '@/constants/styles';
import { createTables, getDBConnection } from '@/utils/database';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BookCarousel from '../../components/BookCarousel';
import SearchModal from '../../components/SearchModal';
import SessionButton from '../../components/SessionButton';
import { Book, getBooksByStatus } from '../../services/bookApi';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HomeScreen() {
  const [dbReady, setDbReady] = useState(false);
  const [toRead, setToRead] = useState<Book[]>([]);
  const [reading, setReading] = useState<Book[]>([]);
  const [completed, setCompleted] = useState<Book[]>([]);
  const [suggested, setSuggested] = useState<Book[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  
  const router = useRouter();
  const insets = useSafeAreaInsets();

  /* Init DB once */
  useEffect(() => {
    const dbSync = getDBConnection();
    createTables(dbSync).then(() => setDbReady(true));
  }, []);

  /* Fetch lists every time screen gains focus */
  const fetchLists = useCallback(async () => {
    const toReadBooks = await getBooksByStatus('to_read');
    const readingBooks = await getBooksByStatus('reading');
    const completedBooks = await getBooksByStatus('completed');

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setToRead(toReadBooks);
    setReading(readingBooks);
    setCompleted(completedBooks);
    setSuggested([]); // TODO suggeriti
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (dbReady) fetchLists();
    }, [dbReady, fetchLists])
  );

  if (!dbReady) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

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
        scrollIndicatorInsets={{ right: 1 }}
      >
        {/* Header */}
        <View style={[CommonStyles.header, { marginTop: insets.top }]}>
          <View style={CommonStyles.headerTop}>
            <View>
              <Text style={CommonStyles.title}>La tua libreria</Text>
              <Text style={CommonStyles.subtitle}>Scopri i tuoi libri</Text>
            </View>
            <View style={CommonStyles.headerActions}>
              <TouchableOpacity
                style={CommonStyles.iconButton}
                onPress={() => setShowSearch(true)}
              >
                <Ionicons name="search-outline" size={24} color={Colors.primary} />
              </TouchableOpacity>
              <SessionButton variant="compact" />
            </View>
          </View>
        </View>

        {/* Book sections */}
        <SectionCard title="In lettura">
          {reading.length > 0 ? (
            <BookCarousel books={reading} onPress={(id) => router.push({ pathname: '/book-details', params: { id } })} />
          ) : (
            <Text style={styles.emptyText}>Nessun libro in lettura</Text>
          )}
        </SectionCard>
        
        <SectionCard title="Da leggere">
          {toRead.length > 0 ? (
            <BookCarousel books={toRead} onPress={(id) => router.push({ pathname: '/book-details', params: { id } })} />
          ) : (
            <Text style={styles.emptyText}>Nessun libro da leggere</Text>
          )}
        </SectionCard>
        
        <SectionCard title="Completati">
          {completed.length > 0 ? (
            <BookCarousel books={completed} onPress={(id) => router.push({ pathname: '/book-details', params: { id } })} />
          ) : (
            <Text style={styles.emptyText}>Nessun libro completato</Text>
          )}
        </SectionCard>
        
        {suggested.length > 0 && (
          <SectionCard title="Suggeriti">
            <BookCarousel books={suggested} onPress={(id) => router.push({ pathname: '/book-details', params: { id } })} />
          </SectionCard>
        )}
      </ScrollView>

      <Modal visible={showSearch} animationType="slide" onRequestClose={() => setShowSearch(false)}>
        <SearchModal
          mode="local"
          onSelectLocal={(b) => {
            setShowSearch(false);
            router.push(`/book-details?id=${b.id}`);
          }}
          onClose={() => setShowSearch(false)}
        />
      </Modal>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 5,
    marginRight: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    padding: 16,
    fontStyle: 'italic',
  },
  loader: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#f8f9fa'
  },
});
