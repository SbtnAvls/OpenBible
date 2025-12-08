import React, { useState, useMemo, useCallback } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Flame, Gem, Shield, Trophy, Target, Clock, ChevronRight } from "lucide-react-native";
import { useTheme, type ThemeColors } from "../context/ThemeContext";
import { useStreak } from "../context/StreakContext";
import { StreakCalendar } from "../components/StreakCalendar";
import { GoalCard } from "../components/GoalCard";
import { ShopItemCard } from "../components/ShopItemCard";
import { ChangeGoalModal } from "../components/ChangeGoalModal";
import {
  STREAK_COLORS,
  GOAL_BONUS,
  MAX_FREEZES,
} from "../types/streak";

export function StreakScreen() {
  const { colors, getFontSize } = useTheme();
  const styles = getStyles(colors, getFontSize);

  const {
    streakData,
    settings,
    getTodayProgress,
    getRemainingMinutes,
    getGoalProgress,
    getDaysToGoal,
    canPurchase,
    purchaseItem,
    setStreakGoal,
    goals,
    shopItems,
  } = useStreak();

  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [showChangeGoalModal, setShowChangeGoalModal] = useState(false);

  const todayProgress = getTodayProgress();
  const remainingMinutes = getRemainingMinutes();
  const goalProgress = getGoalProgress();
  const daysToGoal = getDaysToGoal();

  // Calcular bonus de gemas por la meta actual
  const currentGoalBonus = useMemo(() => {
    return GOAL_BONUS[settings.streakGoalDays] || 0;
  }, [settings.streakGoalDays]);

  const handlePurchase = useCallback((itemId: string) => {
    const item = shopItems.find((i) => i.id === itemId);
    if (!item) return;

    // Verificar límite
    if (streakData.availableFreezes >= MAX_FREEZES) {
      Alert.alert(
        "Límite Alcanzado",
        `Ya tienes el máximo de ${MAX_FREEZES} protectores. Úsalos antes de comprar más.`
      );
      return;
    }

    Alert.alert(
      "Confirmar Compra",
      `¿Comprar ${item.name} por ${item.price} gemas?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Comprar",
          onPress: () => {
            const success = purchaseItem(itemId);
            if (success) {
              Alert.alert("Compra Exitosa", `Has obtenido ${item.quantity} protector(es).`);
            } else {
              Alert.alert("Error", "No se pudo completar la compra.");
            }
          },
        },
      ]
    );
  }, [shopItems, purchaseItem, streakData.availableFreezes]);

  const handleChangeGoal = useCallback(() => {
    setShowChangeGoalModal(true);
  }, []);

  const handleConfirmGoalChange = useCallback((days: number) => {
    setStreakGoal(days);
    setShowChangeGoalModal(false);
  }, [setStreakGoal]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header con racha actual */}
      <View style={styles.streakHeader}>
        <View style={styles.streakFireContainer}>
          <Flame
            size={64}
            color={streakData.currentStreak > 0 ? STREAK_COLORS.fire : colors.placeholderText}
            fill={streakData.currentStreak > 0 ? STREAK_COLORS.fire : "transparent"}
          />
        </View>
        <Text style={styles.streakNumber}>{streakData.currentStreak}</Text>
        <Text style={styles.streakLabel}>
          {streakData.currentStreak === 1 ? "día de racha" : "días de racha"}
        </Text>
        {streakData.longestStreak > streakData.currentStreak && (
          <Text style={styles.bestStreakText}>
            Mejor racha: {streakData.longestStreak} días
          </Text>
        )}
      </View>

      {/* Progreso del día */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progreso de Hoy</Text>
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={styles.progressInfo}>
              <Clock size={18} color={colors.placeholderText} />
              <Text style={styles.progressText}>
                {streakData.todayCompleted
                  ? "Meta completada"
                  : `${remainingMinutes} min restantes`}
              </Text>
            </View>
            <Text style={styles.progressPercentage}>{Math.round(todayProgress)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(100, todayProgress)}%`,
                  backgroundColor: streakData.todayCompleted
                    ? STREAK_COLORS.completed
                    : colors.accent,
                },
              ]}
            />
          </View>
          <Text style={styles.goalDescription}>
            Meta diaria: {settings.dailyGoalMinutes} minutos
          </Text>
        </View>
      </View>

      {/* Inventario */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mi Inventario</Text>
        <View style={styles.inventoryRow}>
          <View style={styles.inventoryCard}>
            <Gem size={28} color={STREAK_COLORS.gems} />
            <Text style={styles.inventoryValue}>{streakData.currentGems}</Text>
            <Text style={styles.inventoryLabel}>Gemas</Text>
          </View>
          <View style={styles.inventoryCard}>
            <Shield size={28} color={STREAK_COLORS.frozen} />
            <Text style={styles.inventoryValue}>{streakData.availableFreezes}</Text>
            <Text style={styles.inventoryLabel}>
              Protectores ({MAX_FREEZES} máx)
            </Text>
          </View>
        </View>
      </View>

      {/* Calendario */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mi Calendario</Text>
        <StreakCalendar
          history={streakData.streakHistory}
          currentMonth={viewMonth}
          currentYear={viewYear}
          onMonthChange={(year, month) => {
            setViewYear(year);
            setViewMonth(month);
          }}
          todayCompleted={streakData.todayCompleted}
        />
      </View>

      {/* Meta actual */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mi Meta</Text>
          <Pressable
            style={({ pressed }) => [
              styles.changeGoalButton,
              pressed && { opacity: 0.7 },
            ]}
            onPress={handleChangeGoal}
          >
            <Text style={styles.changeGoalText}>Cambiar</Text>
            <ChevronRight size={16} color={colors.accent} />
          </Pressable>
        </View>

        <View style={styles.currentGoalCard}>
          <View style={styles.goalIconContainer}>
            <Target size={32} color={colors.accent} />
          </View>
          <View style={styles.goalInfo}>
            <Text style={styles.goalTitle}>
              Meta: {settings.streakGoalDays} días
            </Text>
            <Text style={styles.goalProgress}>
              {goalProgress.current} / {goalProgress.target} días completados
            </Text>
            {daysToGoal > 0 && (
              <Text style={styles.goalRemaining}>
                Faltan {daysToGoal} días para el bonus
              </Text>
            )}
          </View>
          <View style={styles.goalReward}>
            <Gem size={18} color={STREAK_COLORS.gems} />
            <Text style={styles.goalRewardText}>+{currentGoalBonus}</Text>
          </View>
        </View>

        {/* Barra de progreso de la meta */}
        <View style={styles.goalProgressBar}>
          <View
            style={[
              styles.goalProgressFill,
              { width: `${goalProgress.percentage}%` },
            ]}
          />
        </View>
        <Text style={styles.goalPercentage}>
          {Math.round(goalProgress.percentage)}% completado
        </Text>
      </View>

      {/* Metas históricas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Logros</Text>
        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            isCompleted={streakData.currentStreak >= goal.targetDays}
            currentStreak={streakData.currentStreak}
          />
        ))}
      </View>

      {/* Tienda */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tienda</Text>
        <Text style={styles.sectionSubtitle}>
          Compra protectores con tus gemas
        </Text>
        {shopItems.map((item) => (
          <ShopItemCard
            key={item.id}
            item={item}
            canPurchase={canPurchase(item.id)}
            onPurchase={() => handlePurchase(item.id)}
          />
        ))}
        {streakData.availableFreezes >= MAX_FREEZES && (
          <Text style={styles.maxFreezesWarning}>
            Ya tienes el máximo de protectores ({MAX_FREEZES})
          </Text>
        )}
      </View>

      {/* Estadísticas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estadísticas</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Trophy size={24} color={STREAK_COLORS.completed} />
            <Text style={styles.statValue}>{streakData.longestStreak}</Text>
            <Text style={styles.statLabel}>Mejor racha</Text>
          </View>
          <View style={styles.statCard}>
            <Gem size={24} color={STREAK_COLORS.gems} />
            <Text style={styles.statValue}>{streakData.totalGemsEarned}</Text>
            <Text style={styles.statLabel}>Gemas totales</Text>
          </View>
          <View style={styles.statCard}>
            <Flame size={24} color={STREAK_COLORS.fire} />
            <Text style={styles.statValue}>{streakData.currentStreak}</Text>
            <Text style={styles.statLabel}>Racha actual</Text>
          </View>
        </View>
      </View>

      {/* Info de protectores */}
      {streakData.availableFreezes > 0 && (
        <View style={styles.freezeInfoBox}>
          <Shield size={20} color={STREAK_COLORS.frozen} />
          <Text style={styles.freezeInfoText}>
            Tienes {streakData.availableFreezes} protector{streakData.availableFreezes > 1 ? "es" : ""} que se usarán automáticamente si faltas un día
          </Text>
        </View>
      )}

      {/* Espacio al final */}
      <View style={styles.bottomSpacer} />

      {/* Modal para cambiar meta */}
      <ChangeGoalModal
        visible={showChangeGoalModal}
        onClose={() => setShowChangeGoalModal(false)}
        onConfirm={handleConfirmGoalChange}
        currentGoalDays={settings.streakGoalDays}
        currentProgress={streakData.currentStreak - streakData.currentGoalStartStreak}
      />
    </ScrollView>
  );
}

const getStyles = (colors: ThemeColors, getFontSize: (size: number) => number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
    },
    contentContainer: {
      paddingHorizontal: 20,
    },
    // Header
    streakHeader: {
      alignItems: "center",
      paddingVertical: 24,
    },
    streakFireContainer: {
      marginBottom: 8,
    },
    streakNumber: {
      fontSize: getFontSize(56),
      fontWeight: "800",
      color: colors.headerText,
      lineHeight: getFontSize(64),
    },
    streakLabel: {
      fontSize: getFontSize(16),
      color: colors.placeholderText,
      marginTop: -4,
    },
    bestStreakText: {
      fontSize: getFontSize(13),
      color: STREAK_COLORS.completed,
      marginTop: 8,
      fontWeight: "600",
    },
    // Secciones
    section: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    sectionTitle: {
      fontSize: getFontSize(18),
      fontWeight: "700",
      color: colors.headerText,
      marginBottom: 12,
    },
    sectionSubtitle: {
      fontSize: getFontSize(13),
      color: colors.placeholderText,
      marginTop: -8,
      marginBottom: 12,
    },
    // Progreso del día
    progressCard: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: 16,
      padding: 16,
    },
    progressHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    progressInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    progressText: {
      fontSize: getFontSize(14),
      color: colors.bodyText,
      fontWeight: "500",
    },
    progressPercentage: {
      fontSize: getFontSize(16),
      fontWeight: "700",
      color: colors.accent,
    },
    progressBar: {
      height: 8,
      backgroundColor: colors.divider,
      borderRadius: 4,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: 4,
    },
    goalDescription: {
      fontSize: getFontSize(12),
      color: colors.placeholderText,
      marginTop: 8,
      textAlign: "center",
    },
    // Inventario
    inventoryRow: {
      flexDirection: "row",
      gap: 12,
    },
    inventoryCard: {
      flex: 1,
      backgroundColor: colors.surfaceMuted,
      borderRadius: 16,
      padding: 16,
      alignItems: "center",
      gap: 8,
    },
    inventoryValue: {
      fontSize: getFontSize(24),
      fontWeight: "800",
      color: colors.headerText,
    },
    inventoryLabel: {
      fontSize: getFontSize(12),
      color: colors.placeholderText,
      textAlign: "center",
    },
    // Meta actual
    changeGoalButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    changeGoalText: {
      fontSize: getFontSize(14),
      color: colors.accent,
      fontWeight: "600",
    },
    currentGoalCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surfaceMuted,
      borderRadius: 16,
      padding: 16,
    },
    goalIconContainer: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.accentSubtle,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    goalInfo: {
      flex: 1,
    },
    goalTitle: {
      fontSize: getFontSize(16),
      fontWeight: "700",
      color: colors.headerText,
    },
    goalProgress: {
      fontSize: getFontSize(13),
      color: colors.bodyText,
      marginTop: 2,
    },
    goalRemaining: {
      fontSize: getFontSize(12),
      color: colors.placeholderText,
      marginTop: 2,
    },
    goalReward: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: `${STREAK_COLORS.gems}20`,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      gap: 4,
    },
    goalRewardText: {
      fontSize: getFontSize(14),
      fontWeight: "700",
      color: STREAK_COLORS.gems,
    },
    goalProgressBar: {
      height: 6,
      backgroundColor: colors.divider,
      borderRadius: 3,
      overflow: "hidden",
      marginTop: 12,
    },
    goalProgressFill: {
      height: "100%",
      backgroundColor: colors.accent,
      borderRadius: 3,
    },
    goalPercentage: {
      fontSize: getFontSize(12),
      color: colors.placeholderText,
      textAlign: "center",
      marginTop: 6,
    },
    // Estadísticas
    statsGrid: {
      flexDirection: "row",
      gap: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.surfaceMuted,
      borderRadius: 16,
      padding: 14,
      alignItems: "center",
      gap: 6,
    },
    statValue: {
      fontSize: getFontSize(20),
      fontWeight: "800",
      color: colors.headerText,
    },
    statLabel: {
      fontSize: getFontSize(11),
      color: colors.placeholderText,
      textAlign: "center",
    },
    // Advertencia de protectores
    maxFreezesWarning: {
      fontSize: getFontSize(12),
      color: colors.placeholderText,
      textAlign: "center",
      marginTop: 8,
      fontStyle: "italic",
    },
    // Botón de protector
    freezeInfoBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: `${STREAK_COLORS.frozen}15`,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      gap: 12,
      marginBottom: 16,
    },
    freezeInfoText: {
      flex: 1,
      fontSize: getFontSize(14),
      color: STREAK_COLORS.frozen,
      lineHeight: getFontSize(20),
    },
    // Espaciador
    bottomSpacer: {
      height: 40,
    },
  });
