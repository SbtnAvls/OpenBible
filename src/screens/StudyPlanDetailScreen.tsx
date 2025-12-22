import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import {
  ChevronLeft,
  Lock,
  CheckCircle2,
  Circle,
  BookOpen,
  Play,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useStudyPlan } from '../context/StudyPlanContext';
import type { ThemeColors, GetFontSize } from '../context/ThemeContext';
import { StudyPlanSection, Reading } from '../types/studyPlan';

type StudyPlanDetailScreenProps = {
  planId: string;
  onBack: () => void;
  onStartReading: (planId: string, sectionId: string) => void;
};

export const StudyPlanDetailScreen: React.FC<StudyPlanDetailScreenProps> = ({
  planId,
  onBack,
  onStartReading,
}) => {
  const { colors, getFontSize } = useTheme();
  const { plans } = useStudyPlan();
  const styles = getStyles(colors, getFontSize);
  const scrollViewRef = useRef<ScrollView>(null);
  const sectionYPositions = useRef<{ [key: string]: number }>({});
  const hasScrolled = useRef(false);
  const layoutCompleteCount = useRef(0);

  const plan = plans.find(p => p.id === planId);

  // Reset scroll state when planId changes
  useEffect(() => {
    hasScrolled.current = false;
    layoutCompleteCount.current = 0;
    sectionYPositions.current = {};
  }, [planId]);

  // Función para hacer scroll a la siguiente sección no completada
  const scrollToNextSection = useCallback(() => {
    if (!plan || hasScrolled.current) return;

    const nextUncompletedSection = plan.sections.find(s => !s.isCompleted);

    // Solo hacer scroll si hay secciones completadas y la siguiente no es la primera
    if (nextUncompletedSection && nextUncompletedSection !== plan.sections[0]) {
      const yPosition = sectionYPositions.current[nextUncompletedSection.id];

      if (yPosition !== undefined && yPosition > 0) {
        hasScrolled.current = true;
        // Use requestAnimationFrame for smoother scrolling after layout
        requestAnimationFrame(() => {
          scrollViewRef.current?.scrollTo({
            y: yPosition - 100,
            animated: true,
          });
        });
      }
    }
  }, [plan]);

  const handleSectionLayout = useCallback(
    (sectionId: string, y: number) => {
      sectionYPositions.current[sectionId] = y;
      layoutCompleteCount.current += 1;

      // Trigger scroll when all sections have reported their layout
      if (plan && layoutCompleteCount.current >= plan.sections.length) {
        scrollToNextSection();
      }
    },
    [plan, scrollToNextSection],
  );

  if (!plan) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Plan no encontrado</Text>
      </View>
    );
  }

  const formatReading = (reading: Reading): string => {
    let result = reading.book + ' ';

    const chapters = reading.chapters;
    if (chapters) {
      if (chapters.length === 1) {
        result += chapters[0];
      } else if (chapters.length === 2) {
        result += chapters.join(', ');
      } else {
        // Check if chapters are consecutive
        const isConsecutive = chapters.every(
          (ch, idx) => idx === 0 || ch === chapters[idx - 1] + 1,
        );

        if (isConsecutive) {
          const first = chapters[0];
          const last = chapters[chapters.length - 1];
          result += `${first}–${last}`;
        } else {
          // Group consecutive chapters into ranges
          const ranges: string[] = [];
          let rangeStart = chapters[0];
          let rangeEnd = chapters[0];

          for (let i = 1; i <= chapters.length; i++) {
            const current = chapters[i];
            const prev = chapters[i - 1];

            if (current === prev + 1) {
              rangeEnd = current;
            } else {
              // End current range
              if (rangeStart === rangeEnd) {
                ranges.push(`${rangeStart}`);
              } else if (rangeEnd === rangeStart + 1) {
                ranges.push(`${rangeStart}, ${rangeEnd}`);
              } else {
                ranges.push(`${rangeStart}–${rangeEnd}`);
              }
              rangeStart = current;
              rangeEnd = current;
            }
          }
          result += ranges.join(', ');
        }
      }
    } else if (reading.verseRanges) {
      const ranges = reading.verseRanges.map(range => {
        if (range.startVerse && range.endVerse) {
          return `${range.chapter}:${range.startVerse}–${range.endVerse}`;
        } else if (range.startVerse) {
          return `${range.chapter}:${range.startVerse}`;
        } else {
          return `${range.chapter}`;
        }
      });
      result += ranges.join(', ');
    }

    return result;
  };

  const renderSection = (item: StudyPlanSection) => {
    const isLocked = !item.isUnlocked;

    return (
      <View
        onLayout={event => {
          const { y } = event.nativeEvent.layout;
          handleSectionLayout(item.id, y);
        }}
        style={[
          styles.sectionCard,
          isLocked && styles.sectionCardLocked,
          item.isCompleted && styles.sectionCardCompleted,
        ]}
      >
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View
            style={[
              styles.sectionIconContainer,
              isLocked && styles.sectionIconLocked,
              item.isCompleted && styles.sectionIconCompleted,
            ]}
          >
            {item.isCompleted ? (
              <CheckCircle2
                size={24}
                color={colors.accent}
                fill={colors.accent}
              />
            ) : isLocked ? (
              <Lock size={20} color={colors.placeholderText} />
            ) : (
              <Circle size={24} color={colors.accent} />
            )}
          </View>

          <View style={styles.sectionInfo}>
            <Text
              style={[
                styles.sectionTitle,
                isLocked && styles.sectionTitleLocked,
              ]}
            >
              {item.title}
            </Text>
            {item.description && (
              <Text
                style={[
                  styles.sectionDescription,
                  isLocked && styles.textMuted,
                ]}
              >
                {item.description}
              </Text>
            )}
          </View>
        </View>

        {/* Readings List */}
        <View style={styles.readingsContainer}>
          <Text style={[styles.readingsLabel, isLocked && styles.textMuted]}>
            Lecturas incluidas:
          </Text>
          {item.readings.map((reading, idx) => (
            <View key={idx} style={styles.readingItem}>
              <View style={styles.readingBullet}>
                <BookOpen
                  size={14}
                  color={isLocked ? colors.placeholderText : colors.accent}
                />
              </View>
              <View style={styles.readingContent}>
                <Text
                  style={[
                    styles.readingReference,
                    isLocked && styles.textMuted,
                  ]}
                >
                  {formatReading(reading)}
                </Text>
                {reading.description && (
                  <Text
                    style={[
                      styles.readingDescription,
                      isLocked && styles.textMuted,
                    ]}
                  >
                    {reading.description}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Action Button */}
        {!isLocked && (
          <Pressable
            style={({ pressed }) => [
              styles.startButton,
              item.isCompleted && styles.startButtonOutline,
              pressed && styles.startButtonPressed,
            ]}
            onPress={() => onStartReading(planId, item.id)}
          >
            {!item.isCompleted && (
              <Play
                size={18}
                color={colors.accentText}
                fill={colors.accentText}
              />
            )}
            <Text
              style={[
                styles.startButtonText,
                item.isCompleted && styles.startButtonTextOutline,
              ]}
            >
              {item.isCompleted ? 'Leer nuevamente' : 'Comenzar lectura'}
            </Text>
          </Pressable>
        )}

        {isLocked && (
          <View style={styles.lockedBanner}>
            <Lock size={14} color={colors.placeholderText} />
            <Text style={styles.lockedText}>
              Completa la sección anterior para desbloquear
            </Text>
          </View>
        )}
      </View>
    );
  };

  const completedSections = plan.sections.filter(s => s.isCompleted).length;
  const totalSections = plan.sections.length;

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
          <Text style={styles.headerTitle}>{plan.title}</Text>
          <Text style={styles.headerSubtitle}>{plan.description}</Text>
        </View>
      </View>

      {/* Progress Card */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Tu progreso</Text>
          <Text style={styles.progressStats}>
            {completedSections}/{totalSections} completadas
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${plan.progress ?? 0}%` }]}
            />
          </View>
          <Text style={styles.progressPercentage}>
            {Math.round(plan.progress ?? 0)}%
          </Text>
        </View>
      </View>

      {/* Sections List */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {plan.sections.map(section => (
          <View key={section.id}>{renderSection(section)}</View>
        ))}
      </ScrollView>
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
      paddingBottom: 20,
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
    },
    headerTitle: {
      fontSize: getFontSize(24),
      fontWeight: '700',
      color: colors.headerText,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: getFontSize(14),
      color: colors.placeholderText,
      lineHeight: 20,
    },
    progressCard: {
      backgroundColor: colors.backgroundSecondary,
      marginHorizontal: 16,
      marginVertical: 16,
      padding: 16,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    progressTitle: {
      fontSize: getFontSize(14),
      fontWeight: '600',
      color: colors.bodyText,
    },
    progressStats: {
      fontSize: getFontSize(13),
      color: colors.placeholderText,
    },
    progressBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    progressBar: {
      flex: 1,
      height: 8,
      backgroundColor: colors.surfaceMuted,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.accent,
      borderRadius: 4,
    },
    progressPercentage: {
      fontSize: getFontSize(13),
      fontWeight: '600',
      color: colors.bodyText,
      minWidth: 40,
      textAlign: 'right',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 100,
      gap: 16,
    },
    sectionCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 12,
      padding: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
      gap: 16,
    },
    sectionCardLocked: {
      opacity: 0.6,
    },
    sectionCardCompleted: {
      borderColor: colors.accent,
      borderWidth: 1,
    },
    sectionHeader: {
      flexDirection: 'row',
      gap: 12,
    },
    sectionIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.accentSubtle,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sectionIconLocked: {
      backgroundColor: colors.surfaceMuted,
    },
    sectionIconCompleted: {
      backgroundColor: colors.accentSubtle,
    },
    sectionInfo: {
      flex: 1,
      gap: 4,
    },
    sectionTitle: {
      fontSize: getFontSize(17),
      fontWeight: '600',
      color: colors.headerText,
      lineHeight: 22,
    },
    sectionTitleLocked: {
      color: colors.placeholderText,
    },
    sectionDescription: {
      fontSize: getFontSize(14),
      color: colors.placeholderText,
      lineHeight: 19,
    },
    textMuted: {
      opacity: 0.6,
    },
    readingsContainer: {
      gap: 8,
    },
    readingsLabel: {
      fontSize: getFontSize(13),
      fontWeight: '600',
      color: colors.bodyText,
      marginBottom: 4,
    },
    readingItem: {
      flexDirection: 'row',
      gap: 10,
      paddingVertical: 4,
    },
    readingBullet: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.accentSubtle,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 2,
    },
    readingContent: {
      flex: 1,
      gap: 2,
    },
    readingReference: {
      fontSize: getFontSize(14),
      color: colors.bodyText,
      fontWeight: '500',
    },
    readingDescription: {
      fontSize: getFontSize(12),
      color: colors.placeholderText,
      lineHeight: 17,
    },
    startButton: {
      backgroundColor: colors.accent,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 10,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    startButtonOutline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.accent,
    },
    startButtonPressed: {
      opacity: 0.7,
      transform: [{ scale: 0.98 }],
    },
    startButtonText: {
      fontSize: getFontSize(15),
      fontWeight: '600',
      color: colors.accentText,
    },
    startButtonTextOutline: {
      color: colors.accent,
    },
    lockedBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.surfaceMuted,
      borderRadius: 8,
    },
    lockedText: {
      fontSize: getFontSize(13),
      color: colors.placeholderText,
    },
    errorText: {
      fontSize: getFontSize(16),
      color: colors.bodyText,
      textAlign: 'center',
      marginTop: 40,
    },
  });
