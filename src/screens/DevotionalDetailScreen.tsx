import React, { useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
} from 'react-native';
import {
  BookOpen,
  MessageCircle,
  Zap,
  CheckCircle2,
  Calendar,
  Quote,
  Check,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import type { ThemeColors, GetFontSize } from '../context/ThemeContext';
import type { Devotional } from '../types/devotional';

type DevotionalDetailScreenProps = {
  devotional: Devotional;
  isCompleted?: boolean;
  onComplete?: () => void;
};

export function DevotionalDetailScreen({
  devotional,
  isCompleted = false,
  onComplete,
}: DevotionalDetailScreenProps) {
  const { colors, getFontSize } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, getFontSize),
    [colors, getFontSize],
  );

  // Animaciones
  const headerAnim = useRef(new Animated.Value(0)).current;
  const verseAnim = useRef(new Animated.Value(0)).current;
  const sectionsAnim = useRef([
    new Animated.Value(0), // Reading
    new Animated.Value(0), // Reflection
    new Animated.Value(0), // Prayer
    new Animated.Value(0), // Action
  ]).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Secuencia de entrada espectacular
    Animated.sequence([
      // Header y título fade in
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Verse card spring con bounce
      Animated.spring(verseAnim, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Secciones staggered
    const sectionAnimations = sectionsAnim.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: 200 + index * 120,
        useNativeDriver: true,
      }),
    );
    Animated.stagger(120, sectionAnimations).start(() => {
      // Botón slide up al final
      Animated.spring(buttonAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    });
  }, [headerAnim, verseAnim, sectionsAnim, buttonAnim]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
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
      {/* Header with date - animado */}
      <Animated.View
        style={[
          styles.dateContainer,
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
        <Calendar size={16} color={colors.placeholderText} />
        <Text style={styles.dateText}>{formatDate(devotional.date)}</Text>
      </Animated.View>

      {/* Title - animado */}
      <Animated.Text
        style={[
          styles.title,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-15, 0],
                }),
              },
            ],
          },
        ]}
      >
        {devotional.title}
      </Animated.Text>

      {/* Bible Verse Section - animado con spring */}
      <Animated.View
        style={[
          styles.verseCard,
          {
            backgroundColor: colors.accentSubtle,
            borderColor: colors.accent,
            opacity: verseAnim,
            transform: [
              {
                translateY: verseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
              {
                scale: verseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.verseLabelContainer}>
          <BookOpen size={18} color={colors.accent} />
          <Text style={[styles.verseLabel, { color: colors.accent }]}>
            Texto bíblico
          </Text>
        </View>
        <Text style={styles.verseReference}>
          {devotional.bibleVerse.reference}
        </Text>
        <View style={styles.quoteContainer}>
          <Quote size={24} color={colors.accent} style={styles.quoteIcon} />
          <Text style={styles.verseText}>"{devotional.bibleVerse.text}"</Text>
        </View>
      </Animated.View>

      {/* Reading Section - animado */}
      <Animated.View
        style={[
          styles.section,
          {
            opacity: sectionsAnim[0],
            transform: [
              {
                translateX: sectionsAnim[0].interpolate({
                  inputRange: [0, 1],
                  outputRange: [-30, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.sectionHeader}>
          <View
            style={[
              styles.sectionIconContainer,
              { backgroundColor: colors.accentSubtle },
            ]}
          >
            <BookOpen size={20} color={colors.accent} />
          </View>
          <Text style={styles.sectionTitle}>Lectura</Text>
        </View>
        <Text style={styles.readingText}>{devotional.reading}</Text>
      </Animated.View>

      {/* Reflection Questions - animado */}
      <Animated.View
        style={[
          styles.section,
          {
            opacity: sectionsAnim[1],
            transform: [
              {
                translateX: sectionsAnim[1].interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.sectionHeader}>
          <View
            style={[
              styles.sectionIconContainer,
              { backgroundColor: colors.accentSubtle },
            ]}
          >
            <MessageCircle size={20} color={colors.accent} />
          </View>
          <Text style={styles.sectionTitle}>Para reflexionar</Text>
        </View>
        <View style={styles.questionsList}>
          {devotional.reflectionQuestions.map((question, index) => (
            <View
              key={index}
              style={[
                styles.questionCard,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderColor: colors.divider,
                },
              ]}
            >
              <View style={styles.questionHeader}>
                <View
                  style={[
                    styles.questionNumber,
                    { backgroundColor: colors.accent },
                  ]}
                >
                  <Text
                    style={[
                      styles.questionNumberText,
                      { color: colors.accentText },
                    ]}
                  >
                    {index + 1}
                  </Text>
                </View>
                <Text style={styles.questionText}>{question}</Text>
              </View>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Prayer Section - animado */}
      <Animated.View
        style={[
          styles.section,
          {
            opacity: sectionsAnim[2],
            transform: [
              {
                translateX: sectionsAnim[2].interpolate({
                  inputRange: [0, 1],
                  outputRange: [-30, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.sectionHeader}>
          <View
            style={[
              styles.sectionIconContainer,
              { backgroundColor: colors.accentSubtle },
            ]}
          >
            <Quote size={20} color={colors.accent} />
          </View>
          <Text style={styles.sectionTitle}>Oración</Text>
        </View>
        <View
          style={[
            styles.prayerCard,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.divider,
            },
          ]}
        >
          <Text style={styles.prayerText}>{devotional.prayer}</Text>
        </View>
      </Animated.View>

      {/* Daily Action - animado */}
      <Animated.View
        style={[
          styles.section,
          {
            opacity: sectionsAnim[3],
            transform: [
              {
                translateX: sectionsAnim[3].interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.sectionHeader}>
          <View
            style={[
              styles.sectionIconContainer,
              { backgroundColor: colors.accentSubtle },
            ]}
          >
            <Zap size={20} color={colors.accent} />
          </View>
          <Text style={styles.sectionTitle}>Acción del día</Text>
        </View>
        <View
          style={[
            styles.actionCard,
            {
              backgroundColor: colors.accentSubtle,
              borderColor: colors.accent,
            },
          ]}
        >
          <Text style={styles.actionText}>{devotional.dailyAction}</Text>
        </View>
      </Animated.View>

      {/* Complete Button - animado con spring */}
      <Animated.View
        style={{
          opacity: buttonAnim,
          transform: [
            {
              translateY: buttonAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [40, 0],
              }),
            },
            {
              scale: buttonAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1],
              }),
            },
          ],
        }}
      >
        <Pressable
          style={({ pressed }) => [
            styles.completeButton,
            {
              backgroundColor: isCompleted ? '#4CAF50' : colors.accent,
            },
            pressed &&
              !isCompleted && { opacity: 0.8, transform: [{ scale: 0.98 }] },
            isCompleted && { opacity: 0.9 },
          ]}
          onPress={isCompleted ? undefined : onComplete}
          disabled={isCompleted}
        >
          {isCompleted ? (
            <Check size={20} color={colors.accentText} />
          ) : (
            <CheckCircle2 size={20} color={colors.accentText} />
          )}
          <Text
            style={[styles.completeButtonText, { color: colors.accentText }]}
          >
            {isCompleted ? 'Completado' : 'Marcar como completado'}
          </Text>
        </Pressable>
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
    dateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 12,
    },
    dateText: {
      fontSize: getFontSize(13),
      color: colors.placeholderText,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    title: {
      fontSize: getFontSize(28),
      fontWeight: '700',
      color: colors.headerText,
      marginBottom: 24,
      lineHeight: Math.round(getFontSize(28) * 1.2),
    },
    verseCard: {
      borderRadius: 16,
      padding: 20,
      marginBottom: 28,
      borderWidth: 2,
      shadowColor: colors.accent,
      shadowOpacity: 0.15,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    verseLabelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    verseLabel: {
      fontSize: getFontSize(13),
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    verseReference: {
      fontSize: getFontSize(15),
      fontWeight: '700',
      color: colors.accent,
      marginBottom: 12,
    },
    quoteContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },
    quoteIcon: {
      marginTop: 2,
      opacity: 0.5,
    },
    verseText: {
      flex: 1,
      fontSize: getFontSize(17),
      color: colors.bodyText,
      fontWeight: '500',
      fontStyle: 'italic',
      lineHeight: Math.round(getFontSize(17) * 1.5),
    },
    section: {
      marginBottom: 28,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
    },
    sectionIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionTitle: {
      fontSize: getFontSize(18),
      fontWeight: '700',
      color: colors.headerText,
    },
    readingText: {
      fontSize: getFontSize(16),
      color: colors.bodyText,
      lineHeight: Math.round(getFontSize(16) * 1.6),
      textAlign: 'justify',
    },
    questionsList: {
      gap: 12,
    },
    questionCard: {
      borderRadius: 12,
      padding: 16,
      borderWidth: StyleSheet.hairlineWidth,
    },
    questionHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    questionNumber: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    questionNumberText: {
      fontSize: getFontSize(13),
      fontWeight: '700',
    },
    questionText: {
      flex: 1,
      fontSize: getFontSize(15),
      color: colors.bodyText,
      lineHeight: Math.round(getFontSize(15) * 1.5),
      fontWeight: '500',
    },
    prayerCard: {
      borderRadius: 12,
      padding: 20,
      borderWidth: StyleSheet.hairlineWidth,
    },
    prayerText: {
      fontSize: getFontSize(16),
      color: colors.bodyText,
      lineHeight: Math.round(getFontSize(16) * 1.6),
      fontStyle: 'italic',
      textAlign: 'justify',
    },
    actionCard: {
      borderRadius: 12,
      padding: 20,
      borderWidth: 2,
    },
    actionText: {
      fontSize: getFontSize(15),
      color: colors.bodyText,
      lineHeight: Math.round(getFontSize(15) * 1.6),
      fontWeight: '500',
      textAlign: 'justify',
    },
    completeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      borderRadius: 16,
      padding: 18,
      marginTop: 12,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    completeButtonText: {
      fontSize: getFontSize(16),
      fontWeight: '700',
    },
  });
