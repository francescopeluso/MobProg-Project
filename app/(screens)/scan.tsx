// app/(screens)/scan.tsx
import { Ionicons } from '@expo/vector-icons';
import { BarcodeScanningResult, Camera, CameraView } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Book, insertBook, searchBooksRemote } from '../../services/bookApi';

interface ScannedBookProps {
  book: Book;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [scannedBook, setScannedBook] = useState<Book | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Haptic feedback wrapper functions
  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleOpenSettings = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openSettings();
  };

  const handleToggleScanning = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScanning(!scanning);
  };

  const handleAddManual = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/add-book");
  };

  const handleSaveBookWithHaptic = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleSaveBook();
  };

  const handleCancelScannedBookWithHaptic = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleCancelScannedBook();
  };

  // Richiedi il permesso di accesso alla fotocamera all'avvio
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Gestisce la scansione di un codice a barre
  const handleBarCodeScanned = async ({ type, data }: BarcodeScanningResult) => {
    // Ignora la scansione se stiamo già elaborando una
    if (scanned || loading) return;
    
    // Add haptic feedback for successful scan
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Segna come scansionato per evitare scansioni multiple
    setScanned(true);
    setLoading(true);
    setError(null);
    
    console.log(`Codice a barre scansionato di tipo ${type}: ${data}`);
    
    // Controlla se il codice è un ISBN (EAN-13 e inizia con 978 o 979)
    const isISBN = data.startsWith('978') || data.startsWith('979');
    
    if (!isISBN) {
      setError('Codice non riconosciuto. Scansiona un ISBN (codice a barre del libro).');
      setLoading(false);
      setTimeout(() => setScanned(false), 2000);
      return;
    }
    
    try {
      // Cerca il libro su Google Books usando l'ISBN scansionato
      const searchQuery = `isbn:${data}`;
      const results = await searchBooksRemote(searchQuery);
      
      if (results.length === 0) {
        setError('Nessun libro trovato con questo ISBN. Riprova o aggiungi manualmente.');
        setLoading(false);
        setTimeout(() => setScanned(false), 2000);
        return;
      }
      
      // Imposta il libro trovato come risultato della scansione
      setScannedBook(results[0]);
      
    } catch (e) {
      console.error('Errore durante la ricerca del libro:', e);
      setError('Errore durante la ricerca del libro. Riprova.');
      setTimeout(() => setScanned(false), 2000);
    } finally {
      setLoading(false);
    }
  };

  // Salva il libro nel database
  const handleSaveBook = async () => {
    if (!scannedBook) return;
    
    try {
      setLoading(true);
      const bookId = await insertBook(scannedBook);
      setLoading(false);
      
      if (bookId) {
        Alert.alert(
          'Libro aggiunto',
          'Il libro è stato aggiunto alla tua libreria con successo!',
          [{ 
            text: 'Vedi dettagli', 
            onPress: () => router.push(`/book-details?id=${bookId}`) 
          }]
        );
      }
      
      // Reset dello stato
      setScannedBook(null);
      setScanned(false);
      setScanning(true);
      
    } catch (error) {
      setLoading(false);
      console.error('Errore durante il salvataggio del libro:', error);
      
      let errorMessage = 'Errore durante il salvataggio del libro.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      Alert.alert('Errore', errorMessage, [
        { text: 'OK', onPress: () => {
          setScannedBook(null);
          setScanned(false);
          setScanning(true);
        }}
      ]);
    }
  };

  // Torna alla modalità scansione
  const handleCancelScannedBook = () => {
    setScannedBook(null);
    setScanned(false);
    setScanning(true);
  };

  // Rendering condizionale in base allo stato dei permessi
  if (hasPermission === null) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.statusText}>Richiesta di autorizzazione alla fotocamera...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="camera-outline" size={80} color="#ccc" />
        <Text style={styles.statusText}>
          Accesso alla fotocamera negato
        </Text>
        <Text style={styles.subText}>
          Per utilizzare la scansione dei codici a barre, concedi l&apos;accesso alla fotocamera nelle impostazioni.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={handleOpenSettings}
        >
          <Text style={styles.permissionButtonText}>Apri Impostazioni</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Rendering componente libro scansionato
  if (scannedBook) {
    return <ScannedBookView 
      book={scannedBook} 
      onConfirm={handleSaveBookWithHaptic} 
      onCancel={handleCancelScannedBookWithHaptic} 
    />;
  }

  // Vista principale dello scanner
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
        >
          <Ionicons name="arrow-back" size={24} color="#4A90E2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scansiona ISBN</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.scannerContainer}>
        {scanning ? (
          <CameraView
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            style={styles.scanner}
          />
        ) : (
          <View style={styles.pausedScannerView}>
            <Ionicons name="camera-outline" size={80} color="#aaa" />
            <Text style={styles.pausedText}>Scanner in pausa</Text>
          </View>
        )}

        <View style={styles.scannerOverlay}>
          <View style={styles.scanFrame} />
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Ricerca libro...</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={handleToggleScanning}
        >
          <Ionicons
            name={scanning ? "pause-circle-outline" : "play-circle-outline"}
            size={28}
            color="#4A90E2"
          />
          <Text style={styles.footerButtonText}>
            {scanning ? "Pausa" : "Riprendi"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerButton}
          onPress={handleAddManual}
        >
          <Ionicons name="add-circle-outline" size={28} color="#4A90E2" />
          <Text style={styles.footerButtonText}>Manuale</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Componente per visualizzare e confermare il libro scansionato
function ScannedBookView({ book, onConfirm, onCancel }: ScannedBookProps) {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onCancel}
        >
          <Ionicons name="arrow-back" size={24} color="#4A90E2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Libro trovato</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.bookDetailsContainer}
        contentContainerStyle={styles.bookDetailsContent}
      >
        <View style={styles.bookHeader}>
          {book.cover_url ? (
            <Image
              source={{ uri: book.cover_url }}
              style={styles.bookCover}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.bookCoverPlaceholder}>
              <Ionicons name="book-outline" size={50} color="#ccc" />
            </View>
          )}
          
          <View style={styles.bookInfo}>
            <Text style={styles.bookTitle}>{book.title}</Text>
            
            {book.authors && book.authors.length > 0 && (
              <Text style={styles.bookAuthor}>
                {Array.isArray(book.authors) 
                  ? book.authors.join(', ')
                  : book.authors}
              </Text>
            )}
            
            {book.publication && (
              <Text style={styles.bookPublicationYear}>
                {book.publication}
              </Text>
            )}
            
            {(book.isbn10 || book.isbn13) && (
              <View style={styles.isbnContainer}>
                {book.isbn13 && (
                  <View style={styles.isbnTag}>
                    <Text style={styles.isbnLabel}>ISBN-13:</Text>
                    <Text style={styles.isbnValue}>{book.isbn13}</Text>
                  </View>
                )}
                {book.isbn10 && (
                  <View style={styles.isbnTag}>
                    <Text style={styles.isbnLabel}>ISBN-10:</Text>
                    <Text style={styles.isbnValue}>{book.isbn10}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
        
        {book.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>Descrizione</Text>
            <Text style={styles.descriptionText}>{book.description}</Text>
          </View>
        )}
        
        {book.genres && book.genres.length > 0 && (
          <View style={styles.genresContainer}>
            <Text style={styles.genresTitle}>Generi</Text>
            <View style={styles.genresList}>
              {Array.isArray(book.genres) && book.genres.map((genre, index) => (
                <View key={index} style={styles.genreTag}>
                  <Text style={styles.genreText}>
                    {typeof genre === 'string' ? genre : genre.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.confirmFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Annulla</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={onConfirm}
        >
          <Text style={styles.confirmButtonText}>Aggiungi alla libreria</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FF',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  scanner: {
    flex: 1,
  },
  pausedScannerView: {
    flex: 1,
    backgroundColor: '#E8F2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pausedText: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 100,
    borderWidth: 2,
    borderColor: '#4A90E2',
    backgroundColor: 'transparent',
    borderRadius: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  footerButton: {
    alignItems: 'center',
    padding: 10,
  },
  footerButtonText: {
    color: '#555',
    marginTop: 5,
    fontSize: 14,
  },
  errorContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    margin: 20,
    borderRadius: 8,
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    borderRadius: 10,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    textAlign: 'center',
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#444',
    marginTop: 20,
    textAlign: 'center',
  },
  subText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  permissionButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  // Stili per la visualizzazione del libro scansionato
  bookDetailsContainer: {
    flex: 1,
  },
  bookDetailsContent: {
    padding: 16,
  },
  bookHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  bookCover: {
    width: 120,
    height: 180,
    borderRadius: 8,
  },
  bookCoverPlaceholder: {
    width: 120,
    height: 180,
    borderRadius: 8,
    backgroundColor: '#E8F2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookInfo: {
    flex: 1,
    marginLeft: 16,
  },
  bookTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  bookAuthor: {
    fontSize: 16,
    color: '#555',
    marginBottom: 4,
  },
  bookPublicationYear: {
    fontSize: 14,
    color: '#777',
    marginBottom: 8,
  },
  isbnContainer: {
    marginTop: 8,
  },
  isbnTag: {
    flexDirection: 'row',
    backgroundColor: '#EBF8FF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  isbnLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4A90E2',
    marginRight: 4,
  },
  isbnValue: {
    fontSize: 13,
    color: '#666',
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  genresContainer: {
    marginBottom: 20,
  },
  genresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  genresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  genreTag: {
    backgroundColor: '#e8f4ff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  genreText: {
    fontSize: 13,
    color: '#4A90E2',
  },
  confirmFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    width: '35%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#555',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#4A90E2',
    width: '60%',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
