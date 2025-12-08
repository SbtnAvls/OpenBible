import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import Share from "react-native-share";
import ViewShot from "react-native-view-shot";
import { useTheme } from "../context/ThemeContext";
import type { ThemeColors, GetFontSize } from "../context/ThemeContext";
import { useVerseOfTheDay } from "../context/VerseOfTheDayContext";
import { useStreak } from "../context/StreakContext";
import { STREAK_COLORS } from "../types/streak";
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
} from "lucide-react-native";

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
  onOpenStreak?: () => void;
};

// Función para obtener el versículo del día de manera determinística
function getVerseOfTheDay(bibleData: BibleData): SearchResult | null {
  try {
    // Validar que bibleData y testament existan
    if (!bibleData || !bibleData.testament || !Array.isArray(bibleData.testament)) {
      console.error("Invalid bible data structure");
      return null;
    }

    // Usar la fecha actual como seed (YYYY-MM-DD)
    const today = new Date();
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Crear un hash simple de la fecha para usar como seed
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
      hash = ((hash << 5) - hash) + dateString.charCodeAt(i);
      hash = hash & hash; // Convertir a entero de 32 bits
    }
    hash = Math.abs(hash);

    // Recopilar todos los versículos
    const allVerses: SearchResult[] = [];
    (bibleData.testament ?? []).forEach((testament) => {
      if (!testament || !testament.books) return;

      (testament.books ?? []).forEach((book, bookIndex) => {
        if (!book || !book.chapters) return;

        (book.chapters ?? []).forEach((chapter, chapterIndex) => {
          if (!chapter || !chapter.verses) return;

          (chapter.verses ?? []).forEach((verse) => {
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
      console.error("No verses found in bible data");
      return null;
    }

    // Seleccionar un versículo basado en el hash de la fecha
    const verseIndex = hash % allVerses.length;
    return allVerses[verseIndex];
  } catch (error) {
    console.error("Error getting verse of the day:", error);
    return null;
  }
}

export function SearchScreen({ bibleData, onSelectResult, onSelectBook, onOpenReadingHistory, onOpenDevotionals, onOpenStudyPlans, onOpenStreak }: SearchScreenProps) {
  const { colors, getFontSize } = useTheme();
  const { getCuratedVerseForDate } = useVerseOfTheDay();
  const {
    streakData,
    getTodayProgress,
    getRemainingMinutes,
  } = useStreak();
  const styles = useMemo(
    () => createStyles(colors, getFontSize),
    [colors, getFontSize]
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [displayedResults, setDisplayedResults] = useState(20); // Número inicial de resultados a mostrar
  const RESULTS_PER_PAGE = 20; // Resultados por página
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [isCapturingImage, setIsCapturingImage] = useState(false);
  const verseViewShotRef = useRef<ViewShot>(null);

  // Función para obtener un versículo completamente aleatorio
  const getRandomVerse = useCallback((): SearchResult | null => {
    try {
      // Validar que bibleData y testament existan
      if (!bibleData || !bibleData.testament || !Array.isArray(bibleData.testament)) {
        console.error("Invalid bible data structure");
        return null;
      }

      // Recopilar todos los versículos
      const allVerses: SearchResult[] = [];
      (bibleData.testament ?? []).forEach((testament) => {
        if (!testament || !testament.books) return;

        (testament.books ?? []).forEach((book, bookIndex) => {
          if (!book || !book.chapters) return;

          (book.chapters ?? []).forEach((chapter, chapterIndex) => {
            if (!chapter || !chapter.verses) return;

            (chapter.verses ?? []).forEach((verse) => {
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
        console.error("No verses found in bible data");
        return null;
      }

      // Seleccionar un versículo completamente aleatorio
      const randomIndex = Math.floor(Math.random() * allVerses.length);
      return allVerses[randomIndex];
    } catch (error) {
      console.error("Error getting random verse:", error);
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
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }, []);

  // Buscar coincidencias de libros
  const bookMatches = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 3) {
      return [];
    }

    const matches: BookMatch[] = [];
    const normalizedQuery = normalizeText(searchQuery.trim());

    try {
      (bibleData.testament ?? []).forEach((testament) => {
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
      console.error("Error searching books:", error);
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
      (bibleData.testament ?? []).forEach((testament) => {
        (testament.books ?? []).forEach((book, bookIndex) => {
          (book.chapters ?? []).forEach((chapter, chapterIndex) => {
            (chapter.verses ?? []).forEach((verse) => {
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
      console.error("Error during search:", error);
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
    [normalizeText]
  );

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    setDisplayedResults(RESULTS_PER_PAGE); // Resetear la paginación al buscar
  }, []);

  const handleSelectResult = useCallback(
    (result: SearchResult) => {
      onSelectResult(result);
    },
    [onSelectResult]
  );

  const handleSelectBookMatch = useCallback(
    (bookMatch: BookMatch) => {
      onSelectBook(bookMatch);
    },
    [onSelectBook]
  );

  const handleLoadMore = useCallback(() => {
    setDisplayedResults((prev) => prev + RESULTS_PER_PAGE);
  }, []);

  const handleOpenShareDialog = useCallback(() => {
    setShareModalVisible(true);
  }, []);

  const handleCloseShareDialog = useCallback(() => {
    setShareModalVisible(false);
  }, []);

  const getVerseOfTheDayText = useCallback(() => {
    if (!verseOfTheDay) return "";

    return `${verseOfTheDay.bookName} ${verseOfTheDay.chapterName}:${verseOfTheDay.verseName}\n\n"${verseOfTheDay.verseText}"\n\nVersículo del Día - Biblia Reina-Valera 1909`;
  }, [verseOfTheDay]);

  const handleShareAsText = useCallback(async () => {
    try {
      const text = getVerseOfTheDayText();

      await Share.open({
        message: text,
        title: "Compartir Versículo del Día",
      });

      handleCloseShareDialog();
    } catch (error: any) {
      if (error?.message !== "User did not share") {
        Alert.alert("Error", "No se pudo compartir el texto");
      }
      handleCloseShareDialog();
    }
  }, [getVerseOfTheDayText, handleCloseShareDialog]);

  const handleShareAsImage = useCallback(async () => {
    try {
      if (!verseOfTheDay) {
        Alert.alert("Error", "No hay versículo del día disponible");
        return;
      }

      // Activar modo de captura temporalmente
      setIsCapturingImage(true);

      // Esperar un momento para que se renderice la vista
      setTimeout(async () => {
        try {
          if (!verseViewShotRef.current) {
            throw new Error("ViewShot reference not available");
          }

          // Capturar la vista como imagen
          const uri = await verseViewShotRef.current.capture?.();

          if (!uri) {
            throw new Error("Failed to capture image");
          }

          await Share.open({
            url: `file://${uri}`,
            title: "Compartir Versículo del Día",
          });

          handleCloseShareDialog();
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
          <Search size={18} color={colors.placeholderText} style={{ marginRight: 8 }} />
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
              onPress={() => setSearchQuery("")}
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
          {/* Acceso Rápido */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Acceso Rápido</Text>
            <View style={styles.quickAccessGrid}>
              <Pressable
                style={({ pressed }) => [
                  styles.quickAccessButton,
                  { backgroundColor: colors.accent },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => {
                  if (onOpenDevotionals) {
                    onOpenDevotionals();
                  }
                }}
              >
                <Heart size={40} color={colors.accentText} style={{ marginBottom: 12 }} />
                <Text style={styles.quickAccessTitle}>Devocionales</Text>
                <Text style={styles.quickAccessSubtitle}>Reflexiones diarias</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.quickAccessButton,
                  { backgroundColor: colors.accent },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => {
                  if (onOpenStudyPlans) {
                    onOpenStudyPlans();
                  }
                }}
              >
                <LibraryBig size={40} color={colors.accentText} style={{ marginBottom: 12 }} />
                <Text style={styles.quickAccessTitle}>Planes</Text>
                <Text style={styles.quickAccessSubtitle}>de Estudio</Text>
              </Pressable>
            </View>
          </View>

          {/* Cita Bíblica del Día */}
          {verseOfTheDay && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Versículo del Día</Text>
                <Text style={styles.sectionDate}>
                  {new Date().toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long'
                  })}
                </Text>
              </View>
              <View
                style={[
                  styles.verseOfDayCard,
                  {
                    backgroundColor: colors.accentSubtle,
                    borderColor: colors.accent,
                  },
                ]}
              >
                <Sparkles size={32} color={colors.accent} style={{ marginBottom: 16 }} />
                <Text style={styles.verseOfDayText}>
                  "{verseOfTheDay.verseText}"
                </Text>
                <Text style={styles.verseOfDayReference}>
                  {verseOfTheDay.bookName} {verseOfTheDay.chapterName}:{verseOfTheDay.verseName}
                </Text>
                <View style={styles.verseOfDayActions}>
                  <Pressable
                    style={[
                      styles.verseOfDayButton,
                      styles.verseOfDayButtonSecondary,
                      { borderColor: colors.accent },
                    ]}
                    onPress={handleOpenShareDialog}
                  >
                    <Share2 size={16} color={colors.accent} style={{ marginRight: 6 }} />
                    <Text style={[styles.verseOfDayButtonTextSecondary, { color: colors.accent }]}>
                      Compartir
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.verseOfDayButton,
                      { backgroundColor: colors.accent },
                    ]}
                    onPress={() => {
                      onSelectResult(verseOfTheDay);
                    }}
                  >
                    <Text style={styles.verseOfDayButtonText}>Leer capítulo</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          {/* Utilidades */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Más Opciones</Text>
            <View style={styles.utilitiesGrid}>
              <Pressable
                style={({ pressed }) => [
                  styles.utilityCard,
                  {
                    backgroundColor: colors.surfaceMuted,
                    borderColor: colors.divider,
                  },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => {
                  const randomVerse = getRandomVerse();
                  if (randomVerse) {
                    onSelectResult(randomVerse);
                  } else {
                    Alert.alert("Error", "No se pudo obtener un versículo aleatorio");
                  }
                }}
              >
                <Shuffle size={28} color={colors.headerText} style={{ marginBottom: 8 }} />
                <Text style={styles.utilityTitle}>Versículo Aleatorio</Text>
                <Text style={styles.utilitySubtitle}>Descubre nuevos pasajes</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.utilityCard,
                  {
                    backgroundColor: colors.surfaceMuted,
                    borderColor: colors.divider,
                  },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => {
                  if (onOpenReadingHistory) {
                    onOpenReadingHistory();
                  }
                }}
              >
                <Clock size={28} color={colors.headerText} style={{ marginBottom: 8 }} />
                <Text style={styles.utilityTitle}>Lectura Reciente</Text>
                <Text style={styles.utilitySubtitle}>Continúa donde lo dejaste</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.streakCard,
                  {
                    backgroundColor: colors.surfaceMuted,
                    borderColor: streakData.currentStreak > 0 ? STREAK_COLORS.fire : colors.divider,
                  },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => {
                  if (onOpenStreak) {
                    onOpenStreak();
                  }
                }}
              >
                <View style={styles.streakCardHeader}>
                  <View style={styles.streakInfo}>
                    <Flame
                      size={28}
                      color={streakData.currentStreak > 0 ? STREAK_COLORS.fire : colors.placeholderText}
                      fill={streakData.currentStreak > 0 ? STREAK_COLORS.fire : "transparent"}
                    />
                    <View style={styles.streakTextContainer}>
                      <Text style={styles.streakNumber}>{streakData.currentStreak}</Text>
                      <Text style={styles.streakLabel}>
                        {streakData.currentStreak === 1 ? "día" : "días"}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={18} color={colors.placeholderText} />
                </View>

                <View style={styles.streakProgressContainer}>
                  <View style={styles.streakProgressBar}>
                    <View
                      style={[
                        styles.streakProgressFill,
                        {
                          width: `${Math.min(100, getTodayProgress())}%`,
                          backgroundColor: streakData.todayCompleted
                            ? STREAK_COLORS.completed
                            : colors.accent,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.streakProgressText}>
                    {streakData.todayCompleted
                      ? "Meta cumplida"
                      : `${getRemainingMinutes()} min`}
                  </Text>
                </View>

                <View style={styles.streakStats}>
                  <View style={styles.streakStatItem}>
                    <Gem size={14} color={STREAK_COLORS.gems} />
                    <Text style={styles.streakStatText}>{streakData.currentGems}</Text>
                  </View>
                  <View style={styles.streakStatDivider} />
                  <View style={styles.streakStatItem}>
                    <Shield size={14} color={STREAK_COLORS.frozen} />
                    <Text style={styles.streakStatText}>{streakData.availableFreezes}</Text>
                  </View>
                </View>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.utilityCard,
                  {
                    backgroundColor: colors.surfaceMuted,
                    borderColor: colors.divider,
                  },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => {
                  // TODO: Plan de lectura anual
                  console.log("Plan de lectura anual");
                }}
              >
                <Calendar size={28} color={colors.headerText} style={{ marginBottom: 8 }} />
                <Text style={styles.utilityTitle}>Lectura Anual</Text>
                <Text style={styles.utilitySubtitle}>Lee la Biblia en un año</Text>
              </Pressable>
            </View>
          </View>

          {/* Footer con tips */}
          <View style={styles.footer}>
            <Lightbulb size={24} color={colors.placeholderText} style={{ marginBottom: 8 }} />
            <Text style={styles.footerText}>
              Usa el buscador arriba para encontrar cualquier palabra o frase en toda la Biblia
            </Text>
          </View>
        </ScrollView>
      ) : searchQuery.length < 3 ? (
        <View style={styles.emptyStateContainer} />
      ) : searchResults.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyState}>
            <Search size={48} color={colors.placeholderText} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>Sin resultados</Text>
            <Text style={styles.emptyText}>
              No se encontraron versículos con "{searchQuery}"
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={paginatedResults}
          keyExtractor={(item, index) => `${item.bookId}-${item.chapterName}-${item.verseName}-${index}`}
          ListHeaderComponent={
            <>
              {/* Sección de libros coincidentes */}
              {bookMatches.length > 0 && (
                <View style={styles.bookMatchesSection}>
                  <View style={styles.bookMatchesHeader}>
                    <LibraryBig size={20} color={colors.headerText} style={{ marginRight: 8 }} />
                    <Text style={styles.bookMatchesTitle}>
                      {bookMatches.length === 1 ? "Libro encontrado" : "Libros encontrados"}
                    </Text>
                  </View>
                  {bookMatches.map((bookMatch) => (
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
                          {bookMatch.testamentName} • {bookMatch.chaptersCount} capítulo{bookMatch.chaptersCount !== 1 ? "s" : ""}
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
                  {searchResults.length} resultado{searchResults.length !== 1 ? "s" : ""}{" "}
                  {searchResults.length >= 100 ? "(mostrando los primeros 100)" : ""}
                </Text>
                <Text style={styles.resultsShowing}>
                  Mostrando {paginatedResults.length} de {searchResults.length}
                </Text>
              </View>
            </>
          }
          renderItem={({ item: result }) => {
            const highlighted = highlightText(result.verseText, searchQuery);
            const isHighlighted = typeof highlighted === "object";

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
                  <Text style={styles.loadMoreText}>
                    Cargar más resultados
                  </Text>
                </Pressable>
              </View>
            ) : searchResults.length >= 100 ? (
              <View style={styles.endMessage}>
                <Text style={styles.endMessageText}>
                  Mostrando los primeros 100 resultados.{"\n"}
                  Refina tu búsqueda para ver más específicos.
                </Text>
              </View>
            ) : paginatedResults.length > 10 ? (
              <View style={styles.endMessage}>
                <Text style={styles.endMessageText}>
                  Fin de los resultados
                </Text>
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
                  { backgroundColor: colors.surfaceMuted }
                ]}
              >
                <FileText size={32} color={colors.bodyText} style={{ marginRight: 12 }} />
                <View style={styles.shareOptionContent}>
                  <Text style={styles.shareOptionTitle}>Compartir como texto</Text>
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
                  { backgroundColor: colors.surfaceMuted }
                ]}
              >
                <Image size={32} color={colors.bodyText} style={{ marginRight: 12 }} />
                <View style={styles.shareOptionContent}>
                  <Text style={styles.shareOptionTitle}>Compartir como imagen</Text>
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
        <View style={{ position: 'absolute', left: -9999, top: -9999, opacity: 0 }}>
          <ViewShot
            ref={verseViewShotRef}
            options={{ format: "jpg", quality: 0.9, result: 'tmpfile' }}
            style={{ width: 400, backgroundColor: colors.backgroundPrimary }}
          >
            <View style={[styles.shareableVerseCard, { backgroundColor: colors.backgroundPrimary, width: 400 }]}>
              <Sparkles size={48} color={colors.accent} style={{ marginBottom: 20 }} />
              <Text style={styles.shareableVerseTitle}>Versículo del Día</Text>
              <Text style={styles.shareableVerseText}>
                "{verseOfTheDay.verseText}"
              </Text>
              <Text style={styles.shareableVerseReference}>
                {verseOfTheDay.bookName} {verseOfTheDay.chapterName}:{verseOfTheDay.verseName}
              </Text>
              <View style={styles.shareableVerseFooterContainer}>
                <BookOpen size={14} color={colors.placeholderText} style={{ marginRight: 6 }} />
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

const createStyles = (colors: ThemeColors, getFontSize: GetFontSize) =>
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
      flexDirection: "row",
      alignItems: "center",
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
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    bookMatchesTitle: {
      fontSize: getFontSize(16),
      fontWeight: "700",
      color: colors.headerText,
    },
    bookMatchCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
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
      fontWeight: "700",
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
      fontWeight: "600",
      marginLeft: 12,
    },
    sectionDivider: {
      height: 1,
      backgroundColor: colors.divider,
      marginTop: 14,
    },
    sectionSubtitle: {
      fontSize: getFontSize(15),
      fontWeight: "600",
      color: colors.headerText,
      marginBottom: 8,
    },
    resultsHeader: {
      marginBottom: 16,
    },
    resultsCount: {
      fontSize: getFontSize(14),
      color: colors.placeholderText,
      fontWeight: "600",
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
      fontWeight: "600",
      color: colors.accent,
    },
    resultText: {
      fontSize: getFontSize(15),
      color: colors.bodyText,
      lineHeight: Math.round(getFontSize(15) * 1.5),
    },
    highlightedText: {
      fontWeight: "700",
      color: colors.accent,
      backgroundColor: colors.accentSubtle,
    },
    emptyStateContainer: {
      flex: 1,
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 40,
      paddingTop: 60,
      gap: 8,
    },
    loadMoreContainer: {
      paddingVertical: 20,
      paddingHorizontal: 20,
      alignItems: "center",
    },
    loadMoreButton: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
      minWidth: 200,
      alignItems: "center",
    },
    loadMoreText: {
      fontSize: getFontSize(15),
      color: colors.accentText,
      fontWeight: "600",
    },
    endMessage: {
      paddingVertical: 20,
      paddingHorizontal: 40,
      alignItems: "center",
    },
    endMessageText: {
      fontSize: getFontSize(13),
      color: colors.placeholderText,
      textAlign: "center",
      lineHeight: Math.round(getFontSize(13) * 1.5),
    },
    emptyTitle: {
      fontSize: getFontSize(20),
      fontWeight: "600",
      color: colors.headerText,
      textAlign: "center",
    },
    emptyText: {
      fontSize: getFontSize(15),
      color: colors.placeholderText,
      textAlign: "center",
      lineHeight: Math.round(getFontSize(15) * 1.5),
    },
    // Home Screen Styles
    homeContainer: {
      flex: 1,
    },
    homeContent: {
      padding: 20,
      paddingBottom: 40,
    },
    section: {
      marginBottom: 32,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: getFontSize(18),
      fontWeight: "700",
      color: colors.headerText,
      marginBottom: 16,
    },
    sectionDate: {
      fontSize: getFontSize(13),
      color: colors.placeholderText,
      fontWeight: "600",
    },
    quickAccessGrid: {
      flexDirection: "row",
      gap: 12,
    },
    quickAccessButton: {
      flex: 1,
      borderRadius: 16,
      padding: 20,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 140,
      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    quickAccessTitle: {
      fontSize: getFontSize(16),
      fontWeight: "700",
      color: colors.accentText,
      textAlign: "center",
      marginBottom: 4,
    },
    quickAccessSubtitle: {
      fontSize: getFontSize(13),
      color: colors.accentText,
      textAlign: "center",
      opacity: 0.9,
    },
    verseOfDayCard: {
      borderRadius: 16,
      padding: 24,
      borderWidth: 2,
      alignItems: "center",
      shadowColor: colors.accent,
      shadowOpacity: 0.2,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    verseOfDayText: {
      fontSize: getFontSize(16),
      lineHeight: Math.round(getFontSize(16) * 1.6),
      color: colors.bodyText,
      textAlign: "center",
      fontWeight: "500",
      marginBottom: 16,
      fontStyle: "italic",
    },
    verseOfDayReference: {
      fontSize: getFontSize(15),
      fontWeight: "700",
      color: colors.accent,
      marginBottom: 20,
    },
    verseOfDayActions: {
      flexDirection: "row",
      gap: 12,
      width: "100%",
    },
    verseOfDayButton: {
      flex: 1,
      flexDirection: "row",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    verseOfDayButtonSecondary: {
      backgroundColor: "transparent",
      borderWidth: 2,
      shadowOpacity: 0,
      elevation: 0,
    },
    verseOfDayButtonText: {
      fontSize: getFontSize(14),
      fontWeight: "600",
      color: colors.accentText,
      textAlign: "center",
    },
    verseOfDayButtonTextSecondary: {
      fontSize: getFontSize(14),
      fontWeight: "600",
      textAlign: "center",
    },
    utilitiesGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    utilityCard: {
      width: "48%",
      borderRadius: 12,
      padding: 16,
      borderWidth: StyleSheet.hairlineWidth,
      minHeight: 120,
      justifyContent: "center",
    },
    utilityTitle: {
      fontSize: getFontSize(14),
      fontWeight: "700",
      color: colors.headerText,
      marginBottom: 4,
    },
    utilitySubtitle: {
      fontSize: getFontSize(12),
      color: colors.placeholderText,
      lineHeight: Math.round(getFontSize(12) * 1.4),
    },
    footer: {
      alignItems: "center",
      paddingVertical: 20,
      paddingHorizontal: 20,
      marginTop: 12,
    },
    footerText: {
      fontSize: getFontSize(13),
      color: colors.placeholderText,
      textAlign: "center",
      lineHeight: Math.round(getFontSize(13) * 1.5),
    },
    // Modal styles
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
      fontWeight: "600",
      textAlign: "center",
    },
    shareOptionButton: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderRadius: 12,
      marginVertical: 4,
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
    },
    // Shareable verse card styles (for image capture)
    shareableVerseCard: {
      padding: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    shareableVerseTitle: {
      fontSize: getFontSize(20),
      fontWeight: "700",
      color: colors.headerText,
      marginBottom: 24,
      textAlign: "center",
    },
    shareableVerseText: {
      fontSize: getFontSize(18),
      lineHeight: Math.round(getFontSize(18) * 1.6),
      color: colors.bodyText,
      textAlign: "center",
      fontWeight: "500",
      marginBottom: 24,
      fontStyle: "italic",
      paddingHorizontal: 20,
    },
    shareableVerseReference: {
      fontSize: getFontSize(17),
      fontWeight: "700",
      color: colors.accent,
      marginBottom: 32,
      textAlign: "center",
    },
    shareableVerseFooterContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    shareableVerseFooter: {
      fontSize: getFontSize(14),
      color: colors.placeholderText,
      textAlign: "center",
      fontWeight: "600",
    },
    // Streak card styles
    streakCard: {
      width: "48%",
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      minHeight: 120,
    },
    streakCardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 10,
    },
    streakInfo: {
      flexDirection: "row",
      alignItems: "center",
    },
    streakTextContainer: {
      marginLeft: 8,
    },
    streakNumber: {
      fontSize: getFontSize(22),
      fontWeight: "800",
      color: colors.headerText,
      lineHeight: getFontSize(26),
    },
    streakLabel: {
      fontSize: getFontSize(11),
      color: colors.placeholderText,
      marginTop: -3,
    },
    streakProgressContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 10,
    },
    streakProgressBar: {
      flex: 1,
      height: 4,
      backgroundColor: colors.divider,
      borderRadius: 2,
      overflow: "hidden",
    },
    streakProgressFill: {
      height: "100%",
      borderRadius: 2,
    },
    streakProgressText: {
      fontSize: getFontSize(10),
      color: colors.placeholderText,
      fontWeight: "600",
      minWidth: 50,
      textAlign: "right",
    },
    streakStats: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    streakStatItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    streakStatText: {
      fontSize: getFontSize(12),
      fontWeight: "600",
      color: colors.bodyText,
    },
    streakStatDivider: {
      width: 1,
      height: 12,
      backgroundColor: colors.divider,
    },
  });

