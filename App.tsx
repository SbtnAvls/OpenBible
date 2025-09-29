import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import bibleContent from "./src/textContent/rv1909.json";
import {
  BibleDrawer,
  DrawerBook,
  DrawerSection,
} from "./src/components/BibleDrawer";
import {
  ThemeProvider,
  useTheme,
} from "./src/context/ThemeContext";
import { SettingsScreen } from "./src/screens/SettingsScreen";

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

type ThemeColors = ReturnType<typeof useTheme>["colors"];

function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle } = useTheme();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedBook, setSelectedBook] =
    useState<DrawerBook<BookData> | null>(null);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);

  const styles = useMemo(() => createStyles(colors), [colors]);

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

  const handleSelectBook = (book: DrawerBook<BookData>) => {
    setSelectedBook(book);
    setSelectedChapterIndex(0);
    setIsSettingsVisible(false);
  };

  const handleSelectChapter = (index: number) => {
    setSelectedChapterIndex(index);
  };

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
        {isSettingsVisible ? (
          <Pressable
            accessibilityLabel="Volver"
            onPress={() => setIsSettingsVisible(false)}
            style={styles.actionButton}
          >
            <Text style={[styles.backButtonText, { color: colors.menuIcon }]}>
              Volver
            </Text>
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

        <Text style={[styles.headerTitle, { color: colors.headerText }]}>
          {isSettingsVisible ? "Configuraciones" : "Biblia Reina-Valera 1909"}
        </Text>

        {isSettingsVisible ? (
          <View style={styles.actionPlaceholder} />
        ) : (
          <Pressable
            accessibilityLabel="Abrir configuraciones"
            onPress={() => {
              setDrawerVisible(false);
              setIsSettingsVisible(true);
            }}
            style={styles.settingsButton}
          >
            <View style={styles.settingsIconRow}>
              <View
                style={[
                  styles.settingsSlider,
                  styles.settingsSliderShort,
                  { backgroundColor: colors.menuIcon },
                ]}
              />
              <View
                style={[styles.settingsSlider, { backgroundColor: colors.menuIcon }]}
              />
              <View
                style={[
                  styles.settingsSlider,
                  styles.settingsSliderMedium,
                  { backgroundColor: colors.menuIcon },
                ]}
              />
            </View>
          </Pressable>
        )}
      </View>

      {isSettingsVisible ? (
        <SettingsScreen />
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
                        { color: colors.bodyText },
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

          <ScrollView
            style={[styles.chapterContent, { backgroundColor: colors.backgroundPrimary }]}
            contentContainerStyle={styles.chapterContentContainer}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.chapterHeading, { color: colors.headerText }]}>
              {selectedBook.label} {selectedChapter.name}
            </Text>
            {selectedChapter.verses.map((verse) => (
              <View key={verse.name} style={styles.verseRow}>
                <Text style={[styles.verseNumber, { color: colors.verseNumber }]}>
                  {verse.name}
                </Text>
                <Text style={[styles.verseText, { color: colors.bodyText }]}>
                  {verse.text}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Text style={[styles.placeholderText, { color: colors.placeholderText }]}>
            Selecciona un libro desde el menu.
          </Text>
        </View>
      )}

      <BibleDrawer
        visible={drawerVisible && !isSettingsVisible}
        onClose={() => setDrawerVisible(false)}
        sections={sections}
        onSelectBook={handleSelectBook}
        selectedBookId={selectedBook?.id}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
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
      fontSize: 14,
      fontWeight: "600",
    },
    actionPlaceholder: {
      width: 44,
      height: 44,
      marginLeft: 12,
    },
    settingsButton: {
      width: 44,
      height: 44,
      justifyContent: "center",
      alignItems: "center",
      marginLeft: 12,
    },
    menuBar: {
      width: 24,
      height: 2,
      marginVertical: 2,
      borderRadius: 1,
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: "600",
      textAlign: "center",
    },
    settingsIconRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      width: 20,
      height: 18,
    },
    settingsSlider: {
      width: 4,
      borderRadius: 2,
    },
    settingsSliderShort: {
      height: 10,
    },
    settingsSliderMedium: {
      height: 14,
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
      fontSize: 14,
    },
    chapterContent: {
      flex: 1,
    },
    chapterContentContainer: {
      paddingHorizontal: 20,
      paddingVertical: 24,
    },
    chapterHeading: {
      fontSize: 20,
      fontWeight: "600",
      marginBottom: 16,
    },
    verseRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 12,
    },
    verseNumber: {
      width: 28,
      fontWeight: "600",
    },
    verseText: {
      flex: 1,
      fontSize: 15,
      lineHeight: 22,
    },
    placeholder: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
    },
    placeholderText: {
      fontSize: 16,
      textAlign: "center",
    },
  });

export default App;
