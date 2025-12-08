import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { BookOpen, ChevronRight, CheckCircle2, TrendingUp } from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";
import { useStudyPlan } from "../context/StudyPlanContext";
import type { ThemeColors, GetFontSize } from "../context/ThemeContext";
import { StudyPlan } from "../types/studyPlan";

type StudyPlansScreenProps = {
  onSelectPlan: (planId: string) => void;
};

export const StudyPlansScreen: React.FC<StudyPlansScreenProps> = ({
  onSelectPlan,
}) => {
  const { colors, getFontSize } = useTheme();
  const { plans } = useStudyPlan();
  const styles = getStyles(colors, getFontSize);

  const renderPlanCard = (item: StudyPlan) => {
    const completedSections = item.sections.filter(s => s.isCompleted).length;
    const totalSections = item.sections.length;
    const isCompleted = completedSections === totalSections;
    const isStarted = completedSections > 0;

    return (
      <Pressable
        key={item.id}
        style={({ pressed }) => [
          styles.planCard,
          pressed && styles.planCardPressed,
        ]}
        onPress={() => onSelectPlan(item.id)}
      >
        <View style={styles.planCardContent}>
          <View style={styles.planIconContainer}>
            <BookOpen size={28} color={colors.accent} />
          </View>

          <View style={styles.planInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.planTitle} numberOfLines={1}>
                {item.title}
              </Text>
              {isCompleted && (
                <View style={styles.completedBadge}>
                  <CheckCircle2 size={16} color={colors.accent} />
                </View>
              )}
            </View>

            <Text style={styles.planDescription} numberOfLines={2}>
              {item.description}
            </Text>

            {/* Progress Section */}
            <View style={styles.progressSection}>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${item.progress ?? 0}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressPercentage}>
                  {Math.round(item.progress ?? 0)}%
                </Text>
              </View>

              <View style={styles.statsRow}>
                {isStarted && !isCompleted && (
                  <View style={styles.statBadge}>
                    <TrendingUp size={12} color={colors.accent} />
                    <Text style={styles.statText}>En progreso</Text>
                  </View>
                )}
                <Text style={styles.sectionsText}>
                  {completedSections} de {totalSections} secciones
                </Text>
              </View>
            </View>
          </View>

          <ChevronRight size={20} color={colors.placeholderText} />
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerIconContainer}>
            <BookOpen size={32} color={colors.accent} />
          </View>
          <Text style={styles.headerTitle}>Planes de Estudio</Text>
          <Text style={styles.headerSubtitle}>
            Profundiza en la Palabra con guías estructuradas que te llevan paso a paso
          </Text>
        </View>

        {/* Plans List */}
        <View style={styles.plansContainer}>
          {plans.map(plan => renderPlanCard(plan))}
        </View>
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
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 100,
    },
    headerSection: {
      padding: 24,
      paddingTop: 60,
      alignItems: 'center',
    },
    headerIconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.accentSubtle,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    headerTitle: {
      fontSize: getFontSize(28),
      fontWeight: '700',
      color: colors.headerText,
      marginBottom: 8,
      textAlign: 'center',
    },
    headerSubtitle: {
      fontSize: getFontSize(14),
      color: colors.placeholderText,
      textAlign: 'center',
      lineHeight: 20,
      paddingHorizontal: 16,
    },
    plansContainer: {
      paddingHorizontal: 16,
      gap: 16,
    },
    planCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 16,
      padding: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
    },
    planCardPressed: {
      opacity: 0.7,
      transform: [{ scale: 0.98 }],
    },
    planCardContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    planIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 12,
      backgroundColor: colors.accentSubtle,
      justifyContent: 'center',
      alignItems: 'center',
    },
    planInfo: {
      flex: 1,
      gap: 8,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    planTitle: {
      fontSize: getFontSize(18),
      fontWeight: '600',
      color: colors.headerText,
      flex: 1,
    },
    completedBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.accentSubtle,
      justifyContent: 'center',
      alignItems: 'center',
    },
    planDescription: {
      fontSize: getFontSize(14),
      color: colors.placeholderText,
      lineHeight: 20,
    },
    progressSection: {
      gap: 8,
      marginTop: 4,
    },
    progressBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    progressBarBackground: {
      flex: 1,
      height: 8,
      backgroundColor: colors.surfaceMuted,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: colors.accent,
      borderRadius: 4,
    },
    progressPercentage: {
      fontSize: getFontSize(12),
      fontWeight: '600',
      color: colors.bodyText,
      minWidth: 36,
      textAlign: 'right',
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: colors.accentSubtle,
      borderRadius: 8,
    },
    statText: {
      fontSize: getFontSize(11),
      fontWeight: '600',
      color: colors.accent,
    },
    sectionsText: {
      fontSize: getFontSize(12),
      color: colors.placeholderText,
    },
  });
