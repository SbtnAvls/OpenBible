import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Pressable,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import Share from 'react-native-share';
import ViewShot from 'react-native-view-shot';
import { useTheme } from '../context/ThemeContext';
import type { ThemeColors, GetFontSize } from '../context/ThemeContext';
import { useVerseOfTheDay } from '../context/VerseOfTheDayContext';
import { useStreak } from '../context/StreakContext';
import { STREAK_COLORS } from '../types/streak';
import {
  Search,
  X,
  BookOpen,
  Sparkles,
  Share2,
  FileText,
  Image,
  Heart,
  LibraryBig,
  Shuffle,
  Clock,
  Flame,
  Calendar,
  Lightbulb,
  Gem,
  Shield,
  ChevronRight,
  Sun,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Animated card component with fade + scale entrance
function AnimatedCard({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: any;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        delay,
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [fadeAnim, scaleAnim, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

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

export type SearchResult = {
  bookName: string;
  bookIndex: number;
  testamentName: string;
  chapterName: string;
  chapterIndex: number;
  verseName: string;
  verseText: string;
  bookId: string;
};

export type BookMatch = {
  bookName: string;
  bookIndex: number;
  testamentName: string;
  bookId: string;
  chaptersCount: number;
};

type SearchScreenProps = {
  bibleData: BibleData;
  onSelectResult: (result: SearchResult) => void;
  onSelectBook: (bookMatch: BookMatch) => void;
  onOpenReadingHistory?: () => void;
  onOpenDevotionals?: () => void;
  onOpenStudyPlans?: () => void;
  onOpenYearlyPlans?: () => void;
  onOpenStreak?: () => void;
  onOpenFavorites?: () => void;
};

// Función para obtener el versículo del día de manera determinística
function getVerseOfTheDay(bibleData: BibleData): SearchResult | null {
  try {
    // Validar que bibleData y testament existan
    if (
      !bibleData ||
      !bibleData.testament ||
      !Array.isArray(bibleData.testament)
    ) {
      console.error('Invalid bible data structure');
      return null;
    }

    // Usar la fecha actual como seed (YYYY-MM-DD)
    const today = new Date();
    const dateString = `${today.getFullYear()}-${String(
      today.getMonth() + 1,
    ).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Crear un hash simple de la fecha para usar como seed
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
      hash = (hash << 5) - hash + dateString.charCodeAt(i);
      hash = hash & hash; // Convertir a entero de 32 bits
    }
    hash = Math.abs(hash);

    // Recopilar todos los versículos
    const allVerses: SearchResult[] = [];
    (bibleData.testament ?? []).forEach(testament => {
      if (!testament || !testament.books) return;

      (testament.books ?? []).forEach((book, bookIndex) => {
        if (!book || !book.chapters) return;

        (book.chapters ?? []).forEach((chapter, chapterIndex) => {
          if (!chapter || !chapter.verses) return;

          (chapter.verses ?? []).forEach(verse => {
            if (!verse || !verse.text) return;

            allVerses.push({
              bookName: book.name,
              bookIndex,
              testamentName: testament.name,
              chapterName: chapter.name,
              chapterIndex,
              verseName: verse.name,
              verseText: verse.text,
              bookId: `${testament.name}-${book.name}`,
            });
          });
        });
      });
    });

    // Verificar que hay versículos
    if (allVerses.length === 0) {
      console.error('No verses found in bible data');
      return null;
    }

    // Seleccionar un versículo basado en el hash de la fecha
    const verseIndex = hash % allVerses.length;
    return allVerses[verseIndex];
  } catch (error) {
    console.error('Error getting verse of the day:', error);
    return null;
  }
}

export function SearchScreen({
  bibleData,
  onSelectResult,
  onSelectBook,
  onOpenReadingHistory,
  onOpenDevotionals,
  onOpenStudyPlans,
  onOpenYearlyPlans,
  onOpenStreak,
  onOpenFavorites,
}: SearchScreenProps) {
  const { colors, getFontSize, theme } = useTheme();
  const { getCuratedVerseForDate } = useVerseOfTheDay();
  const { streakData, getTodayProgress, getRemainingMinutes } = useStreak();
  const styles = useMemo(
    () => createStyles(colors, getFontSize, theme),
    [colors, getFontSize, theme],
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [displayedResults, setDisplayedResults] = useState(20); // Número inicial de resultados a mostrar
  const RESULTS_PER_PAGE = 20; // Resultados por página
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [isCapturingImage, setIsCapturingImage] = useState(false);
  const verseViewShotRef = useRef<ViewShot>(null);

  // Función para obtener un versículo completamente aleatorio
  const getRandomVerse = useCallback((): SearchResult | null => {
    try {
      // Validar que bibleData y testament existan
      if (
        !bibleData ||
        !bibleData.testament ||
        !Array.isArray(bibleData.testament)
      ) {
        console.error('Invalid bible data structure');
        return null;
      }

      // Recopilar todos los versículos
      const allVerses: SearchResult[] = [];
      (bibleData.testament ?? []).forEach(testament => {
        if (!testament || !testament.books) return;

        (testament.books ?? []).forEach((book, bookIndex) => {
          if (!book || !book.chapters) return;

          (book.chapters ?? []).forEach((chapter, chapterIndex) => {
            if (!chapter || !chapter.verses) return;

            (chapter.verses ?? []).forEach(verse => {
              if (!verse || !verse.text) return;

              allVerses.push({
                bookName: book.name,
                bookIndex,
                testamentName: testament.name,
                chapterName: chapter.name,
                chapterIndex,
                verseName: verse.name,
                verseText: verse.text,
                bookId: `${testament.name}-${book.name}`,
              });
            });
          });
        });
      });

      // Verificar que hay versículos
      if (allVerses.length === 0) {
        console.error('No verses found in bible data');
        return null;
      }

      // Seleccionar un versículo completamente aleatorio
      const randomIndex = Math.floor(Math.random() * allVerses.length);
      return allVerses[randomIndex];
    } catch (error) {
      console.error('Error getting random verse:', error);
      return null;
    }
  }, [bibleData]);

  // Calcular el versículo del día
  // Primero intentar obtener de la lista curada, si no existe, usar todos los versículos
  const verseOfTheDay = useMemo(() => {
    const curatedVerse = getCuratedVerseForDate(new Date());
    if (curatedVerse) {
      return curatedVerse;
    }
    // Fallback a la lista completa si no hay versículos curados
    return getVerseOfTheDay(bibleData);
  }, [bibleData, getCuratedVerseForDate]);

  // Función para normalizar texto (quitar acentos y convertir a minúsculas)
  const normalizeText = useCallback((text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }, []);

  // Buscar coincidencias de libros
  const bookMatches = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 3) {
      return [];
    }

    const matches: BookMatch[] = [];
    const normalizedQuery = normalizeText(searchQuery.trim());

    try {
      (bibleData.testament ?? []).forEach(testament => {
        (testament.books ?? []).forEach((book, bookIndex) => {
          const normalizedBookName = normalizeText(book.name);

          // Verificar si el nombre del libro contiene la búsqueda o viceversa
          if (
            normalizedBookName.includes(normalizedQuery) ||
            normalizedQuery.includes(normalizedBookName)
          ) {
            matches.push({
              bookName: book.name,
              bookIndex,
              testamentName: testament.name,
              bookId: `${testament.name}-${book.name}`,
              chaptersCount: book.chapters?.length ?? 0,
            });
          }
        });
      });
    } catch (error) {
      console.error('Error searching books:', error);
    }

    return matches;
  }, [bibleData, searchQuery, normalizeText]);

  // Realizar búsqueda
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 3) {
      return [];
    }

    const results: SearchResult[] = [];
    const normalizedQuery = normalizeText(searchQuery.trim());
    const maxResults = 100; // Limitar resultados para rendimiento

    try {
      (bibleData.testament ?? []).forEach(testament => {
        (testament.books ?? []).forEach((book, bookIndex) => {
          (book.chapters ?? []).forEach((chapter, chapterIndex) => {
            (chapter.verses ?? []).forEach(verse => {
              if (results.length >= maxResults) {
                return;
              }

              const normalizedVerse = normalizeText(verse.text);
              if (normalizedVerse.includes(normalizedQuery)) {
                results.push({
                  bookName: book.name,
                  bookIndex,
                  testamentName: testament.name,
                  chapterName: chapter.name,
                  chapterIndex,
                  verseName: verse.name,
                  verseText: verse.text,
                  bookId: `${testament.name}-${book.name}`,
                });
              }
            });
          });
        });
      });
    } catch (error) {
      console.error('Error during search:', error);
    }

    return results;
  }, [bibleData, searchQuery, normalizeText]);

  // Función para resaltar el texto de búsqueda
  const highlightText = useCallback(
    (text: string, query: string) => {
      if (!query.trim()) {
        return text;
      }

      const normalizedText = normalizeText(text);
      const normalizedQuery = normalizeText(query);
      const index = normalizedText.indexOf(normalizedQuery);

      if (index === -1) {
        return text;
      }

      // Encontrar el texto original que coincide
      const beforeMatch = text.substring(0, index);
      const match = text.substring(index, index + query.length);
      const afterMatch = text.substring(index + query.length);

      return { beforeMatch, match, afterMatch };
    },
    [normalizeText],
  );

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    setDisplayedResults(RESULTS_PER_PAGE); // Resetear la paginación al buscar
  }, []);

  const handleSelectResult = useCallback(
    (result: SearchResult) => {
      onSelectResult(result);
    },
    [onSelectResult],
  );

  const handleSelectBookMatch = useCallback(
    (bookMatch: BookMatch) => {
      onSelectBook(bookMatch);
    },
    [onSelectBook],
  );

  const handleLoadMore = useCallback(() => {
    setDisplayedResults(prev => prev + RESULTS_PER_PAGE);
  }, []);

  const handleOpenShareDialog = useCallback(() => {
    setShareModalVisible(true);
  }, []);

  const handleCloseShareDialog = useCallback(() => {
    setShareModalVisible(false);
  }, []);

  const getVerseOfTheDayText = useCallback(() => {
    if (!verseOfTheDay) return '';

    return `${verseOfTheDay.bookName} ${verseOfTheDay.chapterName}:${verseOfTheDay.verseName}\n\n"${verseOfTheDay.verseText}"\n\nVersículo del Día - Biblia Reina-Valera 1909`;
  }, [verseOfTheDay]);

  const handleShareAsText = useCallback(async () => {
    try {
      const text = getVerseOfTheDayText();

      await Share.open({
        message: text,
        title: 'Compartir Versículo del Día',
      });

      handleCloseShareDialog();
    } catch (error: any) {
      if (error?.message !== 'User did not share') {
        Alert.alert('Error', 'No se pudo compartir el texto');
      }
      handleCloseShareDialog();
    }
  }, [getVerseOfTheDayText, handleCloseShareDialog]);

  const handleShareAsImage = useCallback(async () => {
    try {
      if (!verseOfTheDay) {
        Alert.alert('Error', 'No hay versículo del día disponible');
        return;
      }

      // Activar modo de captura temporalmente
      setIsCapturingImage(true);

      // Esperar un momento para que se renderice la vista
      setTimeout(async () => {
        try {
          if (!verseViewShotRef.current) {
            throw new Error('ViewShot reference not available');
          }

          // Capturar la vista como imagen
          const uri = await verseViewShotRef.current.capture?.();

          if (!uri) {
            throw new Error('Failed to capture image');
          }

          await Share.open({
            url: `file://${uri}`,
            title: 'Compartir Versículo del Día',
          });

          handleCloseShareDialog();
        } catch (captureError: any) {
          console.error('Error capturing image:', captureError);
          if (captureError?.message !== 'User did not share') {
            Alert.alert(
              'Error',
              'No se pudo capturar la imagen. Intenta compartir como texto.',
            );
          }
          handleCloseShareDialog();
        } finally {
          setIsCapturingImage(false);
        }
      }, 300);
    } catch (error: any) {
      console.error('Error in handleShareAsImage:', error);
      if (error?.message !== 'User did not share') {
        Alert.alert('Error', 'No se pudo compartir la imagen');
      }
      handleCloseShareDialog();
      setIsCapturingImage(false);
    }
  }, [verseOfTheDay, handleCloseShareDialog]);

  // Resultados paginados
  const paginatedResults = useMemo(() => {
    return searchResults.slice(0, displayedResults);
  }, [searchResults, displayedResults]);

  const hasMoreResults = displayedResults < searchResults.length;

  return (
    <View style={styles.container}>
      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchInputWrapper,
            {
              backgroundColor: colors.surfaceMuted,
              borderColor: colors.divider,
            },
          ]}
        >
          <Search
            size={18}
            color={colors.placeholderText}
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.bodyText }]}
            placeholder="Buscar en la Biblia..."
            placeholderTextColor={colors.placeholderText}
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <X size={18} color={colors.placeholderText} />
            </Pressable>
          )}
        </View>

        {searchQuery.length > 0 && searchQuery.length < 3 && (
          <Text style={styles.hint}>Escribe al menos 3 caracteres</Text>
        )}
      </View>

      {/* Resultados de búsqueda */}
      {searchQuery.length === 0 ? (
        <ScrollView
          style={styles.homeContainer}
          contentContainerStyle={styles.homeContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section - Versículo del Día */}
          {verseOfTheDay && (
            <AnimatedCard delay={0} style={styles.heroSection}>
              <View
                style={[
                  styles.verseOfDayCard,
                  styles.glassCard,
                  {
                    backgroundColor: colors.glassBackground,
                    borderColor: colors.glassBorder,
                  },
                ]}
              >
                <View style={styles.verseOfDayHeader}>
                  <View
                    style={[
                      styles.verseOfDayBadge,
                      { backgroundColor: colors.accentSubtle },
                    ]}
                  >
                    <Sun size={14} color={colors.accent} />
                    <Text
                      style={[
                        styles.verseOfDayBadgeText,
                        { color: colors.accent },
                      ]}
                    >
                      Versículo del Día
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.verseOfDayDate,
                      { color: colors.placeholderText },
                    ]}
                  >
                    {new Date().toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                </View>

                <Text
                  style={[styles.verseOfDayText, { color: colors.bodyText }]}
                >
                  "{verseOfTheDay.verseText}"
                </Text>
                <Text
                  style={[styles.verseOfDayReference, { color: colors.accent }]}
                >
                  — {verseOfTheDay.bookName} {verseOfTheDay.chapterName}:
                  {verseOfTheDay.verseName}
                </Text>

                <View style={styles.verseOfDayActions}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.verseOfDayButton,
                      styles.verseOfDayButtonSecondary,
                      { backgroundColor: colors.surfaceMuted },
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={handleOpenShareDialog}
                  >
                    <Share2 size={18} color={colors.accent} />
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.verseOfDayButton,
                      styles.verseOfDayButtonPrimary,
                      { backgroundColor: colors.accent },
                      pressed && { opacity: 0.9 },
                    ]}
                    onPress={() => onSelectResult(verseOfTheDay)}
                  >
                    <Text
                      style={[
                        styles.verseOfDayButtonText,
                        { color: colors.accentText },
                      ]}
                    >
                      Leer capítulo
                    </Text>
                    <ChevronRight size={16} color={colors.accentText} />
                  </Pressable>
                </View>
              </View>
            </AnimatedCard>
          )}

          {/* Quick Access Section */}
          <View style={styles.section}>
            <AnimatedCard delay={100}>
              <Text style={styles.sectionTitle}>Acceso Rápido</Text>
            </AnimatedCard>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickAccessScroll}
            >
              <AnimatedCard delay={150}>
                <Pressable
                  style={({ pressed }) => [
                    styles.quickAccessCard,
                    styles.glassCard,
                    {
                      backgroundColor: colors.glassBackground,
                      borderColor: colors.glassBorder,
                    },
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() => onOpenDevotionals?.()}
                >
                  <View
                    style={[
                      styles.quickAccessIcon,
                      { backgroundColor: colors.accentSubtle },
                    ]}
                  >
                    <Heart
                      size={24}
                      color={colors.accent}
                      fill={colors.accent}
                    />
                  </View>
                  <Text style={styles.quickAccessTitle}>Devocionales</Text>
                  <Text style={styles.quickAccessSubtitle}>
                    Reflexiones diarias
                  </Text>
                </Pressable>
              </AnimatedCard>

              <AnimatedCard delay={200}>
                <Pressable
                  style={({ pressed }) => [
                    styles.quickAccessCard,
                    styles.glassCard,
                    {
                      backgroundColor: colors.glassBackground,
                      borderColor: colors.glassBorder,
                    },
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() => onOpenStudyPlans?.()}
                >
                  <View
                    style={[
                      styles.quickAccessIcon,
                      { backgroundColor: colors.accentSubtle },
                    ]}
                  >
                    <LibraryBig size={24} color={colors.accent} />
                  </View>
                  <Text style={styles.quickAccessTitle}>Planes de Estudio</Text>
                  <Text style={styles.quickAccessSubtitle}>
                    Guías estructuradas
                  </Text>
                </Pressable>
              </AnimatedCard>

              <AnimatedCard delay={250}>
                <Pressable
                  style={({ pressed }) => [
                    styles.quickAccessCard,
                    styles.glassCard,
                    {
                      backgroundColor: colors.glassBackground,
                      borderColor: colors.glassBorder,
                    },
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() => onOpenYearlyPlans?.()}
                >
                  <View
                    style={[
                      styles.quickAccessIcon,
                      { backgroundColor: '#8B5CF620' },
                    ]}
                  >
                    <Calendar size={24} color="#8B5CF6" />
                  </View>
                  <Text style={styles.quickAccessTitle}>Biblia en 1 Año</Text>
                  <Text style={styles.quickAccessSubtitle}>
                    Lectura completa
                  </Text>
                </Pressable>
              </AnimatedCard>
            </ScrollView>
          </View>

          {/* Streak Card - Featured */}
          <AnimatedCard delay={250} style={styles.section}>
            <Pressable
              style={({ pressed }) => [
                styles.streakCardNew,
                styles.glassCard,
                {
                  backgroundColor: colors.glassBackground,
                  borderColor:
                    streakData.currentStreak > 0
                      ? STREAK_COLORS.fire
                      : colors.glassBorder,
                },
                pressed && styles.cardPressed,
              ]}
              onPress={() => onOpenStreak?.()}
            >
              <View style={styles.streakCardContent}>
                <View style={styles.streakLeft}>
                  <View
                    style={[
                      styles.streakIconContainer,
                      {
                        backgroundColor:
                          streakData.currentStreak > 0
                            ? `${STREAK_COLORS.fire}20`
                            : colors.surfaceMuted,
                      },
                    ]}
                  >
                    <Flame
                      size={32}
                      color={
                        streakData.currentStreak > 0
                          ? STREAK_COLORS.fire
                          : colors.placeholderText
                      }
                      fill={
                        streakData.currentStreak > 0
                          ? STREAK_COLORS.fire
                          : 'transparent'
                      }
                    />
                  </View>
                  <View style={styles.streakTextContent}>
                    <Text style={styles.streakTitle}>
                      {streakData.currentStreak > 0
                        ? `${streakData.currentStreak} días de racha`
                        : 'Comienza tu racha'}
                    </Text>
                    <Text style={styles.streakSubtitle}>
                      {streakData.todayCompleted
                        ? '¡Meta de hoy completada!'
                        : `${getRemainingMinutes()} min restantes`}
                    </Text>
                  </View>
                </View>

                <View style={styles.streakRight}>
                  <View style={styles.streakMiniStats}>
                    <View style={styles.streakMiniStat}>
                      <Gem size={12} color={STREAK_COLORS.gems} />
                      <Text style={styles.streakMiniStatText}>
                        {streakData.currentGems}
                      </Text>
                    </View>
                    <View style={styles.streakMiniStat}>
                      <Shield size={12} color={STREAK_COLORS.frozen} />
                      <Text style={styles.streakMiniStatText}>
                        {streakData.availableFreezes}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color={colors.placeholderText} />
                </View>
              </View>

              <View style={styles.streakProgressNew}>
                <View
                  style={[
                    styles.streakProgressBarNew,
                    { backgroundColor: colors.divider },
                  ]}
                >
                  <View
                    style={[
                      styles.streakProgressFillNew,
                      {
                        width: `${Math.min(100, getTodayProgress())}%`,
                        backgroundColor: streakData.todayCompleted
                          ? STREAK_COLORS.completed
                          : STREAK_COLORS.fire,
                      },
                    ]}
                  />
                </View>
              </View>
            </Pressable>
          </AnimatedCard>

          {/* Utilities Grid */}
          <View style={styles.section}>
            <AnimatedCard delay={300}>
              <Text style={styles.sectionTitle}>Explorar</Text>
            </AnimatedCard>
            <View style={styles.utilitiesGrid}>
              <AnimatedCard delay={350} style={styles.utilityCardWrapper}>
                <Pressable
                  style={({ pressed }) => [
                    styles.utilityCard,
                    styles.glassCard,
                    {
                      backgroundColor: colors.glassBackground,
                      borderColor: colors.glassBorder,
                    },
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() => {
                    const randomVerse = getRandomVerse();
                    if (randomVerse) {
                      onSelectResult(randomVerse);
                    } else {
                      Alert.alert(
                        'Error',
                        'No se pudo obtener un versículo aleatorio',
                      );
                    }
                  }}
                >
                  <View
                    style={[
                      styles.utilityIcon,
                      { backgroundColor: `${colors.gradientAccent}20` },
                    ]}
                  >
                    <Shuffle size={22} color={colors.gradientAccent} />
                  </View>
                  <Text style={styles.utilityTitle}>Aleatorio</Text>
                  <Text style={styles.utilitySubtitle}>Sorpréndete</Text>
                </Pressable>
              </AnimatedCard>

              <AnimatedCard delay={400} style={styles.utilityCardWrapper}>
                <Pressable
                  style={({ pressed }) => [
                    styles.utilityCard,
                    styles.glassCard,
                    {
                      backgroundColor: colors.glassBackground,
                      borderColor: colors.glassBorder,
                    },
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() => onOpenReadingHistory?.()}
                >
                  <View
                    style={[
                      styles.utilityIcon,
                      { backgroundColor: colors.accentSubtle },
                    ]}
                  >
                    <Clock size={22} color={colors.accent} />
                  </View>
                  <Text style={styles.utilityTitle}>Historial</Text>
                  <Text style={styles.utilitySubtitle}>Continúa leyendo</Text>
                </Pressable>
              </AnimatedCard>

              <AnimatedCard delay={450} style={styles.utilityCardWrapper}>
                <Pressable
                  style={({ pressed }) => [
                    styles.utilityCard,
                    styles.glassCard,
                    {
                      backgroundColor: colors.glassBackground,
                      borderColor: colors.glassBorder,
                    },
                    pressed && styles.cardPressed,
                  ]}
                  onPress={onOpenFavorites}
                >
                  <View
                    style={[
                      styles.utilityIcon,
                      { backgroundColor: colors.surfaceMuted },
                    ]}
                  >
                    <BookOpen size={22} color={colors.headerText} />
                  </View>
                  <Text style={styles.utilityTitle}>Guardados</Text>
                  <Text style={styles.utilitySubtitle}>Tus favoritos</Text>
                </Pressable>
              </AnimatedCard>
            </View>
          </View>

          {/* Footer tip */}
          <AnimatedCard delay={550} style={styles.footer}>
            <View
              style={[
                styles.footerCard,
                { backgroundColor: colors.surfaceMuted },
              ]}
            >
              <Lightbulb size={20} color={colors.accent} />
              <Text style={styles.footerText}>
                Usa el buscador para encontrar cualquier palabra en la Biblia
              </Text>
            </View>
          </AnimatedCard>
        </ScrollView>
      ) : searchQuery.length < 3 ? (
        <View style={styles.emptyStateContainer} />
      ) : searchResults.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyState}>
            <Search
              size={48}
              color={colors.placeholderText}
              style={{ marginBottom: 16 }}
            />
            <Text style={styles.emptyTitle}>Sin resultados</Text>
            <Text style={styles.emptyText}>
              No se encontraron versículos con "{searchQuery}"
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={paginatedResults}
          keyExtractor={(item, index) =>
            `${item.bookId}-${item.chapterName}-${item.verseName}-${index}`
          }
          ListHeaderComponent={
            <>
              {/* Sección de libros coincidentes */}
              {bookMatches.length > 0 && (
                <View style={styles.bookMatchesSection}>
                  <View style={styles.bookMatchesHeader}>
                    <LibraryBig
                      size={20}
                      color={colors.headerText}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.bookMatchesTitle}>
                      {bookMatches.length === 1
                        ? 'Libro encontrado'
                        : 'Libros encontrados'}
                    </Text>
                  </View>
                  {bookMatches.map(bookMatch => (
                    <Pressable
                      key={bookMatch.bookId}
                      onPress={() => handleSelectBookMatch(bookMatch)}
                      style={({ pressed }) => [
                        styles.bookMatchCard,
                        {
                          backgroundColor: colors.accent,
                          borderColor: colors.accent,
                        },
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <View style={styles.bookMatchContent}>
                        <Text style={styles.bookMatchName}>
                          {bookMatch.bookName}
                        </Text>
                        <Text style={styles.bookMatchInfo}>
                          {bookMatch.testamentName} • {bookMatch.chaptersCount}{' '}
                          capítulo{bookMatch.chaptersCount !== 1 ? 's' : ''}
                        </Text>
                      </View>
                      <Text style={styles.bookMatchArrow}>→</Text>
                    </Pressable>
                  ))}
                  <View style={styles.sectionDivider} />
                </View>
              )}

              {/* Header de resultados de texto */}
              <View style={styles.resultsHeader}>
                {bookMatches.length > 0 && (
                  <Text style={styles.sectionSubtitle}>
                    Coincidencias en versículos
                  </Text>
                )}
                <Text style={styles.resultsCount}>
                  {searchResults.length} resultado
                  {searchResults.length !== 1 ? 's' : ''}{' '}
                  {searchResults.length >= 100
                    ? '(mostrando los primeros 100)'
                    : ''}
                </Text>
                <Text style={styles.resultsShowing}>
                  Mostrando {paginatedResults.length} de {searchResults.length}
                </Text>
              </View>
            </>
          }
          renderItem={({ item: result }) => {
            const highlighted = highlightText(result.verseText, searchQuery);
            const isHighlighted = typeof highlighted === 'object';

            return (
              <Pressable
                onPress={() => handleSelectResult(result)}
                style={({ pressed }) => [
                  styles.resultCard,
                  {
                    backgroundColor: colors.surfaceMuted,
                    borderColor: colors.divider,
                  },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <View style={styles.resultHeader}>
                  <Text style={styles.resultReference}>
                    {result.bookName} {result.chapterName}:{result.verseName}
                  </Text>
                </View>
                <Text style={styles.resultText} numberOfLines={3}>
                  {isHighlighted ? (
                    <>
                      {highlighted.beforeMatch}
                      <Text style={styles.highlightedText}>
                        {highlighted.match}
                      </Text>
                      {highlighted.afterMatch}
                    </>
                  ) : (
                    result.verseText
                  )}
                </Text>
              </Pressable>
            );
          }}
          ListFooterComponent={
            hasMoreResults ? (
              <View style={styles.loadMoreContainer}>
                <Pressable
                  onPress={handleLoadMore}
                  style={[
                    styles.loadMoreButton,
                    { backgroundColor: colors.accent },
                  ]}
                >
                  <Text style={styles.loadMoreText}>Cargar más resultados</Text>
                </Pressable>
              </View>
            ) : searchResults.length >= 100 ? (
              <View style={styles.endMessage}>
                <Text style={styles.endMessageText}>
                  Mostrando los primeros 100 resultados.{'\n'}
                  Refina tu búsqueda para ver más específicos.
                </Text>
              </View>
            ) : paginatedResults.length > 10 ? (
              <View style={styles.endMessage}>
                <Text style={styles.endMessageText}>Fin de los resultados</Text>
              </View>
            ) : null
          }
          contentContainerStyle={styles.resultsContent}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={5}
        />
      )}

      {/* Modal de compartir versículo del día */}
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
              <Text style={styles.modalTitle}>Compartir Versículo del Día</Text>
              <Text style={styles.modalSubtitle}>
                ¿Cómo deseas compartir el versículo?
              </Text>

              <Pressable
                accessibilityLabel="Compartir como texto"
                onPress={handleShareAsText}
                style={[
                  styles.shareOptionButton,
                  { backgroundColor: colors.surfaceMuted },
                ]}
              >
                <FileText
                  size={32}
                  color={colors.bodyText}
                  style={{ marginRight: 12 }}
                />
                <View style={styles.shareOptionContent}>
                  <Text style={styles.shareOptionTitle}>
                    Compartir como texto
                  </Text>
                  <Text style={styles.shareOptionDescription}>
                    Comparte el versículo en formato de texto plano
                  </Text>
                </View>
              </Pressable>

              <Pressable
                accessibilityLabel="Compartir como imagen"
                onPress={handleShareAsImage}
                style={[
                  styles.shareOptionButton,
                  { backgroundColor: colors.surfaceMuted },
                ]}
              >
                <Image
                  size={32}
                  color={colors.bodyText}
                  style={{ marginRight: 12 }}
                />
                <View style={styles.shareOptionContent}>
                  <Text style={styles.shareOptionTitle}>
                    Compartir como imagen
                  </Text>
                  <Text style={styles.shareOptionDescription}>
                    Comparte el versículo como una imagen
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

      {/* ViewShot oculto para capturar el versículo del día como imagen */}
      {isCapturingImage && verseOfTheDay ? (
        <View
          style={{ position: 'absolute', left: -9999, top: -9999, opacity: 0 }}
        >
          <ViewShot
            ref={verseViewShotRef}
            options={{ format: 'jpg', quality: 0.9, result: 'tmpfile' }}
            style={{ width: 400, backgroundColor: colors.backgroundPrimary }}
          >
            <View
              style={[
                styles.shareableVerseCard,
                { backgroundColor: colors.backgroundPrimary, width: 400 },
              ]}
            >
              <Sparkles
                size={48}
                color={colors.accent}
                style={{ marginBottom: 20 }}
              />
              <Text style={styles.shareableVerseTitle}>Versículo del Día</Text>
              <Text style={styles.shareableVerseText}>
                "{verseOfTheDay.verseText}"
              </Text>
              <Text style={styles.shareableVerseReference}>
                {verseOfTheDay.bookName} {verseOfTheDay.chapterName}:
                {verseOfTheDay.verseName}
              </Text>
              <View style={styles.shareableVerseFooterContainer}>
                <BookOpen
                  size={14}
                  color={colors.placeholderText}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.shareableVerseFooter}>
                  Biblia Reina-Valera 1909
                </Text>
              </View>
            </View>
          </ViewShot>
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (
  colors: ThemeColors,
  getFontSize: GetFontSize,
  theme: 'Claro' | 'Oscuro',
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
    },
    searchContainer: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
      backgroundColor: colors.backgroundSecondary,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    searchInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: StyleSheet.hairlineWidth,
    },
    searchInput: {
      flex: 1,
      fontSize: getFontSize(16),
      padding: 0,
    },
    clearButton: {
      padding: 4,
      marginLeft: 8,
    },
    hint: {
      fontSize: getFontSize(12),
      color: colors.placeholderText,
      marginTop: 8,
      marginLeft: 4,
    },
    resultsContent: {
      padding: 20,
    },
    bookMatchesSection: {
      marginBottom: 24,
    },
    bookMatchesHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    bookMatchesTitle: {
      fontSize: getFontSize(16),
      fontWeight: '700',
      color: colors.headerText,
    },
    bookMatchCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 12,
      padding: 16,
      marginBottom: 10,
      borderWidth: StyleSheet.hairlineWidth,
      shadowColor: colors.accent,
      shadowOpacity: 0.2,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    },
    bookMatchContent: {
      flex: 1,
    },
    bookMatchName: {
      fontSize: getFontSize(18),
      fontWeight: '700',
      color: colors.accentText,
      marginBottom: 4,
    },
    bookMatchInfo: {
      fontSize: getFontSize(13),
      color: colors.accentText,
      opacity: 0.9,
    },
    bookMatchArrow: {
      fontSize: getFontSize(24),
      color: colors.accentText,
      fontWeight: '600',
      marginLeft: 12,
    },
    sectionDivider: {
      height: 1,
      backgroundColor: colors.divider,
      marginTop: 14,
    },
    sectionSubtitle: {
      fontSize: getFontSize(15),
      fontWeight: '600',
      color: colors.headerText,
      marginBottom: 8,
    },
    resultsHeader: {
      marginBottom: 16,
    },
    resultsCount: {
      fontSize: getFontSize(14),
      color: colors.placeholderText,
      fontWeight: '600',
      marginBottom: 4,
    },
    resultsShowing: {
      fontSize: getFontSize(12),
      color: colors.placeholderText,
    },
    resultCard: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: StyleSheet.hairlineWidth,
    },
    resultHeader: {
      marginBottom: 8,
    },
    resultReference: {
      fontSize: getFontSize(14),
      fontWeight: '600',
      color: colors.accent,
    },
    resultText: {
      fontSize: getFontSize(15),
      color: colors.bodyText,
      lineHeight: Math.round(getFontSize(15) * 1.5),
    },
    highlightedText: {
      fontWeight: '700',
      color: colors.accent,
      backgroundColor: colors.accentSubtle,
    },
    emptyStateContainer: {
      flex: 1,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
      paddingTop: 60,
      gap: 8,
    },
    loadMoreContainer: {
      paddingVertical: 20,
      paddingHorizontal: 20,
      alignItems: 'center',
    },
    loadMoreButton: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
      minWidth: 200,
      alignItems: 'center',
    },
    loadMoreText: {
      fontSize: getFontSize(15),
      color: colors.accentText,
      fontWeight: '600',
    },
    endMessage: {
      paddingVertical: 20,
      paddingHorizontal: 40,
      alignItems: 'center',
    },
    endMessageText: {
      fontSize: getFontSize(13),
      color: colors.placeholderText,
      textAlign: 'center',
      lineHeight: Math.round(getFontSize(13) * 1.5),
    },
    emptyTitle: {
      fontSize: getFontSize(20),
      fontWeight: '600',
      color: colors.headerText,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: getFontSize(15),
      color: colors.placeholderText,
      textAlign: 'center',
      lineHeight: Math.round(getFontSize(15) * 1.5),
    },
    // Home Screen Styles - Modern Glassmorphism Design
    homeContainer: {
      flex: 1,
    },
    homeContent: {
      padding: 20,
      paddingBottom: 40,
    },
    heroSection: {
      marginBottom: 28,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: getFontSize(20),
      fontWeight: '800',
      color: colors.headerText,
      marginBottom: 16,
      letterSpacing: -0.5,
    },
    // Glass Card Base Style - sin sombras para evitar artefactos en animaciones fade
    glassCard: {
      borderWidth: theme === 'Claro' ? 1.5 : 1,
    },
    cardPressed: {
      transform: [{ scale: 0.98 }],
      opacity: 0.9,
    },
    // Verse of the Day - Hero Card (Glassmorphism style - compact)
    verseOfDayCard: {
      borderRadius: 20,
      padding: 18,
    },
    verseOfDayHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    verseOfDayBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 16,
      gap: 5,
    },
    verseOfDayBadgeText: {
      fontSize: getFontSize(11),
      fontWeight: '700',
    },
    verseOfDayDate: {
      fontSize: getFontSize(12),
      fontWeight: '600',
    },
    verseOfDayText: {
      fontSize: getFontSize(15),
      lineHeight: Math.round(getFontSize(15) * 1.6),
      fontWeight: '500',
      marginBottom: 8,
      fontStyle: 'italic',
      textAlign: 'center',
    },
    verseOfDayReference: {
      fontSize: getFontSize(13),
      fontWeight: '700',
      marginBottom: 16,
      textAlign: 'center',
    },
    verseOfDayActions: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'center',
    },
    verseOfDayButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      gap: 5,
    },
    verseOfDayButtonSecondary: {
      width: 42,
      height: 42,
    },
    verseOfDayButtonPrimary: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    verseOfDayButtonText: {
      fontSize: getFontSize(13),
      fontWeight: '700',
    },
    // Quick Access Cards
    quickAccessScroll: {
      paddingHorizontal: 20,
      gap: 12,
    },
    quickAccessCard: {
      borderRadius: 20,
      padding: 20,
      alignItems: 'center',
      minHeight: 140,
      width: 140,
    },
    quickAccessIcon: {
      width: 56,
      height: 56,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    quickAccessTitle: {
      fontSize: getFontSize(15),
      fontWeight: '700',
      color: colors.headerText,
      textAlign: 'center',
      marginBottom: 4,
    },
    quickAccessSubtitle: {
      fontSize: getFontSize(12),
      color: colors.placeholderText,
      textAlign: 'center',
    },
    // Streak Card - New Design
    streakCardNew: {
      borderRadius: 20,
      padding: 18,
    },
    streakCardContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    streakLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    streakIconContainer: {
      width: 52,
      height: 52,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    streakTextContent: {
      flex: 1,
    },
    streakTitle: {
      fontSize: getFontSize(16),
      fontWeight: '700',
      color: colors.headerText,
      marginBottom: 2,
    },
    streakSubtitle: {
      fontSize: getFontSize(13),
      color: colors.placeholderText,
    },
    streakRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    streakMiniStats: {
      flexDirection: 'row',
      gap: 10,
    },
    streakMiniStat: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.surfaceMuted,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    streakMiniStatText: {
      fontSize: getFontSize(11),
      fontWeight: '700',
      color: colors.bodyText,
    },
    streakProgressNew: {
      paddingTop: 4,
    },
    streakProgressBarNew: {
      height: 6,
      borderRadius: 3,
      overflow: 'hidden',
    },
    streakProgressFillNew: {
      height: '100%',
      borderRadius: 3,
    },
    // Utilities Grid
    utilitiesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    utilityCardWrapper: {
      width: (SCREEN_WIDTH - 52) / 2,
    },
    utilityCard: {
      borderRadius: 18,
      padding: 18,
      minHeight: 110,
    },
    utilityIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    utilityTitle: {
      fontSize: getFontSize(14),
      fontWeight: '700',
      color: colors.headerText,
      marginBottom: 2,
    },
    utilitySubtitle: {
      fontSize: getFontSize(11),
      color: colors.placeholderText,
    },
    // Footer
    footer: {
      marginTop: 8,
    },
    footerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      borderRadius: 14,
    },
    footerText: {
      flex: 1,
      fontSize: getFontSize(13),
      color: colors.placeholderText,
      lineHeight: Math.round(getFontSize(13) * 1.4),
    },
    // Modal styles
    modalWrapper: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    modalContainer: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    modalCard: {
      width: '100%',
      borderRadius: 20,
      padding: 20,
      borderWidth: StyleSheet.hairlineWidth,
      gap: 12,
      shadowColor: '#000',
      shadowOpacity: 0.18,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    modalTitle: {
      fontSize: getFontSize(18),
      color: colors.headerText,
      fontWeight: '600',
    },
    modalSubtitle: {
      fontSize: getFontSize(13),
      color: colors.placeholderText,
      marginBottom: 8,
    },
    modalButtonSecondary: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
      backgroundColor: colors.surfaceMuted,
      marginTop: 4,
    },
    modalButtonSecondaryText: {
      fontSize: getFontSize(14),
      color: colors.bodyText,
      fontWeight: '600',
      textAlign: 'center',
    },
    shareOptionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      marginVertical: 4,
    },
    shareOptionContent: {
      flex: 1,
    },
    shareOptionTitle: {
      fontSize: getFontSize(16),
      fontWeight: '600',
      color: colors.bodyText,
      marginBottom: 4,
    },
    shareOptionDescription: {
      fontSize: getFontSize(13),
      color: colors.placeholderText,
    },
    // Shareable verse card styles (for image capture)
    shareableVerseCard: {
      padding: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    shareableVerseTitle: {
      fontSize: getFontSize(20),
      fontWeight: '700',
      color: colors.headerText,
      marginBottom: 24,
      textAlign: 'center',
    },
    shareableVerseText: {
      fontSize: getFontSize(18),
      lineHeight: Math.round(getFontSize(18) * 1.6),
      color: colors.bodyText,
      textAlign: 'center',
      fontWeight: '500',
      marginBottom: 24,
      fontStyle: 'italic',
      paddingHorizontal: 20,
    },
    shareableVerseReference: {
      fontSize: getFontSize(17),
      fontWeight: '700',
      color: colors.accent,
      marginBottom: 32,
      textAlign: 'center',
    },
    shareableVerseFooterContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    shareableVerseFooter: {
      fontSize: getFontSize(14),
      color: colors.placeholderText,
      textAlign: 'center',
      fontWeight: '600',
    },
  });
