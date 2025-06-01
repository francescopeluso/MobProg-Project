import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    FlatList,
    Keyboard,
    PanResponder,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SectionCard } from '@/components';
import { getTabContentBottomPadding } from '@/constants/layout';
import { BorderRadius, Colors, CommonStyles, Spacing, Typography } from '@/constants/styles';
import {
    addToWishlist,
    getWishlistItems,
    isTitleInWishlist,
    removeFromWishlist,
    WishlistItem
} from '@/services/wishlistService';

const SWIPE_THRESHOLD = 50;

export default function WishlistScreen() {
  const insets = useSafeAreaInsets();
  const [newBookTitle, setNewBookTitle] = useState('');
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Carica la wishlist dal database
  const loadWishlist = async () => {
    try {
      setLoading(true);
      const items = await getWishlistItems();
      setWishlist(items);
    } catch (error) {
      console.error('Errore nel caricamento della wishlist:', error);
      Alert.alert('Errore', 'Impossibile caricare la wishlist');
    } finally {
      setLoading(false);
    }
  };

  // Carica la wishlist quando la schermata viene focalizzata
  useFocusEffect(
    useCallback(() => {
      loadWishlist();
    }, [])
  );

  const addToWishlistHandler = async () => {
    if (!newBookTitle.trim()) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Verifica se il titolo è già presente
      const alreadyExists = await isTitleInWishlist(newBookTitle);
      if (alreadyExists) {
        Alert.alert('Attenzione', 'Questo libro è già presente nella tua wishlist');
        return;
      }

      await addToWishlist(newBookTitle);
      setNewBookTitle('');
      await loadWishlist(); // Ricarica la lista
    } catch (error) {
      console.error('Errore nell\'aggiunta alla wishlist:', error);
      Alert.alert('Errore', 'Impossibile aggiungere il libro alla wishlist');
    }
  };

  const removeFromWishlistHandler = async (id: number) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await removeFromWishlist(id);
      await loadWishlist(); // Ricarica la lista
    } catch (error) {
      console.error('Errore nella rimozione dalla wishlist:', error);
      Alert.alert('Errore', 'Impossibile rimuovere il libro dalla wishlist');
    }
  };

  const handleAddBook = (item: WishlistItem) => {
    Alert.alert(
      "Aggiungi libro",
      `Come vuoi aggiungere "${item.bookTitle}" alla tua libreria?`,
      [
        { text: "Annulla", style: "cancel" },
        { 
          text: "Cerca online", 
          onPress: () => {
            removeFromWishlistHandler(item.id);
            // Naviga alla pagina add-book con il SearchModal aperto e query precompilata
            router.push({
              pathname: '/(screens)/add-book',
              params: { 
                searchQuery: item.bookTitle,
                openSearch: 'true' 
              }
            });
          }
        },
        { 
          text: "Scansiona ISBN", 
          onPress: () => {
            removeFromWishlistHandler(item.id);
            router.push('/(screens)/scan');
          }
        }
      ]
    );
  };

  const WishlistItemRow = ({ item }: { item: WishlistItem }) => {
    const translateX = useRef(new Animated.Value(0)).current;

    const panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -150));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -SWIPE_THRESHOLD) {
          Animated.timing(translateX, {
            toValue: -150,
            duration: 200,
            useNativeDriver: true,
          }).start();
        } else {
          Animated.timing(translateX, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      },
    });

    const resetSwipe = () => {
      Animated.timing(translateX, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    };

    return (
      <View style={styles.itemContainer}>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => {
              removeFromWishlistHandler(item.id);
              resetSwipe();
            }}
          >
            <Ionicons name="trash-outline" size={20} color={Colors.background} />
            <Text style={styles.actionText}>Elimina</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.swipeActionButton]}
            onPress={() => {
              handleAddBook(item);
              resetSwipe();
            }}
          >
            <Ionicons name="add" size={20} color={Colors.background} />
            <Text style={styles.actionText}>Aggiungi</Text>
          </TouchableOpacity>
        </View>
        
        <Animated.View
          style={[
            styles.itemContent,
            { transform: [{ translateX }] }
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.bookInfo}>
            <Text style={styles.bookTitle}>{item.bookTitle}</Text>
            <Text style={styles.dateAdded}>Aggiunto il {new Date(item.addedAt).toLocaleDateString('it-IT')}</Text>
          </View>
          <TouchableOpacity 
            onPress={() => {
              // Animate to show actions when icon is tapped
              Animated.timing(translateX, {
          toValue: -150,
          duration: 200,
          useNativeDriver: true,
              }).start();
            }}
          >
            <Ionicons name="book-outline" size={24} color={Colors.secondary} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={CommonStyles.container}>
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
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
          <View style={styles.headerRow}>
            <TouchableOpacity 
              style={CommonStyles.iconButton} 
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={CommonStyles.title}>Wishlist</Text>
            <View style={{width: 24}} />
          </View>
        </View>

        {/* Aggiungi nuovo libro */}
        <SectionCard title="Aggiungi alla wishlist">
          <View style={styles.addBookContainer}>
            <TextInput
              style={styles.bookInput}
              placeholder="Cosa desideri leggere?"
              placeholderTextColor={Colors.textSecondary}
              value={newBookTitle}
              onChangeText={setNewBookTitle}
              onSubmitEditing={() => {
                addToWishlistHandler();
                Keyboard.dismiss();
              }}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.addButton, { opacity: newBookTitle.trim() ? 1 : 0.5 }]}
              onPress={addToWishlistHandler}
              disabled={!newBookTitle.trim()}
            >
              <Ionicons name="add" size={24} color={Colors.background} />
            </TouchableOpacity>
          </View>
        </SectionCard>

        {/* Lista wishlist */}
        <SectionCard title={`I tuoi desideri`}>
          {loading ? (
            <View style={CommonStyles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.secondary} />
              <Text style={CommonStyles.loadingText}>Caricamento wishlist...</Text>
            </View>
          ) : wishlist.length > 0 ? (
            <>
              <Text style={styles.swipeHint}>
                💡 Fai swipe a sinistra su un elemento per vedere le opzioni
              </Text>
              <FlatList
                data={wishlist}
                renderItem={({ item }) => <WishlistItemRow item={item} />}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            </>
          ) : (
            <Text style={CommonStyles.emptyText}>
              La tua wishlist è vuota. Aggiungi i titoli dei libri che desideri acquistare!
            </Text>
          )}
        </SectionCard>
      </ScrollView>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  addBookContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bookInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  swipeHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.accent,
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
    backgroundColor: Colors.accent + '10',
    borderWidth: 1,
    borderColor: Colors.accent + '30',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    fontWeight: Typography.fontWeight.medium,
  },
  itemContainer: {
    position: 'relative',
    marginBottom: 12,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    width: 150,
    zIndex: 1,
    overflow: 'visible',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  deleteButton: {
    backgroundColor: Colors.error,
  },
  swipeActionButton: {
    backgroundColor: Colors.success,
  },
  actionText: {
    color: Colors.textOnPrimary,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    marginTop: 2,
    textAlign: 'center',
  },
  itemContent: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderTopLeftRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.lg,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
    minHeight: 72,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  dateAdded: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
});
