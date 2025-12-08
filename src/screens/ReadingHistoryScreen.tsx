import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { BookOpen, Eye, Clock, Pin } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useReadingHistory } from '../context/ReadingHistoryContext';
import { PinExplanationModal } from '../components/PinExplanationModal';
import type { GetFontSize, ThemeColors } from '../context/ThemeContext';

interface ReadingHistoryScreenProps {
  onNavigateToReading: (book: string, chapter: number) => void;
}

export const ReadingHistoryScreen: React.FC<ReadingHistoryScreenProps> = ({
  onNavigateToReading,
}) => {
  const { colors, getFontSize } = useTheme();
  const { flashViews, recentReads, togglePin, hasSeenPinExplanation, markPinExplanationAsSeen } = useReadingHistory();
  const [showPinExplanation, setShowPinExplanation] = useState(false);

  // Ordenar por timestamp descendente (más reciente primero)
  const sortedFlashViews = [...flashViews].sort((a, b) => b.timestamp - a.timestamp);

  // Separar ancladas y no ancladas, luego ordenar cada grupo por timestamp
  const pinnedReads = recentReads.filter(e => e.pinned).sort((a, b) => b.timestamp - a.timestamp);
  const unpinnedReads = recentReads.filter(e => !e.pinned).sort((a, b) => b.timestamp - a.timestamp);
  const sortedRecentReads = [...pinnedReads, ...unpinnedReads];

  const styles = createStyles(colors, getFontSize);

  const handleTogglePin = (book: string, chapter: number) => {
    // Verificar si el capítulo está actualmente anclado
    const entry = recentReads.find(e => e.book === book && e.chapter === chapter);
    const isCurrentlyPinned = entry?.pinned || false;

    // Si no está anclado y es la primera vez que ancla algo, mostrar explicación
    if (!isCurrentlyPinned && !hasSeenPinExplanation) {
      setShowPinExplanation(true);
    }

    // Ejecutar el toggle
    togglePin(book, chapter);
  };

  const handleCloseExplanation = () => {
    setShowPinExplanation(false);
    markPinExplanationAsSeen();
  };

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours} h`;
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;
    if (days < 30) return `Hace ${Math.floor(days / 7)} semanas`;
    return `Hace ${Math.floor(days / 30)} meses`;
  };

  const renderEmptyState = (message: string) => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>{message}</Text>
    </View>
  );

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
      {/* Sección: Lecturas Recientes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <BookOpen size={20} color={colors.accent} style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>Lecturas recientes</Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          Capítulos donde pasaste al menos 5 minutos
        </Text>

        {sortedRecentReads.length === 0 ? (
          renderEmptyState('No tienes lecturas recientes aún')
        ) : (
          <View style={styles.listContainer}>
            {sortedRecentReads.map((entry) => (
              <View
                key={`recent-${entry.book}-${entry.chapter}-${entry.timestamp}`}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: entry.pinned ? colors.accent : colors.divider,
                    borderWidth: entry.pinned ? 1.5 : StyleSheet.hairlineWidth,
                  },
                ]}
              >
                <Pressable
                  onPress={() => onNavigateToReading(entry.book, entry.chapter)}
                  style={styles.cardContent}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleContainer}>
                      {entry.pinned && (
                        <Pin size={14} color={colors.accent} fill={colors.accent} style={{ marginRight: 6 }} />
                      )}
                      <Text style={styles.cardTitle}>
                        {entry.book} {entry.chapter}
                      </Text>
                    </View>
                    <View style={styles.cardActions}>
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: colors.accentSubtle },
                        ]}
                      >
                        <BookOpen size={12} color={colors.accent} style={{ marginRight: 4 }} />
                        <Text style={[styles.badgeText, { color: colors.accent }]}>
                          Leído
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.cardFooter}>
                    <View style={styles.cardFooterLeft}>
                      <Clock size={12} color={colors.placeholderText} style={{ marginRight: 4 }} />
                      <Text style={styles.timeText}>
                        {formatTimeAgo(entry.timestamp)}
                      </Text>
                    </View>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        handleTogglePin(entry.book, entry.chapter);
                      }}
                      style={styles.pinButton}
                    >
                      <Pin
                        size={16}
                        color={entry.pinned ? colors.accent : colors.placeholderText}
                        fill={entry.pinned ? colors.accent : 'transparent'}
                      />
                    </Pressable>
                  </View>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Sección: Visualizaciones Recientes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Eye size={20} color={colors.menuIcon} style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>Visualizaciones recientes</Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          Capítulos que visitaste recientemente
        </Text>

        {sortedFlashViews.length === 0 ? (
          renderEmptyState('No tienes visualizaciones recientes')
        ) : (
          <View style={styles.listContainer}>
            {sortedFlashViews.map((entry) => (
              <Pressable
                key={`flash-${entry.book}-${entry.chapter}-${entry.timestamp}`}
                onPress={() => onNavigateToReading(entry.book, entry.chapter)}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.divider,
                  },
                ]}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>
                      {entry.book} {entry.chapter}
                    </Text>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: colors.surfaceMuted },
                      ]}
                    >
                      <Eye size={12} color={colors.placeholderText} style={{ marginRight: 4 }} />
                      <Text style={[styles.badgeText, { color: colors.placeholderText }]}>
                        Vista rápida
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardFooterSimple}>
                    <Clock size={12} color={colors.placeholderText} style={{ marginRight: 4 }} />
                    <Text style={styles.timeText}>
                      {formatTimeAgo(entry.timestamp)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>
      </ScrollView>

      {/* Modal de explicación de anclas */}
      <PinExplanationModal
        visible={showPinExplanation}
        onClose={handleCloseExplanation}
      />
    </>
  );
};

const createStyles = (colors: ThemeColors, getFontSize: GetFontSize) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    contentContainer: {
      paddingHorizontal: 20,
      paddingVertical: 24,
    },
    section: {
      marginBottom: 32,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    sectionTitle: {
      fontSize: getFontSize(18),
      fontWeight: '600',
      color: colors.headerText,
    },
    sectionSubtitle: {
      fontSize: getFontSize(13),
      color: colors.placeholderText,
      marginBottom: 16,
    },
    listContainer: {
      gap: 12,
    },
    card: {
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      overflow: 'hidden',
    },
    cardContent: {
      padding: 16,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    cardTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    cardTitle: {
      fontSize: getFontSize(16),
      fontWeight: '600',
      color: colors.bodyText,
    },
    cardActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    badgeText: {
      fontSize: getFontSize(11),
      fontWeight: '600',
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cardFooterSimple: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    cardFooterLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    timeText: {
      fontSize: getFontSize(12),
      color: colors.placeholderText,
    },
    pinButton: {
      padding: 4,
      borderRadius: 6,
    },
    emptyState: {
      paddingVertical: 32,
      alignItems: 'center',
    },
    emptyStateText: {
      fontSize: getFontSize(14),
      color: colors.placeholderText,
      textAlign: 'center',
    },
  });
