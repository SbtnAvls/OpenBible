import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import {
  ChevronLeft,
  CheckCircle2,
  Heart,
  BookOpen,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useStudyPlan } from '../context/StudyPlanContext';
import { useFavoritesVerses } from '../context/FavoritesVersesContext';
import type { ThemeColors, GetFontSize } from '../context/ThemeContext';

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

type StudyPlanReadingScreenProps = {
  planId: string;
  sectionId: string;
  bibleData: BibleData;
  onBack: () => void;
};

type FilteredVerse = {
  bookName: string;
  bookId: number;
  chapterName: string;
  chapterIndex: number;
  verseName: string;
  verseText: string;
  verseId: string;
};

export const StudyPlanReadingScreen: React.FC<StudyPlanReadingScreenProps> = ({
  planId,
  sectionId,
  bibleData,
  onBack,
}) => {
  const { colors, getFontSize } = useTheme();
  const { plans, completeSection } = useStudyPlan();
  const { addFavorite, getVerseFavorites } = useFavoritesVerses();
  const [selectedVerses, setSelectedVerses] = useState<string[]>([]);
  const styles = getStyles(colors, getFontSize);

  const plan = plans.find(p => p.id === planId);
  const section = plan?.sections.find(s => s.id === sectionId);

  const getBookByIndex = (bookId: number): BookData | null => {
    let currentIndex = 0;
    for (const testament of bibleData.testament) {
      for (const book of testament.books) {
        if (currentIndex === bookId) {
          return book;
        }
        currentIndex++;
      }
    }
    return null;
  };

  const filteredVerses = useMemo((): FilteredVerse[] => {
    if (!section) return [];

    const verses: FilteredVerse[] = [];

    section.readings.forEach(reading => {
      const book = getBookByIndex(reading.bookId);
      if (!book) return;

      if (reading.chapters) {
        reading.chapters.forEach(chapterNum => {
          const chapter = book.chapters[chapterNum - 1];
          if (!chapter) return;

          chapter.verses.forEach(verse => {
            verses.push({
              bookName: reading.book,
              bookId: reading.bookId,
              chapterName: chapter.name,
              chapterIndex: chapterNum - 1,
              verseName: verse.name,
              verseText: verse.text,
              verseId: `${reading.bookId}-${chapterNum - 1}-${verse.name}`,
            });
          });
        });
      } else if (reading.verseRanges) {
        reading.verseRanges.forEach(range => {
          const chapter = book.chapters[range.chapter - 1];
          if (!chapter) return;

          if (range.startVerse && range.endVerse) {
            for (let i = range.startVerse; i <= range.endVerse; i++) {
              const verse = chapter.verses[i - 1];
              if (verse) {
                verses.push({
                  bookName: reading.book,
                  bookId: reading.bookId,
                  chapterName: chapter.name,
                  chapterIndex: range.chapter - 1,
                  verseName: verse.name,
                  verseText: verse.text,
                  verseId: `${reading.bookId}-${range.chapter - 1}-${
                    verse.name
                  }`,
                });
              }
            }
          } else if (range.startVerse) {
            for (let i = range.startVerse; i <= chapter.verses.length; i++) {
              const verse = chapter.verses[i - 1];
              if (verse) {
                verses.push({
                  bookName: reading.book,
                  bookId: reading.bookId,
                  chapterName: chapter.name,
                  chapterIndex: range.chapter - 1,
                  verseName: verse.name,
                  verseText: verse.text,
                  verseId: `${reading.bookId}-${range.chapter - 1}-${
                    verse.name
                  }`,
                });
              }
            }
          } else {
            chapter.verses.forEach(verse => {
              verses.push({
                bookName: reading.book,
                bookId: reading.bookId,
                chapterName: chapter.name,
                chapterIndex: range.chapter - 1,
                verseName: verse.name,
                verseText: verse.text,
                verseId: `${reading.bookId}-${range.chapter - 1}-${verse.name}`,
              });
            });
          }
        });
      }
    });

    return verses;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section?.readings, bibleData]);

  const groupedVerses = useMemo(() => {
    const groups: {
      key: string;
      bookName: string;
      chapterName: string;
      verses: FilteredVerse[];
    }[] = [];

    const groupMap: { [key: string]: number } = {};

    filteredVerses.forEach(verse => {
      const key = `${verse.bookName}-${verse.chapterName}`;
      if (groupMap[key] === undefined) {
        groupMap[key] = groups.length;
        groups.push({
          key,
          bookName: verse.bookName,
          chapterName: verse.chapterName,
          verses: [],
        });
      }
      groups[groupMap[key]].verses.push(verse);
    });

    return groups;
  }, [filteredVerses]);

  if (!plan || !section) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Sección no encontrada</Text>
      </View>
    );
  }

  const handleVersePress = (verseId: string) => {
    setSelectedVerses(prev => {
      if (prev.includes(verseId)) {
        return prev.filter(id => id !== verseId);
      } else {
        return [...prev, verseId];
      }
    });
  };

  const handleAddToFavorites = () => {
    if (selectedVerses.length === 0) {
      Alert.alert('Atención', 'Selecciona al menos un versículo');
      return;
    }

    const versesToAdd = filteredVerses.filter(v =>
      selectedVerses.includes(v.verseId),
    );

    // Filter out verses that are already in favorites
    const newVersesToAdd = versesToAdd.filter(verse => {
      const existingFavorites = getVerseFavorites(
        `${verse.bookId}`,
        verse.chapterName,
        verse.verseName,
      );
      return existingFavorites.length === 0;
    });

    if (newVersesToAdd.length === 0) {
      setSelectedVerses([]);
      Alert.alert(
        'Información',
        versesToAdd.length === 1
          ? 'Este versículo ya está en tus favoritos'
          : 'Todos los versículos seleccionados ya están en tus favoritos',
      );
      return;
    }

    newVersesToAdd.forEach(verse => {
      addFavorite({
        id: `${verse.bookId}-${verse.chapterName}-${verse.verseName}`,
        bookId: `${verse.bookId}`,
        bookName: verse.bookName,
        chapterName: verse.chapterName,
        verseNumbers: [verse.verseName],
        verses: [{ verseNumber: verse.verseName, text: verse.verseText }],
        comment: '',
      });
    });

    const skippedCount = versesToAdd.length - newVersesToAdd.length;
    setSelectedVerses([]);

    let message = `${newVersesToAdd.length} versículo${
      newVersesToAdd.length > 1 ? 's' : ''
    } agregado${newVersesToAdd.length > 1 ? 's' : ''} a favoritos`;

    if (skippedCount > 0) {
      message += `\n(${skippedCount} ya estaba${
        skippedCount > 1 ? 'n' : ''
      } en favoritos)`;
    }

    Alert.alert('¡Listo!', message);
  };

  const handleCompleteSection = () => {
    Alert.alert('Completar sección', '¿Has terminado de leer esta sección?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Completar',
        onPress: async () => {
          try {
            // Completar la sección y esperar a que se guarde
            await completeSection(planId, sectionId);

            // Verificar si hay una siguiente sección
            const currentSectionIndex = plan.sections.findIndex(
              s => s.id === sectionId,
            );
            const hasNextSection =
              currentSectionIndex < plan.sections.length - 1;

            const message = hasNextSection
              ? 'Has completado esta sección del plan de estudio.\n\n¡La siguiente sección ya está disponible!'
              : '¡Has completado todo el plan de estudio!';

            // Mostrar mensaje de felicitaciones y luego volver
            Alert.alert('¡Felicitaciones!', message, [
              { text: 'Continuar', onPress: onBack },
            ]);
          } catch (error) {
            console.error('Error completing section:', error);
            Alert.alert(
              'Error',
              'No se pudo completar la sección. Intenta nuevamente.',
            );
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={onBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={28} color={colors.headerText} />
        </Pressable>

        <View style={styles.headerContent}>
          <Text style={styles.headerLabel}>{plan.title}</Text>
          <Text style={styles.headerTitle} numberOfLines={2}>
            {section.title}
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {groupedVerses.map(group => (
          <View key={group.key} style={styles.chapterSection}>
            {/* Chapter Header */}
            <View style={styles.chapterHeader}>
              <View style={styles.chapterIconContainer}>
                <BookOpen size={18} color={colors.accent} />
              </View>
              <Text style={styles.chapterTitle}>
                {group.bookName} {group.chapterName}
              </Text>
            </View>

            {/* Verses */}
            <View style={styles.versesContainer}>
              {group.verses.map(verse => {
                const isSelected = selectedVerses.includes(verse.verseId);
                const isFavorite =
                  getVerseFavorites(
                    `${verse.bookId}`,
                    verse.chapterName,
                    verse.verseName,
                  ).length > 0;

                return (
                  <Pressable
                    key={verse.verseId}
                    onPress={() => handleVersePress(verse.verseId)}
                    style={[
                      styles.verseContainer,
                      isSelected && styles.verseContainerSelected,
                    ]}
                  >
                    <View style={styles.verseHeader}>
                      <Text
                        style={[
                          styles.verseNumber,
                          isSelected && styles.verseNumberSelected,
                        ]}
                      >
                        {verse.verseName}
                      </Text>
                      {isFavorite && (
                        <Heart
                          size={14}
                          color={colors.accent}
                          fill={colors.accent}
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.verseText,
                        isSelected && styles.verseTextSelected,
                      ]}
                    >
                      {verse.verseText}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Actions */}
      {(selectedVerses.length > 0 || !section.isCompleted) && (
        <View style={styles.bottomBar}>
          {selectedVerses.length > 0 && (
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                styles.favoritesButton,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={handleAddToFavorites}
            >
              <Heart size={18} color={colors.accentText} />
              <Text style={styles.actionButtonText}>
                Favoritos ({selectedVerses.length})
              </Text>
            </Pressable>
          )}

          {!section.isCompleted && selectedVerses.length === 0 && (
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                styles.completeButton,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={handleCompleteSection}
            >
              <CheckCircle2 size={18} color={colors.accentText} />
              <Text style={styles.actionButtonText}>
                Marcar como completada
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
};

const getStyles = (colors: ThemeColors, getFontSize: GetFontSize) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
    },
    header: {
      backgroundColor: colors.backgroundSecondary,
      paddingTop: 60,
      paddingBottom: 16,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'flex-start',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    backButton: {
      marginRight: 8,
      marginTop: 2,
    },
    headerContent: {
      flex: 1,
      gap: 4,
    },
    headerLabel: {
      fontSize: getFontSize(12),
      color: colors.placeholderText,
      fontWeight: '500',
    },
    headerTitle: {
      fontSize: getFontSize(20),
      fontWeight: '700',
      color: colors.headerText,
      lineHeight: 26,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      paddingBottom: 120,
    },
    chapterSection: {
      marginBottom: 32,
    },
    chapterHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 16,
      paddingBottom: 12,
      borderBottomWidth: 2,
      borderBottomColor: colors.accent,
    },
    chapterIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.accentSubtle,
      justifyContent: 'center',
      alignItems: 'center',
    },
    chapterTitle: {
      fontSize: getFontSize(17),
      fontWeight: '700',
      color: colors.headerText,
    },
    versesContainer: {
      gap: 12,
    },
    verseContainer: {
      backgroundColor: colors.backgroundSecondary,
      padding: 14,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
    },
    verseContainerSelected: {
      backgroundColor: colors.accentSubtle,
      borderColor: colors.accent,
      borderWidth: 1.5,
    },
    verseHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    verseNumber: {
      fontSize: getFontSize(13),
      fontWeight: '700',
      color: colors.accent,
    },
    verseNumberSelected: {
      color: colors.accentText,
    },
    verseText: {
      fontSize: getFontSize(16),
      color: colors.bodyText,
      lineHeight: 24,
    },
    verseTextSelected: {
      color: colors.headerText,
      fontWeight: '500',
    },
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.backgroundSecondary,
      paddingHorizontal: 16,
      paddingVertical: 16,
      paddingBottom: 32,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
      gap: 10,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 10,
      gap: 8,
    },
    actionButtonPressed: {
      opacity: 0.7,
      transform: [{ scale: 0.98 }],
    },
    favoritesButton: {
      backgroundColor: colors.accent,
    },
    completeButton: {
      backgroundColor: colors.accent,
    },
    actionButtonText: {
      fontSize: getFontSize(15),
      fontWeight: '600',
      color: colors.accentText,
    },
    errorText: {
      fontSize: getFontSize(16),
      color: colors.bodyText,
      textAlign: 'center',
      marginTop: 40,
    },
  });
