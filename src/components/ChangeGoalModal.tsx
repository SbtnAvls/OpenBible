import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';
import { Target, AlertTriangle, Check, Gem } from 'lucide-react-native';
import { useTheme, type ThemeColors } from '../context/ThemeContext';
import {
  STREAK_GOAL_OPTIONS,
  GOAL_BONUS,
  STREAK_COLORS,
} from '../types/streak';

interface ChangeGoalModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (days: number) => void;
  currentGoalDays: number;
  currentProgress: number; // días de progreso actual hacia la meta
}

export function ChangeGoalModal({
  visible,
  onClose,
  onConfirm,
  currentGoalDays,
  currentProgress,
}: ChangeGoalModalProps) {
  const { colors, getFontSize } = useTheme();
  const styles = getStyles(colors, getFontSize);
  const [selectedGoal, setSelectedGoal] = useState<number | null>(null);

  const handleConfirm = () => {
    if (selectedGoal !== null) {
      onConfirm(selectedGoal);
      setSelectedGoal(null);
    }
  };

  const handleClose = () => {
    setSelectedGoal(null);
    onClose();
  };

  // Verificar si cambiar a esta meta perdería progreso
  const wouldLoseProgress = (days: number) => currentProgress >= days;

  // Calcular nuevo progreso si cambia a esta meta
  const getNewProgress = (days: number) => {
    if (wouldLoseProgress(days)) return 0;
    return currentProgress;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Target size={32} color={colors.accent} />
            </View>
            <Text style={styles.title}>Cambiar Meta</Text>
            <Text style={styles.subtitle}>
              Meta actual: {currentGoalDays} días ({currentProgress}/
              {currentGoalDays} completados)
            </Text>
          </View>

          {/* Lista de metas */}
          <ScrollView
            style={styles.optionsList}
            contentContainerStyle={styles.optionsListContent}
            showsVerticalScrollIndicator={false}
          >
            {STREAK_GOAL_OPTIONS.map(days => {
              const isCurrentGoal = days === currentGoalDays;
              const isSelected = days === selectedGoal;
              const willLoseProgress = wouldLoseProgress(days);
              const newProgress = getNewProgress(days);
              const bonus = GOAL_BONUS[days] || 0;

              return (
                <Pressable
                  key={days}
                  style={[
                    styles.optionCard,
                    isCurrentGoal && styles.optionCardCurrent,
                    isSelected && styles.optionCardSelected,
                    willLoseProgress &&
                      !isCurrentGoal &&
                      styles.optionCardWarning,
                  ]}
                  onPress={() => !isCurrentGoal && setSelectedGoal(days)}
                  disabled={isCurrentGoal}
                >
                  <View style={styles.optionContent}>
                    <View style={styles.optionHeader}>
                      <Text
                        style={[
                          styles.optionDays,
                          isCurrentGoal && styles.optionTextCurrent,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {days} días
                      </Text>
                      {isCurrentGoal && (
                        <View style={styles.currentBadge}>
                          <Text style={styles.currentBadgeText}>Actual</Text>
                        </View>
                      )}
                      {isSelected && <Check size={20} color={colors.accent} />}
                    </View>

                    <View style={styles.optionDetails}>
                      <View style={styles.gemReward}>
                        <Gem size={14} color={STREAK_COLORS.gems} />
                        <Text style={styles.gemRewardText}>+{bonus} gemas</Text>
                      </View>

                      {!isCurrentGoal && (
                        <Text
                          style={[
                            styles.progressPreview,
                            willLoseProgress && styles.progressPreviewWarning,
                          ]}
                        >
                          {willLoseProgress
                            ? `Progreso: 0/${days}`
                            : `Progreso: ${newProgress}/${days}`}
                        </Text>
                      )}
                    </View>

                    {/* Advertencia de pérdida de progreso */}
                    {willLoseProgress && !isCurrentGoal && (
                      <View style={styles.warningContainer}>
                        <AlertTriangle size={14} color={STREAK_COLORS.atRisk} />
                        <Text style={styles.warningText}>
                          Tu progreso se reiniciará
                        </Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Advertencia detallada si hay pérdida de progreso */}
          {selectedGoal && wouldLoseProgress(selectedGoal) && (
            <View style={styles.warningBox}>
              <AlertTriangle size={20} color={STREAK_COLORS.atRisk} />
              <Text style={styles.warningBoxText}>
                Ya tienes {currentProgress} días de progreso. Al cambiar a una
                meta de {selectedGoal} días, tu progreso se reiniciará a 0 para
                evitar completar la meta instantáneamente.
              </Text>
            </View>
          )}

          {/* Botones */}
          <View style={styles.buttons}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                pressed && { opacity: 0.7 },
              ]}
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.confirmButton,
                selectedGoal === null && styles.buttonDisabled,
                pressed && selectedGoal !== null && { opacity: 0.8 },
              ]}
              onPress={handleConfirm}
              disabled={selectedGoal === null}
            >
              <Text
                style={[
                  styles.confirmButtonText,
                  selectedGoal === null && styles.buttonTextDisabled,
                ]}
              >
                Confirmar
              </Text>
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
      maxWidth: 400,
      maxHeight: '80%',
      overflow: 'hidden',
    },
    header: {
      alignItems: 'center',
      padding: 24,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    iconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.accentSubtle,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    title: {
      fontSize: getFontSize(20),
      fontWeight: '700',
      color: colors.headerText,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: getFontSize(14),
      color: colors.placeholderText,
      textAlign: 'center',
    },
    optionsList: {
      flexGrow: 0,
      flexShrink: 1,
    },
    optionsListContent: {
      padding: 16,
      paddingBottom: 8,
    },
    optionCard: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: 12,
      padding: 16,
      marginBottom: 10,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    optionCardCurrent: {
      opacity: 0.5,
      borderColor: colors.divider,
    },
    optionCardSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSubtle,
    },
    optionCardWarning: {
      borderColor: `${STREAK_COLORS.atRisk}40`,
    },
    optionContent: {
      gap: 8,
    },
    optionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    optionDays: {
      fontSize: getFontSize(18),
      fontWeight: '700',
      color: colors.headerText,
    },
    optionTextCurrent: {
      color: colors.placeholderText,
    },
    optionTextSelected: {
      color: colors.accent,
    },
    currentBadge: {
      backgroundColor: colors.divider,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    currentBadgeText: {
      fontSize: getFontSize(11),
      fontWeight: '600',
      color: colors.placeholderText,
    },
    optionDetails: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    gemReward: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    gemRewardText: {
      fontSize: getFontSize(13),
      fontWeight: '600',
      color: STREAK_COLORS.gems,
    },
    progressPreview: {
      fontSize: getFontSize(12),
      color: colors.placeholderText,
    },
    progressPreviewWarning: {
      color: STREAK_COLORS.atRisk,
    },
    warningContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
    },
    warningText: {
      fontSize: getFontSize(12),
      color: STREAK_COLORS.atRisk,
      fontWeight: '500',
    },
    warningBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: `${STREAK_COLORS.atRisk}15`,
      marginHorizontal: 16,
      marginBottom: 16,
      padding: 12,
      borderRadius: 12,
    },
    warningBoxText: {
      flex: 1,
      fontSize: getFontSize(13),
      color: STREAK_COLORS.atRisk,
      lineHeight: getFontSize(18),
    },
    buttons: {
      flexDirection: 'row',
      padding: 16,
      paddingTop: 8,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    button: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
      backgroundColor: colors.surfaceMuted,
    },
    cancelButtonText: {
      fontSize: getFontSize(15),
      fontWeight: '600',
      color: colors.bodyText,
    },
    confirmButton: {
      backgroundColor: colors.accent,
    },
    confirmButtonText: {
      fontSize: getFontSize(15),
      fontWeight: '600',
      color: 'white',
    },
    buttonDisabled: {
      backgroundColor: colors.divider,
    },
    buttonTextDisabled: {
      color: colors.placeholderText,
    },
  });
