import React, { useEffect, useRef } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  Animated,
  Easing,
} from 'react-native';
import { Flame, Gem, Trophy, Target, Sparkles } from 'lucide-react-native';
import { useTheme, type ThemeColors } from '../context/ThemeContext';
import { STREAK_COLORS, type PendingReward } from '../types/streak';

interface DailyCompletionModalProps {
  visible: boolean;
  onClose: () => void;
  reward: PendingReward;
}

export function DailyCompletionModal({
  visible,
  onClose,
  reward,
}: DailyCompletionModalProps) {
  const { colors, getFontSize } = useTheme();
  const styles = getStyles(colors, getFontSize);

  // Animaciones
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const streakScaleAnim = useRef(new Animated.Value(0)).current;
  const gemsScaleAnim = useRef(new Animated.Value(0)).current;
  const gemsRotateAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      streakScaleAnim.setValue(0);
      gemsScaleAnim.setValue(0);
      gemsRotateAnim.setValue(0);
      shimmerAnim.setValue(0);
      bounceAnim.setValue(0);

      // Secuencia de animaciones
      Animated.sequence([
        // 1. Modal aparece con bounce
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }),
        // 2. Número de racha aparece
        Animated.spring(streakScaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 120,
          useNativeDriver: true,
        }),
      ]).start();

      // 3. Animación de gemas (si hay gemas ganadas)
      if (reward.totalGemsEarned > 0) {
        Animated.sequence([
          Animated.delay(600),
          Animated.parallel([
            // Escala con bounce
            Animated.spring(gemsScaleAnim, {
              toValue: 1,
              friction: 4,
              tension: 100,
              useNativeDriver: true,
            }),
            // Rotación sutil
            Animated.sequence([
              Animated.timing(gemsRotateAnim, {
                toValue: 1,
                duration: 150,
                easing: Easing.ease,
                useNativeDriver: true,
              }),
              Animated.timing(gemsRotateAnim, {
                toValue: -1,
                duration: 150,
                easing: Easing.ease,
                useNativeDriver: true,
              }),
              Animated.timing(gemsRotateAnim, {
                toValue: 0,
                duration: 150,
                easing: Easing.ease,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ]).start();

        // Shimmer continuo para las gemas
        Animated.loop(
          Animated.sequence([
            Animated.timing(shimmerAnim, {
              toValue: 1,
              duration: 1500,
              easing: Easing.ease,
              useNativeDriver: true,
            }),
            Animated.timing(shimmerAnim, {
              toValue: 0,
              duration: 1500,
              easing: Easing.ease,
              useNativeDriver: true,
            }),
          ]),
        ).start();
      }

      // Bounce sutil continuo para el ícono de fuego
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -5,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }

    // Cleanup: detener todas las animaciones cuando el modal se cierra
    return () => {
      scaleAnim.stopAnimation();
      streakScaleAnim.stopAnimation();
      gemsScaleAnim.stopAnimation();
      gemsRotateAnim.stopAnimation();
      shimmerAnim.stopAnimation();
      bounceAnim.stopAnimation();
    };
    // Las Animated.Value refs son estables y no necesitan estar en dependencias
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, reward.totalGemsEarned]);

  const gemsRotation = gemsRotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-10deg', '0deg', '10deg'],
  });

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Contenido principal */}
          <View style={styles.content}>
            {/* Icono de fuego animado */}
            <Animated.View
              style={[
                styles.fireContainer,
                {
                  transform: [
                    { translateY: bounceAnim },
                    { scale: streakScaleAnim },
                  ],
                },
              ]}
            >
              <Flame
                size={56}
                color={STREAK_COLORS.fire}
                fill={STREAK_COLORS.fire}
              />
            </Animated.View>

            {/* Título de celebración */}
            <Text style={styles.title}>
              {reward.goalCompleted
                ? '🎉 ¡Meta Completada!'
                : '¡Día Completado!'}
            </Text>

            {/* Número de racha */}
            <Animated.View
              style={[
                styles.streakBadge,
                { transform: [{ scale: streakScaleAnim }] },
              ]}
            >
              <Text style={styles.streakNumber}>{reward.newStreak}</Text>
              <Text style={styles.streakLabel}>
                {reward.newStreak === 1 ? 'día de racha' : 'días de racha'}
              </Text>
            </Animated.View>

            {/* Si completó la meta de días */}
            {reward.goalCompleted && reward.goalTitle && (
              <View style={styles.goalCompletedBadge}>
                <Trophy size={20} color={STREAK_COLORS.gems} />
                <Text style={styles.goalCompletedText}>{reward.goalTitle}</Text>
              </View>
            )}

            {/* Sección de gemas ganadas */}
            {reward.totalGemsEarned > 0 && (
              <Animated.View
                style={[
                  styles.gemsContainer,
                  {
                    transform: [
                      { scale: gemsScaleAnim },
                      { rotate: gemsRotation },
                    ],
                  },
                ]}
              >
                <Animated.View style={{ opacity: shimmerOpacity }}>
                  <Sparkles
                    size={16}
                    color={STREAK_COLORS.gems}
                    style={styles.sparkleLeft}
                  />
                </Animated.View>

                <Gem size={32} color={STREAK_COLORS.gems} />

                <Text style={styles.gemsEarned}>+{reward.totalGemsEarned}</Text>

                <Animated.View style={{ opacity: shimmerOpacity }}>
                  <Sparkles
                    size={16}
                    color={STREAK_COLORS.gems}
                    style={styles.sparkleRight}
                  />
                </Animated.View>
              </Animated.View>
            )}

            {/* Desglose de gemas (si hay múltiples fuentes) */}
            {reward.totalGemsEarned > 0 && (
              <View style={styles.gemsBreakdown}>
                {reward.intervalGemsEarned > 0 && (
                  <Text style={styles.gemsBreakdownText}>
                    +{reward.intervalGemsEarned} por racha de {reward.newStreak}{' '}
                    días
                  </Text>
                )}
                {reward.goalGemsEarned > 0 && (
                  <Text style={styles.gemsBreakdownText}>
                    +{reward.goalGemsEarned} por completar meta
                  </Text>
                )}
              </View>
            )}

            {/* Info de próximos hitos */}
            {!reward.goalCompleted && (
              <View style={styles.nextMilestones}>
                {reward.daysToNextGoal > 0 && (
                  <View style={styles.milestoneItem}>
                    <Target size={16} color={colors.accent} />
                    <Text style={styles.milestoneText}>
                      {reward.daysToNextGoal} días para tu meta
                    </Text>
                  </View>
                )}
                {reward.daysToNextInterval > 0 &&
                  reward.daysToNextInterval < 5 && (
                    <View style={styles.milestoneItem}>
                      <Gem size={16} color={STREAK_COLORS.gems} />
                      <Text style={styles.milestoneText}>
                        {reward.daysToNextInterval} días para +10 gemas
                      </Text>
                    </View>
                  )}
              </View>
            )}

            {/* Mensaje motivacional */}
            <Text style={styles.motivationalText}>
              {reward.goalCompleted
                ? '¡Increíble dedicación! Sigue construyendo tu hábito de lectura.'
                : '¡Excelente! Cada día cuenta para construir tu hábito.'}
            </Text>

            {/* Botón de continuar */}
            <Pressable
              style={({ pressed }) => [
                styles.continueButton,
                pressed && { opacity: 0.8 },
              ]}
              onPress={onClose}
            >
              <Text style={styles.continueButtonText}>¡Genial!</Text>
            </Pressable>
          </View>
        </Animated.View>
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
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    container: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 28,
      width: '100%',
      maxWidth: 340,
      overflow: 'hidden',
    },
    content: {
      padding: 28,
      alignItems: 'center',
    },
    fireContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: `${STREAK_COLORS.fire}20`,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: getFontSize(22),
      fontWeight: '800',
      color: colors.headerText,
      textAlign: 'center',
      marginBottom: 16,
    },
    streakBadge: {
      alignItems: 'center',
      marginBottom: 16,
    },
    streakNumber: {
      fontSize: getFontSize(52),
      fontWeight: '900',
      color: STREAK_COLORS.fire,
      lineHeight: getFontSize(56),
    },
    streakLabel: {
      fontSize: getFontSize(14),
      color: colors.placeholderText,
      marginTop: -4,
    },
    goalCompletedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: `${STREAK_COLORS.gems}15`,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 20,
      marginBottom: 16,
      gap: 8,
    },
    goalCompletedText: {
      fontSize: getFontSize(14),
      fontWeight: '700',
      color: STREAK_COLORS.gems,
    },
    gemsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: `${STREAK_COLORS.gems}15`,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 20,
      marginBottom: 8,
      gap: 8,
    },
    sparkleLeft: {
      marginRight: -4,
    },
    sparkleRight: {
      marginLeft: -4,
    },
    gemsEarned: {
      fontSize: getFontSize(28),
      fontWeight: '900',
      color: STREAK_COLORS.gems,
    },
    gemsBreakdown: {
      alignItems: 'center',
      marginBottom: 16,
    },
    gemsBreakdownText: {
      fontSize: getFontSize(12),
      color: colors.placeholderText,
      fontStyle: 'italic',
    },
    nextMilestones: {
      width: '100%',
      backgroundColor: colors.surfaceMuted,
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
      gap: 8,
    },
    milestoneItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    milestoneText: {
      fontSize: getFontSize(13),
      color: colors.bodyText,
    },
    motivationalText: {
      fontSize: getFontSize(13),
      color: colors.placeholderText,
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: getFontSize(19),
    },
    continueButton: {
      backgroundColor: STREAK_COLORS.fire,
      paddingVertical: 16,
      paddingHorizontal: 48,
      borderRadius: 16,
      width: '100%',
    },
    continueButtonText: {
      fontSize: getFontSize(16),
      fontWeight: '700',
      color: 'white',
      textAlign: 'center',
    },
  });
