import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Pressable,
  Dimensions,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import type { ThemeColors, GetFontSize } from "../context/ThemeContext";

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

type DrawerBook<T> = {
  id: string;
  label: string;
  data: T;
};

type BookSearchResult = {
  chapterName: string;
  chapterIndex: number;
  verseName: string;
  verseIndex: number;
  verseText: string;
  isCurrentChapter: boolean;
};

type BookSearchViewProps = {
  selectedBook: DrawerBook<BookData>;
  chapters: ChapterData[];
  selectedChapterIndex: number;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSelectResult: (chapterIndex: number, verseIndex?: number) => void;
};

export function BookSearchView({
  selectedBook,
  chapters,
  selectedChapterIndex,
  searchQuery,
  onSearchQueryChange,
  onSelectResult,
}: BookSearchViewProps) {
  const { colors, getFontSize } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, getFontSize),
    [colors, getFontSize]
  );

  const [displayedCurrentChapterResults, setDisplayedCurrentChapterResults] = useState(10);
  const [displayedOtherChaptersResults, setDisplayedOtherChaptersResults] = useState(10);
  const [activeTab, setActiveTab] = useState<'current' | 'other'>('current');
  const RESULTS_PER_PAGE = 10;
  const screenWidth = Dimensions.get('window').width;

  // Función para normalizar texto
  const normalizeText = useCallback((text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }, []);

  // Realizar búsqueda en todo el libro
  const allSearchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 3) {
      return { currentChapter: [], otherChapters: [] };
    }

    const currentChapterResults: BookSearchResult[] = [];
    const otherChaptersResults: BookSearchResult[] = [];
    const normalizedQuery = normalizeText(searchQuery.trim());
    const maxResults = 100; // Limitar para rendimiento

    try {
      chapters.forEach((chapter, chapterIndex) => {
        let chapterResultsCount = 0;
        chapter.verses.forEach((verse, verseIndex) => {
          if (currentChapterResults.length + otherChaptersResults.length >= maxResults) {
            return;
          }

          const normalizedVerse = normalizeText(verse.text);
          if (normalizedVerse.includes(normalizedQuery)) {
            const result: BookSearchResult = {
              chapterName: chapter.name,
              chapterIndex,
              verseName: verse.name,
              verseIndex,
              verseText: verse.text,
              isCurrentChapter: chapterIndex === selectedChapterIndex,
            };

            if (chapterIndex === selectedChapterIndex) {
              currentChapterResults.push(result);
            } else {
              otherChaptersResults.push(result);
            }
            chapterResultsCount++;
          }
        });
      });
    } catch (error) {
      console.error("Error during book search:", error);
    }

    return {
      currentChapter: currentChapterResults,
      otherChapters: otherChaptersResults,
    };
  }, [chapters, searchQuery, normalizeText, selectedChapterIndex]);

  // Función para resaltar el texto
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

      const beforeMatch = text.substring(0, index);
      const match = text.substring(index, index + query.length);
      const afterMatch = text.substring(index + query.length);

      return { beforeMatch, match, afterMatch };
    },
    [normalizeText]
  );

  const handleSearch = useCallback((text: string) => {
    onSearchQueryChange(text);
    setDisplayedCurrentChapterResults(RESULTS_PER_PAGE);
    setDisplayedOtherChaptersResults(RESULTS_PER_PAGE);
    // Resetear a la primera pestaña cuando se busca algo nuevo
    if (text.length >= 3) {
      setActiveTab('current');
    }
  }, [onSearchQueryChange]);

  const handleLoadMoreCurrentChapter = useCallback(() => {
    setDisplayedCurrentChapterResults((prev) => prev + RESULTS_PER_PAGE);
  }, []);

  const handleLoadMoreOtherChapters = useCallback(() => {
    setDisplayedOtherChaptersResults((prev) => prev + RESULTS_PER_PAGE);
  }, []);

  const handleTabChange = useCallback((tab: 'current' | 'other') => {
    setActiveTab(tab);
  }, []);

  // Combinar resultados paginados
  const paginatedCurrentChapterResults = useMemo(() => {
    return allSearchResults.currentChapter.slice(0, displayedCurrentChapterResults);
  }, [allSearchResults.currentChapter, displayedCurrentChapterResults]);

  const paginatedOtherChaptersResults = useMemo(() => {
    return allSearchResults.otherChapters.slice(0, displayedOtherChaptersResults);
  }, [allSearchResults.otherChapters, displayedOtherChaptersResults]);

  const hasMoreCurrentChapter = displayedCurrentChapterResults < allSearchResults.currentChapter.length;
  const hasMoreOtherChapters = displayedOtherChaptersResults < allSearchResults.otherChapters.length;

  const totalResults = allSearchResults.currentChapter.length + allSearchResults.otherChapters.length;

  // Resultados para la pestaña activa
  const activeResults = useMemo(() => {
    if (activeTab === 'current') {
      return paginatedCurrentChapterResults;
    } else {
      return paginatedOtherChaptersResults;
    }
  }, [activeTab, paginatedCurrentChapterResults, paginatedOtherChaptersResults]);

  const activeHasMore = activeTab === 'current' ? hasMoreCurrentChapter : hasMoreOtherChapters;
  const activeLoadMore = activeTab === 'current' ? handleLoadMoreCurrentChapter : handleLoadMoreOtherChapters;

  const renderItem = useCallback(({ item }: { item: BookSearchResult }) => {
    const highlighted = highlightText(item.verseText, searchQuery);
    const isHighlighted = typeof highlighted === "object";

    return (
      <Pressable
        onPress={() => onSelectResult(item.chapterIndex, item.isCurrentChapter ? item.verseIndex : undefined)}
        style={({ pressed }) => [
          styles.resultCard,
          {
            backgroundColor: item.isCurrentChapter
              ? colors.accentSubtle
              : colors.surfaceMuted,
            borderColor: colors.divider,
          },
          pressed && { opacity: 0.7 },
        ]}
      >
        <View style={styles.resultHeader}>
          <Text style={styles.resultReference}>
            {item.isCurrentChapter ? 'Versículo' : `Capítulo ${item.chapterName}:`} {item.verseName}
          </Text>
        </View>
        <Text style={styles.resultText} numberOfLines={3}>
          {isHighlighted ? (
            <>
              {highlighted.beforeMatch}
              <Text style={styles.highlightedText}>{highlighted.match}</Text>
              {highlighted.afterMatch}
            </>
          ) : (
            item.verseText
          )}
        </Text>
      </Pressable>
    );
  }, [
    searchQuery,
    highlightText,
    onSelectResult,
    colors,
    styles,
  ]);

  const renderListFooter = useCallback(() => {
    if (activeHasMore) {
      return (
        <View style={styles.loadMoreContainer}>
          <Pressable
            onPress={activeLoadMore}
            style={[styles.loadMoreButton, { backgroundColor: colors.accent }]}
          >
            <Text style={styles.loadMoreText}>Cargar más resultados</Text>
          </Pressable>
        </View>
      );
    }
    return null;
  }, [activeHasMore, activeLoadMore, colors, styles]);

  return (
    <View style={styles.container}>
      {/* Barra de búsqueda compacta */}
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
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.bodyText }]}
            placeholder={`Buscar en ${selectedBook.label}...`}
            placeholderTextColor={colors.placeholderText}
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus={true}
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => handleSearch("")}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.hintRow}>
          {searchQuery.length > 0 && searchQuery.length < 3 && (
            <Text style={styles.hint}>Escribe al menos 3 caracteres</Text>
          )}

          {searchQuery.length >= 3 && totalResults > 0 && (
            <Text style={styles.totalCount}>
              {totalResults} resultado{totalResults !== 1 ? "s" : ""}
            </Text>
          )}
        </View>
      </View>

      {/* Mini navegación por pestañas */}
      {searchQuery.length >= 3 && totalResults > 0 && (
        <View style={[styles.tabNav, { borderBottomColor: colors.divider }]}>
          <Pressable
            onPress={() => handleTabChange('current')}
            style={[
              styles.tabButton,
              activeTab === 'current' && { backgroundColor: colors.accentSubtle }
            ]}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'current' && { color: colors.accent, fontWeight: '600' }
            ]}>
              📍 En este capítulo ({allSearchResults.currentChapter.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleTabChange('other')}
            style={[
              styles.tabButton,
              activeTab === 'other' && { backgroundColor: colors.accentSubtle }
            ]}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'other' && { color: colors.accent, fontWeight: '600' }
            ]}>
              📖 En otros capítulos ({allSearchResults.otherChapters.length})
            </Text>
          </Pressable>
        </View>
      )}

      {/* Resultados */}
      {searchQuery.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>Buscar en {selectedBook.label}</Text>
            <Text style={styles.emptyText}>
              Busca palabras o frases en este libro.{"\n"}
              Resultados del capítulo actual aparecerán primero.
            </Text>
          </View>
        </View>
      ) : searchQuery.length < 3 ? (
        <View style={styles.emptyStateContainer} />
      ) : totalResults === 0 ? (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>Sin resultados</Text>
            <Text style={styles.emptyText}>
              No hay coincidencias para "{searchQuery}"
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={activeResults}
          keyExtractor={(item, index) => `${item.chapterIndex}-${item.verseName}-${index}`}
          renderItem={renderItem}
          ListFooterComponent={renderListFooter}
          contentContainerStyle={styles.resultsContent}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={5}
        />
      )}
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
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 8,
      backgroundColor: colors.backgroundSecondary,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    hintRow: {
      minHeight: 20,
      marginTop: 4,
    },
    tabNav: {
      flexDirection: 'row',
      borderBottomWidth: StyleSheet.hairlineWidth,
      backgroundColor: colors.backgroundSecondary,
    },
    tabButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 8,
      alignItems: 'center',
    },
    tabText: {
      fontSize: getFontSize(13),
      color: colors.bodyText,
      textAlign: 'center',
    },
    searchInputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderWidth: StyleSheet.hairlineWidth,
    },
    searchIcon: {
      fontSize: getFontSize(16),
      marginRight: 6,
    },
    searchInput: {
      flex: 1,
      fontSize: getFontSize(15),
      padding: 0,
    },
    clearButton: {
      padding: 4,
      marginLeft: 8,
    },
    clearButtonText: {
      fontSize: getFontSize(18),
      color: colors.placeholderText,
    },
    hint: {
      fontSize: getFontSize(11),
      color: colors.placeholderText,
      marginLeft: 2,
    },
    totalCount: {
      fontSize: getFontSize(12),
      color: colors.accent,
      fontWeight: "600",
      marginLeft: 2,
    },
    resultsContent: {
      padding: 16,
      paddingBottom: 24,
    },
    resultCard: {
      borderRadius: 10,
      padding: 12,
      marginBottom: 10,
      borderWidth: StyleSheet.hairlineWidth,
    },
    resultHeader: {
      marginBottom: 6,
    },
    resultReference: {
      fontSize: getFontSize(13),
      fontWeight: "600",
      color: colors.accent,
    },
    resultText: {
      fontSize: getFontSize(14),
      color: colors.bodyText,
      lineHeight: Math.round(getFontSize(14) * 1.5),
    },
    highlightedText: {
      fontWeight: "700",
      color: colors.accent,
      backgroundColor: colors.accentSubtle,
    },
    loadMoreContainer: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      alignItems: "center",
    },
    loadMoreButton: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 12,
      minWidth: 180,
      alignItems: "center",
    },
    loadMoreText: {
      fontSize: getFontSize(14),
      color: colors.accentText,
      fontWeight: "600",
    },
    emptyStateContainer: {
      flex: 1,
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
      paddingTop: 40,
    },
    emptyIcon: {
      fontSize: getFontSize(40),
      marginBottom: 12,
    },
    emptyTitle: {
      fontSize: getFontSize(17),
      fontWeight: "600",
      color: colors.headerText,
      marginBottom: 6,
      textAlign: "center",
    },
    emptyText: {
      fontSize: getFontSize(14),
      color: colors.placeholderText,
      textAlign: "center",
      lineHeight: Math.round(getFontSize(14) * 1.5),
    },
  });

