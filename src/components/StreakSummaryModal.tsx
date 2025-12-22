import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Flame,
  AlertTriangle,
  Heart,
  Gem,
  Shield,
  Trophy,
  BookOpen,
} from 'lucide-react-native';
import { useTheme, type ThemeColors } from '../context/ThemeContext';
import { STREAK_COLORS, type StreakStatus } from '../types/streak';

interface StreakSummaryModalProps {
  visible: boolean;
  onClose: () => void;
  currentStreak: number;
  longestStreak: number;
  todayProgress: number;
  remainingMinutes: number;
  streakStatus: StreakStatus;
  availableFreezes: number;
  currentGems: number;
  newGoalCompleted?: {
    title: string;
    gemsEarned: number;
  } | null;
}

export function StreakSummaryModal({
  visible,
  onClose,
  currentStreak,
  longestStreak,
  todayProgress,
  remainingMinutes,
  streakStatus,
  availableFreezes,
  currentGems,
  newGoalCompleted,
}: StreakSummaryModalProps) {
  const { colors, getFontSize } = useTheme();
  const styles = getStyles(colors, getFontSize);

  // Estado de celebración por meta completada
  if (newGoalCompleted) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.celebrationContainer}>
              <View style={styles.trophyContainer}>
                <Trophy size={64} color={STREAK_COLORS.gems} />
              </View>

              <Text style={styles.celebrationTitle}>¡Meta Completada!</Text>

              <Text style={styles.celebrationSubtitle}>
                {newGoalCompleted.title}
              </Text>

              <View style={styles.gemsEarned}>
                <Gem size={32} color={STREAK_COLORS.gems} />
                <Text style={styles.gemsEarnedText}>
                  +{newGoalCompleted.gemsEarned}
                </Text>
              </View>

              <Text style={styles.celebrationMessage}>
                ¡Sigue así! Estás construyendo un gran hábito de lectura.
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={onClose}
              >
                <Text style={styles.primaryButtonText}>¡Genial!</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Estado de racha activa
  if (streakStatus === 'active' || streakStatus === 'new') {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.content}>
              {/* Icono y número de racha */}
              <View style={styles.streakDisplay}>
                <Flame
                  size={48}
                  color={
                    currentStreak > 0
                      ? STREAK_COLORS.fire
                      : colors.placeholderText
                  }
                  fill={currentStreak > 0 ? STREAK_COLORS.fire : 'transparent'}
                />
                <Text style={styles.streakNumber}>{currentStreak}</Text>
                <Text style={styles.streakLabel}>
                  {currentStreak === 1 ? 'día de racha' : 'días de racha'}
                </Text>
              </View>

              {/* Progreso del día */}
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressTitle}>Progreso de hoy</Text>
                  <Text style={styles.progressValue}>
                    {Math.round(todayProgress)}%
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(100, todayProgress)}%`,
                        backgroundColor:
                          todayProgress >= 100
                            ? STREAK_COLORS.completed
                            : colors.accent,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressSubtext}>
                  {todayProgress >= 100
                    ? '¡Meta de hoy completada!'
                    : `Lee ${remainingMinutes} minutos más para completar tu meta`}
                </Text>
              </View>

              {/* Stats rápidos */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Gem size={18} color={STREAK_COLORS.gems} />
                  <Text style={styles.statValue}>{currentGems}</Text>
                  <Text style={styles.statLabel}>gemas</Text>
                </View>
                <View style={styles.statItem}>
                  <Shield size={18} color={STREAK_COLORS.frozen} />
                  <Text style={styles.statValue}>{availableFreezes}</Text>
                  <Text style={styles.statLabel}>protectores</Text>
                </View>
                <View style={styles.statItem}>
                  <Trophy size={18} color={STREAK_COLORS.gems} />
                  <Text style={styles.statValue}>{longestStreak}</Text>
                  <Text style={styles.statLabel}>mejor racha</Text>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={onClose}
              >
                <BookOpen size={20} color="white" />
                <Text style={styles.primaryButtonText}>Continuar Leyendo</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Estado de racha en riesgo
  if (streakStatus === 'at_risk') {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.content}>
              <View style={[styles.iconContainer, styles.warningIcon]}>
                <AlertTriangle size={48} color={STREAK_COLORS.atRisk} />
              </View>

              <Text style={styles.warningTitle}>¡Tu racha está en riesgo!</Text>

              <Text style={styles.streakAtRisk}>
                {currentStreak} días de racha
              </Text>

              <Text style={styles.warningMessage}>
                Lee {remainingMinutes} minutos antes de medianoche para mantener
                tu racha
              </Text>

              {/* Info de protectores disponibles */}
              {availableFreezes > 0 && (
                <View style={styles.freezeInfo}>
                  <Shield size={18} color={STREAK_COLORS.frozen} />
                  <Text style={styles.freezeInfoText}>
                    Tienes {availableFreezes} protector
                    {availableFreezes > 1 ? 'es' : ''} que se usarán
                    automáticamente si faltas un día
                  </Text>
                </View>
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  styles.urgentButton,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={onClose}
              >
                <BookOpen size={20} color="white" />
                <Text style={styles.primaryButtonText}>Leer Ahora</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Estado de racha perdida
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={[styles.iconContainer, styles.lostIcon]}>
              <Heart size={48} color={colors.placeholderText} />
            </View>

            <Text style={styles.lostTitle}>Tu racha se reinició</Text>

            <Text style={styles.lostMessage}>
              Pero cada día es una nueva oportunidad para comenzar de nuevo
            </Text>

            <View style={styles.bestStreakBadge}>
              <Trophy size={20} color={STREAK_COLORS.gems} />
              <Text style={styles.bestStreakText}>
                Tu mejor racha: {longestStreak} días
              </Text>
            </View>

            <Text style={styles.encouragement}>
              ¡Vamos a superar ese récord!
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && { opacity: 0.8 },
              ]}
              onPress={onClose}
            >
              <Flame size={20} color="white" />
              <Text style={styles.primaryButtonText}>Comenzar Nueva Racha</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (
  colors: ThemeColors,
  getFontSize: (size: number) => number,
) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    container: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 24,
      width: '100%',
      maxWidth: 380,
      overflow: 'hidden',
    },
    content: {
      padding: 24,
      alignItems: 'center',
    },
    streakDisplay: {
      alignItems: 'center',
      marginBottom: 24,
    },
    streakNumber: {
      fontSize: getFontSize(48),
      fontWeight: '800',
      color: colors.headerText,
      marginTop: 8,
    },
    streakLabel: {
      fontSize: getFontSize(16),
      color: colors.placeholderText,
    },
    progressSection: {
      width: '100%',
      backgroundColor: colors.surfaceMuted,
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    progressTitle: {
      fontSize: getFontSize(14),
      fontWeight: '600',
      color: colors.headerText,
    },
    progressValue: {
      fontSize: getFontSize(14),
      fontWeight: '700',
      color: colors.accent,
    },
    progressBar: {
      height: 8,
      backgroundColor: colors.divider,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    progressSubtext: {
      fontSize: getFontSize(13),
      color: colors.placeholderText,
      marginTop: 10,
      textAlign: 'center',
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      marginBottom: 24,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: getFontSize(18),
      fontWeight: '700',
      color: colors.headerText,
      marginTop: 4,
    },
    statLabel: {
      fontSize: getFontSize(11),
      color: colors.placeholderText,
    },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accent,
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 16,
      width: '100%',
      gap: 8,
    },
    primaryButtonText: {
      fontSize: getFontSize(16),
      fontWeight: '600',
      color: 'white',
    },
    // Warning state
    iconContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    warningIcon: {
      backgroundColor: `${STREAK_COLORS.atRisk}20`,
    },
    warningTitle: {
      fontSize: getFontSize(20),
      fontWeight: '700',
      color: STREAK_COLORS.atRisk,
      textAlign: 'center',
      marginBottom: 8,
    },
    streakAtRisk: {
      fontSize: getFontSize(16),
      color: colors.bodyText,
      marginBottom: 12,
    },
    warningMessage: {
      fontSize: getFontSize(15),
      color: colors.placeholderText,
      textAlign: 'center',
      marginBottom: 20,
    },
    freezeInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: `${STREAK_COLORS.frozen}15`,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 12,
      marginBottom: 16,
      width: '100%',
      gap: 10,
    },
    freezeInfoText: {
      flex: 1,
      fontSize: getFontSize(13),
      color: STREAK_COLORS.frozen,
      lineHeight: getFontSize(18),
    },
    urgentButton: {
      backgroundColor: STREAK_COLORS.atRisk,
    },
    // Lost state
    lostIcon: {
      backgroundColor: colors.surfaceMuted,
    },
    lostTitle: {
      fontSize: getFontSize(20),
      fontWeight: '700',
      color: colors.headerText,
      textAlign: 'center',
      marginBottom: 12,
    },
    lostMessage: {
      fontSize: getFontSize(15),
      color: colors.placeholderText,
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: getFontSize(22),
    },
    bestStreakBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: `${STREAK_COLORS.gems}15`,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
      marginBottom: 16,
      gap: 8,
    },
    bestStreakText: {
      fontSize: getFontSize(14),
      fontWeight: '600',
      color: STREAK_COLORS.gems,
    },
    encouragement: {
      fontSize: getFontSize(14),
      color: colors.bodyText,
      marginBottom: 20,
    },
    // Celebration state
    celebrationContainer: {
      padding: 24,
      alignItems: 'center',
    },
    trophyContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: `${STREAK_COLORS.gems}20`,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    celebrationTitle: {
      fontSize: getFontSize(24),
      fontWeight: '800',
      color: colors.headerText,
      marginBottom: 8,
    },
    celebrationSubtitle: {
      fontSize: getFontSize(16),
      color: colors.accent,
      fontWeight: '600',
      marginBottom: 20,
    },
    gemsEarned: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: `${STREAK_COLORS.gems}20`,
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 16,
      gap: 12,
      marginBottom: 20,
    },
    gemsEarnedText: {
      fontSize: getFontSize(32),
      fontWeight: '800',
      color: STREAK_COLORS.gems,
    },
    celebrationMessage: {
      fontSize: getFontSize(14),
      color: colors.placeholderText,
      textAlign: 'center',
      marginBottom: 24,
    },
  });
