import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useFavoritesVerses } from '../context/FavoritesVersesContext';
import { useTheme } from '../context/ThemeContext';
import type { GetFontSize, ThemeColors } from '../context/ThemeContext';
import { formatVerseNumbersRange } from '../utils/verseRange';

type FavoritesScreenProps = {
  onNavigateToVerse: (bookId: string, chapterName: string) => void;
};

export function FavoritesScreen({ onNavigateToVerse }: FavoritesScreenProps) {
  const { favorites, removeFavorite, clearFavorites } = useFavoritesVerses();
  const { colors, getFontSize } = useTheme();

  const styles = useMemo(
    () => createStyles(colors, getFontSize),
    [colors, getFontSize],
  );

  if (!favorites.length) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Aun no guardas citas.</Text>
        <Text style={styles.emptySubtitle}>
          Mantente presionando un versiculo para seleccionarlo y luego guardalo
          desde el menu inferior.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Tus citas guardas</Text>
        <Pressable
          accessibilityLabel="Eliminar todas las citas guardas"
          onPress={clearFavorites}
          style={styles.clearButton}
        >
          <Text style={styles.clearButtonText}>Borrar todo</Text>
        </Pressable>
      </View>
      {favorites.map(item => (
        <Pressable
          key={item.id}
          onPress={() => onNavigateToVerse(item.bookId, item.chapterName)}
          style={styles.card}
          accessibilityLabel={`Ir a ${item.bookName} capitulo ${item.chapterName}`}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardReference}>
                {item.bookName} capitulo {item.chapterName}
              </Text>
              <Text style={styles.cardSubtitle}>
                Versos {formatVerseNumbersRange(item.verseNumbers)}
              </Text>
              {item.comment ? (
                <Text style={styles.cardComment}>{item.comment}</Text>
              ) : null}
            </View>
            <Pressable
              accessibilityLabel={`Eliminar cita ${item.bookName} ${item.chapterName}`}
              onPress={e => {
                e.stopPropagation();
                removeFavorite(item.id);
              }}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteButtonText}>Quitar</Text>
            </Pressable>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.versesGroup}>
            {item.verses.map(verse => (
              <View
                key={`${item.id}-${verse.verseNumber}`}
                style={styles.verseRow}
              >
                <Text style={styles.verseNumber}>{verse.verseNumber}</Text>
                <Text style={styles.verseText}>{verse.text}</Text>
              </View>
            ))}
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors, getFontSize: GetFontSize) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
    },
    content: {
      paddingHorizontal: 20,
      paddingVertical: 24,
      gap: 16,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitle: {
      fontSize: getFontSize(18),
      color: colors.headerText,
      fontWeight: '600',
    },
    clearButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
      backgroundColor: colors.surfaceMuted,
    },
    clearButtonText: {
      fontSize: getFontSize(13),
      color: colors.placeholderText,
      fontWeight: '600',
    },
    card: {
      borderRadius: 14,
      padding: 16,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
      gap: 12,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
    },
    cardHeaderText: {
      flex: 1,
      gap: 4,
    },
    cardReference: {
      fontSize: getFontSize(15),
      color: colors.headerText,
      fontWeight: '600',
    },
    cardSubtitle: {
      fontSize: getFontSize(13),
      color: colors.placeholderText,
      fontWeight: '500',
    },
    cardComment: {
      fontSize: getFontSize(13),
      color: colors.bodyText,
      fontStyle: 'italic',
    },
    deleteButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 14,
      backgroundColor: colors.accentSubtle,
      alignSelf: 'flex-start',
    },
    deleteButtonText: {
      fontSize: getFontSize(13),
      color: colors.accent,
      fontWeight: '600',
    },
    cardDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.divider,
    },
    versesGroup: {
      gap: 8,
    },
    verseRow: {
      flexDirection: 'row',
      gap: 8,
    },
    verseNumber: {
      fontSize: getFontSize(13),
      color: colors.verseNumber,
      fontWeight: '600',
      width: 32,
    },
    verseText: {
      flex: 1,
      fontSize: getFontSize(14),
      color: colors.bodyText,
      lineHeight: Math.round(getFontSize(14) * 1.42),
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.backgroundPrimary,
      paddingHorizontal: 32,
      gap: 12,
    },
    emptyTitle: {
      fontSize: getFontSize(18),
      fontWeight: '600',
      color: colors.headerText,
    },
    emptySubtitle: {
      fontSize: getFontSize(14),
      color: colors.placeholderText,
      textAlign: 'center',
      lineHeight: Math.round(getFontSize(14) * 1.4),
    },
  });
