import React, { useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Animated,
} from 'react-native';
import {
  Calendar,
  Clock,
  BookOpen,
  Shuffle,
  Heart,
  ChevronRight,
  Play,
  Target,
  TrendingUp,
  AlertCircle,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useYearlyPlan } from '../context/YearlyPlanContext';
import type { ThemeColors, GetFontSize } from '../context/ThemeContext';
import type { YearlyPlan } from '../types/yearlyPlan';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const HORIZONTAL_PADDING = 16;
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;

type YearlyPlansScreenProps = {
  onSelectPlan: (planId: string) => void;
};

// Mapeo de nombres de iconos a componentes
const IconMap: Record<string, React.FC<{ size: number; color: string }>> = {
  Clock,
  BookOpen,
  Shuffle,
  Heart,
};

export const YearlyPlansScreen: React.FC<YearlyPlansScreenProps> = ({
  onSelectPlan,
}) => {
  const { colors, getFontSize } = useTheme();
  const {
    plans,
    activePlan,
    progress,
    getTodaysDayNumber,
    getCompletionPercentage,
    getDaysBehind,
    getDaysAhead,
    getCurrentDayReading,
  } = useYearlyPlan();

  const styles = useMemo(
    () => getStyles(colors, getFontSize),
    [colors, getFontSize],
  );

  // Animaciones
  const headerAnim = useRef(new Animated.Value(0)).current;
  const heroAnim = useRef(new Animated.Value(0)).current;
  const cardsAnim = useRef(plans.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Secuencia de animaciones
    Animated.sequence([
      // Header fade in
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Hero card slide up
      Animated.spring(heroAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Cards staggered animation
    const cardAnimations = cardsAnim.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: index * 100,
        useNativeDriver: true,
      }),
    );
    Animated.stagger(80, cardAnimations).start();
  }, [headerAnim, heroAnim, cardsAnim]);

  const todayReading = getCurrentDayReading();
  const currentDay = getTodaysDayNumber();
  const completionPercentage = getCompletionPercentage();
  const daysBehind = getDaysBehind();
  const daysAhead = getDaysAhead();

  // Formatear la lectura de hoy para mostrar
  const todayReadingPreview = useMemo(() => {
    if (!todayReading) return null;
    return todayReading.readings
      .map(r => {
        if (r.chapters && r.chapters.length > 0) {
          if (r.chapters.length === 1) {
            return `${r.book} ${r.chapters[0]}`;
          }
          return `${r.book} ${r.chapters[0]}-${
            r.chapters[r.chapters.length - 1]
          }`;
        }
        return r.book;
      })
      .join(', ');
  }, [todayReading]);

  const renderActivePlanHero = () => {
    if (!activePlan || !progress) return null;

    const IconComponent = IconMap[activePlan.icon] || BookOpen;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.heroCard,
          { borderColor: activePlan.color + '40' },
          pressed && styles.cardPressed,
        ]}
        onPress={() => onSelectPlan(activePlan.id)}
      >
        {/* Header del hero */}
        <View style={styles.heroHeader}>
          <View
            style={[
              styles.heroIconContainer,
              { backgroundColor: activePlan.color + '20' },
            ]}
          >
            <IconComponent size={24} color={activePlan.color} />
          </View>
          <View style={styles.heroTitleContainer}>
            <Text style={styles.heroLabel}>Plan activo</Text>
            <Text style={styles.heroTitle}>{activePlan.title}</Text>
          </View>
          <ChevronRight size={20} color={colors.placeholderText} />
        </View>

        {/* Progreso circular y stats */}
        <View style={styles.heroContent}>
          {/* Círculo de progreso */}
          <View style={styles.progressCircleContainer}>
            <View
              style={[
                styles.progressCircle,
                { borderColor: colors.surfaceMuted },
              ]}
            >
              <View
                style={[
                  styles.progressCircleInner,
                  { backgroundColor: activePlan.color + '15' },
                ]}
              >
                <Text style={[styles.progressDay, { color: activePlan.color }]}>
                  {currentDay}
                </Text>
                <Text style={styles.progressDayLabel}>de 365</Text>
              </View>
            </View>
            <Text style={styles.progressPercentage}>
              {Math.round(completionPercentage)}% completado
            </Text>
          </View>

          {/* Stats y lectura de hoy */}
          <View style={styles.heroStats}>
            {/* Estado del progreso */}
            {daysBehind > 0 ? (
              <View style={[styles.statusBadge, styles.statusBehind]}>
                <AlertCircle size={14} color="#EF4444" />
                <Text style={[styles.statusText, { color: '#EF4444' }]}>
                  {daysBehind} {daysBehind === 1 ? 'día' : 'días'} atrasado
                </Text>
              </View>
            ) : daysAhead > 0 ? (
              <View style={[styles.statusBadge, styles.statusAhead]}>
                <TrendingUp size={14} color="#10B981" />
                <Text style={[styles.statusText, { color: '#10B981' }]}>
                  {daysAhead} {daysAhead === 1 ? 'día' : 'días'} adelantado
                </Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, styles.statusOnTrack]}>
                <Target size={14} color={activePlan.color} />
                <Text style={[styles.statusText, { color: activePlan.color }]}>
                  Al día
                </Text>
              </View>
            )}

            {/* Lectura de hoy */}
            {todayReadingPreview && (
              <View style={styles.todayReading}>
                <Text style={styles.todayReadingLabel}>Lectura de hoy:</Text>
                <Text style={styles.todayReadingText} numberOfLines={2}>
                  {todayReadingPreview}
                </Text>
              </View>
            )}

            {/* Botón continuar */}
            <Pressable
              style={[
                styles.continueButton,
                { backgroundColor: activePlan.color },
              ]}
              onPress={() => onSelectPlan(activePlan.id)}
            >
              <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.continueButtonText}>Continuar lectura</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderPlanCard = (plan: YearlyPlan) => {
    const IconComponent = IconMap[plan.icon] || BookOpen;
    const isActive = activePlan?.id === plan.id;
    const existingProgress = progress;

    return (
      <Pressable
        key={plan.id}
        style={({ pressed }) => [
          styles.planCard,
          { borderColor: isActive ? plan.color + '60' : colors.divider },
          isActive && { backgroundColor: plan.color + '08' },
          pressed && styles.cardPressed,
        ]}
        onPress={() => onSelectPlan(plan.id)}
      >
        {/* Icono */}
        <View
          style={[
            styles.planIconContainer,
            { backgroundColor: plan.color + '15' },
          ]}
        >
          <IconComponent size={28} color={plan.color} />
        </View>

        {/* Título */}
        <Text style={styles.planTitle}>{plan.title}</Text>

        {/* Descripción */}
        <Text style={styles.planDescription} numberOfLines={2}>
          {plan.description}
        </Text>

        {/* Badge de estado */}
        {isActive ? (
          <View style={[styles.planBadge, { backgroundColor: plan.color }]}>
            <Text style={styles.planBadgeText}>Activo</Text>
          </View>
        ) : existingProgress ? (
          <View
            style={[styles.planBadge, { backgroundColor: colors.surfaceMuted }]}
          >
            <Text style={[styles.planBadgeText, { color: colors.bodyText }]}>
              Disponible
            </Text>
          </View>
        ) : null}
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
        <Animated.View
          style={[
            styles.headerSection,
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
          <View style={styles.headerIconContainer}>
            <Calendar size={32} color={colors.accent} />
          </View>
          <Text style={styles.headerTitle}>Biblia en 1 Año</Text>
          <Text style={styles.headerSubtitle}>
            Completa la lectura de toda la Biblia en 365 días con el plan que
            mejor se adapte a ti
          </Text>
        </Animated.View>

        {/* Hero del plan activo */}
        {activePlan && progress && (
          <Animated.View
            style={{
              opacity: heroAnim,
              transform: [
                {
                  translateY: heroAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
                {
                  scale: heroAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1],
                  }),
                },
              ],
            }}
          >
            {renderActivePlanHero()}
          </Animated.View>
        )}

        {/* Título de sección */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {activePlan ? 'Otros planes' : 'Elige tu plan'}
          </Text>
        </View>

        {/* Grid de planes */}
        <View style={styles.plansGrid}>
          {plans
            .filter(p => p.id !== activePlan?.id)
            .map((plan, index) => {
              const animIndex = activePlan ? index : index;
              const anim = cardsAnim[animIndex] || new Animated.Value(1);
              return (
                <Animated.View
                  key={plan.id}
                  style={{
                    opacity: anim,
                    transform: [
                      {
                        translateY: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [40, 0],
                        }),
                      },
                      {
                        scale: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.9, 1],
                        }),
                      },
                    ],
                  }}
                >
                  {renderPlanCard(plan)}
                </Animated.View>
              );
            })}
        </View>

        {/* Si hay plan activo, mostrar el card del activo al final también */}
        {activePlan && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tu plan actual</Text>
            </View>
            <View style={styles.plansGrid}>
              <Animated.View
                style={{
                  opacity: cardsAnim[plans.length - 1] || 1,
                  transform: [
                    {
                      translateY: (
                        cardsAnim[plans.length - 1] || new Animated.Value(1)
                      ).interpolate({
                        inputRange: [0, 1],
                        outputRange: [40, 0],
                      }),
                    },
                  ],
                }}
              >
                {renderPlanCard(activePlan)}
              </Animated.View>
            </View>
          </>
        )}
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
      paddingTop: 16,
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
    // Hero card del plan activo
    heroCard: {
      marginHorizontal: HORIZONTAL_PADDING,
      marginBottom: 24,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1.5,
    },
    heroHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    heroIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    heroTitleContainer: {
      flex: 1,
      marginLeft: 12,
    },
    heroLabel: {
      fontSize: getFontSize(11),
      fontWeight: '600',
      color: colors.placeholderText,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    heroTitle: {
      fontSize: getFontSize(18),
      fontWeight: '700',
      color: colors.headerText,
    },
    heroContent: {
      flexDirection: 'row',
      gap: 16,
    },
    progressCircleContainer: {
      alignItems: 'center',
    },
    progressCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    progressCircleInner: {
      width: 76,
      height: 76,
      borderRadius: 38,
      justifyContent: 'center',
      alignItems: 'center',
    },
    progressDay: {
      fontSize: getFontSize(24),
      fontWeight: '700',
    },
    progressDayLabel: {
      fontSize: getFontSize(11),
      color: colors.placeholderText,
    },
    progressPercentage: {
      marginTop: 8,
      fontSize: getFontSize(12),
      fontWeight: '600',
      color: colors.bodyText,
    },
    heroStats: {
      flex: 1,
      gap: 12,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    statusBehind: {
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
    },
    statusAhead: {
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
    },
    statusOnTrack: {
      backgroundColor: colors.accentSubtle,
    },
    statusText: {
      fontSize: getFontSize(12),
      fontWeight: '600',
    },
    todayReading: {
      gap: 4,
    },
    todayReadingLabel: {
      fontSize: getFontSize(11),
      fontWeight: '600',
      color: colors.placeholderText,
      textTransform: 'uppercase',
    },
    todayReadingText: {
      fontSize: getFontSize(13),
      color: colors.bodyText,
      lineHeight: 18,
    },
    continueButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      marginTop: 'auto',
    },
    continueButtonText: {
      fontSize: getFontSize(14),
      fontWeight: '600',
      color: '#FFFFFF',
    },
    // Sección de planes
    sectionHeader: {
      paddingHorizontal: HORIZONTAL_PADDING,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: getFontSize(18),
      fontWeight: '600',
      color: colors.headerText,
    },
    plansGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: HORIZONTAL_PADDING,
      gap: CARD_GAP,
      marginBottom: 24,
    },
    planCard: {
      width: CARD_WIDTH,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 16,
      padding: 16,
      borderWidth: StyleSheet.hairlineWidth,
      gap: 8,
    },
    cardPressed: {
      opacity: 0.8,
      transform: [{ scale: 0.98 }],
    },
    planIconContainer: {
      width: 52,
      height: 52,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    planTitle: {
      fontSize: getFontSize(16),
      fontWeight: '600',
      color: colors.headerText,
    },
    planDescription: {
      fontSize: getFontSize(12),
      color: colors.placeholderText,
      lineHeight: 16,
      flex: 1,
    },
    planBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      marginTop: 4,
    },
    planBadgeText: {
      fontSize: getFontSize(11),
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });
