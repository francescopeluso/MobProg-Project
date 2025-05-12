# Home and Core Screens Module

Questo modulo contiene tutti i file relativi alle schermate principali dell'applicazione, inclusi la Home, l'aggiunta di libri, il dettaglio libro, il profilo utente e la gestione delle liste.

## Struttura delle Directory Reale

```plaintext
project-root/
├── app/
│   ├── index.tsx                  # Entry point dell'app (Home)
│   ├── navigation/
│   │   └── AppNavigator.tsx       # Configurazione React Navigation (Bottom Tabs + Drawer)
│   ├── screens/
│   │   ├── index.tsx              # Schermata Home: sessioni, carousel, ricerca
│   │   ├── add-book.tsx           # Schermata per aggiungere un nuovo libro (manuale/API)
│   │   ├── book-details.tsx       # Dettaglio Libro: informazioni, note, rating, favorite, wishlist, liste
│   │   ├── profile.tsx            # Profilo Utente: statistiche di lettura, cronologia, liste salvate
│   │   └── list-details.tsx       # Dettaglio Lista Personalizzata: libri in una lista specifica
│   ├── components/
│   │   ├── SessionButton.tsx      # Pulsante per inizio/fine sessione di lettura
│   │   ├── SearchDrawer.tsx       # Drawer/modal per ricerca avanzata (titolo, autore, genere)
│   │   └── BookCarousel.tsx       # Carousel orizzontale per visualizzare raccolte di libri
│   ├── services/
│   │   ├── bookApi.ts             # Funzioni per fetch da Google Books/OpenLibrary
│   │   └── profileService.ts      # Funzioni per statistiche utente, conteggio sessioni, letture totali
│   ├── hooks/
│   │   ├── useBooks.ts            # Hook per gestione dati libri (`currentlyReading`, `suggestedBooks`)
│   │   └── useProfile.ts          # Hook per gestione dati profilo e statistiche
│   └── types.ts                   # Tipi TypeScript (Book, Author, Genre, ReadingSession, ReadingStatus, List, Note, Rating)
├── utils/
│   └── database.ts                # Wrapper SQLite per query e operazioni CRUD su tutte le tabelle
└── assets/                        # Risorse statiche (immagini, icone, font)
```

> **Compatibilità con React Navigation**: grazie a `AppNavigator.tsx` possiamo definire un **Bottom Tab Navigator** con 3 tab principali (Home, Aggiungi Libro, Profilo) e un **Drawer** (o `Modal`) per la ricerca. Ogni screen under `app/screens` viene registrato in questo navigator, quindi la struttura è pienamente compatibile.

---

## Descrizione delle Schermate

### `index.tsx` (Home)

* **Path**: `app/index.tsx`
* **Contenuto**:

  * Toolbar con icona di ricerca che apre `SearchDrawer`
  * `SessionButton` per inizio/fine sessione di lettura
  * `BookCarousel` per libri con `status = 'reading'`
  * `BookCarousel` per libri suggeriti (API esterne)
  * Navigazione a `book-details.tsx` al click di un libro

### `add-book.tsx`

* **Path**: `app/screens/add-book.tsx`
* **Funzionalità**:

  * Form per inserimento manuale (titolo, autore, anno, ISBN, generi)
  * Possibilità di ricerca via API per auto-compilare i campi
  * Salvataggio su tabelle `books`, `authors`, `book_genres`

### `book-details.tsx`

* **Path**: `app/screens/book-details.tsx`
* **Funzionalità**:

  * Visualizza tutti i dettagli del libro (titolo, descrizione, autore, generi, copertina)
  * Mostra note esistenti e consente di modificarle (`notes`)
  * Permette di aggiungere un voto (`ratings`) e commento
  * Toggle `favorites` e `wishlist`
  * Dropdown per aggiungere/rimuovere da liste personalizzate (`lists`, `list_items`)

### `profile.tsx`

* **Path**: `app/screens/profile.tsx`
* **Funzionalità**:

  * Statistiche aggregate: tempo totale di lettura (`reading_sessions`), libri completati, sessioni totali
  * Grafici o tabelle (es. durate medie, sessioni per settimana)
  * Liste personalizzate create dall'utente e navigazione a `list-details.tsx`

### `list-details.tsx`

* **Path**: `app/screens/list-details.tsx`
* **Funzionalità**:

  * Mostra i libri contenuti in una lista specifica
  * Permette di rimuovere libri dalla lista
  * Naviga al dettaglio di ogni libro

---

## Componenti Riutilizzabili

* **SessionButton.tsx**: gestione insert/update su `reading_sessions` e `reading_status`
* **SearchDrawer.tsx**: UI per filtro ricerca e callback con risultati
* **BookCarousel.tsx**: HBox scrollabile, prop `books: Book[]`, prop `onPress(bookId)`

---

## Servizi e Hook

* **database.ts** (utils): tutte le query SQL (autori, libri, generi, sessioni, note, rating, favorites, wishlist, liste)
* **bookApi.ts**: `searchByTitle()`, `searchByAuthor()`, `getSuggestionsByGenre()`
* **profileService.ts**: `getTotalReadingTime()`, `getCompletedCount()`, `getSessionHistory()`
* **useBooks.ts**: hook per dati in Home
* **useProfile.ts**: hook per dati in Profile

---





Ecco il **quadro di navigazione** che ti consiglio, basato su un Bottom Tab Navigator per le sezioni principali e su uno Stack per le schermate “figlie” o modali (dettagli, ricerca, liste).

---

## 1. Navigazione primaria: Bottom Tab

Nel tuo **`app/_layout.tsx`** definisci un Tab Navigator con tre tab:

| Tab Name | Route file     | Descrizione                                  |
| :------- | :------------- | :------------------------------------------- |
| Home     | `index.tsx`    | Elenco libri, sessione di lettura, ricerca   |
| Aggiungi | `add-book.tsx` | Form per inserire o modificare un libro      |
| Profilo  | `profile.tsx`  | Statistiche, categorie, liste personalizzate |

Questo ti permette di passare da *Home* ⇄ *Aggiungi* ⇄ *Profilo* con un semplice tap nell’UI in basso.

```tsx
// app/_layout.tsx
import { Tabs } from 'expo-router';
…
<Tabs>
  <Tabs.Screen name="index"     options={{ title: 'Home',    … }} />
  <Tabs.Screen name="add-book"  options={{ title: 'Aggiungi', … }} />
  <Tabs.Screen name="profile"   options={{ title: 'Profilo',  … }} />
</Tabs>
```

---

## 2. Navigazione secondaria: Stack per dettagli e modali

All’interno di **ognuna** di queste tab talvolta avrai bisogno di:

1. **Schermate di dettaglio** (book-details, list-details)
2. **Modal di ricerca** (search)
3. **Eventuali flussi nested** (es. categorie e analisi dentro Profilo)

Per questo, all’esterno del `<Tabs>` puoi avvolgere tutto in uno **Stack**:

```tsx
// app/_layout.tsx
import { Stack } from 'expo-router';
…
<Stack screenOptions={{ headerShown: false }}>
  {/* PRIMA: Tab Navigator */}
  <Stack.Screen name="(tabs)" />
  {/* POI: modali o schermate “figlie” */}
  <Stack.Group screenOptions={{ presentation: 'modal' }}>
    <Stack.Screen name="search" />
    <Stack.Screen name="book-details" />
    <Stack.Screen name="list-details" />
  </Stack.Group>
</Stack>
```

In questo modo:

* Le **route modali** (`/search`, `/book-details`, `/list-details`) si aprono sopra alle tab, con animazione a comparsa.
* Dentro **`index.tsx`** (Home) puoi fare `router.push('search')` per la ricerca, oppure `router.push('book-details', { id })` per i dettagli di un libro.

---

## 3. File structure – cosa sta dove

```plaintext
app/
├── _layout.tsx            ← Stack + Tabs (root)
├── index.tsx              ← HomeScreen (route “/”)
├── add-book.tsx           ← AddBookScreen (route “/add-book”)
├── profile.tsx            ← ProfileScreen (route “/profile”)
├── search.tsx             ← SearchScreen (modal /route “/search”)
├── book-details.tsx       ← BookDetailsScreen (modal /route “/book-details”)
├── list-details.tsx       ← ListDetailsScreen (modal /route “/list-details”)
├── (components)/          ← Expo Router IGNORA questa cartella
│   ├── SessionButton.tsx
│   ├── BookCarousel.tsx
│   └── SearchDrawer.tsx
├── (hooks)/               ← IGNORA questa cartella
│   ├── useBooks.ts
│   └── useProfile.ts
└── (services)/            ← IGNORA questa cartella
    ├── bookApi.ts
    └── profileService.ts
```

> Le cartelle tra parentesi tonde sono **solo per raggruppare** i file di supporto:
> Expo Router non le considera route, ma ti permettono di importare i tuoi componenti e hook in modo ordinato, per esempio:
>
> ```ts
> import SessionButton from './(components)/SessionButton'
> ```

---

## 4. Flusso di navigazione tipico

1. **Avvio** → `index.tsx`

   * Database inzializzato
   * Mostra lista libri e pulsante “Inizia sessione” (SessionButton)
   * Icona di ricerca: `router.push('search')`

2. **Ricerca** → `search.tsx` (modal)

   * Filtri e risultati
   * Scegli un libro → `router.push('book-details', { id })`

3. **Dettaglio Libro** → `book-details.tsx` (modal)

   * Voti, note, toggle preferiti/wishlist, aggiungi a liste

4. **Home** → ritorno automatico alle tab al chiudersi del modal

5. **Aggiungi Libro** → `add-book.tsx`

   * Form manuale o ricerca API, salvataggio su SQLite

6. **Profilo** → `profile.tsx`

   * Statistiche aggregate (tempo, rating medio, grafici)
   * Categorie personalizzate → `router.push('list-details', { listId })`

---

### Vantaggi di questo approccio

* **Coerenza UX**: le tab sono sempre visibili in basso, il contenuto cambia senza riavviare l’app.
* **Separazione netta**: i modali/“figli” (ricerca, dettagli) sono definiti in uno Stack e non gonfiano il Tab Navigator.
* **Organizzazione chiara**: tutto il “plumbing” di navigazione sta in `_layout.tsx`, i tuoi screen restano puliti e focalizzati sulla UI e la logica.
* **Estendibilità**: se in futuro vuoi aggiungere nuove schermate modali o nested, ti basta inserire nuovi `<Stack.Screen>` in `_layout.tsx`.

Fammi sapere se questo schema ti convince, o se preferisci variare qualche dettaglio (es. non usare modali ma uno stack “standard”), così poi passiamo alla scrittura passo-passo della **HomeScreen**!
