import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Flame, Gem, Shield, ChevronRight } from "lucide-react-native";
import { useTheme, type ThemeColors } from "../context/ThemeContext";
import { STREAK_COLORS } from "../types/streak";

interface StreakCardProps {
  currentStreak: number;
  todayProgress: number;
  todayCompleted: boolean;
  remainingMinutes: number;
  currentGems: number;
  availableFreezes: number;
  onPress: () => void;
}

export function StreakCard({
  currentStreak,
  todayProgress,
  todayCompleted,
  remainingMinutes,
  currentGems,
  availableFreezes,
  onPress,
}: StreakCardProps) {
  const { colors, getFontSize } = useTheme();
  const styles = getStyles(colors, getFontSize);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && { opacity: 0.8 },
      ]}
      onPress={onPress}
    >
      {/* Header con racha */}
      <View style={styles.header}>
        <View style={styles.streakInfo}>
          <Flame
            size={32}
            color={currentStreak > 0 ? STREAK_COLORS.fire : colors.placeholderText}
            fill={currentStreak > 0 ? STREAK_COLORS.fire : "transparent"}
          />
          <View style={styles.streakTextContainer}>
            <Text style={styles.streakNumber}>{currentStreak}</Text>
            <Text style={styles.streakLabel}>
              {currentStreak === 1 ? "día" : "días"}
            </Text>
          </View>
        </View>

        <ChevronRight size={20} color={colors.placeholderText} />
      </View>

      {/* Barra de progreso */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>
            {todayCompleted ? "Meta completada" : `${remainingMinutes} min restantes`}
          </Text>
          <Text style={styles.progressValue}>{Math.round(todayProgress)}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(100, todayProgress)}%`,
                backgroundColor: todayCompleted
                  ? STREAK_COLORS.completed
                  : colors.accent,
              },
            ]}
          />
        </View>
      </View>

      {/* Stats rápidos */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Gem size={14} color={STREAK_COLORS.gems} />
          <Text style={styles.statValue}>{currentGems}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Shield size={14} color={STREAK_COLORS.frozen} />
          <Text style={styles.statValue}>{availableFreezes}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const getStyles = (colors: ThemeColors, getFontSize: (size: number) => number) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.divider,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14,
    },
    streakInfo: {
      flexDirection: "row",
      alignItems: "center",
    },
    streakTextContainer: {
      marginLeft: 10,
    },
    streakNumber: {
      fontSize: getFontSize(28),
      fontWeight: "800",
      color: colors.headerText,
      lineHeight: getFontSize(32),
    },
    streakLabel: {
      fontSize: getFontSize(12),
      color: colors.placeholderText,
      marginTop: -4,
    },
    progressSection: {
      marginBottom: 14,
    },
    progressHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    progressLabel: {
      fontSize: getFontSize(12),
      color: colors.placeholderText,
    },
    progressValue: {
      fontSize: getFontSize(12),
      fontWeight: "600",
      color: colors.accent,
    },
    progressBar: {
      height: 6,
      backgroundColor: colors.divider,
      borderRadius: 3,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: 3,
    },
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
    },
    statItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    statValue: {
      fontSize: getFontSize(14),
      fontWeight: "600",
      color: colors.bodyText,
    },
    divider: {
      width: 1,
      height: 16,
      backgroundColor: colors.divider,
    },
  });
