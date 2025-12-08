import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import {
  BookOpen,
  MessageCircle,
  Zap,
  CheckCircle2,
  Calendar,
  Quote,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import type { ThemeColors, GetFontSize } from '../context/ThemeContext';
import type { Devotional } from '../types/devotional';

type DevotionalDetailScreenProps = {
  devotional: Devotional;
};

export function DevotionalDetailScreen({
  devotional,
}: DevotionalDetailScreenProps) {
  const { colors, getFontSize } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, getFontSize),
    [colors, getFontSize]
  );

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
      {/* Header with date */}
      <View style={styles.dateContainer}>
        <Calendar size={16} color={colors.placeholderText} />
        <Text style={styles.dateText}>{formatDate(devotional.date)}</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>{devotional.title}</Text>

      {/* Bible Verse Section */}
      <View
        style={[
          styles.verseCard,
          {
            backgroundColor: colors.accentSubtle,
            borderColor: colors.accent,
          },
        ]}
      >
        <View style={styles.verseLabelContainer}>
          <BookOpen size={18} color={colors.accent} />
          <Text style={[styles.verseLabel, { color: colors.accent }]}>
            Texto bíblico
          </Text>
        </View>
        <Text style={styles.verseReference}>{devotional.bibleVerse.reference}</Text>
        <View style={styles.quoteContainer}>
          <Quote
            size={24}
            color={colors.accent}
            style={styles.quoteIcon}
          />
          <Text style={styles.verseText}>"{devotional.bibleVerse.text}"</Text>
        </View>
      </View>

      {/* Reading Section */}
      <View style={styles.section}>
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
      </View>

      {/* Reflection Questions */}
      <View style={styles.section}>
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
      </View>

      {/* Prayer Section */}
      <View style={styles.section}>
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
      </View>

      {/* Daily Action */}
      <View style={styles.section}>
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
      </View>

      {/* Complete Button */}
      <Pressable
        style={({ pressed }) => [
          styles.completeButton,
          { backgroundColor: colors.accent },
          pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
        ]}
        onPress={() => {
          // TODO: Implementar marcar como completado
        }}
      >
        <CheckCircle2 size={20} color={colors.accentText} />
        <Text style={[styles.completeButtonText, { color: colors.accentText }]}>
          Marcar como completado
        </Text>
      </Pressable>
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
