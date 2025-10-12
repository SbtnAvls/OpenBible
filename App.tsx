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
import type {
  GetFontSize,
  ThemeColors,
} from "./src/context/ThemeContext";
import { FavoritesScreen } from "./src/screens/FavoritesScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { SearchScreen, SearchResult, BookMatch } from "./src/screens/SearchScreen";
import { formatVerseNumbersRange } from "./src/utils/verseRange";

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

type ActiveScreen = "reader" | "settings" | "favorites";

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
        <SafeAreaProvider>
          <AppContent />
        </SafeAreaProvider>
      </ThemeProvider>
    </FavoritesVersesProvider>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle, getFontSize } = useTheme();
  const { addFavorite, getVerseFavorites } = useFavoritesVerses();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedBook, setSelectedBook] =
    useState<DrawerBook<BookData> | null>(null);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>("reader");
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedVerses, setSelectedVerses] = useState<string[]>([]);
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
  const viewShotRef = useRef<ViewShot>(null);
  const selectedVersesViewShotRef = useRef<ViewShot>(null);
  const COLLAPSED_HEIGHT = 0;
  const EXPANDED_HEIGHT = 400; // Altura del drawer expandido

  const styles = useMemo(
    () => createStyles(colors, getFontSize),
    [colors, getFontSize]
  );

  const isReaderScreen = activeScreen === "reader";
  const isSettingsScreen = activeScreen === "settings";
  const isFavoritesScreen = activeScreen === "favorites";
  const isSelecting = isReaderScreen && selectedVerses.length > 0;

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

    return `${selectedBook.label} ${selectedChapter.name}\n\n${versesToShare}\n\n📖 Biblia Reina-Valera 1909`;
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
          const uri = await selectedVersesViewShotRef.current.capture();
          
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
    : isFavoritesScreen
    ? "Citas guardas"
    : !selectedBook
    ? "Buscar en la Biblia"
    : "Biblia Reina-Valera 1909";

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
            <Text style={styles.backButtonText}>Volver</Text>
          </Pressable>
        ) : isSelecting ? (
          <Pressable
            accessibilityLabel="Cancelar seleccion"
            onPress={handleClearSelection}
            style={styles.actionButton}
          >
            <Text style={styles.backButtonText}>Cancelar</Text>
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

        <Text style={styles.headerTitle}>{headerTitle}</Text>

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
                <Text style={styles.homeButtonText}>🏠</Text>
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
      ) : isFavoritesScreen ? (
        <FavoritesScreen />
      ) : !selectedBook ? (
        <SearchScreen
          bibleData={bibleContent as BibleData}
          onSelectResult={handleSearchResultSelect}
          onSelectBook={handleBookMatchSelect}
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
            >
              <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.9 }}>
                <View style={[styles.shareableContent, { backgroundColor: colors.backgroundPrimary }]}>
                  <Text style={styles.chapterHeading}>
                    {selectedBook.label} {selectedChapter.name}
                  </Text>
                  {selectedChapter.verses.map((verse, verseIndex) => {
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
                <Text style={styles.selectionActionIcon}>↗️</Text>
                <Text style={styles.selectionActionText}>Compartir</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Guardar versiculos seleccionados"
                onPress={handleOpenSaveDialog}
                style={styles.selectionAction}
              >
                <Text style={styles.selectionActionIcon}>{"\u2661"}</Text>
                <Text style={styles.selectionActionText}>Guardar</Text>
              </Pressable>
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
                <Text style={styles.shareOptionIcon}>📝</Text>
                <View style={styles.shareOptionContent}>
                  <Text style={styles.shareOptionTitle}>Compartir como texto</Text>
                  <Text style={styles.shareOptionDescription}>
                    Comparte los versículos en formato de texto plano
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
                <Text style={styles.shareOptionIcon}>🖼️</Text>
                <View style={styles.shareOptionContent}>
                  <Text style={styles.shareOptionTitle}>Compartir como imagen</Text>
                  <Text style={styles.shareOptionDescription}>
                    Comparte los versículos como una imagen
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
              <Text style={styles.searchTabIcon}>🔍</Text>
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
              {selectedChapter.verses.map((verse, verseIndex) => {
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
              <Text style={[styles.shareFooter, { marginTop: 20 }]}>
                📖 Biblia Reina-Valera 1909
              </Text>
            </View>
          </ViewShot>
        </View>
      ) : null}
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
    homeButtonText: {
      fontSize: getFontSize(20),
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
    selectionActionIcon: {
      fontSize: getFontSize(18),
      color: colors.accent,
      marginRight: 6,
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
    searchTabIcon: {
      fontSize: getFontSize(18),
      marginRight: 6,
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
    shareFooter: {
      fontSize: getFontSize(14),
      color: colors.placeholderText,
      textAlign: "center",
      marginTop: 16,
      fontWeight: "600",
    },
    shareOptionButton: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderRadius: 12,
      marginVertical: 8,
    },
    shareOptionIcon: {
      fontSize: getFontSize(32),
      marginRight: 12,
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
  });

export default App;
