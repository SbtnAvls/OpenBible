import React, { useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
} from 'react-native';
import { Heart, Calendar, ArrowRight } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import type { ThemeColors, GetFontSize } from '../context/ThemeContext';
import { devotionals } from '../data/devotionals';
import type { Devotional } from '../types/devotional';

type DevotionalListScreenProps = {
  onSelectDevotional: (devotional: Devotional) => void;
};

export function DevotionalListScreen({
  onSelectDevotional,
}: DevotionalListScreenProps) {
  const { colors, getFontSize } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, getFontSize),
    [colors, getFontSize],
  );

  // Animaciones
  const headerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const cardsAnim = useRef(
    devotionals.map(() => new Animated.Value(0)),
  ).current;
  const comingSoonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Secuencia de animaciones de entrada
    Animated.sequence([
      // Header fade in con slide
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Stats card spring
      Animated.spring(statsAnim, {
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
        duration: 350,
        delay: index * 80,
        useNativeDriver: true,
      }),
    );
    Animated.stagger(80, cardAnimations).start(() => {
      // Coming soon fade in después de las cards
      Animated.timing(comingSoonAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    });
  }, [headerAnim, statsAnim, cardsAnim, comingSoonAnim]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header con animación */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-30, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.headerIconContainer}>
          <Heart size={32} color={colors.accent} />
        </View>
        <Text style={styles.headerTitle}>Devocionales</Text>
        <Text style={styles.headerSubtitle}>
          Reflexiones diarias para fortalecer tu fe
        </Text>
      </Animated.View>

      {/* Stats Card con animación spring */}
      <Animated.View
        style={[
          styles.statsCard,
          {
            backgroundColor: colors.accentSubtle,
            borderColor: colors.accent,
            opacity: statsAnim,
            transform: [
              {
                translateY: statsAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0],
                }),
              },
              {
                scale: statsAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.accent }]}>
            {devotionals.length}
          </Text>
          <Text style={styles.statLabel}>Devocionales</Text>
        </View>
        <View
          style={[styles.statDivider, { backgroundColor: colors.accent }]}
        />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.accent }]}>0</Text>
          <Text style={styles.statLabel}>Completados</Text>
        </View>
      </Animated.View>

      {/* Devotionals List con animación staggered */}
      <View style={styles.devotionalsList}>
        <Text style={styles.sectionTitle}>Últimos devocionales</Text>
        {devotionals.map((devotional, index) => {
          const cardAnim = cardsAnim[index] || new Animated.Value(1);
          return (
            <Animated.View
              key={devotional.id}
              style={{
                opacity: cardAnim,
                transform: [
                  {
                    translateX: cardAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                  {
                    scale: cardAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1],
                    }),
                  },
                ],
              }}
            >
              <Pressable
                onPress={() => onSelectDevotional(devotional)}
                style={({ pressed }) => [
                  styles.devotionalCard,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.divider,
                  },
                  pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
                ]}
              >
                {/* Number Badge */}
                <View
                  style={[
                    styles.numberBadge,
                    { backgroundColor: colors.accentSubtle },
                  ]}
                >
                  <Text
                    style={[styles.numberBadgeText, { color: colors.accent }]}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </Text>
                </View>

                {/* Content */}
                <View style={styles.devotionalContent}>
                  <Text style={styles.devotionalTitle} numberOfLines={2}>
                    {devotional.title}
                  </Text>
                  <View style={styles.devotionalMeta}>
                    <Calendar size={14} color={colors.placeholderText} />
                    <Text style={styles.devotionalDate}>
                      {formatDate(devotional.date)}
                    </Text>
                  </View>
                  <Text style={styles.devotionalVerse} numberOfLines={1}>
                    {devotional.bibleVerse.reference}
                  </Text>
                </View>

                {/* Arrow */}
                <View style={styles.arrowContainer}>
                  <ArrowRight size={20} color={colors.accent} />
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {/* Coming Soon Card con animación */}
      <Animated.View
        style={[
          styles.comingSoonCard,
          {
            backgroundColor: colors.surfaceMuted,
            borderColor: colors.divider,
            opacity: comingSoonAnim,
            transform: [
              {
                translateY: comingSoonAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.comingSoonTitle}>Más contenido próximamente</Text>
        <Text style={styles.comingSoonText}>
          Estamos trabajando en nuevos devocionales para ti. ¡Vuelve pronto!
        </Text>
      </Animated.View>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors, getFontSize: GetFontSize) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
    },
    content: {
      paddingHorizontal: 20,
      paddingVertical: 24,
      paddingBottom: 40,
    },
    header: {
      alignItems: 'center',
      marginBottom: 24,
    },
    headerIconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.accentSubtle,
      alignItems: 'center',
      justifyContent: 'center',
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
      fontSize: getFontSize(15),
      color: colors.placeholderText,
      textAlign: 'center',
      lineHeight: Math.round(getFontSize(15) * 1.5),
    },
    statsCard: {
      flexDirection: 'row',
      borderRadius: 16,
      padding: 20,
      marginBottom: 32,
      borderWidth: 2,
      shadowColor: colors.accent,
      shadowOpacity: 0.15,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statValue: {
      fontSize: getFontSize(32),
      fontWeight: '700',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: getFontSize(13),
      color: colors.placeholderText,
      fontWeight: '600',
    },
    statDivider: {
      width: 1,
      marginHorizontal: 20,
      opacity: 0.3,
    },
    devotionalsList: {
      gap: 16,
    },
    sectionTitle: {
      fontSize: getFontSize(18),
      fontWeight: '700',
      color: colors.headerText,
      marginBottom: 8,
    },
    devotionalCard: {
      flexDirection: 'row',
      borderRadius: 16,
      padding: 18,
      borderWidth: StyleSheet.hairlineWidth,
      alignItems: 'center',
      gap: 16,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
    numberBadge: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    numberBadgeText: {
      fontSize: getFontSize(18),
      fontWeight: '700',
    },
    devotionalContent: {
      flex: 1,
      gap: 6,
    },
    devotionalTitle: {
      fontSize: getFontSize(16),
      fontWeight: '700',
      color: colors.headerText,
      lineHeight: Math.round(getFontSize(16) * 1.3),
    },
    devotionalMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    devotionalDate: {
      fontSize: getFontSize(12),
      color: colors.placeholderText,
      fontWeight: '500',
    },
    devotionalVerse: {
      fontSize: getFontSize(13),
      color: colors.accent,
      fontWeight: '600',
      fontStyle: 'italic',
    },
    arrowContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.accentSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    comingSoonCard: {
      borderRadius: 16,
      padding: 24,
      marginTop: 24,
      borderWidth: StyleSheet.hairlineWidth,
      alignItems: 'center',
    },
    comingSoonTitle: {
      fontSize: getFontSize(16),
      fontWeight: '700',
      color: colors.headerText,
      marginBottom: 8,
      textAlign: 'center',
    },
    comingSoonText: {
      fontSize: getFontSize(14),
      color: colors.placeholderText,
      textAlign: 'center',
      lineHeight: Math.round(getFontSize(14) * 1.5),
    },
  });
