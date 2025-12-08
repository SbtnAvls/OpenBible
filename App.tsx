import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Animated,
  AppState,
  KeyboardAvoidingView,
  Platform,
  PanResponder,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Share from "react-native-share";
import ViewShot from "react-native-view-shot";
import { Home, Search, Share2, Heart, Sparkles, FileText, Image, BookOpen, ChevronLeft, X, ChevronDown, Flame, Gem, Shield } from "lucide-react-native";

import bibleContent from "./src/textContent/rv1909.json";
import {
  BibleDrawer,
  DrawerBook,
  DrawerSection,
} from "./src/components/BibleDrawer";
import { BookSearchView } from "./src/components/BookSearchView";
import {
  FavoritesVersesProvider,
  useFavoritesVerses,
} from "./src/context/FavoritesVersesContext";
import {
  ThemeProvider,
  useTheme,
} from "./src/context/ThemeContext";
import {
  VerseOfTheDayProvider,
  useVerseOfTheDay,
} from "./src/context/VerseOfTheDayContext";
import {
  ReadingHistoryProvider,
  useReadingHistory,
} from "./src/context/ReadingHistoryContext";
import {
  StudyPlanProvider,
} from "./src/context/StudyPlanContext";
import {
  StreakProvider,
  useStreak,
} from "./src/context/StreakContext";
import type {
  GetFontSize,
  ThemeColors,
} from "./src/context/ThemeContext";
import { FavoritesScreen } from "./src/screens/FavoritesScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { SearchScreen, SearchResult, BookMatch } from "./src/screens/SearchScreen";
import { ReadingHistoryScreen } from "./src/screens/ReadingHistoryScreen";
import { DevotionalListScreen } from "./src/screens/DevotionalListScreen";
import { DevotionalDetailScreen } from "./src/screens/DevotionalDetailScreen";
import { StudyPlansScreen } from "./src/screens/StudyPlansScreen";
import { StudyPlanDetailScreen } from "./src/screens/StudyPlanDetailScreen";
import { StudyPlanReadingScreen } from "./src/screens/StudyPlanReadingScreen";
import { StreakScreen } from "./src/screens/StreakScreen";
import { StreakOnboardingModal } from "./src/components/StreakOnboardingModal";
import { StreakSummaryModal } from "./src/components/StreakSummaryModal";
import { DailyCompletionModal } from "./src/components/DailyCompletionModal";
import { Toast } from "./src/components/Toast";
import { EndOfBookModal } from "./src/components/EndOfBookModal";
import { formatVerseNumbersRange } from "./src/utils/verseRange";
import type { Devotional } from "./src/types/devotional";

type VerseData = {
  name: string;
  text: string;
};

type ChapterData = {
  name: string;
  verses: VerseData[];
};

type BookData = {
  name: string;
  chapters: ChapterData[];
};

type TestamentData = {
  name: string;
  books: BookData[];
};

type BibleData = {
  testament: TestamentData[];
};

type ActiveScreen = "reader" | "settings" | "favorites" | "history" | "devotionals" | "devotional-detail" | "study-plans" | "study-plan-detail" | "study-plan-reading" | "streak";

type PendingFavorite = {
  bookId: string;
  bookName: string;
  chapterName: string;
  verses: {
    verseNumber: string;
    text: string;
  }[];
};

function App() {
  return (
    <FavoritesVersesProvider>
      <ThemeProvider>
        <VerseOfTheDayProvider>
          <ReadingHistoryProvider>
            <StreakProvider>
              <StudyPlanProvider>
                <SafeAreaProvider>
                  <AppContent />
                </SafeAreaProvider>
              </StudyPlanProvider>
            </StreakProvider>
          </ReadingHistoryProvider>
        </VerseOfTheDayProvider>
      </ThemeProvider>
    </FavoritesVersesProvider>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle, getFontSize } = useTheme();
  const { addFavorite, getVerseFavorites } = useFavoritesVerses();
  const { isAdmin, addVerseToCuratedList } = useVerseOfTheDay();
  const { addFlashView, convertToRecentRead, recentReads, updatePinnedChapter, unpinChapter } = useReadingHistory();
  const {
    addReadingTime,
    settings: streakSettings,
    completeOnboarding,
    streakData,
    getStreakStatus,
    getTodayProgress,
    getRemainingMinutes,
    pendingReward,
    clearPendingReward,
    autoFreezesUsed,
    clearAutoFreezesUsed,
  } = useStreak();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedBook, setSelectedBook] =
    useState<DrawerBook<BookData> | null>(null);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>("reader");
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedVerses, setSelectedVerses] = useState<string[]>([]);
  const [selectedDevotional, setSelectedDevotional] = useState<Devotional | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [pendingFavorite, setPendingFavorite] =
    useState<PendingFavorite | null>(null);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [bookSearchQuery, setBookSearchQuery] = useState("");
  const [isSearchDrawerExpanded, setIsSearchDrawerExpanded] = useState(false);
  const searchDrawerHeight = useRef(new Animated.Value(0)).current;
  const chapterScrollViewRef = useRef<ScrollView>(null);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [isCapturingImage, setIsCapturingImage] = useState(false);
  const [showStreakSummary, setShowStreakSummary] = useState(false);
  const streakSummaryShownRef = useRef(false);
  const viewShotRef = useRef<ViewShot>(null);
  const selectedVersesViewShotRef = useRef<ViewShot>(null);
  const COLLAPSED_HEIGHT = 0;
  const EXPANDED_HEIGHT = 400; // Altura del drawer expandido

  // Estados para ancla automática
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [endOfBookModalVisible, setEndOfBookModalVisible] = useState(false);
  const [nextBookForPin, setNextBookForPin] = useState<{ book: string; chapter: number } | null>(null);
  const previousChapterRef = useRef<{ book: string; chapter: number } | null>(null);

  // Tracking de actividad para pausar contador de lectura por inactividad
  const lastActivityRef = useRef<number>(Date.now());
  const isReadingActiveRef = useRef<boolean>(true);
  const partialReadingTimeRef = useRef<number>(0); // Segundos acumulados que aún no suman 1 minuto
  const lastReadingTickRef = useRef<number>(Date.now()); // Último momento que se contó tiempo
  const INACTIVITY_TIMEOUT = 3.5 * 60 * 1000; // 3.5 minutos en milisegundos

  // Estados para selector de versiones
  const [bibleVersionPickerVisible, setBibleVersionPickerVisible] = useState(false);
  const [selectedBibleVersion, setSelectedBibleVersion] = useState("Reina-Valera 1909");

  const styles = useMemo(
    () => createStyles(colors, getFontSize),
    [colors, getFontSize]
  );

  const isReaderScreen = activeScreen === "reader";
  const isSettingsScreen = activeScreen === "settings";
  const isFavoritesScreen = activeScreen === "favorites";
  const isHistoryScreen = activeScreen === "history";
  const isDevotionalsScreen = activeScreen === "devotionals";
  const isDevotionalDetailScreen = activeScreen === "devotional-detail";
  const isStudyPlansScreen = activeScreen === "study-plans";
  const isStudyPlanDetailScreen = activeScreen === "study-plan-detail";
  const isStudyPlanReadingScreen = activeScreen === "study-plan-reading";
  const isStreakScreen = activeScreen === "streak";
  const isSelecting = isReaderScreen && selectedVerses.length > 0;

  // Límite de versículos para compartir como imagen
  const MAX_VERSES_FOR_IMAGE = 3;
  const canShareAsImage = selectedVerses.length <= MAX_VERSES_FOR_IMAGE;

  const sections = useMemo<DrawerSection<BookData>[]>(() => {
    const data = bibleContent as BibleData;
    return data.testament.map((entry) => ({
      title: entry.name,
      books: entry.books.map((book) => ({
        id: `${entry.name}-${book.name}`,
        label: book.name,
        data: book,
      })),
    }));
  }, []);

  const chapters = selectedBook?.data.chapters ?? [];
  const selectedChapter = chapters[selectedChapterIndex];

  const buildVerseId = useCallback(
    (bookId: string, chapterName: string, verseName: string) =>
      `${bookId}-${chapterName}-${verseName}`,
    []
  );

  // Helper para obtener el siguiente libro en la Biblia
  const getNextBook = useCallback((currentBookName: string): { book: DrawerBook<BookData>; chapter: ChapterData } | null => {
    const data = bibleContent as BibleData;
    let foundCurrent = false;

    for (const testament of data.testament) {
      for (const book of testament.books) {
        if (foundCurrent) {
          // Este es el siguiente libro
          const bookDrawer: DrawerBook<BookData> = {
            id: `${testament.name}-${book.name}`,
            label: book.name,
            data: book,
          };
          return { book: bookDrawer, chapter: book.chapters[0] };
        }
        if (book.name === currentBookName) {
          foundCurrent = true;
        }
      }
    }
    return null; // Es el último libro de la Biblia
  }, []);

  // Helper para verificar si es el último capítulo de la Biblia
  const isLastChapterOfBible = useCallback((bookName: string, chapterIndex: number): boolean => {
    const data = bibleContent as BibleData;
    const lastTestament = data.testament[data.testament.length - 1];
    const lastBook = lastTestament.books[lastTestament.books.length - 1];
    return bookName === lastBook.name && chapterIndex === lastBook.chapters.length - 1;
  }, []);

  // Manejo de ancla automática cuando se cambia de capítulo
  useEffect(() => {
    if (!selectedBook || !selectedChapter) {
      return;
    }

    const currentBook = selectedBook.label;
    const currentChapter = parseInt(selectedChapter.name, 10);

    // Si no hay capítulo anterior, solo guardar el actual
    if (!previousChapterRef.current) {
      previousChapterRef.current = { book: currentBook, chapter: currentChapter };
      return;
    }

    const prevBook = previousChapterRef.current.book;
    const prevChapter = previousChapterRef.current.chapter;

    // Verificar si el capítulo anterior está anclado
    const prevChapterPinned = recentReads.find(
      entry => entry.book === prevBook && entry.chapter === prevChapter && entry.pinned
    );

    if (!prevChapterPinned) {
      // Actualizar referencia y salir
      previousChapterRef.current = { book: currentBook, chapter: currentChapter };
      return;
    }

    // Si el libro es el mismo y el capítulo es el siguiente
    if (currentBook === prevBook && currentChapter === prevChapter + 1) {
      // Verificar si es el último capítulo del libro
      const isLastChapter = selectedChapterIndex === chapters.length - 1;

      if (isLastChapter) {
        // Es el último capítulo del libro
        if (isLastChapterOfBible(currentBook, selectedChapterIndex)) {
          // Es el último capítulo de la Biblia - eliminar ancla sin preguntar
          unpinChapter(prevBook, prevChapter);
          previousChapterRef.current = { book: currentBook, chapter: currentChapter };
        } else {
          // Mostrar modal para preguntar al usuario
          const nextBookData = getNextBook(currentBook);
          if (nextBookData) {
            setNextBookForPin({
              book: nextBookData.book.label,
              chapter: parseInt(nextBookData.chapter.name, 10),
            });
            setEndOfBookModalVisible(true);
          }
        }
      } else {
        // No es el último capítulo - actualizar ancla normalmente
        updatePinnedChapter(prevBook, prevChapter, currentBook, currentChapter);
        setToastMessage(`Ancla actualizada: ${currentBook} ${currentChapter}`);
        setToastVisible(true);
      }
    }

    // Actualizar referencia
    previousChapterRef.current = { book: currentBook, chapter: currentChapter };
  }, [selectedBook, selectedChapter, selectedChapterIndex, chapters.length, recentReads, updatePinnedChapter, unpinChapter, getNextBook, isLastChapterOfBible]);

  // Handlers para el modal de fin de libro
  const handleContinueToNextBook = useCallback(() => {
    if (nextBookForPin && previousChapterRef.current) {
      updatePinnedChapter(
        previousChapterRef.current.book,
        previousChapterRef.current.chapter,
        nextBookForPin.book,
        nextBookForPin.chapter
      );
      setToastMessage(`Ancla actualizada: ${nextBookForPin.book} ${nextBookForPin.chapter}`);
      setToastVisible(true);
    }
    setEndOfBookModalVisible(false);
    setNextBookForPin(null);
  }, [nextBookForPin, updatePinnedChapter]);

  const handleRemovePin = useCallback(() => {
    if (previousChapterRef.current) {
      unpinChapter(previousChapterRef.current.book, previousChapterRef.current.chapter);
    }
    setEndOfBookModalVisible(false);
    setNextBookForPin(null);
  }, [unpinChapter]);

  const handleSelectBook = (book: DrawerBook<BookData>) => {
    setSelectedBook(book);
    setSelectedChapterIndex(0);
    setActiveScreen("reader");
    setSelectedVerses([]);
  };

  const handleSearchResultSelect = useCallback((result: SearchResult) => {
    // Encontrar el libro correcto en las secciones
    const section = sections.find(s => s.title === result.testamentName);
    if (!section) return;

    const book = section.books.find(b => b.label === result.bookName);
    if (!book) return;

    // Seleccionar el libro y capítulo
    setSelectedBook(book);
    setSelectedChapterIndex(result.chapterIndex);
    setActiveScreen("reader");
    setSelectedVerses([]);

    // Hacer scroll al versículo específico después de que se renderice
    setTimeout(() => {
      if (chapterScrollViewRef.current) {
        // Encontrar el índice del versículo en el capítulo
        const chapter = book.data.chapters[result.chapterIndex];
        if (chapter && chapter.verses) {
          const verseIndex = chapter.verses.findIndex(v => v.name === result.verseName);

          if (verseIndex !== -1) {
            // Calcular posición aproximada basada en el índice del versículo
            const estimatedVerseHeight = 90; // Altura promedio por versículo
            const headerHeight = 50; // Altura del header del capítulo
            const targetY = headerHeight + (verseIndex * estimatedVerseHeight);

            chapterScrollViewRef.current.scrollTo({
              y: Math.max(0, targetY - 100), // Offset de 100px para mejor visualización
              animated: true,
            });
          }
        }
      }
    }, 300); // Esperar a que se renderice el nuevo capítulo
  }, [sections]);

  const handleBookMatchSelect = useCallback((bookMatch: BookMatch) => {
    // Encontrar el libro correcto en las secciones
    const section = sections.find(s => s.title === bookMatch.testamentName);
    if (!section) return;

    const book = section.books.find(b => b.label === bookMatch.bookName);
    if (!book) return;

    // Seleccionar el libro y abrir en el capítulo 1
    setSelectedBook(book);
    setSelectedChapterIndex(0);
    setActiveScreen("reader");
    setSelectedVerses([]);
  }, [sections]);

  const handleSelectChapter = useCallback((index: number) => {
    setSelectedChapterIndex(index);
    setActiveScreen("reader");
    setSelectedVerses([]);
  }, []);

  const handleGoToPreviousChapter = useCallback(() => {
    if (selectedChapterIndex <= 0) {
      return;
    }
    handleSelectChapter(selectedChapterIndex - 1);
  }, [handleSelectChapter, selectedChapterIndex]);

  const handleGoToNextChapter = useCallback(() => {
    if (selectedChapterIndex >= chapters.length - 1) {
      return;
    }
    handleSelectChapter(selectedChapterIndex + 1);
  }, [chapters.length, handleSelectChapter, selectedChapterIndex]);

  const handleHorizontalSwipe = useCallback(
    (deltaX: number) => {
      const swipeThreshold = 60;
      if (Math.abs(deltaX) < swipeThreshold) {
        return;
      }
      if (deltaX > 0) {
        handleGoToPreviousChapter();
      } else {
        handleGoToNextChapter();
      }
    },
    [handleGoToNextChapter, handleGoToPreviousChapter]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          if (isSelecting) {
            return false;
          }
          const { dx, dy } = gestureState;
          if (Math.abs(dx) <= Math.abs(dy)) {
            return false;
          }
          return Math.abs(dx) > 20;
        },
        onMoveShouldSetPanResponderCapture: (_, gestureState) => {
          if (isSelecting) {
            return false;
          }
          const { dx, dy } = gestureState;
          if (Math.abs(dx) <= Math.abs(dy)) {
            return false;
          }
          return Math.abs(dx) > 20;
        },
        onPanResponderRelease: (_, gestureState) => {
          handleHorizontalSwipe(gestureState.dx);
        },
        onPanResponderTerminate: (_, gestureState) => {
          handleHorizontalSwipe(gestureState.dx);
        },
      }),
    [handleHorizontalSwipe, isSelecting]
  );

  const handleToggleMenu = () => {
    if (!isReaderScreen) {
      return;
    }
    setMenuVisible((prev) => !prev);
  };

  const closeMenu = useCallback(() => {
    setMenuVisible(false);
  }, []);

  useEffect(() => {
    if (!isReaderScreen || isSelecting) {
      setMenuVisible(false);
    }
  }, [isReaderScreen, isSelecting]);

  // Cerrar drawer cuando cambias de pantalla
  useEffect(() => {
    if (!isReaderScreen || !selectedBook) {
      setIsSearchDrawerExpanded(false);
      searchDrawerHeight.setValue(COLLAPSED_HEIGHT);
      setBookSearchQuery("");
    }
  }, [isReaderScreen, selectedBook, searchDrawerHeight]);

  // Función para registrar actividad del usuario (scroll, toque, etc.)
  const registerActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    isReadingActiveRef.current = true;
  }, []);

  // Detectar cuando la app va a background/foreground para pausar/reanudar contador
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // App vuelve a primer plano - reanudar tracking
        lastActivityRef.current = Date.now();
        isReadingActiveRef.current = true;
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App va a segundo plano - pausar tracking
        isReadingActiveRef.current = false;
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Tracking de lectura: flashView después de entrar, recentRead después de 5 minutos
  useEffect(() => {
    if (!selectedBook || !selectedChapter) {
      return;
    }

    const bookName = selectedBook.label;
    const chapterNumber = parseInt(selectedChapter.name, 10);

    if (isNaN(chapterNumber)) {
      return;
    }

    // Resetear estado de actividad al entrar a un capítulo
    lastActivityRef.current = Date.now();
    isReadingActiveRef.current = true;

    // Agregar como flashView inmediatamente
    addFlashView(bookName, chapterNumber);

    // Timer de 5 minutos para convertir a recentRead (lectura confirmada)
    const recentReadTimer = setTimeout(() => {
      convertToRecentRead(bookName, chapterNumber);
    }, 5 * 60 * 1000); // 5 minutos

    // Resetear el último tick al entrar a un capítulo
    lastReadingTickRef.current = Date.now();

    // Intervalo cada 10 segundos para tracking más granular
    // Acumula tiempo parcial y suma minutos completos cuando corresponde
    const readingInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;
      const isAppActive = isReadingActiveRef.current;
      const isUserActive = timeSinceLastActivity < INACTIVITY_TIMEOUT;

      if (isAppActive && isUserActive) {
        // Calcular segundos desde el último tick
        const secondsSinceLastTick = Math.floor((now - lastReadingTickRef.current) / 1000);
        lastReadingTickRef.current = now;

        // Acumular tiempo parcial
        partialReadingTimeRef.current += secondsSinceLastTick;

        // Si acumuló 60 segundos o más, sumar minutos completos
        while (partialReadingTimeRef.current >= 60) {
          addReadingTime(1);
          partialReadingTimeRef.current -= 60;
        }
      } else {
        // Si está inactivo, solo actualizar el tick para no acumular tiempo muerto
        lastReadingTickRef.current = now;
      }
    }, 10 * 1000); // Cada 10 segundos para mayor precisión

    // Cleanup: cancelar timers si el usuario cambia de capítulo o sale
    return () => {
      clearTimeout(recentReadTimer);
      clearInterval(readingInterval);
    };
  }, [selectedBook, selectedChapter, addFlashView, convertToRecentRead, addReadingTime, INACTIVITY_TIMEOUT]);

  // Mostrar modal de resumen de racha al abrir la app (después del onboarding)
  useEffect(() => {
    if (
      streakSettings.hasCompletedOnboarding &&
      !streakSummaryShownRef.current
    ) {
      const status = getStreakStatus();
      // Mostrar automáticamente si la racha está en riesgo o perdida
      if (status === "at_risk" || status === "lost") {
        setShowStreakSummary(true);
        streakSummaryShownRef.current = true;
      }
    }
  }, [streakSettings.hasCompletedOnboarding, getStreakStatus]);

  const handleOpenSettings = () => {
    setActiveScreen("settings");
    setDrawerVisible(false);
    setSelectedVerses([]);
  };

  const handleOpenSavedQuotes = () => {
    setActiveScreen("favorites");
    setDrawerVisible(false);
    setSelectedVerses([]);
  };

  const handleOpenReadingHistory = () => {
    setActiveScreen("history");
    setDrawerVisible(false);
    setSelectedVerses([]);
  };

  const handleOpenDevotionals = () => {
    setActiveScreen("devotionals");
    setDrawerVisible(false);
    setSelectedVerses([]);
  };

  const handleSelectDevotional = useCallback((devotional: Devotional) => {
    setSelectedDevotional(devotional);
    setActiveScreen("devotional-detail");
  }, []);

  const handleOpenStudyPlans = () => {
    setActiveScreen("study-plans");
    setDrawerVisible(false);
    setSelectedVerses([]);
  };

  const handleOpenStreak = () => {
    setActiveScreen("streak");
    setDrawerVisible(false);
    setSelectedVerses([]);
  };

  const handleSelectPlan = useCallback((planId: string) => {
    setSelectedPlanId(planId);
    setActiveScreen("study-plan-detail");
  }, []);

  const handleStartReading = useCallback((planId: string, sectionId: string) => {
    setSelectedPlanId(planId);
    setSelectedSectionId(sectionId);
    setActiveScreen("study-plan-reading");
  }, []);

  const handleBackFromStudyPlanDetail = useCallback(() => {
    setActiveScreen("study-plans");
    setSelectedPlanId(null);
  }, []);

  const handleBackFromStudyPlanReading = useCallback(() => {
    setActiveScreen("study-plan-detail");
    setSelectedSectionId(null);
  }, []);

  const handleNavigateFromHistory = useCallback((bookName: string, chapterNumber: number) => {
    // Encontrar el libro y capítulo basados en el nombre y número
    let foundBook: DrawerBook<BookData> | null = null;
    let foundChapterIndex = -1;

    for (const section of sections) {
      const book = section.books.find(b => b.label === bookName);
      if (book) {
        foundBook = book;
        foundChapterIndex = book.data.chapters.findIndex(ch => parseInt(ch.name, 10) === chapterNumber);
        break;
      }
    }

    if (!foundBook || foundChapterIndex === -1) {
      return;
    }

    // Navegar al libro y capítulo
    setSelectedBook(foundBook);
    setSelectedChapterIndex(foundChapterIndex);
    setActiveScreen("reader");
    setSelectedVerses([]);
  }, [sections]);

  const handleNavigateToFavorite = useCallback((bookId: string, chapterName: string) => {
    // Encontrar el libro correcto en las secciones
    const section = sections.find(s => s.books.some(b => b.id === bookId));
    if (!section) return;

    const book = section.books.find(b => b.id === bookId);
    if (!book) return;

    // Encontrar el índice del capítulo
    const chapterIndex = book.data.chapters.findIndex(ch => ch.name === chapterName);
    if (chapterIndex === -1) return;

    // Navegar al libro y capítulo
    setSelectedBook(book);
    setSelectedChapterIndex(chapterIndex);
    setActiveScreen("reader");
    setSelectedVerses([]);
  }, [sections]);

  const handleBackToReader = () => {
    setActiveScreen("reader");
    setSelectedVerses([]);
    setMenuVisible(false);
  };

  const toggleSearchDrawer = useCallback(() => {
    const toValue = isSearchDrawerExpanded ? COLLAPSED_HEIGHT : EXPANDED_HEIGHT;
    setIsSearchDrawerExpanded(!isSearchDrawerExpanded);
    
    Animated.spring(searchDrawerHeight, {
      toValue,
      useNativeDriver: false,
      tension: 50,
      friction: 8,
    }).start();

    if (isSearchDrawerExpanded) {
      // Limpiar búsqueda al cerrar
      setBookSearchQuery("");
    }
  }, [isSearchDrawerExpanded, searchDrawerHeight]);

  const handleBookSearchResultSelect = useCallback((chapterIndex: number, verseIndex?: number) => {
    if (chapterIndex === selectedChapterIndex && verseIndex !== undefined) {
      // Mismo capítulo: hacer scroll al versículo
      toggleSearchDrawer(); // Cerrar el drawer primero
      
      // Esperar a que se cierre el drawer antes de hacer scroll
      setTimeout(() => {
        if (chapterScrollViewRef.current) {
          // Calcular posición aproximada basada en el índice del versículo
          // Cada versículo tiene aproximadamente 80-100px de altura
          const estimatedVerseHeight = 90; // Altura promedio por versículo
          const headerHeight = 50; // Altura del header del capítulo
          const targetY = headerHeight + (verseIndex * estimatedVerseHeight);
          
          chapterScrollViewRef.current.scrollTo({
            y: Math.max(0, targetY - 100), // Offset de 100px para mejor visualización
            animated: true,
          });
        }
      }, 350); // Esperar a que termine la animación del drawer
    } else {
      // Diferente capítulo: cambiar de capítulo
      setSelectedChapterIndex(chapterIndex);
      toggleSearchDrawer(); // Cerrar el drawer
    }
  }, [selectedChapterIndex, toggleSearchDrawer]);

  const handleClearSelection = () => {
    setSelectedVerses([]);
  };

  const handleLongPressVerse = (verseId: string) => {
    if (!isReaderScreen) {
      return;
    }
    setSelectedVerses((prev) => {
      if (prev.includes(verseId)) {
        return prev;
      }
      return [...prev, verseId];
    });
  };

  const handlePressVerse = (verseId: string) => {
    if (!isSelecting) {
      return;
    }
    setSelectedVerses((prev) =>
      prev.includes(verseId)
        ? prev.filter((item) => item !== verseId)
        : [...prev, verseId]
    );
  };

  const handleOpenSaveDialog = () => {
    if (!selectedBook || !selectedChapter || !selectedVerses.length) {
      return;
    }

    const versesToSave = selectedChapter.verses
      .filter((verse) =>
        selectedVerses.includes(
          buildVerseId(selectedBook.id, selectedChapter.name, verse.name)
        )
      )
      .map((verse) => ({
        verseNumber: verse.name,
        text: verse.text,
      }));

    setPendingFavorite({
      bookId: selectedBook.id,
      bookName: selectedBook.label,
      chapterName: selectedChapter.name,
      verses: versesToSave,
    });
    setCommentInput("");
    setCommentModalVisible(true);
  };

  const handleCloseSaveDialog = () => {
    setCommentModalVisible(false);
    setPendingFavorite(null);
    setCommentInput("");
  };

  const handleConfirmSave = () => {
    if (!pendingFavorite) {
      return;
    }

    const verseNumbers = pendingFavorite.verses.map((verse) => verse.verseNumber);
    const comment = commentInput.trim();

    addFavorite({
      id: `${pendingFavorite.bookId}-${pendingFavorite.chapterName}-${verseNumbers.join("_")}-${Date.now()}`,
      bookName: pendingFavorite.bookName,
      chapterName: pendingFavorite.chapterName,
      verseNumbers,
      verses: pendingFavorite.verses,
      comment: comment ? comment : "",
      bookId: pendingFavorite.bookId,
    });

    setSelectedVerses([]);
    handleCloseSaveDialog();

    Alert.alert(
      "Citas guardas",
      comment
        ? `Guardaste ${verseNumbers.length} versiculo(s) con comentario.`
        : `Guardaste ${verseNumbers.length} versiculo(s).`
    );
  };

  const handleOpenShareDialog = () => {
    setShareModalVisible(true);
  };

  const handleCloseShareDialog = () => {
    setShareModalVisible(false);
  };

  const getSelectedVersesText = useCallback(() => {
    if (!selectedBook || !selectedChapter || !selectedVerses.length) {
      return "";
    }

    const versesToShare = selectedChapter.verses
      .filter((verse) =>
        selectedVerses.includes(
          buildVerseId(selectedBook.id, selectedChapter.name, verse.name)
        )
      )
      .map((verse) => `${verse.name}. ${verse.text}`)
      .join("\n");

    return `${selectedBook.label} ${selectedChapter.name}\n\n${versesToShare}\n\nBiblia Reina-Valera 1909`;
  }, [selectedBook, selectedChapter, selectedVerses, buildVerseId]);

  const handleShareAsText = async () => {
    try {
      const text = getSelectedVersesText();
      
      await Share.open({
        message: text,
        title: "Compartir versículos",
      });
      
      handleCloseShareDialog();
      setSelectedVerses([]);
    } catch (error: any) {
      if (error?.message !== "User did not share") {
        Alert.alert("Error", "No se pudo compartir el texto");
      }
      handleCloseShareDialog();
    }
  };

  const handleShareAsImage = async () => {
    try {
      if (!selectedBook || !selectedChapter || !selectedVerses.length) {
        Alert.alert("Error", "No hay versículos seleccionados");
        return;
      }

      // Activar modo de captura temporalmente
      setIsCapturingImage(true);
      
      // Esperar un momento para que se renderice la vista
      setTimeout(async () => {
        try {
          if (!selectedVersesViewShotRef.current) {
            throw new Error("ViewShot reference not available");
          }

          // Capturar la vista como imagen
          const uri = await selectedVersesViewShotRef.current.capture?.();
          
          if (!uri) {
            throw new Error("Failed to capture image");
          }
          
          await Share.open({
            url: `file://${uri}`,
            title: "Compartir versículos",
          });
          
          handleCloseShareDialog();
          setSelectedVerses([]);
        } catch (captureError: any) {
          console.error("Error capturing image:", captureError);
          if (captureError?.message !== "User did not share") {
            Alert.alert("Error", "No se pudo capturar la imagen. Intenta compartir como texto.");
          }
          handleCloseShareDialog();
        } finally {
          setIsCapturingImage(false);
        }
      }, 300);
    } catch (error: any) {
      console.error("Error in handleShareAsImage:", error);
      if (error?.message !== "User did not share") {
        Alert.alert("Error", "No se pudo compartir la imagen");
      }
      handleCloseShareDialog();
      setIsCapturingImage(false);
    }
  };

  const headerTitle = isSettingsScreen
    ? "Configuraciones"
    : isStreakScreen
    ? "Mi Racha"
    : isFavoritesScreen
    ? "Citas guardas"
    : isHistoryScreen
    ? "Historial de lectura"
    : isDevotionalsScreen
    ? "Devocionales"
    : isDevotionalDetailScreen
    ? "Devocional"
    : null; // Para reader screen mostramos el selector

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={colors.backgroundSecondary}
      />

      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.backgroundSecondary,
            borderBottomColor: colors.divider,
          },
        ]}
      >
        {!isReaderScreen ? (
          <Pressable
            accessibilityLabel="Volver al buscador"
            onPress={handleBackToReader}
            style={styles.actionButton}
          >
            <ChevronLeft size={24} color={colors.menuIcon} />
          </Pressable>
        ) : isSelecting ? (
          <Pressable
            accessibilityLabel="Cancelar seleccion"
            onPress={handleClearSelection}
            style={styles.actionButton}
          >
            <X size={24} color={colors.menuIcon} />
          </Pressable>
        ) : (
          <Pressable
            accessibilityLabel="Abrir navegacion"
            onPress={() => setDrawerVisible(true)}
            style={styles.menuButton}
          >
            <View style={[styles.menuBar, { backgroundColor: colors.menuIcon }]} />
            <View style={[styles.menuBar, { backgroundColor: colors.menuIcon }]} />
            <View style={[styles.menuBar, { backgroundColor: colors.menuIcon }]} />
          </Pressable>
        )}

        {headerTitle ? (
          <Text style={styles.headerTitle}>{headerTitle}</Text>
        ) : (
          <Pressable
            accessibilityLabel="Seleccionar versión de la Biblia"
            onPress={() => setBibleVersionPickerVisible(true)}
            style={styles.versionSelector}
          >
            <Text style={styles.versionSelectorText}>{selectedBibleVersion}</Text>
            <ChevronDown size={16} color={colors.menuIcon} style={{ marginLeft: 4 }} />
          </Pressable>
        )}

        {!isReaderScreen || isSelecting ? (
          <View style={styles.actionPlaceholder} />
        ) : (
          <View style={styles.rightActionsContainer}>
            {selectedBook && (
              <Pressable
                accessibilityLabel="Volver al buscador principal"
                onPress={() => {
                  setSelectedBook(null);
                  setSelectedChapterIndex(0);
                  setSelectedVerses([]);
                }}
                style={styles.homeButton}
              >
                <Home size={20} color={colors.menuIcon} />
              </Pressable>
            )}
            <Pressable
              accessibilityLabel="Abrir menu de opciones"
              onPress={handleToggleMenu}
              style={styles.menuTrigger}
            >
              <View style={[styles.menuDot, { backgroundColor: colors.menuIcon }]} />
              <View style={[styles.menuDot, { backgroundColor: colors.menuIcon }]} />
              <View style={[styles.menuDot, { backgroundColor: colors.menuIcon }]} />
            </Pressable>
          </View>
        )}
      </View>

      {isSettingsScreen ? (
        <SettingsScreen />
      ) : isStreakScreen ? (
        <StreakScreen />
      ) : isFavoritesScreen ? (
        <FavoritesScreen onNavigateToVerse={handleNavigateToFavorite} />
      ) : isHistoryScreen ? (
        <ReadingHistoryScreen onNavigateToReading={handleNavigateFromHistory} />
      ) : isDevotionalsScreen ? (
        <DevotionalListScreen onSelectDevotional={handleSelectDevotional} />
      ) : isDevotionalDetailScreen && selectedDevotional ? (
        <DevotionalDetailScreen devotional={selectedDevotional} />
      ) : isStudyPlansScreen ? (
        <StudyPlansScreen onSelectPlan={handleSelectPlan} />
      ) : isStudyPlanDetailScreen && selectedPlanId ? (
        <StudyPlanDetailScreen
          planId={selectedPlanId}
          onBack={handleBackFromStudyPlanDetail}
          onStartReading={handleStartReading}
        />
      ) : isStudyPlanReadingScreen && selectedPlanId && selectedSectionId ? (
        <StudyPlanReadingScreen
          planId={selectedPlanId}
          sectionId={selectedSectionId}
          bibleData={bibleContent as BibleData}
          onBack={handleBackFromStudyPlanReading}
        />
      ) : !selectedBook ? (
        <SearchScreen
          bibleData={bibleContent as BibleData}
          onSelectResult={handleSearchResultSelect}
          onSelectBook={handleBookMatchSelect}
          onOpenReadingHistory={handleOpenReadingHistory}
          onOpenDevotionals={handleOpenDevotionals}
          onOpenStudyPlans={handleOpenStudyPlans}
          onOpenStreak={handleOpenStreak}
        />
      ) : selectedBook && selectedChapter ? (
        <View style={styles.content}>
          <View
            style={[
              styles.chapterNavWrapper,
              {
                backgroundColor: colors.backgroundSecondary,
                borderBottomColor: colors.divider,
              },
            ]}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chapterNavContent}
            >
              {chapters.map((chapter, index) => {
                const isActive = index === selectedChapterIndex;
                return (
                  <Pressable
                    key={`${selectedBook.id}-${chapter.name}`}
                    onPress={() => handleSelectChapter(index)}
                    style={[
                      styles.chapterPill,
                      { backgroundColor: colors.surfaceMuted },
                      isActive && {
                        backgroundColor: colors.accent,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chapterPillText,
                        isActive && { color: colors.accentText },
                      ]}
                    >
                      {chapter.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View
            style={styles.chapterContentWrapper}
            {...panResponder.panHandlers}
          >
            <ScrollView
              ref={chapterScrollViewRef}
              style={[styles.chapterContent, { backgroundColor: colors.backgroundPrimary }]}
              contentContainerStyle={styles.chapterContentContainer}
              showsVerticalScrollIndicator={false}
              onScroll={registerActivity}
              onTouchStart={registerActivity}
              scrollEventThrottle={1000}
            >
              <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.9 }}>
                <View style={[styles.shareableContent, { backgroundColor: colors.backgroundPrimary }]}>
                  <Text style={styles.chapterHeading}>
                    {selectedBook.label} {selectedChapter.name}
                  </Text>
                  {selectedChapter.verses.map((verse) => {
                    const verseId = buildVerseId(
                      selectedBook.id,
                      selectedChapter.name,
                      verse.name
                    );
                    const verseFavorites = getVerseFavorites(
                      selectedBook.id,
                      selectedChapter.name,
                      verse.name
                    );
                    const hasFavorite = verseFavorites.length > 0;
                    const favoriteComments = verseFavorites
                      .map((favorite) => favorite.comment)
                      .filter(Boolean) as string[];
                    const isSelected = selectedVerses.includes(verseId);
                    
                    return (
                      <Pressable
                        key={verseId}
                        accessibilityLabel={`Versiculo ${verse.name}`}
                        onLongPress={() => handleLongPressVerse(verseId)}
                        delayLongPress={180}
                        onPress={() => handlePressVerse(verseId)}
                        style={[
                          styles.verseRow,
                          isSelected && styles.verseRowSelected,
                          !isSelected && hasFavorite && styles.verseRowFavorite,
                        ]}
                      >
                        <Text
                          style={[
                            styles.verseNumber,
                            isSelected && styles.verseNumberSelected,
                          ]}
                        >
                          {verse.name}
                        </Text>
                        <View style={styles.verseBody}>
                          <Text
                            style={[
                              styles.verseText,
                              isSelected && styles.verseTextSelected,
                            ]}
                          >
                            {verse.text}
                          </Text>
                          {!isSelected && hasFavorite && favoriteComments.length ? (
                            <View style={styles.favoriteTag}>
                              <Text style={styles.favoriteTagText}>
                                {favoriteComments.join(" / ")}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </ViewShot>
            </ScrollView>
          </View>
        </View>
      ) : null}

      <BibleDrawer
        visible={drawerVisible && isReaderScreen}
        onClose={() => setDrawerVisible(false)}
        sections={sections}
        onSelectBook={handleSelectBook}
        selectedBookId={selectedBook?.id}
      />

      {menuVisible ? (
        <View style={styles.menuPortal} pointerEvents="box-none">
          <Pressable style={styles.menuBackdrop} onPress={closeMenu} />
          <View
            style={[
              styles.menuDropdown,
              {
                top: insets.top + 56,
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.divider,
              },
            ]}
          >
            <Pressable
              accessibilityLabel="Abrir configuraciones"
              onPress={() => {
                closeMenu();
                handleOpenSettings();
              }}
              style={styles.menuItem}
            >
              <Text style={styles.menuItemText}>Configuraciones</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Abrir citas guardas"
              onPress={() => {
                closeMenu();
                handleOpenSavedQuotes();
              }}
              style={styles.menuItem}
            >
              <Text style={styles.menuItemText}>Citas guardas</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Abrir historial de lectura"
              onPress={() => {
                closeMenu();
                handleOpenReadingHistory();
              }}
              style={styles.menuItem}
            >
              <Text style={styles.menuItemText}>Historial de lectura</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {isSelecting ? (
        <View style={styles.selectionBarWrapper} pointerEvents="box-none">
          <View
            style={[
              styles.selectionBar,
              {
                bottom: insets.bottom + 16,
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.divider,
              },
            ]}
          >
            <Pressable
              accessibilityLabel="Limpiar seleccion"
              onPress={handleClearSelection}
            >
              <Text style={styles.selectionCount}>
                {selectedVerses.length} seleccionado(s)
              </Text>
            </Pressable>
            <View style={styles.selectionActions}>
              <Pressable
                accessibilityLabel="Compartir versiculos seleccionados"
                onPress={handleOpenShareDialog}
                style={styles.selectionAction}
              >
                <Share2 size={18} color={colors.accent} style={{ marginRight: 6 }} />
                <Text style={styles.selectionActionText}>Compartir</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Guardar versiculos seleccionados"
                onPress={handleOpenSaveDialog}
                style={styles.selectionAction}
              >
                <Heart size={18} color={colors.accent} style={{ marginRight: 6 }} />
                <Text style={styles.selectionActionText}>Guardar</Text>
              </Pressable>
              {isAdmin && selectedVerses.length === 1 && (
                <Pressable
                  accessibilityLabel="Agregar versiculo al dia"
                  onPress={() => {
                    if (!selectedBook || !selectedChapter) return;
                    const verse = selectedChapter.verses.find(v =>
                      selectedVerses.includes(
                        buildVerseId(selectedBook.id, selectedChapter.name, v.name)
                      )
                    );
                    if (verse) {
                      addVerseToCuratedList({
                        bookName: selectedBook.label,
                        bookIndex: sections.findIndex(s =>
                          s.books.some(b => b.id === selectedBook.id)
                        ),
                        testamentName: sections.find(s =>
                          s.books.some(b => b.id === selectedBook.id)
                        )?.title ?? '',
                        chapterName: selectedChapter.name,
                        chapterIndex: selectedChapterIndex,
                        verseName: verse.name,
                        verseText: verse.text,
                        bookId: selectedBook.id,
                      });
                      setSelectedVerses([]);
                    }
                  }}
                  style={styles.selectionAction}
                >
                  <Sparkles size={18} color={colors.accent} style={{ marginRight: 6 }} />
                  <Text style={styles.selectionActionText}>Al Día</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      ) : null}

      {commentModalVisible && pendingFavorite ? (
        <View style={styles.modalWrapper} pointerEvents="box-none">
          <Pressable
            style={styles.modalBackdrop}
            onPress={handleCloseSaveDialog}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.modalContainer}
          >
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.divider,
                },
              ]}
            >
              <Text style={styles.modalTitle}>Guardar cita</Text>
              <Text style={styles.modalSubtitle}>
                {pendingFavorite.bookName} capitulo {pendingFavorite.chapterName}
              </Text>
              <Text style={styles.modalSubtitle}>
                Versos {formatVerseNumbersRange(
                  pendingFavorite.verses.map((verse) => verse.verseNumber)
                )}
              </Text>
              <Text style={styles.modalHint}>Comentario (opcional)</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    color: colors.bodyText,
                    borderColor: colors.divider,
                    backgroundColor: colors.backgroundPrimary,
                  },
                ]}
                placeholder="Escribe un comentario..."
                placeholderTextColor={colors.placeholderText}
                value={commentInput}
                onChangeText={setCommentInput}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <View style={styles.modalActions}>
                <Pressable
                  accessibilityLabel="Cancelar guardado"
                  onPress={handleCloseSaveDialog}
                  style={styles.modalButtonSecondary}
                >
                  <Text style={styles.modalButtonSecondaryText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel="Confirmar guardado"
                  onPress={handleConfirmSave}
                  style={styles.modalButtonPrimary}
                >
                  <Text style={styles.modalButtonPrimaryText}>Guardar</Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      ) : null}

      {shareModalVisible ? (
        <View style={styles.modalWrapper} pointerEvents="box-none">
          <Pressable
            style={styles.modalBackdrop}
            onPress={handleCloseShareDialog}
          />
          <View style={styles.modalContainer}>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.divider,
                },
              ]}
            >
              <Text style={styles.modalTitle}>Compartir versículos</Text>
              <Text style={styles.modalSubtitle}>
                ¿Cómo deseas compartir los versículos?
              </Text>
              
              <Pressable
                accessibilityLabel="Compartir como texto"
                onPress={handleShareAsText}
                style={[
                  styles.shareOptionButton,
                  { backgroundColor: colors.surfaceMuted }
                ]}
              >
                <FileText size={32} color={colors.bodyText} style={{ marginRight: 12 }} />
                <View style={styles.shareOptionContent}>
                  <Text style={styles.shareOptionTitle}>Compartir como texto</Text>
                  <Text style={styles.shareOptionDescription}>
                    Comparte los versículos en formato de texto plano
                  </Text>
                </View>
              </Pressable>

              <Pressable
                accessibilityLabel="Compartir como imagen"
                onPress={canShareAsImage ? handleShareAsImage : undefined}
                disabled={!canShareAsImage}
                style={[
                  styles.shareOptionButton,
                  { backgroundColor: colors.surfaceMuted },
                  !canShareAsImage && styles.shareOptionButtonDisabled,
                ]}
              >
                <Image
                  size={32}
                  color={colors.bodyText}
                  style={{
                    marginRight: 12,
                    opacity: !canShareAsImage ? 0.4 : 1
                  }}
                />
                <View style={styles.shareOptionContent}>
                  <Text style={[
                    styles.shareOptionTitle,
                    !canShareAsImage && { opacity: 0.5 }
                  ]}>Compartir como imagen</Text>
                  <Text style={[
                    styles.shareOptionDescription,
                    !canShareAsImage && { opacity: 0.5 }
                  ]}>
                    {canShareAsImage
                      ? "Comparte los versículos como una imagen"
                      : `Solo disponible para ${MAX_VERSES_FOR_IMAGE} versículos o menos. Tienes ${selectedVerses.length} seleccionados.`
                    }
                  </Text>
                </View>
              </Pressable>

              <Pressable
                accessibilityLabel="Cancelar compartir"
                onPress={handleCloseShareDialog}
                style={styles.modalButtonSecondary}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}

      {/* Pestaña flotante y drawer de búsqueda - Solo visible en modo lectura con libro seleccionado */}
      {isReaderScreen && selectedBook && !isSelecting && (
        <>
          {/* Pestaña flotante en la esquina inferior derecha */}
          {!isSearchDrawerExpanded && (
            <Pressable
              accessibilityLabel="Abrir búsqueda en libro"
              onPress={toggleSearchDrawer}
              style={[
                styles.searchTab,
                {
                  bottom: insets.bottom + 20,
                  backgroundColor: colors.accent,
                  shadowColor: colors.accent,
                },
              ]}
            >
              <Search size={18} color={colors.accentText} style={{ marginRight: 6 }} />
              <Text style={styles.searchTabText}>Buscar</Text>
            </Pressable>
          )}

          {/* Backdrop invisible para cerrar al hacer click fuera */}
          {isSearchDrawerExpanded && (
            <Pressable
              style={styles.searchBackdrop}
              onPress={toggleSearchDrawer}
              pointerEvents="auto"
            />
          )}

          {/* Drawer de búsqueda inferior */}
          <Animated.View
            style={[
              styles.searchDrawer,
              {
                height: searchDrawerHeight,
                bottom: insets.bottom,
                backgroundColor: colors.backgroundSecondary,
                borderTopColor: colors.divider,
              },
            ]}
            pointerEvents={isSearchDrawerExpanded ? "auto" : "none"}
          >
            {/* Handle para arrastrar */}
            <Pressable
              onPress={toggleSearchDrawer}
              style={styles.drawerHandle}
            >
              <View style={[styles.handleBar, { backgroundColor: colors.divider }]} />
            </Pressable>

            {/* Contenido del drawer */}
            {isSearchDrawerExpanded && (
              <BookSearchView
                selectedBook={selectedBook}
                chapters={chapters}
                selectedChapterIndex={selectedChapterIndex}
                searchQuery={bookSearchQuery}
                onSearchQueryChange={setBookSearchQuery}
                onSelectResult={handleBookSearchResultSelect}
              />
            )}
          </Animated.View>
        </>
      )}

      {/* ViewShot oculto para capturar solo los versículos seleccionados */}
      {isCapturingImage && selectedBook && selectedChapter && selectedVerses.length > 0 ? (
        <View style={{ position: 'absolute', left: -9999, top: -9999, opacity: 0 }}>
          <ViewShot 
            ref={selectedVersesViewShotRef} 
            options={{ format: "jpg", quality: 0.9, result: 'tmpfile' }}
            style={{ width: 400, backgroundColor: colors.backgroundPrimary }}
          >
            <View style={[styles.shareableContent, { backgroundColor: colors.backgroundPrimary, width: 400 }]}>
              <Text style={styles.chapterHeading}>
                {selectedBook.label} {selectedChapter.name}
              </Text>
              {selectedChapter.verses.map((verse) => {
                const verseId = buildVerseId(
                  selectedBook.id,
                  selectedChapter.name,
                  verse.name
                );
                const isSelected = selectedVerses.includes(verseId);
                
                // Solo mostrar versículos seleccionados
                if (!isSelected) {
                  return null;
                }
                
                return (
                  <View
                    key={verseId}
                    style={[
                      styles.verseRow,
                      styles.verseRowSelected,
                      { marginBottom: 8 }
                    ]}
                  >
                    <Text
                      style={[
                        styles.verseNumber,
                        styles.verseNumberSelected,
                      ]}
                    >
                      {verse.name}
                    </Text>
                    <View style={styles.verseBody}>
                      <Text
                        style={[
                          styles.verseText,
                          styles.verseTextSelected,
                        ]}
                      >
                        {verse.text}
                      </Text>
                    </View>
                  </View>
                );
              })}
              <View style={[styles.shareFooterContainer, { marginTop: 20 }]}>
                <BookOpen size={14} color={colors.placeholderText} style={{ marginRight: 6 }} />
                <Text style={styles.shareFooter}>
                  Biblia Reina-Valera 1909
                </Text>
              </View>
            </View>
          </ViewShot>
        </View>
      ) : null}

      {/* Modal para seleccionar versión de la Biblia */}
      {bibleVersionPickerVisible ? (
        <View style={styles.modalWrapper} pointerEvents="box-none">
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setBibleVersionPickerVisible(false)}
          />
          <View style={styles.modalContainer}>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.divider,
                },
              ]}
            >
              <Text style={styles.modalTitle}>Seleccionar versión</Text>

              <Pressable
                accessibilityLabel="Biblia Reina-Valera 1909"
                onPress={() => {
                  setSelectedBibleVersion("Reina-Valera 1909");
                  setBibleVersionPickerVisible(false);
                }}
                style={[
                  styles.versionOption,
                  selectedBibleVersion === "Reina-Valera 1909" && {
                    backgroundColor: colors.accentSubtle,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.versionOptionText,
                    selectedBibleVersion === "Reina-Valera 1909" && {
                      color: colors.accent,
                      fontWeight: "700",
                    },
                  ]}
                >
                  Reina-Valera 1909
                </Text>
                {selectedBibleVersion === "Reina-Valera 1909" && (
                  <View
                    style={[
                      styles.versionCheckmark,
                      { backgroundColor: colors.accent },
                    ]}
                  />
                )}
              </Pressable>

              <Pressable
                accessibilityLabel="Cerrar selector de versiones"
                onPress={() => setBibleVersionPickerVisible(false)}
                style={styles.modalButtonSecondary}
              >
                <Text style={styles.modalButtonSecondaryText}>Cerrar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}

      {/* Toast para notificaciones de ancla */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        onHide={() => setToastVisible(false)}
      />

      {/* Modal para fin de libro */}
      {nextBookForPin && (
        <EndOfBookModal
          visible={endOfBookModalVisible}
          bookName={selectedBook?.label || ''}
          nextBookName={nextBookForPin.book}
          onContinue={handleContinueToNextBook}
          onRemovePin={handleRemovePin}
        />
      )}

      {/* Modal de onboarding para rachas - solo se muestra la primera vez */}
      <StreakOnboardingModal
        visible={!streakSettings.hasCompletedOnboarding}
        onComplete={completeOnboarding}
      />

      {/* Modal de resumen de racha - se muestra al abrir si hay alerta */}
      <StreakSummaryModal
        visible={showStreakSummary}
        onClose={() => setShowStreakSummary(false)}
        currentStreak={streakData.currentStreak}
        longestStreak={streakData.longestStreak}
        todayProgress={getTodayProgress()}
        remainingMinutes={getRemainingMinutes()}
        streakStatus={getStreakStatus()}
        availableFreezes={streakData.availableFreezes}
        currentGems={streakData.currentGems}
      />

      {/* Modal de celebración: día 1 (inicio de racha) O cuando hay gemas */}
      {pendingReward && (pendingReward.totalGemsEarned > 0 || pendingReward.newStreak === 1) && (
        <DailyCompletionModal
          visible={true}
          onClose={clearPendingReward}
          reward={pendingReward}
        />
      )}

      {/* Toast pequeño cuando completa el día SIN gemas (excepto día 1) */}
      {pendingReward && pendingReward.totalGemsEarned === 0 && pendingReward.newStreak > 1 && (
        <Toast
          visible={true}
          message={`🔥 ¡Día ${pendingReward.newStreak} completado! ${pendingReward.daysToNextInterval > 0 ? `(${pendingReward.daysToNextInterval} días para +10 gemas)` : ""}`}
          onHide={clearPendingReward}
          duration={3000}
          icon={<Flame size={16} color="#FF6B35" fill="#FF6B35" />}
          borderColor="#FF6B35"
        />
      )}

      {/* Toast cuando se usaron protectores automáticamente */}
      {autoFreezesUsed > 0 && (
        <Toast
          visible={true}
          message={`🛡️ ${autoFreezesUsed === 1 ? 'Se usó 1 protector automáticamente' : `Se usaron ${autoFreezesUsed} protectores automáticamente`} para mantener tu racha`}
          onHide={clearAutoFreezesUsed}
          duration={4000}
          icon={<Shield size={16} color="#87CEEB" />}
          borderColor="#87CEEB"
        />
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors, getFontSize: GetFontSize) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    menuButton: {
      width: 44,
      height: 44,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    actionButton: {
      width: 64,
      height: 44,
      justifyContent: "center",
      alignItems: "flex-start",
      paddingHorizontal: 8,
      marginRight: 12,
    },
    backButtonText: {
      fontSize: getFontSize(14),
      fontWeight: "600",
      color: colors.menuIcon,
    },
    actionPlaceholder: {
      width: 44,
      height: 44,
      marginLeft: 12,
    },
    rightActionsContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    homeButton: {
      width: 44,
      height: 44,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 8,
    },
    menuTrigger: {
      width: 44,
      height: 44,
      justifyContent: "center",
      alignItems: "center",
      marginLeft: 12,
      paddingVertical: 6,
    },
    menuBar: {
      width: 24,
      height: 2,
      marginVertical: 2,
      borderRadius: 1,
    },
    menuDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      marginVertical: 2,
    },
    headerTitle: {
      flex: 1,
      fontSize: getFontSize(18),
      fontWeight: "600",
      textAlign: "center",
      color: colors.headerText,
    },
    versionSelector: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 8,
    },
    versionSelectorText: {
      fontSize: getFontSize(16),
      fontWeight: "600",
      color: colors.headerText,
    },
    versionOption: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 10,
      marginVertical: 4,
    },
    versionOptionText: {
      fontSize: getFontSize(15),
      color: colors.bodyText,
      fontWeight: "500",
    },
    versionCheckmark: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    content: {
      flex: 1,
    },
    chapterNavWrapper: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      paddingVertical: 12,
    },
    chapterNavContent: {
      paddingHorizontal: 16,
    },
    chapterPill: {
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 16,
      marginRight: 8,
    },
    chapterPillText: {
      fontSize: getFontSize(14),
      color: colors.bodyText,
    },
    chapterContentWrapper: {
      flex: 1,
    },
    chapterContent: {
      flex: 1,
    },
    chapterContentContainer: {
      paddingHorizontal: 20,
      paddingVertical: 24,
    },
    chapterHeading: {
      fontSize: getFontSize(20),
      fontWeight: "600",
      marginBottom: 16,
      color: colors.headerText,
    },
    verseRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 12,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    verseRowSelected: {
      backgroundColor: colors.accentSubtle,
    },
    verseRowFavorite: {
      backgroundColor: colors.surfaceMuted,
    },
    verseNumber: {
      width: 28,
      fontWeight: "600",
      fontSize: getFontSize(14),
      lineHeight: Math.round(getFontSize(14) * 1.2),
      color: colors.verseNumber,
    },
    verseNumberSelected: {
      color: colors.accent,
    },
    verseText: {
      flex: 1,
      fontSize: getFontSize(15),
      color: colors.bodyText,
      lineHeight: Math.round(getFontSize(15) * 1.46),
    },
    verseTextSelected: {
      color: colors.bodyText,
      fontWeight: "600",
    },
    verseBody: {
      flex: 1,
      gap: 6,
    },
    favoriteTag: {
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: colors.accentSubtle,
    },
    favoriteTagText: {
      fontSize: getFontSize(12),
      color: colors.accent,
      fontWeight: "600",
    },
    placeholder: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
    },
    placeholderText: {
      fontSize: getFontSize(16),
      textAlign: "center",
      color: colors.placeholderText,
    },
    menuPortal: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "flex-start",
      alignItems: "flex-end",
    },
    menuBackdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    menuDropdown: {
      position: "absolute",
      right: 16,
      borderRadius: 12,
      paddingVertical: 8,
      paddingHorizontal: 4,
      borderWidth: StyleSheet.hairlineWidth,
      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    menuItem: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
    },
    menuItemText: {
      fontSize: getFontSize(14),
      color: colors.bodyText,
    },
    selectionBarWrapper: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "flex-end",
      alignItems: "center",
    },
    selectionBar: {
      position: "absolute",
      left: 20,
      right: 20,
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    selectionCount: {
      fontSize: getFontSize(14),
      color: colors.bodyText,
      fontWeight: "600",
    },
    selectionActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    selectionAction: {
      flexDirection: "row",
      alignItems: "center",
    },
    selectionActionText: {
      fontSize: getFontSize(15),
      color: colors.accent,
      fontWeight: "600",
    },
    modalWrapper: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "center",
      alignItems: "center",
    },
    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.4)",
    },
    modalContainer: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
    },
    modalCard: {
      width: "100%",
      borderRadius: 20,
      padding: 20,
      borderWidth: StyleSheet.hairlineWidth,
      gap: 12,
      shadowColor: "#000",
      shadowOpacity: 0.18,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    modalTitle: {
      fontSize: getFontSize(18),
      color: colors.headerText,
      fontWeight: "600",
    },
    modalSubtitle: {
      fontSize: getFontSize(13),
      color: colors.placeholderText,
    },
    modalHint: {
      fontSize: getFontSize(14),
      color: colors.bodyText,
      fontWeight: "600",
    },
    modalInput: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: getFontSize(14),
      minHeight: 90,
    },
    modalActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      gap: 12,
      marginTop: 4,
    },
    modalButtonSecondary: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
      backgroundColor: colors.surfaceMuted,
    },
    modalButtonSecondaryText: {
      fontSize: getFontSize(14),
      color: colors.bodyText,
      fontWeight: "600",
    },
    modalButtonPrimary: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: colors.accent,
    },
    modalButtonPrimaryText: {
      fontSize: getFontSize(14),
      color: colors.accentText,
      fontWeight: "600",
    },
    searchTab: {
      position: "absolute",
      right: 20,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 24,
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    searchTabText: {
      fontSize: getFontSize(14),
      color: colors.accentText,
      fontWeight: "600",
    },
    searchDrawer: {
      position: "absolute",
      left: 0,
      right: 0,
      borderTopWidth: StyleSheet.hairlineWidth,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: -4 },
      elevation: 8,
      zIndex: 2,
      overflow: "hidden",
    },
    drawerHandle: {
      alignItems: "center",
      paddingVertical: 12,
    },
    handleBar: {
      width: 40,
      height: 4,
      borderRadius: 2,
    },
    searchBackdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      zIndex: 1,
    },
    shareableContent: {
      paddingHorizontal: 20,
      paddingVertical: 24,
    },
    shareFooterContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    shareFooter: {
      fontSize: getFontSize(14),
      color: colors.placeholderText,
      textAlign: "center",
      fontWeight: "600",
    },
    shareOptionButton: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderRadius: 12,
      marginVertical: 8,
    },
    shareOptionButtonDisabled: {
      opacity: 0.6,
      backgroundColor: colors.backgroundPrimary,
    },
    shareOptionContent: {
      flex: 1,
    },
    shareOptionTitle: {
      fontSize: getFontSize(16),
      fontWeight: "600",
      color: colors.bodyText,
      marginBottom: 4,
    },
    shareOptionDescription: {
      fontSize: getFontSize(13),
      color: colors.placeholderText,
      lineHeight: Math.round(getFontSize(13) * 1.4),
    },
  });

export default App;
