import React, {
  useState,
  useMemo,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Share,
  Animated,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Easing,
} from 'react-native';
import {
  CheckCircle2,
  Circle,
  Heart,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  Share2,
  X,
  FileText,
  Image,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RNShare from 'react-native-share';
import ViewShot from 'react-native-view-shot';
import { useTheme } from '../context/ThemeContext';
import { useYearlyPlan } from '../context/YearlyPlanContext';
import { useFavoritesVerses } from '../context/FavoritesVersesContext';
import type { ThemeColors, GetFontSize } from '../context/ThemeContext';
import type { YearlyReading } from '../types/yearlyPlan';

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

type YearlyPlanReadingScreenProps = {
  planId: string;
  day: number;
  bibleData: BibleData;
  onBack: () => void;
  onNavigateToDay: (day: number) => void;
};

type SearchResult = {
  verse: FilteredVerse;
  groupKey: string;
  verseIndex: number;
};

type PendingFavoriteGroup = {
  bookId: string;
  bookName: string;
  chapterName: string;
  verses: { verseNumber: string; text: string }[];
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

const COLLAPSED_HEIGHT = 0;
const EXPANDED_HEIGHT = 400;

export const YearlyPlanReadingScreen: React.FC<
  YearlyPlanReadingScreenProps
> = ({ planId, day, bibleData, onBack, onNavigateToDay }) => {
  const insets = useSafeAreaInsets();
  const { colors, getFontSize } = useTheme();
  const {
    getPlanById,
    isDayCompleted,
    toggleDayComplete,
    getTodaysDayNumber,
    activePlan,
  } = useYearlyPlan();
  const { addFavorite, getVerseFavorites } = useFavoritesVerses();
  const [selectedVerses, setSelectedVerses] = useState<string[]>([]);
  const [shareDialogVisible, setShareDialogVisible] = useState(false);
  const [isCapturingImage, setIsCapturingImage] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [pendingFavorites, setPendingFavorites] = useState<
    PendingFavoriteGroup[]
  >([]);
  const [commentInput, setCommentInput] = useState('');
  const viewShotRef = useRef<ViewShot>(null);
  const selectedVersesViewShotRef = useRef<ViewShot>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Límite de versículos para compartir como imagen
  const MAX_VERSES_FOR_IMAGE = 3;
  const canShareAsImage = selectedVerses.length <= MAX_VERSES_FOR_IMAGE;

  // Search drawer states
  const [isSearchDrawerExpanded, setIsSearchDrawerExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchDrawerHeight = useRef(
    new Animated.Value(COLLAPSED_HEIGHT),
  ).current;

  // Animaciones de entrada
  const headerAnim = useRef(new Animated.Value(0)).current;
  const readingTitleAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const selectionBarAnim = useRef(new Animated.Value(0)).current;

  const styles = useMemo(
    () => getStyles(colors, getFontSize),
    [colors, getFontSize],
  );

  const plan = getPlanById(planId);
  const reading = plan?.readings.find(r => r.day === day);
  const isCompleted = isDayCompleted(day);
  const currentDay = getTodaysDayNumber();
  const isActivePlan = activePlan?.id === planId;
  const isSelecting = selectedVerses.length > 0;

  // Animación de entrada secuencial
  useEffect(() => {
    // Reset animations
    headerAnim.setValue(0);
    readingTitleAnim.setValue(0);
    contentAnim.setValue(0);

    Animated.sequence([
      // Header aparece primero con slide
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Título de lectura aparece
      Animated.spring(readingTitleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      // Contenido aparece
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [day, headerAnim, readingTitleAnim, contentAnim]);

  // Animación de la barra de selección
  useEffect(() => {
    Animated.spring(selectionBarAnim, {
      toValue: isSelecting ? 1 : 0,
      tension: 60,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [isSelecting, selectionBarAnim]);

  // Calcular la fecha de este día
  const dayDate = useMemo(() => {
    const today = new Date();
    const diff = day - currentDay;
    const date = new Date(today);
    date.setDate(today.getDate() + diff);
    return date;
  }, [day, currentDay]);

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
    if (!reading) return [];

    const verses: FilteredVerse[] = [];

    reading.readings.forEach((readingItem: YearlyReading) => {
      const book = getBookByIndex(readingItem.bookId);
      if (!book) return;

      if (readingItem.chapters) {
        readingItem.chapters.forEach(chapterNum => {
          const chapter = book.chapters[chapterNum - 1];
          if (!chapter) return;

          chapter.verses.forEach(verse => {
            verses.push({
              bookName: readingItem.book,
              bookId: readingItem.bookId,
              chapterName: chapter.name,
              chapterIndex: chapterNum - 1,
              verseName: verse.name,
              verseText: verse.text,
              verseId: `${readingItem.bookId}-${chapterNum - 1}-${verse.name}`,
            });
          });
        });
      } else if (readingItem.verseRanges) {
        readingItem.verseRanges.forEach(range => {
          const chapter = book.chapters[range.chapter - 1];
          if (!chapter) return;

          if (range.startVerse && range.endVerse) {
            for (let i = range.startVerse; i <= range.endVerse; i++) {
              const verse = chapter.verses[i - 1];
              if (verse) {
                verses.push({
                  bookName: readingItem.book,
                  bookId: readingItem.bookId,
                  chapterName: chapter.name,
                  chapterIndex: range.chapter - 1,
                  verseName: verse.name,
                  verseText: verse.text,
                  verseId: `${readingItem.bookId}-${range.chapter - 1}-${
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
                  bookName: readingItem.book,
                  bookId: readingItem.bookId,
                  chapterName: chapter.name,
                  chapterIndex: range.chapter - 1,
                  verseName: verse.name,
                  verseText: verse.text,
                  verseId: `${readingItem.bookId}-${range.chapter - 1}-${
                    verse.name
                  }`,
                });
              }
            }
          } else {
            chapter.verses.forEach(verse => {
              verses.push({
                bookName: readingItem.book,
                bookId: readingItem.bookId,
                chapterName: chapter.name,
                chapterIndex: range.chapter - 1,
                verseName: verse.name,
                verseText: verse.text,
                verseId: `${readingItem.bookId}-${range.chapter - 1}-${
                  verse.name
                }`,
              });
            });
          }
        });
      }
    });

    return verses;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reading?.readings, bibleData]);

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

  // Formatear la lectura para mostrar en el header
  const readingTitle = useMemo(() => {
    if (!reading) return '';
    return reading.readings
      .map(r => {
        if (r.chapters && r.chapters.length > 0) {
          if (r.chapters.length === 1) {
            return `${r.book} ${r.chapters[0]}`;
          }
          const first = r.chapters[0];
          const last = r.chapters[r.chapters.length - 1];
          if (last - first + 1 === r.chapters.length) {
            return `${r.book} ${first}-${last}`;
          }
          return `${r.book} ${r.chapters.join(', ')}`;
        }
        return r.book;
      })
      .join(' · ');
  }, [reading]);

  // Normalizar texto para búsqueda
  const normalizeText = useCallback((text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }, []);

  // Buscar en los versículos del día
  const searchResults = useMemo((): SearchResult[] => {
    if (!searchQuery.trim() || searchQuery.trim().length < 3) {
      return [];
    }

    const normalizedQuery = normalizeText(searchQuery.trim());
    const results: SearchResult[] = [];

    groupedVerses.forEach(group => {
      group.verses.forEach((verse, verseIndex) => {
        const normalizedVerse = normalizeText(verse.verseText);
        if (normalizedVerse.includes(normalizedQuery)) {
          results.push({
            verse,
            groupKey: group.key,
            verseIndex,
          });
        }
      });
    });

    return results;
  }, [searchQuery, groupedVerses, normalizeText]);

  // Toggle del drawer de búsqueda
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
      setSearchQuery('');
    }
  }, [isSearchDrawerExpanded, searchDrawerHeight]);

  // Resaltar texto
  const highlightText = useCallback(
    (text: string, query: string) => {
      if (!query.trim()) {
        return { beforeMatch: text, match: '', afterMatch: '' };
      }

      const normalizedText = normalizeText(text);
      const normalizedQuery = normalizeText(query);
      const index = normalizedText.indexOf(normalizedQuery);

      if (index === -1) {
        return { beforeMatch: text, match: '', afterMatch: '' };
      }

      const beforeMatch = text.substring(0, index);
      const match = text.substring(index, index + query.length);
      const afterMatch = text.substring(index + query.length);

      return { beforeMatch, match, afterMatch };
    },
    [normalizeText],
  );

  // Navegar al versículo seleccionado
  const handleSearchResultSelect = useCallback(
    (result: SearchResult) => {
      toggleSearchDrawer();
      // Calcular posición aproximada y hacer scroll
      const groupIndex = groupedVerses.findIndex(
        g => g.key === result.groupKey,
      );
      if (groupIndex !== -1 && scrollViewRef.current) {
        // Estimación: cada grupo tiene header (~60px) + versículos (~80px cada uno)
        const HEADER_HEIGHT = 60;
        const VERSE_HEIGHT = 100;
        const GROUP_MARGIN = 32;

        let targetY = 0;
        for (let i = 0; i < groupIndex; i++) {
          targetY +=
            HEADER_HEIGHT +
            groupedVerses[i].verses.length * VERSE_HEIGHT +
            GROUP_MARGIN;
        }
        targetY += HEADER_HEIGHT + result.verseIndex * VERSE_HEIGHT;

        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, targetY - 50),
            animated: true,
          });
        }, 350);
      }
    },
    [groupedVerses, toggleSearchDrawer],
  );

  // Obtener versículos seleccionados
  const getSelectedVersesData = () => {
    return filteredVerses.filter(v => selectedVerses.includes(v.verseId));
  };

  // Formatear texto para compartir
  const formatShareText = () => {
    const versesData = getSelectedVersesData();
    if (versesData.length === 0) return '';

    // Agrupar por libro y capítulo
    const grouped: { [key: string]: FilteredVerse[] } = {};
    versesData.forEach(v => {
      const key = `${v.bookName} ${v.chapterName}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(v);
    });

    let text = '';
    Object.entries(grouped).forEach(([reference, verses]) => {
      const verseNumbers = verses.map(v => v.verseName);
      const verseRange =
        verseNumbers.length > 1
          ? `${verseNumbers[0]}-${verseNumbers[verseNumbers.length - 1]}`
          : verseNumbers[0];

      text += `${reference}:${verseRange}\n`;
      verses.forEach(v => {
        text += `${v.verseName}. ${v.verseText}\n`;
      });
      text += '\n';
    });

    return text.trim();
  };

  if (!plan || !reading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={onBack}>
            <ChevronLeft size={28} color={colors.headerText} />
          </Pressable>
          <Text style={styles.errorText}>Lectura no encontrada</Text>
        </View>
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

  const handleVerseLongPress = (verseId: string) => {
    if (!selectedVerses.includes(verseId)) {
      setSelectedVerses([verseId]);
    }
  };

  const handleClearSelection = () => {
    setSelectedVerses([]);
  };

  // Formatear rango de versículos (ej: "1, 2, 3" -> "1-3")
  const formatVerseRange = (verseNumbers: string[]): string => {
    if (verseNumbers.length === 0) return '';
    if (verseNumbers.length === 1) return verseNumbers[0];

    const nums = verseNumbers.map(v => parseInt(v, 10)).sort((a, b) => a - b);
    const ranges: string[] = [];
    let start = nums[0];
    let end = nums[0];

    for (let i = 1; i < nums.length; i++) {
      if (nums[i] === end + 1) {
        end = nums[i];
      } else {
        ranges.push(start === end ? `${start}` : `${start}-${end}`);
        start = nums[i];
        end = nums[i];
      }
    }
    ranges.push(start === end ? `${start}` : `${start}-${end}`);

    return ranges.join(', ');
  };

  const handleSaveToFavorites = () => {
    if (selectedVerses.length === 0) return;

    const versesToAdd = getSelectedVersesData();

    // Agrupar versículos por libro y capítulo
    const groupedByChapter: {
      [key: string]: PendingFavoriteGroup;
    } = {};

    versesToAdd.forEach(verse => {
      const key = `${verse.bookId}-${verse.chapterName}`;
      if (!groupedByChapter[key]) {
        groupedByChapter[key] = {
          bookId: `${verse.bookId}`,
          bookName: verse.bookName,
          chapterName: verse.chapterName,
          verses: [],
        };
      }
      // Solo agregar si no está ya en favoritos
      const existingFavorites = getVerseFavorites(
        `${verse.bookId}`,
        verse.chapterName,
        verse.verseName,
      );
      if (existingFavorites.length === 0) {
        groupedByChapter[key].verses.push({
          verseNumber: verse.verseName,
          text: verse.verseText,
        });
      }
    });

    const groups = Object.values(groupedByChapter).filter(
      g => g.verses.length > 0,
    );
    const totalNewVerses = groups.reduce((sum, g) => sum + g.verses.length, 0);

    if (totalNewVerses === 0) {
      setSelectedVerses([]);
      Alert.alert(
        'Información',
        versesToAdd.length === 1
          ? 'Este versículo ya está en tus favoritos'
          : 'Todos los versículos seleccionados ya están en tus favoritos',
      );
      return;
    }

    // Mostrar modal para agregar comentario
    setPendingFavorites(groups);
    setCommentInput('');
    setSaveModalVisible(true);
  };

  const handleConfirmSave = () => {
    if (pendingFavorites.length === 0) return;

    const comment = commentInput.trim();

    pendingFavorites.forEach(group => {
      const verseNumbers = group.verses.map(v => v.verseNumber);
      addFavorite({
        id: `${group.bookId}-${group.chapterName}-${verseNumbers.join(
          '_',
        )}-${Date.now()}`,
        bookId: group.bookId,
        bookName: group.bookName,
        chapterName: group.chapterName,
        verseNumbers,
        verses: group.verses,
        comment,
      });
    });

    const totalVerses = pendingFavorites.reduce(
      (sum, g) => sum + g.verses.length,
      0,
    );

    setSaveModalVisible(false);
    setPendingFavorites([]);
    setCommentInput('');
    setSelectedVerses([]);

    Alert.alert(
      '¡Listo!',
      `${totalVerses} versículo${totalVerses > 1 ? 's' : ''} agregado${
        totalVerses > 1 ? 's' : ''
      } a favoritos`,
    );
  };

  const handleCloseSaveModal = () => {
    setSaveModalVisible(false);
    setPendingFavorites([]);
    setCommentInput('');
  };

  const handleShare = () => {
    setShareDialogVisible(true);
  };

  const handleShareAsText = async () => {
    setShareDialogVisible(false);
    const text = formatShareText();
    try {
      await Share.share({ message: text });
    } catch (error) {
      console.error('Error sharing:', error);
    }
    setSelectedVerses([]);
  };

  const handleShareAsImage = async () => {
    try {
      if (selectedVerses.length === 0) {
        Alert.alert('Error', 'No hay versículos seleccionados');
        return;
      }

      setShareDialogVisible(false);
      // Activar modo de captura temporalmente
      setIsCapturingImage(true);

      // Esperar un momento para que se renderice la vista
      setTimeout(async () => {
        try {
          if (!selectedVersesViewShotRef.current) {
            throw new Error('ViewShot reference not available');
          }

          // Capturar la vista como imagen
          const uri = await selectedVersesViewShotRef.current.capture?.();

          if (!uri) {
            throw new Error('Failed to capture image');
          }

          await RNShare.open({
            url: `file://${uri}`,
            title: 'Compartir versículos',
          });

          setSelectedVerses([]);
        } catch (captureError: any) {
          console.error('Error capturing image:', captureError);
          if (captureError?.message !== 'User did not share') {
            Alert.alert(
              'Error',
              'No se pudo capturar la imagen. Intenta compartir como texto.',
            );
          }
        } finally {
          setIsCapturingImage(false);
        }
      }, 300);
    } catch (error: any) {
      console.error('Error in handleShareAsImage:', error);
      if (error?.message !== 'User did not share') {
        Alert.alert('Error', 'No se pudo compartir la imagen');
      }
      setIsCapturingImage(false);
    }
  };

  const handleToggleComplete = async () => {
    if (!isActivePlan) {
      Alert.alert(
        'Plan no activo',
        'Debes activar este plan para marcar días como completados.',
      );
      return;
    }

    await toggleDayComplete(day);
  };

  const handlePreviousDay = () => {
    if (day > 1) {
      setSelectedVerses([]);
      onNavigateToDay(day - 1);
    }
  };

  const handleNextDay = () => {
    if (day < 365) {
      setSelectedVerses([]);
      onNavigateToDay(day + 1);
    }
  };

  return (
    <View style={styles.container}>
      {/* Day Navigation Header */}
      <Animated.View
        style={[
          styles.dayNavigation,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Pressable
          style={[styles.navButton, day <= 1 && styles.navButtonDisabled]}
          onPress={handlePreviousDay}
          disabled={day <= 1}
        >
          <ChevronLeft
            size={20}
            color={day <= 1 ? colors.placeholderText : colors.headerText}
          />
        </Pressable>

        <View style={styles.dayInfo}>
          <View style={styles.dayBadge}>
            <Calendar size={14} color={plan.color} />
            <Text style={[styles.dayNumber, { color: plan.color }]}>
              Día {day}
            </Text>
          </View>
          <Text style={styles.dayDate}>
            {dayDate.toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </Text>
        </View>

        <Pressable
          style={[styles.navButton, day >= 365 && styles.navButtonDisabled]}
          onPress={handleNextDay}
          disabled={day >= 365}
        >
          <ChevronRight
            size={20}
            color={day >= 365 ? colors.placeholderText : colors.headerText}
          />
        </Pressable>
      </Animated.View>

      {/* Reading Title with Complete Toggle */}
      <Animated.View
        style={[
          styles.readingHeader,
          {
            opacity: readingTitleAnim,
            transform: [
              {
                translateX: readingTitleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-30, 0],
                }),
              },
              {
                scale: readingTitleAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.95, 1.02, 1],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.readingTitleRow}>
          <Text style={styles.readingTitle} numberOfLines={2}>
            {readingTitle}
          </Text>
          {isActivePlan && (
            <Pressable
              style={[
                styles.completeToggle,
                isCompleted && styles.completeToggleActive,
              ]}
              onPress={handleToggleComplete}
            >
              {isCompleted ? (
                <CheckCircle2 size={22} color="#10B981" />
              ) : (
                <Circle size={22} color={colors.placeholderText} />
              )}
            </Pressable>
          )}
        </View>
      </Animated.View>

      {/* Content */}
      <Animated.View
        style={[
          { flex: 1 },
          {
            opacity: contentAnim,
            transform: [
              {
                translateY: contentAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
            {groupedVerses.map(group => (
              <View key={group.key} style={styles.chapterSection}>
                {/* Chapter Header */}
                <View
                  style={[
                    styles.chapterHeader,
                    { borderBottomColor: plan.color },
                  ]}
                >
                  <View
                    style={[
                      styles.chapterIconContainer,
                      { backgroundColor: plan.color + '20' },
                    ]}
                  >
                    <BookOpen size={18} color={plan.color} />
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
                        onLongPress={() => handleVerseLongPress(verse.verseId)}
                        delayLongPress={180}
                        style={[
                          styles.verseContainer,
                          isSelected && styles.verseContainerSelected,
                          !isSelected &&
                            isFavorite &&
                            styles.verseContainerFavorite,
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
                          {!isSelected && isFavorite && (
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
          </ViewShot>
        </ScrollView>
      </Animated.View>

      {/* Selection Bar (cuando hay versículos seleccionados) */}
      {isSelecting && (
        <Animated.View
          style={[
            styles.selectionBar,
            {
              transform: [
                {
                  translateY: selectionBarAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0],
                  }),
                },
              ],
              opacity: selectionBarAnim,
            },
          ]}
        >
          <Pressable
            onPress={handleClearSelection}
            style={styles.selectionCountContainer}
          >
            <X size={16} color={colors.bodyText} />
            <Text style={styles.selectionCount}>
              {selectedVerses.length} seleccionado
              {selectedVerses.length > 1 ? 's' : ''}
            </Text>
          </Pressable>
          <View style={styles.selectionActions}>
            <Pressable style={styles.selectionAction} onPress={handleShare}>
              <Share2 size={18} color={colors.accent} />
              <Text style={styles.selectionActionText}>Compartir</Text>
            </Pressable>
            <Pressable
              style={styles.selectionAction}
              onPress={handleSaveToFavorites}
            >
              <Heart size={18} color={colors.accent} />
              <Text style={styles.selectionActionText}>Guardar</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* Search Tab and Drawer */}
      {!isSelecting && (
        <>
          {/* Floating Search Tab */}
          {!isSearchDrawerExpanded && (
            <Pressable
              style={[
                styles.searchTab,
                {
                  bottom: insets.bottom + 20,
                  backgroundColor: colors.accent,
                  shadowColor: colors.accent,
                },
              ]}
              onPress={toggleSearchDrawer}
            >
              <Search size={18} color="#FFFFFF" />
              <Text style={styles.searchTabText}>Buscar</Text>
            </Pressable>
          )}

          {/* Backdrop */}
          {isSearchDrawerExpanded && (
            <Pressable
              style={styles.searchBackdrop}
              onPress={toggleSearchDrawer}
            />
          )}

          {/* Search Drawer */}
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
            pointerEvents={isSearchDrawerExpanded ? 'auto' : 'none'}
          >
            {/* Handle */}
            <Pressable onPress={toggleSearchDrawer} style={styles.drawerHandle}>
              <View
                style={[styles.handleBar, { backgroundColor: colors.divider }]}
              />
            </Pressable>

            {/* Search Content */}
            {isSearchDrawerExpanded && (
              <View style={styles.searchContent}>
                {/* Search Input */}
                <View style={styles.searchInputContainer}>
                  <View
                    style={[
                      styles.searchInputWrapper,
                      {
                        backgroundColor: colors.surfaceMuted,
                        borderColor: colors.divider,
                      },
                    ]}
                  >
                    <Search size={18} color={colors.placeholderText} />
                    <TextInput
                      style={[styles.searchInput, { color: colors.bodyText }]}
                      placeholder="Buscar en la lectura del día..."
                      placeholderTextColor={colors.placeholderText}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoFocus={true}
                    />
                    {searchQuery.length > 0 && (
                      <Pressable
                        onPress={() => setSearchQuery('')}
                        style={styles.clearButton}
                      >
                        <X size={18} color={colors.placeholderText} />
                      </Pressable>
                    )}
                  </View>
                  {searchQuery.length > 0 && searchQuery.length < 3 && (
                    <Text style={styles.searchHint}>
                      Escribe al menos 3 caracteres
                    </Text>
                  )}
                  {searchQuery.length >= 3 && (
                    <Text
                      style={[styles.searchCount, { color: colors.accent }]}
                    >
                      {searchResults.length} resultado
                      {searchResults.length !== 1 ? 's' : ''}
                    </Text>
                  )}
                </View>

                {/* Results */}
                {searchQuery.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>🔍</Text>
                    <Text style={styles.emptyTitle}>
                      Buscar en esta lectura
                    </Text>
                    <Text style={styles.emptyText}>
                      Busca palabras o frases en los versículos del día.
                    </Text>
                  </View>
                ) : searchQuery.length < 3 ? (
                  <View style={styles.emptyState} />
                ) : searchResults.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>📭</Text>
                    <Text style={styles.emptyTitle}>Sin resultados</Text>
                    <Text style={styles.emptyText}>
                      No hay coincidencias para "{searchQuery}"
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={searchResults}
                    keyExtractor={(item, index) =>
                      `${item.verse.verseId}-${index}`
                    }
                    renderItem={({ item }) => {
                      const highlighted = highlightText(
                        item.verse.verseText,
                        searchQuery,
                      );
                      return (
                        <Pressable
                          onPress={() => handleSearchResultSelect(item)}
                          style={({ pressed }) => [
                            styles.resultCard,
                            {
                              backgroundColor: colors.surfaceMuted,
                              borderColor: colors.divider,
                            },
                            pressed && { opacity: 0.7 },
                          ]}
                        >
                          <Text
                            style={[
                              styles.resultReference,
                              { color: colors.accent },
                            ]}
                          >
                            {item.verse.bookName} {item.verse.chapterName}:
                            {item.verse.verseName}
                          </Text>
                          <Text style={styles.resultText} numberOfLines={2}>
                            {highlighted.beforeMatch}
                            <Text
                              style={[
                                styles.highlightedText,
                                {
                                  color: colors.accent,
                                  backgroundColor: colors.accentSubtle,
                                },
                              ]}
                            >
                              {highlighted.match}
                            </Text>
                            {highlighted.afterMatch}
                          </Text>
                        </Pressable>
                      );
                    }}
                    contentContainerStyle={styles.resultsContent}
                    keyboardShouldPersistTaps="handled"
                  />
                )}
              </View>
            )}
          </Animated.View>
        </>
      )}

      {/* Share Dialog */}
      {shareDialogVisible && (
        <View style={styles.dialogOverlay}>
          <Pressable
            style={styles.dialogBackdrop}
            onPress={() => setShareDialogVisible(false)}
          />
          <View
            style={[
              styles.dialogContent,
              { backgroundColor: colors.backgroundSecondary },
            ]}
          >
            <Text style={styles.dialogTitle}>Compartir versículos</Text>
            <Text style={styles.dialogSubtitle}>
              ¿Cómo deseas compartir los versículos?
            </Text>

            <Pressable
              style={[
                styles.shareOptionButton,
                { backgroundColor: colors.surfaceMuted },
              ]}
              onPress={handleShareAsText}
            >
              <FileText size={32} color={colors.bodyText} />
              <View style={styles.shareOptionContent}>
                <Text style={styles.shareOptionTitle}>
                  Compartir como texto
                </Text>
                <Text style={styles.shareOptionDescription}>
                  Comparte los versículos en formato de texto plano
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={[
                styles.shareOptionButton,
                { backgroundColor: colors.surfaceMuted },
                !canShareAsImage && styles.shareOptionButtonDisabled,
              ]}
              onPress={canShareAsImage ? handleShareAsImage : undefined}
              disabled={!canShareAsImage}
            >
              <Image
                size={32}
                color={colors.bodyText}
                style={{ opacity: canShareAsImage ? 1 : 0.4 }}
              />
              <View style={styles.shareOptionContent}>
                <Text
                  style={[
                    styles.shareOptionTitle,
                    !canShareAsImage && { opacity: 0.5 },
                  ]}
                >
                  Compartir como imagen
                </Text>
                <Text
                  style={[
                    styles.shareOptionDescription,
                    !canShareAsImage && { opacity: 0.5 },
                  ]}
                >
                  {canShareAsImage
                    ? 'Comparte los versículos como una imagen'
                    : `Solo disponible para ${MAX_VERSES_FOR_IMAGE} versículos o menos. Tienes ${selectedVerses.length} seleccionados.`}
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={[styles.dialogOption, styles.dialogCancel]}
              onPress={() => setShareDialogVisible(false)}
            >
              <Text style={[styles.dialogOptionText, { color: colors.accent }]}>
                Cancelar
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ViewShot oculto para capturar solo los versículos seleccionados */}
      {isCapturingImage && selectedVerses.length > 0 && (
        <View style={styles.hiddenViewShot}>
          <ViewShot
            ref={selectedVersesViewShotRef}
            options={{ format: 'jpg', quality: 0.9, result: 'tmpfile' }}
            style={[
              styles.viewShotContainer,
              { backgroundColor: colors.backgroundPrimary },
            ]}
          >
            <View style={styles.shareableContent}>
              <Text style={styles.shareableTitle}>{readingTitle}</Text>
              {getSelectedVersesData().map(verse => (
                <View key={verse.verseId} style={styles.shareableVerse}>
                  <Text style={styles.shareableVerseNumber}>
                    {verse.verseName}
                  </Text>
                  <Text style={styles.shareableVerseText}>
                    {verse.verseText}
                  </Text>
                </View>
              ))}
              <View style={styles.shareableFooter}>
                <BookOpen size={14} color={colors.placeholderText} />
                <Text style={styles.shareableFooterText}>
                  Biblia Reina-Valera 1909
                </Text>
              </View>
            </View>
          </ViewShot>
        </View>
      )}

      {/* Save Modal */}
      {saveModalVisible && pendingFavorites.length > 0 && (
        <View style={styles.modalWrapper}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={handleCloseSaveModal}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContainer}
          >
            <View
              style={[
                styles.modalCard,
                { backgroundColor: colors.backgroundSecondary },
              ]}
            >
              <Text style={styles.modalTitle}>Guardar cita</Text>

              {/* Mostrar los grupos de versículos */}
              {pendingFavorites.map((group, index) => (
                <View
                  key={`${group.bookId}-${group.chapterName}-${index}`}
                  style={styles.modalVerseGroup}
                >
                  <Text style={styles.modalSubtitle}>
                    {group.bookName} {group.chapterName}
                  </Text>
                  <Text style={styles.modalVerseRange}>
                    Versículos{' '}
                    {formatVerseRange(group.verses.map(v => v.verseNumber))}
                  </Text>
                </View>
              ))}

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
                  onPress={handleCloseSaveModal}
                  style={styles.modalButtonSecondary}
                >
                  <Text style={styles.modalButtonSecondaryText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  onPress={handleConfirmSave}
                  style={styles.modalButtonPrimary}
                >
                  <Text style={styles.modalButtonPrimaryText}>Guardar</Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
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
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    backButton: {
      padding: 4,
    },
    errorText: {
      fontSize: getFontSize(16),
      color: colors.placeholderText,
      marginLeft: 12,
    },
    // Day Navigation
    dayNavigation: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.backgroundSecondary,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    navButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surfaceMuted,
      justifyContent: 'center',
      alignItems: 'center',
    },
    navButtonDisabled: {
      opacity: 0.5,
    },
    dayInfo: {
      alignItems: 'center',
      gap: 4,
    },
    dayBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    dayNumber: {
      fontSize: getFontSize(16),
      fontWeight: '700',
    },
    dayDate: {
      fontSize: getFontSize(12),
      color: colors.placeholderText,
      textTransform: 'capitalize',
    },
    // Reading Header
    readingHeader: {
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    readingTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    readingTitle: {
      flex: 1,
      fontSize: getFontSize(18),
      fontWeight: '700',
      color: colors.headerText,
    },
    completeToggle: {
      padding: 8,
      borderRadius: 20,
    },
    completeToggleActive: {
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    // Scroll Content
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      paddingBottom: 100,
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
    },
    chapterIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    chapterTitle: {
      flex: 1,
      fontSize: getFontSize(17),
      fontWeight: '700',
      color: colors.headerText,
    },
    versesContainer: {
      gap: 8,
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
    verseContainerFavorite: {
      borderLeftWidth: 3,
      borderLeftColor: colors.accent,
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
      color: colors.headerText,
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
    // Search Tab and Drawer
    searchTab: {
      position: 'absolute',
      right: 20,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 24,
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
      gap: 6,
    },
    searchTabText: {
      fontSize: getFontSize(14),
      color: '#FFFFFF',
      fontWeight: '600',
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
    searchDrawer: {
      position: 'absolute',
      left: 0,
      right: 0,
      borderTopWidth: StyleSheet.hairlineWidth,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: -4 },
      elevation: 8,
      zIndex: 2,
      overflow: 'hidden',
    },
    drawerHandle: {
      alignItems: 'center',
      paddingVertical: 12,
    },
    handleBar: {
      width: 40,
      height: 4,
      borderRadius: 2,
    },
    searchContent: {
      flex: 1,
    },
    searchInputContainer: {
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    searchInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: StyleSheet.hairlineWidth,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: getFontSize(15),
      padding: 0,
    },
    clearButton: {
      padding: 4,
    },
    searchHint: {
      fontSize: getFontSize(11),
      color: colors.placeholderText,
      marginTop: 6,
      marginLeft: 2,
    },
    searchCount: {
      fontSize: getFontSize(12),
      fontWeight: '600',
      marginTop: 6,
      marginLeft: 2,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      paddingTop: 20,
    },
    emptyIcon: {
      fontSize: getFontSize(36),
      marginBottom: 10,
    },
    emptyTitle: {
      fontSize: getFontSize(16),
      fontWeight: '600',
      color: colors.headerText,
      marginBottom: 6,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: getFontSize(13),
      color: colors.placeholderText,
      textAlign: 'center',
      lineHeight: Math.round(getFontSize(13) * 1.5),
    },
    resultsContent: {
      padding: 16,
      paddingTop: 8,
    },
    resultCard: {
      borderRadius: 10,
      padding: 12,
      marginBottom: 10,
      borderWidth: StyleSheet.hairlineWidth,
    },
    resultReference: {
      fontSize: getFontSize(13),
      fontWeight: '600',
      marginBottom: 4,
    },
    resultText: {
      fontSize: getFontSize(14),
      color: colors.bodyText,
      lineHeight: Math.round(getFontSize(14) * 1.4),
    },
    highlightedText: {
      fontWeight: '700',
    },
    // Selection Bar
    selectionBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.backgroundSecondary,
      paddingHorizontal: 16,
      paddingVertical: 12,
      paddingBottom: 28,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    selectionCountContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    selectionCount: {
      fontSize: getFontSize(14),
      color: colors.bodyText,
      fontWeight: '500',
    },
    selectionActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    selectionAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    selectionActionText: {
      fontSize: getFontSize(14),
      color: colors.accent,
      fontWeight: '600',
    },
    // Dialog
    dialogOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'flex-end',
    },
    dialogBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    dialogContent: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 20,
      paddingBottom: 40,
      paddingHorizontal: 20,
    },
    dialogTitle: {
      fontSize: getFontSize(18),
      fontWeight: '700',
      color: colors.headerText,
      marginBottom: 16,
      textAlign: 'center',
    },
    dialogOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    dialogOptionDisabled: {
      opacity: 0.5,
    },
    dialogOptionText: {
      fontSize: getFontSize(16),
      color: colors.bodyText,
    },
    dialogCancel: {
      justifyContent: 'center',
      borderBottomWidth: 0,
      marginTop: 8,
    },
    dialogSubtitle: {
      fontSize: getFontSize(13),
      color: colors.placeholderText,
      marginBottom: 12,
    },
    // Share Options
    shareOptionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      marginVertical: 6,
      gap: 12,
    },
    shareOptionButtonDisabled: {
      opacity: 0.6,
    },
    shareOptionContent: {
      flex: 1,
    },
    shareOptionTitle: {
      fontSize: getFontSize(16),
      fontWeight: '600',
      color: colors.bodyText,
      marginBottom: 4,
    },
    shareOptionDescription: {
      fontSize: getFontSize(13),
      color: colors.placeholderText,
      lineHeight: Math.round(getFontSize(13) * 1.4),
    },
    // Hidden ViewShot for image capture
    hiddenViewShot: {
      position: 'absolute',
      left: -9999,
      top: -9999,
      opacity: 0,
    },
    viewShotContainer: {
      width: 400,
    },
    shareableContent: {
      paddingHorizontal: 24,
      paddingVertical: 28,
    },
    shareableTitle: {
      fontSize: getFontSize(18),
      fontWeight: '700',
      color: colors.headerText,
      marginBottom: 20,
    },
    shareableVerse: {
      flexDirection: 'row',
      marginBottom: 12,
    },
    shareableVerseNumber: {
      width: 28,
      fontSize: getFontSize(14),
      fontWeight: '700',
      color: colors.accent,
    },
    shareableVerseText: {
      flex: 1,
      fontSize: getFontSize(15),
      color: colors.bodyText,
      lineHeight: Math.round(getFontSize(15) * 1.5),
    },
    shareableFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 24,
      gap: 6,
    },
    shareableFooterText: {
      fontSize: getFontSize(14),
      color: colors.placeholderText,
      fontWeight: '600',
    },
    // Save Modal
    modalWrapper: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100,
    },
    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
      width: '90%',
      maxWidth: 400,
    },
    modalCard: {
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    modalTitle: {
      fontSize: getFontSize(20),
      fontWeight: '700',
      color: colors.headerText,
      marginBottom: 12,
      textAlign: 'center',
    },
    modalVerseGroup: {
      marginBottom: 8,
    },
    modalSubtitle: {
      fontSize: getFontSize(15),
      fontWeight: '600',
      color: colors.bodyText,
    },
    modalVerseRange: {
      fontSize: getFontSize(13),
      color: colors.placeholderText,
    },
    modalHint: {
      fontSize: getFontSize(13),
      color: colors.placeholderText,
      marginTop: 16,
      marginBottom: 8,
    },
    modalInput: {
      borderWidth: 1,
      borderRadius: 10,
      padding: 12,
      fontSize: getFontSize(15),
      minHeight: 80,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
      marginTop: 20,
    },
    modalButtonSecondary: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 10,
    },
    modalButtonSecondaryText: {
      fontSize: getFontSize(15),
      fontWeight: '600',
      color: colors.placeholderText,
    },
    modalButtonPrimary: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 10,
      backgroundColor: colors.accent,
    },
    modalButtonPrimaryText: {
      fontSize: getFontSize(15),
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });
