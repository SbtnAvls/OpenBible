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

const DRAWER_WIDTH = 280;
const ANIMATION_DURATION = 220;

type ThemeColors = ReturnType<typeof useTheme>["colors"];

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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [renderDrawer, setRenderDrawer] = useState(visible);
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

  const content = useMemo(
    () =>
      sections.map((section) => (
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
    [handleSelect, sections, selectedBookId, styles]
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
        <ScrollView>{content}</ScrollView>
      </Animated.View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
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
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontWeight: "600",
      fontSize: 16,
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
      fontSize: 14,
      color: colors.bodyText,
    },
    bookNameActive: {
      fontWeight: "600",
      color: colors.accent,
    },
  });
