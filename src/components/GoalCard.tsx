import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Check, Gem, Target } from 'lucide-react-native';
import { useTheme, type ThemeColors } from '../context/ThemeContext';
import { STREAK_COLORS, type StreakGoal } from '../types/streak';

interface GoalCardProps {
  goal: StreakGoal;
  isCompleted: boolean;
  currentStreak: number;
}

export function GoalCard({ goal, isCompleted, currentStreak }: GoalCardProps) {
  const { colors, getFontSize } = useTheme();
  const styles = getStyles(colors, getFontSize);

  const progress = Math.min(100, (currentStreak / goal.targetDays) * 100);
  const isLocked = currentStreak < goal.targetDays && !isCompleted;
  const daysRemaining = Math.max(0, goal.targetDays - currentStreak);

  return (
    <View style={[styles.container, isCompleted && styles.containerCompleted]}>
      {/* Icono */}
      <View
        style={[
          styles.iconContainer,
          isCompleted && styles.iconContainerCompleted,
        ]}
      >
        {isCompleted ? (
          <Check size={24} color="white" />
        ) : (
          <Target
            size={24}
            color={isLocked ? colors.placeholderText : colors.accent}
          />
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.title, isCompleted && styles.titleCompleted]}>
          {goal.title}
        </Text>
        <Text style={styles.days}>
          {goal.targetDays} días
          {!isCompleted && daysRemaining > 0 && (
            <Text style={styles.remaining}> · Faltan {daysRemaining}</Text>
          )}
        </Text>

        {/* Barra de progreso */}
        {!isCompleted && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
        )}
      </View>

      {/* Recompensa */}
      <View style={[styles.reward, isCompleted && styles.rewardCompleted]}>
        <Gem size={18} color={isCompleted ? 'white' : STREAK_COLORS.gems} />
        <Text
          style={[styles.rewardText, isCompleted && styles.rewardTextCompleted]}
        >
          {isCompleted ? 'Obtenido' : `+${goal.gemsReward}`}
        </Text>
      </View>
    </View>
  );
}

const getStyles = (
  colors: ThemeColors,
  getFontSize: (size: number) => number,
) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceMuted,
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
    },
    containerCompleted: {
      backgroundColor: `${colors.accent}15`,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    iconContainerCompleted: {
      backgroundColor: colors.accent,
    },
    info: {
      flex: 1,
    },
    title: {
      fontSize: getFontSize(15),
      fontWeight: '600',
      color: colors.headerText,
    },
    titleCompleted: {
      color: colors.accent,
    },
    days: {
      fontSize: getFontSize(13),
      color: colors.placeholderText,
      marginTop: 2,
    },
    remaining: {
      color: colors.placeholderText,
    },
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      gap: 8,
    },
    progressBar: {
      flex: 1,
      height: 6,
      backgroundColor: colors.divider,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.accent,
      borderRadius: 3,
    },
    progressText: {
      fontSize: getFontSize(11),
      color: colors.placeholderText,
      fontWeight: '600',
      width: 35,
    },
    reward: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: `${STREAK_COLORS.gems}20`,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      gap: 4,
    },
    rewardCompleted: {
      backgroundColor: colors.accent,
    },
    rewardText: {
      fontSize: getFontSize(13),
      fontWeight: '700',
      color: STREAK_COLORS.gems,
    },
    rewardTextCompleted: {
      color: 'white',
      fontWeight: '600',
    },
  });
