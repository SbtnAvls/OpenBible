import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  FlatList,
  Animated,
} from 'react-native';
import {
  Calendar,
  List,
  CheckCircle2,
  Circle,
  Play,
  Target,
  TrendingUp,
  AlertCircle,
  Clock,
  BookOpen,
  Shuffle,
  Heart,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useYearlyPlan } from '../context/YearlyPlanContext';
import type { ThemeColors, GetFontSize } from '../context/ThemeContext';
import type { DailyReading, YearlyReading } from '../types/yearlyPlan';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Mapeo de iconos
const IconMap: Record<string, React.FC<{ size: number; color: string }>> = {
  Clock,
  BookOpen,
  Shuffle,
  Heart,
};

type YearlyPlanDetailScreenProps = {
  planId: string;
  onBack: () => void;
  onStartReading: (day: number) => void;
  onActivatePlan: (planId: string) => Promise<void>;
};

type ViewMode = 'calendar' | 'list';

export const YearlyPlanDetailScreen: React.FC<YearlyPlanDetailScreenProps> = ({
  planId,
  onBack: _onBack,
  onStartReading,
  onActivatePlan,
}) => {
  const { colors, getFontSize } = useTheme();
  const {
    activePlan,
    progress,
    getPlanById,
    getTodaysDayNumber,
    getCompletionPercentage,
    getDaysBehind,
    getDaysAhead,
    isDayCompleted,
    toggleDayComplete,
  } = useYearlyPlan();

  // El plan a mostrar (puede ser diferente del activo)
  const displayPlan = getPlanById(planId);
  const isThisActivePlan = activePlan?.id === planId;

  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const styles = useMemo(
    () => getStyles(colors, getFontSize),
    [colors, getFontSize],
  );
  const listRef = useRef<FlatList>(null);
  const hasScrolledToToday = useRef(false);

  // Solo mostrar progreso real si este es el plan activo
  const currentDay = isThisActivePlan ? getTodaysDayNumber() : 1;
  const completionPercentage = isThisActivePlan ? getCompletionPercentage() : 0;

  // Animaciones
  const headerAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Secuencia de entrada
    Animated.sequence([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(contentAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(progressAnim, {
          toValue: completionPercentage,
          duration: 800,
          useNativeDriver: false,
        }),
      ]),
    ]).start();
  }, [headerAnim, contentAnim, progressAnim, completionPercentage]);

  // Animación del tab indicator
  useEffect(() => {
    Animated.spring(tabIndicatorAnim, {
      toValue: viewMode === 'calendar' ? 0 : 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [viewMode, tabIndicatorAnim]);
  const daysBehind = isThisActivePlan ? getDaysBehind() : 0;
  const daysAhead = isThisActivePlan ? getDaysAhead() : 0;
  const completedCount = isThisActivePlan
    ? progress?.completedDays.length || 0
    : 0;

  // Calcular fecha a partir del día (usa hoy como fecha de inicio si no hay progreso)
  const getDayDate = useCallback(
    (day: number): Date => {
      const startDate =
        isThisActivePlan && progress
          ? new Date(progress.startDate)
          : new Date();
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + day - 1);
      return date;
    },
    [progress, isThisActivePlan],
  );

  // Formatear lectura
  const formatReading = (reading: YearlyReading): string => {
    if (reading.chapters && reading.chapters.length > 0) {
      if (reading.chapters.length === 1) {
        return `${reading.book} ${reading.chapters[0]}`;
      }
      const first = reading.chapters[0];
      const last = reading.chapters[reading.chapters.length - 1];
      if (last - first + 1 === reading.chapters.length) {
        return `${reading.book} ${first}-${last}`;
      }
      return `${reading.book} ${reading.chapters.join(', ')}`;
    }
    if (reading.verseRanges && reading.verseRanges.length > 0) {
      const chapters = [...new Set(reading.verseRanges.map(vr => vr.chapter))];
      if (chapters.length === 1) {
        return `${reading.book} ${chapters[0]}`;
      }
      return `${reading.book} ${chapters[0]}-${chapters[chapters.length - 1]}`;
    }
    return reading.book;
  };

  // Generar datos del calendario (12 meses)
  const calendarData = useMemo(() => {
    // Usa fecha de inicio del progreso si existe, sino usa hoy
    const startDate =
      isThisActivePlan && progress ? new Date(progress.startDate) : new Date();
    const months: {
      month: number;
      year: number;
      days: { day: number; date: Date }[];
    }[] = [];

    for (let day = 1; day <= 365; day++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + day - 1);

      let monthData = months.find(
        m => m.year === date.getFullYear() && m.month === date.getMonth(),
      );

      if (!monthData) {
        monthData = {
          month: date.getMonth(),
          year: date.getFullYear(),
          days: [],
        };
        months.push(monthData);
      }

      monthData.days.push({ day, date });
    }

    return months;
  }, [progress, isThisActivePlan]);

  // Scroll a hoy en vista lista
  useEffect(() => {
    if (viewMode === 'list' && !hasScrolledToToday.current && currentDay > 1) {
      setTimeout(() => {
        listRef.current?.scrollToIndex({
          index: Math.max(0, currentDay - 3),
          animated: true,
        });
        hasScrolledToToday.current = true;
      }, 300);
    }
  }, [viewMode, currentDay]);

  if (!displayPlan) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Plan no encontrado</Text>
        </View>
      </View>
    );
  }

  const IconComponent = IconMap[displayPlan.icon] || BookOpen;

  // Obtener la lectura del día de este plan (no del activo)
  const getPlanDayReading = (day: number): DailyReading | null => {
    return displayPlan.readings.find(r => r.day === day) || null;
  };

  // Verificar si el día está completado (solo si este es el plan activo)
  const isDayCompletedForPlan = (day: number): boolean => {
    if (!isThisActivePlan) return false;
    return isDayCompleted(day);
  };

  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  const renderCalendarMonth = (monthData: {
    month: number;
    year: number;
    days: { day: number; date: Date }[];
  }) => {
    const firstDay = monthData.days[0].date;
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

    // Ajustar para empezar en lunes (0 = lunes, 6 = domingo)
    const adjustedStart = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    return (
      <View
        key={`${monthData.year}-${monthData.month}`}
        style={styles.calendarMonth}
      >
        <Text style={styles.monthTitle}>
          {monthNames[monthData.month]} {monthData.year}
        </Text>
        <View style={styles.weekDaysRow}>
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => (
            <Text key={i} style={styles.weekDayLabel}>
              {d}
            </Text>
          ))}
        </View>
        <View style={styles.daysGrid}>
          {/* Espacios vacíos antes del primer día */}
          {Array.from({ length: adjustedStart }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.dayCell} />
          ))}
          {/* Días del mes */}
          {monthData.days.map(({ day, date }) => {
            const isCompleted = isDayCompletedForPlan(day);
            const isToday = isThisActivePlan && day === currentDay;
            const isPast = isThisActivePlan && day < currentDay;

            return (
              <Pressable
                key={day}
                style={styles.dayCell}
                onPress={() => onStartReading(day)}
              >
                <View
                  style={[
                    styles.dayCircle,
                    isCompleted && styles.dayCircleCompleted,
                    isToday && !isCompleted && styles.dayCircleToday,
                    isPast && !isCompleted && styles.dayCircleMissed,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      isCompleted && styles.dayNumberCompleted,
                      isToday && !isCompleted && styles.dayNumberToday,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  const renderDayCard = ({ item: day }: { item: number }) => {
    const reading = getPlanDayReading(day);
    const isCompleted = isDayCompletedForPlan(day);
    const isToday = isThisActivePlan && day === currentDay;
    const date = getDayDate(day);

    if (!reading) return null;

    return (
      <Pressable
        style={[
          styles.dayCard,
          isToday && { borderColor: displayPlan.color, borderWidth: 2 },
        ]}
        onPress={() => isThisActivePlan && onStartReading(day)}
        disabled={!isThisActivePlan}
      >
        <View style={styles.dayCardHeader}>
          <View style={styles.dayCardLeft}>
            <View
              style={[
                styles.dayBadge,
                isCompleted && { backgroundColor: '#10B98120' },
                isToday &&
                  !isCompleted && { backgroundColor: displayPlan.color + '20' },
              ]}
            >
              <Text
                style={[
                  styles.dayBadgeText,
                  isCompleted && { color: '#10B981' },
                  isToday && !isCompleted && { color: displayPlan.color },
                ]}
              >
                Día {day}
              </Text>
            </View>
            {isToday && (
              <View
                style={[
                  styles.todayBadge,
                  { backgroundColor: displayPlan.color },
                ]}
              >
                <Text style={styles.todayBadgeText}>Hoy</Text>
              </View>
            )}
          </View>

          {isThisActivePlan && (
            <Pressable
              style={[
                styles.checkButton,
                isCompleted && { backgroundColor: '#10B981' },
              ]}
              onPress={() => toggleDayComplete(day)}
            >
              {isCompleted ? (
                <CheckCircle2 size={20} color="#FFFFFF" />
              ) : (
                <Circle size={20} color={colors.placeholderText} />
              )}
            </Pressable>
          )}
        </View>

        <Text style={styles.dayCardDate}>
          {date.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </Text>

        <View style={styles.readingsContainer}>
          {reading.readings.map((r, idx) => (
            <Text key={idx} style={styles.readingText}>
              {formatReading(r)}
            </Text>
          ))}
        </View>

        {isThisActivePlan && (
          <Pressable
            style={[styles.readButton, { backgroundColor: displayPlan.color }]}
            onPress={() => onStartReading(day)}
          >
            <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
            <Text style={styles.readButtonText}>
              {isCompleted ? 'Leer de nuevo' : 'Comenzar lectura'}
            </Text>
          </Pressable>
        )}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Plan Header (integrado con el contenido) */}
      <Animated.View
        style={[
          styles.planHeader,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View
          style={[
            styles.planIconContainer,
            { backgroundColor: displayPlan.color + '15' },
          ]}
        >
          <IconComponent size={28} color={displayPlan.color} />
        </View>
        <View style={styles.planHeaderInfo}>
          <Text style={styles.planTitle}>{displayPlan.title}</Text>
          {isThisActivePlan && (
            <View
              style={[
                styles.activeBadge,
                { backgroundColor: displayPlan.color },
              ]}
            >
              <Text style={styles.activeBadgeText}>Plan activo</Text>
            </View>
          )}
        </View>
      </Animated.View>

      {/* Plan Description (solo en modo preview) */}
      {!isThisActivePlan && (
        <View style={styles.previewSection}>
          <Text style={styles.previewDescription}>
            {displayPlan.description}
          </Text>
          <Pressable
            style={[
              styles.activateButton,
              { backgroundColor: displayPlan.color },
            ]}
            onPress={() => onActivatePlan(planId)}
          >
            <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
            <Text style={styles.activateButtonText}>
              {activePlan ? 'Cambiar a este plan' : 'Iniciar este plan'}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Progress Section (solo si es plan activo) */}
      {isThisActivePlan && (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Día {currentDay} de 365</Text>
            <Text style={styles.progressPercentage}>
              {Math.round(completionPercentage)}%
            </Text>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: displayPlan.color,
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.statsRow}>
            <Text style={styles.statsText}>
              {completedCount} días completados
            </Text>
            {daysBehind > 0 ? (
              <View style={styles.statusBadge}>
                <AlertCircle size={12} color="#EF4444" />
                <Text style={[styles.statusText, { color: '#EF4444' }]}>
                  {daysBehind} {daysBehind === 1 ? 'día' : 'días'} atrasado
                </Text>
              </View>
            ) : daysAhead > 0 ? (
              <View style={styles.statusBadge}>
                <TrendingUp size={12} color="#10B981" />
                <Text style={[styles.statusText, { color: '#10B981' }]}>
                  {daysAhead} adelantado
                </Text>
              </View>
            ) : (
              <View style={styles.statusBadge}>
                <Target size={12} color={displayPlan.color} />
                <Text style={[styles.statusText, { color: displayPlan.color }]}>
                  Al día
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Tabs */}
      <Animated.View
        style={[
          styles.tabsContainer,
          {
            opacity: contentAnim,
            transform: [
              {
                translateY: contentAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Pressable
          style={[
            styles.tab,
            viewMode === 'calendar' && {
              backgroundColor: displayPlan.color + '20',
            },
          ]}
          onPress={() => setViewMode('calendar')}
        >
          <Calendar
            size={18}
            color={
              viewMode === 'calendar'
                ? displayPlan.color
                : colors.placeholderText
            }
          />
          <Text
            style={[
              styles.tabText,
              viewMode === 'calendar' && { color: displayPlan.color },
            ]}
          >
            Calendario
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.tab,
            viewMode === 'list' && {
              backgroundColor: displayPlan.color + '20',
            },
          ]}
          onPress={() => setViewMode('list')}
        >
          <List
            size={18}
            color={
              viewMode === 'list' ? displayPlan.color : colors.placeholderText
            }
          />
          <Text
            style={[
              styles.tabText,
              viewMode === 'list' && { color: displayPlan.color },
            ]}
          >
            Lista
          </Text>
        </Pressable>
      </Animated.View>

      {/* Content */}
      {viewMode === 'calendar' ? (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.calendarContent}
          showsVerticalScrollIndicator={false}
        >
          {calendarData.map(monthData => renderCalendarMonth(monthData))}
        </ScrollView>
      ) : (
        <FlatList
          ref={listRef}
          data={Array.from({ length: 365 }, (_, i) => i + 1)}
          renderItem={renderDayCard}
          keyExtractor={item => item.toString()}
          style={styles.content}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          onScrollToIndexFailed={info => {
            setTimeout(() => {
              listRef.current?.scrollToIndex({
                index: info.index,
                animated: true,
              });
            }, 100);
          }}
        />
      )}
    </View>
  );
};

const getStyles = (colors: ThemeColors, getFontSize: GetFontSize) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
    },
    // Plan Header (parte del contenido, no header de navegación)
    planHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
      gap: 14,
    },
    planIconContainer: {
      width: 52,
      height: 52,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    planHeaderInfo: {
      flex: 1,
      gap: 6,
    },
    planTitle: {
      fontSize: getFontSize(20),
      fontWeight: '700',
      color: colors.headerText,
    },
    activeBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
    },
    activeBadgeText: {
      fontSize: getFontSize(11),
      fontWeight: '700',
      color: '#FFFFFF',
    },
    // Preview Section (cuando no es plan activo)
    previewSection: {
      paddingHorizontal: 20,
      paddingBottom: 16,
      gap: 12,
    },
    previewDescription: {
      fontSize: getFontSize(14),
      color: colors.bodyText,
      lineHeight: getFontSize(14) * 1.5,
    },
    activateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingVertical: 14,
      borderRadius: 12,
    },
    activateButtonText: {
      fontSize: getFontSize(15),
      fontWeight: '700',
      color: '#FFFFFF',
    },
    // Progress Section
    progressSection: {
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    progressTitle: {
      fontSize: getFontSize(14),
      fontWeight: '600',
      color: colors.headerText,
    },
    progressPercentage: {
      fontSize: getFontSize(14),
      fontWeight: '700',
      color: colors.headerText,
    },
    progressBarContainer: {
      marginBottom: 8,
    },
    progressBarBackground: {
      height: 8,
      backgroundColor: colors.surfaceMuted,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 4,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statsText: {
      fontSize: getFontSize(12),
      color: colors.placeholderText,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statusText: {
      fontSize: getFontSize(12),
      fontWeight: '600',
    },
    // Tabs
    tabsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      gap: 12,
      marginBottom: 16,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.backgroundSecondary,
    },
    tabText: {
      fontSize: getFontSize(14),
      fontWeight: '600',
      color: colors.placeholderText,
    },
    // Content
    content: {
      flex: 1,
    },
    calendarContent: {
      paddingHorizontal: 16,
      paddingBottom: 100,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 100,
    },
    // Calendar
    calendarMonth: {
      marginBottom: 24,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 16,
      padding: 16,
    },
    monthTitle: {
      fontSize: getFontSize(16),
      fontWeight: '700',
      color: colors.headerText,
      marginBottom: 12,
    },
    weekDaysRow: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    weekDayLabel: {
      width: (SCREEN_WIDTH - 64) / 7,
      textAlign: 'center',
      fontSize: getFontSize(11),
      fontWeight: '600',
      color: colors.placeholderText,
    },
    daysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    dayCell: {
      width: (SCREEN_WIDTH - 64) / 7,
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dayCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dayCircleCompleted: {
      backgroundColor: 'rgba(16, 185, 129, 0.25)',
    },
    dayCircleToday: {
      backgroundColor: colors.accentSubtle,
      borderWidth: 2,
      borderColor: colors.accent,
    },
    dayCircleMissed: {
      backgroundColor: 'rgba(239, 68, 68, 0.08)',
    },
    dayNumber: {
      fontSize: getFontSize(12),
      color: colors.bodyText,
    },
    dayNumberCompleted: {
      color: '#10B981',
      fontWeight: '600',
    },
    dayNumberToday: {
      color: colors.accent,
      fontWeight: '700',
    },
    // Day Card
    dayCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
    },
    dayCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    dayCardLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    dayBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: colors.surfaceMuted,
    },
    dayBadgeText: {
      fontSize: getFontSize(13),
      fontWeight: '700',
      color: colors.headerText,
    },
    todayBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    todayBadgeText: {
      fontSize: getFontSize(11),
      fontWeight: '700',
      color: '#FFFFFF',
    },
    checkButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surfaceMuted,
    },
    dayCardDate: {
      fontSize: getFontSize(12),
      color: colors.placeholderText,
      marginBottom: 12,
      textTransform: 'capitalize',
    },
    readingsContainer: {
      marginBottom: 12,
    },
    readingText: {
      fontSize: getFontSize(15),
      color: colors.headerText,
      marginBottom: 4,
    },
    readButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderRadius: 12,
    },
    readButtonText: {
      fontSize: getFontSize(14),
      fontWeight: '600',
      color: '#FFFFFF',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      fontSize: getFontSize(16),
      color: colors.placeholderText,
      textAlign: 'center',
    },
  });
