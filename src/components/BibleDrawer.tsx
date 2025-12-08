import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useTheme } from "../context/ThemeContext";
import type {
  ThemeColors,
  GetFontSize,
} from "../context/ThemeContext";

const DRAWER_WIDTH = 280;
const ANIMATION_DURATION = 220;

export type DrawerBook<T> = {
  id: string;
  label: string;
  data: T;
};

export type DrawerSection<T> = {
  title: string;
  books: DrawerBook<T>[];
};

type Props<T> = {
  visible: boolean;
  onClose: () => void;
  sections: DrawerSection<T>[];
  onSelectBook: (book: DrawerBook<T>) => void;
  selectedBookId?: string;
};

export function BibleDrawer<T>({
  visible,
  onClose,
  sections,
  onSelectBook,
  selectedBookId,
}: Props<T>) {
  const { colors, getFontSize } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, getFontSize),
    [colors, getFontSize]
  );
  const [renderDrawer, setRenderDrawer] = useState(visible);
  const [activeTab, setActiveTab] = useState<'old' | 'new'>('old');
  const drawerTranslate = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setRenderDrawer(true);
      Animated.parallel([
        Animated.timing(drawerTranslate, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0.4,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(drawerTranslate, {
        toValue: -DRAWER_WIDTH,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setRenderDrawer(false);
      }
    });
  }, [backdropOpacity, drawerTranslate, visible]);

  const handleSelect = useCallback(
    (book: DrawerBook<T>) => {
      onSelectBook(book);
      onClose();
    },
    [onClose, onSelectBook]
  );

  // Separar secciones por testamento
  const { oldTestamentSections, newTestamentSections } = useMemo(() => {
    return {
      oldTestamentSections: sections.filter(s =>
        s.title.toLowerCase().includes('antiguo')
      ),
      newTestamentSections: sections.filter(s =>
        s.title.toLowerCase().includes('nuevo')
      ),
    };
  }, [sections]);

  const activeSections = activeTab === 'old' ? oldTestamentSections : newTestamentSections;

  const content = useMemo(
    () =>
      activeSections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.books.map((book) => {
            const isActive = book.id === selectedBookId;
            return (
              <Pressable
                key={book.id}
                onPress={() => handleSelect(book)}
                style={[
                  styles.bookButton,
                  isActive && styles.bookButtonActive,
                ]}
              >
                <Text
                  style={[styles.bookName, isActive && styles.bookNameActive]}
                >
                  {book.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )),
    [handleSelect, activeSections, selectedBookId, styles]
  );

  if (!renderDrawer) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View
        pointerEvents={visible ? "auto" : "none"}
        style={[styles.backdrop, { opacity: backdropOpacity }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [{ translateX: drawerTranslate }],
          },
        ]}
      >
        <View style={styles.tabContainer}>
          <Pressable
            style={[
              styles.tab,
              activeTab === 'old' && styles.tabActive,
            ]}
            onPress={() => setActiveTab('old')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'old' && styles.tabTextActive,
              ]}
            >
              Antiguo Testamento
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.tab,
              activeTab === 'new' && styles.tabActive,
            ]}
            onPress={() => setActiveTab('new')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'new' && styles.tabTextActive,
              ]}
            >
              Nuevo Testamento
            </Text>
          </Pressable>
        </View>
        <ScrollView>{content}</ScrollView>
      </Animated.View>
    </View>
  );
}

const createStyles = (colors: ThemeColors, getFontSize: GetFontSize) =>
  StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "#000",
    },
    drawer: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: DRAWER_WIDTH,
      backgroundColor: colors.surfaceElevated,
      paddingVertical: 32,
      paddingHorizontal: 24,
      elevation: 6,
      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    },
    tabContainer: {
      flexDirection: "row",
      marginBottom: 20,
      backgroundColor: colors.surfaceMuted,
      borderRadius: 8,
      padding: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 6,
      alignItems: "center",
      justifyContent: "center",
    },
    tabActive: {
      backgroundColor: colors.accent,
    },
    tabText: {
      fontSize: getFontSize(13),
      color: colors.bodyText,
      fontWeight: "500",
      textAlign: "center",
    },
    tabTextActive: {
      color: "#FFF",
      fontWeight: "600",
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontWeight: "600",
      fontSize: getFontSize(16),
      marginBottom: 12,
      color: colors.headerText,
    },
    bookButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      marginBottom: 4,
    },
    bookButtonActive: {
      backgroundColor: colors.accentSubtle,
    },
    bookName: {
      fontSize: getFontSize(14),
      color: colors.bodyText,
    },
    bookNameActive: {
      fontWeight: "600",
      color: colors.accent,
    },
  });
