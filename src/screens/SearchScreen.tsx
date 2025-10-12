import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
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
};

export function SearchScreen({ bibleData, onSelectResult, onSelectBook }: SearchScreenProps) {
  const { colors, getFontSize } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, getFontSize),
    [colors, getFontSize]
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [displayedResults, setDisplayedResults] = useState(20); // Número inicial de resultados a mostrar
  const RESULTS_PER_PAGE = 20; // Resultados por página

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
          <Text style={styles.searchIcon}>🔍</Text>
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
              <Text style={styles.clearButtonText}>✕</Text>
            </Pressable>
          )}
        </View>

        {searchQuery.length > 0 && searchQuery.length < 3 && (
          <Text style={styles.hint}>Escribe al menos 3 caracteres</Text>
        )}
      </View>

      {/* Resultados de búsqueda */}
      {searchQuery.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📖</Text>
            <Text style={styles.emptyTitle}>Buscador de la Biblia</Text>
            <Text style={styles.emptyText}>
              Busca cualquier palabra o frase en toda la Biblia.{"\n"}
              Los resultados te llevarán directamente al versículo.
            </Text>
          </View>
        </View>
      ) : searchQuery.length < 3 ? (
        <View style={styles.emptyStateContainer} />
      ) : searchResults.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
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
                    <Text style={styles.bookMatchesIcon}>📚</Text>
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
    searchIcon: {
      fontSize: getFontSize(18),
      marginRight: 8,
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
    clearButtonText: {
      fontSize: getFontSize(18),
      color: colors.placeholderText,
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
    bookMatchesIcon: {
      fontSize: getFontSize(20),
      marginRight: 8,
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
    emptyIcon: {
      fontSize: getFontSize(48),
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: getFontSize(20),
      fontWeight: "600",
      color: colors.headerText,
      marginBottom: 8,
      textAlign: "center",
    },
    emptyText: {
      fontSize: getFontSize(15),
      color: colors.placeholderText,
      textAlign: "center",
      lineHeight: Math.round(getFontSize(15) * 1.5),
    },
  });

