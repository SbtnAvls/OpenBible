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

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedBook, setSelectedBook] =
    useState<DrawerBook<BookData> | null>(null);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);

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
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Abrir navegacion"
          onPress={() => setDrawerVisible(true)}
          style={styles.menuButton}
        >
          <View style={styles.menuBar} />
          <View style={styles.menuBar} />
          <View style={styles.menuBar} />
        </Pressable>
        <Text style={styles.headerTitle}>Biblia Reina-Valera 1909</Text>
      </View>

      {selectedBook && selectedChapter ? (
        <View style={styles.content}>
          <View style={styles.chapterNavWrapper}>
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
                      isActive && styles.chapterPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chapterPillText,
                        isActive && styles.chapterPillTextActive,
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
            style={styles.chapterContent}
            contentContainerStyle={styles.chapterContentContainer}
          >
            <Text style={styles.chapterHeading}>
              {selectedBook.label} {selectedChapter.name}
            </Text>
            {selectedChapter.verses.map((verse) => (
              <View key={verse.name} style={styles.verseRow}>
                <Text style={styles.verseNumber}>{verse.name}</Text>
                <Text style={styles.verseText}>{verse.text}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Selecciona un libro desde el menu.
          </Text>
        </View>
      )}

      <BibleDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        sections={sections}
        onSelectBook={handleSelectBook}
        selectedBookId={selectedBook?.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8f9fb",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#d0d4db",
  },
  menuButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuBar: {
    width: 24,
    height: 2,
    backgroundColor: "#111",
    marginVertical: 2,
    borderRadius: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
  },
  content: {
    flex: 1,
  },
  chapterNavWrapper: {
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#d0d4db",
    paddingVertical: 12,
  },
  chapterNavContent: {
    paddingHorizontal: 16,
  },
  chapterPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: "#f1f3f8",
    borderRadius: 16,
    marginRight: 8,
  },
  chapterPillActive: {
    backgroundColor: "#2f3ec9",
  },
  chapterPillText: {
    fontSize: 14,
    color: "#1d2333",
  },
  chapterPillTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  chapterContent: {
    flex: 1,
    backgroundColor: "#f8f9fb",
  },
  chapterContentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  chapterHeading: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    color: "#111",
  },
  verseRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  verseNumber: {
    width: 28,
    fontWeight: "600",
    color: "#2f3ec9",
  },
  verseText: {
    flex: 1,
    fontSize: 15,
    color: "#1d2333",
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
    color: "#556",
    textAlign: "center",
  },
});

export default App;
