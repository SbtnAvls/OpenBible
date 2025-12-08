import React, { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useTheme, type ThemeColors } from "../context/ThemeContext";
import { STREAK_COLORS, getTodayDateString, type StreakHistoryEntry } from "../types/streak";

interface StreakCalendarProps {
  history: StreakHistoryEntry[];
  currentMonth: number; // 0-11
  currentYear: number;
  onMonthChange: (year: number, month: number) => void;
  todayCompleted?: boolean;
}

const DAYS_OF_WEEK = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export function StreakCalendar({
  history,
  currentMonth,
  currentYear,
  onMonthChange,
  todayCompleted = false,
}: StreakCalendarProps) {
  const { colors, getFontSize } = useTheme();
  const styles = getStyles(colors, getFontSize);

  const today = useMemo(() => new Date(), []);
  const todayString = getTodayDateString();

  const isCurrentMonth = currentYear === today.getFullYear() && currentMonth === today.getMonth();

  // Crear mapa de historial para acceso rápido
  const historyMap = useMemo(() => {
    const map = new Map<string, StreakHistoryEntry>();
    history.forEach((entry) => {
      map.set(entry.date, entry);
    });
    return map;
  }, [history]);

  // Generar días del mes
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Array<{
      day: number | null;
      dateString: string;
      isToday: boolean;
      isFuture: boolean;
      entry: StreakHistoryEntry | null;
    }> = [];

    // Días vacíos al inicio
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({
        day: null,
        dateString: "",
        isToday: false,
        isFuture: false,
        entry: null,
      });
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const isToday = dateString === todayString;
      // Comparar strings directamente (YYYY-MM-DD se ordena correctamente)
      const isFuture = dateString > todayString;
      const entry = historyMap.get(dateString) || null;

      days.push({
        day,
        dateString,
        isToday,
        isFuture,
        entry,
      });
    }

    return days;
  }, [currentYear, currentMonth, historyMap, todayString]);

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      onMonthChange(currentYear - 1, 11);
    } else {
      onMonthChange(currentYear, currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (isCurrentMonth) return;

    if (currentMonth === 11) {
      onMonthChange(currentYear + 1, 0);
    } else {
      onMonthChange(currentYear, currentMonth + 1);
    }
  };

  const getDayStyle = (day: typeof calendarDays[0]) => {
    if (day.day === null) return null;

    if (day.isFuture) {
      return styles.dayFuture;
    }

    if (day.isToday) {
      if (todayCompleted || day.entry?.completed) {
        return styles.dayCompleted;
      }
      return styles.dayToday;
    }

    if (day.entry?.frozen) {
      return styles.dayFrozen;
    }

    if (day.entry?.completed) {
      return styles.dayCompleted;
    }

    return styles.dayMissed;
  };

  const getDayTextStyle = (day: typeof calendarDays[0]) => {
    if (day.day === null) return null;

    if (day.isFuture) {
      return styles.dayTextFuture;
    }

    if (day.entry?.completed || day.entry?.frozen || (day.isToday && todayCompleted)) {
      return styles.dayTextCompleted;
    }

    if (day.isToday) {
      return styles.dayTextToday;
    }

    return styles.dayTextMissed;
  };

  return (
    <View style={styles.container}>
      {/* Header con navegación */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.navButton,
            pressed && { opacity: 0.6 },
          ]}
          onPress={goToPreviousMonth}
        >
          <ChevronLeft size={24} color={colors.headerText} />
        </Pressable>

        <Text style={styles.monthTitle}>
          {MONTH_NAMES[currentMonth]} {currentYear}
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.navButton,
            isCurrentMonth && styles.navButtonDisabled,
            pressed && !isCurrentMonth && { opacity: 0.6 },
          ]}
          onPress={goToNextMonth}
          disabled={isCurrentMonth}
        >
          <ChevronRight
            size={24}
            color={isCurrentMonth ? colors.placeholderText : colors.headerText}
          />
        </Pressable>
      </View>

      {/* Días de la semana */}
      <View style={styles.weekDays}>
        {DAYS_OF_WEEK.map((day) => (
          <Text key={day} style={styles.weekDayText}>
            {day}
          </Text>
        ))}
      </View>

      {/* Grid de días */}
      <View style={styles.daysGrid}>
        {calendarDays.map((day, index) => (
          <View key={index} style={styles.dayCell}>
            {day.day !== null && (
              <View style={[styles.dayCircle, getDayStyle(day)]}>
                <Text style={[styles.dayText, getDayTextStyle(day)]}>
                  {day.day}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Leyenda */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: STREAK_COLORS.completed }]} />
          <Text style={styles.legendText}>Completado</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: STREAK_COLORS.frozen }]} />
          <Text style={styles.legendText}>Protegido</Text>
        </View>
      </View>
    </View>
  );
}

const getStyles = (colors: ThemeColors, getFontSize: (size: number) => number) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: 16,
      padding: 16,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    navButton: {
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 20,
    },
    navButtonDisabled: {
      opacity: 0.4,
    },
    monthTitle: {
      fontSize: getFontSize(18),
      fontWeight: "700",
      color: colors.headerText,
    },
    weekDays: {
      flexDirection: "row",
      marginBottom: 8,
    },
    weekDayText: {
      flex: 1,
      textAlign: "center",
      fontSize: getFontSize(12),
      fontWeight: "600",
      color: colors.placeholderText,
    },
    daysGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    dayCell: {
      width: "14.28%",
      aspectRatio: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 2,
    },
    dayCircle: {
      width: 36,
      height: 36,
      borderRadius: 999, // Círculo perfecto
      justifyContent: "center",
      alignItems: "center",
    },
    dayText: {
      fontSize: getFontSize(14),
      fontWeight: "500",
    },
    // Estados de días
    dayCompleted: {
      backgroundColor: STREAK_COLORS.completed,
    },
    dayFrozen: {
      backgroundColor: STREAK_COLORS.frozen,
    },
    dayToday: {
      borderWidth: 2,
      borderColor: STREAK_COLORS.completed,
    },
    dayMissed: {
      backgroundColor: "transparent",
    },
    dayFuture: {
      backgroundColor: "transparent",
      opacity: 0.3,
    },
    // Textos de días
    dayTextCompleted: {
      color: "#000000",
      fontWeight: "700",
    },
    dayTextToday: {
      color: STREAK_COLORS.completed,
      fontWeight: "700",
    },
    dayTextMissed: {
      color: colors.placeholderText,
    },
    dayTextFuture: {
      color: colors.placeholderText,
    },
    // Leyenda
    legend: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 24,
      marginTop: 16,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    legendDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    legendText: {
      fontSize: getFontSize(12),
      color: colors.placeholderText,
    },
  });
