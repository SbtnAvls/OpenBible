import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Flame, Clock, Target, ChevronRight, Check } from 'lucide-react-native';
import { useTheme, type ThemeColors } from '../context/ThemeContext';
import {
  DAILY_GOAL_OPTIONS,
  STREAK_GOALS,
  STREAK_COLORS,
} from '../types/streak';

interface StreakOnboardingModalProps {
  visible: boolean;
  onComplete: (dailyGoal: number, streakGoal: number) => void;
}

type OnboardingStep = 'intro' | 'daily-goal' | 'streak-goal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function StreakOnboardingModal({
  visible,
  onComplete,
}: StreakOnboardingModalProps) {
  const { colors, getFontSize } = useTheme();
  const styles = getStyles(colors, getFontSize);

  const [step, setStep] = useState<OnboardingStep>('intro');
  const [selectedDailyGoal, setSelectedDailyGoal] = useState<number>(5);
  const [selectedStreakGoal, setSelectedStreakGoal] = useState<number>(10);

  const handleNext = () => {
    if (step === 'intro') {
      setStep('daily-goal');
    } else if (step === 'daily-goal') {
      setStep('streak-goal');
    } else {
      onComplete(selectedDailyGoal, selectedStreakGoal);
      // Reset for next time
      setStep('intro');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Pantalla 1: Introducción */}
          {step === 'intro' && (
            <View style={styles.stepContainer}>
              <View style={styles.iconContainer}>
                <Flame size={64} color={STREAK_COLORS.fire} />
              </View>

              <Text style={styles.title}>¡Comienza tu Racha de Lectura!</Text>

              <Text style={styles.description}>
                Mantén una racha leyendo la Biblia todos los días. Gana gemas
                gratis al alcanzar tus metas de lectura y úsalas para proteger
                tu racha en días difíciles.
              </Text>

              <Text style={styles.freeNote}>
                Las gemas se obtienen únicamente leyendo, sin compras.
              </Text>

              <View style={styles.featureList}>
                <View style={styles.featureItem}>
                  <Clock size={20} color={colors.accent} />
                  <Text style={styles.featureText}>
                    Define cuántos minutos quieres leer al día
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Target size={20} color={colors.accent} />
                  <Text style={styles.featureText}>
                    Establece metas y gana gemas al completarlas
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Flame size={20} color={STREAK_COLORS.fire} />
                  <Text style={styles.featureText}>
                    Construye el hábito de lectura diaria
                  </Text>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={handleNext}
              >
                <Text style={styles.primaryButtonText}>Continuar</Text>
                <ChevronRight size={20} color="white" />
              </Pressable>
            </View>
          )}

          {/* Pantalla 2: Meta Diaria */}
          {step === 'daily-goal' && (
            <View style={styles.stepContainer}>
              <View style={styles.iconContainer}>
                <Clock size={48} color={colors.accent} />
              </View>

              <Text style={styles.title}>
                ¿Cuántos minutos quieres leer cada día?
              </Text>

              <Text style={styles.subtitle}>
                Elige un tiempo que puedas mantener consistentemente
              </Text>

              <ScrollView
                style={styles.optionsScrollView}
                contentContainerStyle={styles.optionsGrid}
                showsVerticalScrollIndicator={false}
              >
                {DAILY_GOAL_OPTIONS.map(minutes => (
                  <Pressable
                    key={minutes}
                    style={({ pressed }) => [
                      styles.optionCard,
                      selectedDailyGoal === minutes &&
                        styles.optionCardSelected,
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={() => setSelectedDailyGoal(minutes)}
                  >
                    <Text
                      style={[
                        styles.optionValue,
                        selectedDailyGoal === minutes &&
                          styles.optionValueSelected,
                      ]}
                    >
                      {minutes}
                    </Text>
                    <Text
                      style={[
                        styles.optionLabel,
                        selectedDailyGoal === minutes &&
                          styles.optionLabelSelected,
                      ]}
                    >
                      minutos
                    </Text>
                    {selectedDailyGoal === minutes && (
                      <View style={styles.checkmark}>
                        <Check size={16} color="white" />
                      </View>
                    )}
                  </Pressable>
                ))}
              </ScrollView>

              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={handleNext}
              >
                <Text style={styles.primaryButtonText}>Siguiente</Text>
                <ChevronRight size={20} color="white" />
              </Pressable>
            </View>
          )}

          {/* Pantalla 3: Meta de Racha */}
          {step === 'streak-goal' && (
            <View style={styles.stepContainer}>
              <View style={styles.iconContainer}>
                <Target size={48} color={colors.accent} />
              </View>

              <Text style={styles.title}>¿Cuál es tu primera meta?</Text>

              <Text style={styles.subtitle}>
                Al completarla ganarás gemas gratis como recompensa por tu
                dedicación
              </Text>

              <Text style={styles.freeNote}>
                Las gemas se obtienen únicamente leyendo, sin compras ni micro
                transacciones.
              </Text>

              <ScrollView
                style={styles.goalScrollView}
                contentContainerStyle={styles.goalOptionsContainer}
                showsVerticalScrollIndicator={true}
                persistentScrollbar={true}
              >
                {STREAK_GOALS.map(goal => (
                  <Pressable
                    key={goal.id}
                    style={({ pressed }) => [
                      styles.goalCard,
                      selectedStreakGoal === goal.targetDays &&
                        styles.goalCardSelected,
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={() => setSelectedStreakGoal(goal.targetDays)}
                  >
                    <View style={styles.goalInfo}>
                      <Text
                        style={[
                          styles.goalDays,
                          selectedStreakGoal === goal.targetDays &&
                            styles.goalDaysSelected,
                        ]}
                      >
                        {goal.targetDays} días
                      </Text>
                      <Text
                        style={[
                          styles.goalTitle,
                          selectedStreakGoal === goal.targetDays &&
                            styles.goalTitleSelected,
                        ]}
                      >
                        {goal.title}
                      </Text>
                    </View>
                    <View style={styles.goalReward}>
                      <Text style={styles.goalGems}>+{goal.gemsReward}</Text>
                      <Text style={styles.goalGemsLabel}>gemas</Text>
                    </View>
                    {selectedStreakGoal === goal.targetDays && (
                      <View style={styles.checkmarkGoal}>
                        <Check size={16} color="white" />
                      </View>
                    )}
                  </Pressable>
                ))}
              </ScrollView>

              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  styles.startButton,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={handleNext}
              >
                <Flame size={20} color="white" />
                <Text style={styles.primaryButtonText}>¡Empezar!</Text>
              </Pressable>
            </View>
          )}

          {/* Indicadores de paso */}
          <View style={styles.stepIndicators}>
            <View
              style={[styles.stepDot, step === 'intro' && styles.stepDotActive]}
            />
            <View
              style={[
                styles.stepDot,
                step === 'daily-goal' && styles.stepDotActive,
              ]}
            />
            <View
              style={[
                styles.stepDot,
                step === 'streak-goal' && styles.stepDotActive,
              ]}
            />
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
      maxWidth: 400,
      maxHeight: '85%',
      overflow: 'hidden',
    },
    stepContainer: {
      padding: 24,
      alignItems: 'center',
    },
    iconContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.surfaceMuted,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: getFontSize(22),
      fontWeight: '700',
      color: colors.headerText,
      textAlign: 'center',
      marginBottom: 12,
    },
    subtitle: {
      fontSize: getFontSize(14),
      color: colors.placeholderText,
      textAlign: 'center',
      marginBottom: 20,
    },
    description: {
      fontSize: getFontSize(15),
      color: colors.bodyText,
      textAlign: 'center',
      lineHeight: getFontSize(22),
      marginBottom: 8,
    },
    freeNote: {
      fontSize: getFontSize(12),
      color: colors.placeholderText,
      textAlign: 'center',
      fontStyle: 'italic',
      marginBottom: 12,
      paddingHorizontal: 16,
    },
    goalScrollView: {
      maxHeight: 240,
      width: '100%',
      paddingRight: 8,
    },
    featureList: {
      width: '100%',
      marginBottom: 24,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.surfaceMuted,
      borderRadius: 12,
      marginBottom: 10,
    },
    featureText: {
      fontSize: getFontSize(14),
      color: colors.bodyText,
      marginLeft: 12,
      flex: 1,
    },
    optionsScrollView: {
      maxHeight: 280,
      width: '100%',
    },
    optionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 12,
      paddingBottom: 16,
    },
    optionCard: {
      width: (SCREEN_WIDTH - 100) / 3,
      maxWidth: 90,
      aspectRatio: 1,
      backgroundColor: colors.surfaceMuted,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    optionCardSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSubtle,
    },
    optionValue: {
      fontSize: getFontSize(24),
      fontWeight: '700',
      color: colors.headerText,
    },
    optionValueSelected: {
      color: colors.accent,
    },
    optionLabel: {
      fontSize: getFontSize(12),
      color: colors.placeholderText,
      marginTop: 2,
    },
    optionLabelSelected: {
      color: colors.accent,
    },
    checkmark: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
    },
    goalOptionsContainer: {
      paddingBottom: 16,
    },
    goalCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceMuted,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    goalCardSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSubtle,
    },
    goalInfo: {
      flex: 1,
    },
    goalDays: {
      fontSize: getFontSize(18),
      fontWeight: '700',
      color: colors.headerText,
    },
    goalDaysSelected: {
      color: colors.accent,
    },
    goalTitle: {
      fontSize: getFontSize(13),
      color: colors.placeholderText,
      marginTop: 2,
    },
    goalTitleSelected: {
      color: colors.accent,
    },
    goalReward: {
      alignItems: 'center',
      backgroundColor: `${STREAK_COLORS.gems}20`,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
    },
    goalGems: {
      fontSize: getFontSize(16),
      fontWeight: '700',
      color: STREAK_COLORS.gems,
    },
    goalGemsLabel: {
      fontSize: getFontSize(11),
      color: STREAK_COLORS.gems,
    },
    checkmarkGoal: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
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
    startButton: {
      backgroundColor: STREAK_COLORS.fire,
    },
    primaryButtonText: {
      fontSize: getFontSize(16),
      fontWeight: '600',
      color: 'white',
    },
    stepIndicators: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      paddingBottom: 20,
    },
    stepDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.divider,
    },
    stepDotActive: {
      backgroundColor: colors.accent,
      width: 24,
    },
  });
