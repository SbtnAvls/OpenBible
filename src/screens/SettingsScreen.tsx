import React, { useCallback, useMemo, useState } from "react";
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  FONT_SCALE_MAX,
  FONT_SCALE_MIN,
  FONT_SCALE_STEP,
  themeOptions,
  useTheme,
} from "../context/ThemeContext";
import type {
  ThemeColors,
  GetFontSize,
} from "../context/ThemeContext";

const TRACK_HEIGHT = 6;
const THUMB_SIZE = 22;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function SettingsScreen() {
  const { theme, setTheme, colors, fontScale, setFontScale, getFontSize } =
    useTheme();
  const styles = useMemo(
    () => createStyles(colors, getFontSize),
    [colors, getFontSize]
  );
  const [trackWidth, setTrackWidth] = useState(0);

  const sliderPercent = clamp(
    (fontScale - FONT_SCALE_MIN) / (FONT_SCALE_MAX - FONT_SCALE_MIN),
    0,
    1
  );
  const thumbLeft = trackWidth * sliderPercent;
  const fillWidth = trackWidth > 0 ? Math.max(0, thumbLeft) : 0;
  const thumbTranslateX =
    (trackWidth > 0 ? clamp(thumbLeft, 0, trackWidth) : 0) - THUMB_SIZE / 2;

  const updateScaleFromPosition = useCallback(
    (positionX: number) => {
      if (trackWidth <= 0) {
        return;
      }
      const ratio = clamp(positionX / trackWidth, 0, 1);
      const nextScale =
        FONT_SCALE_MIN + ratio * (FONT_SCALE_MAX - FONT_SCALE_MIN);
      setFontScale(nextScale);
    },
    [setFontScale, trackWidth]
  );

  const handleSliderEvent = useCallback(
    (event: GestureResponderEvent) => {
      updateScaleFromPosition(event.nativeEvent.locationX);
    },
    [updateScaleFromPosition]
  );

  const handleTrackLayout = useCallback((event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  }, []);

  const handleDecrease = useCallback(() => {
    setFontScale(fontScale - FONT_SCALE_STEP);
  }, [fontScale, setFontScale]);

  const handleIncrease = useCallback(() => {
    setFontScale(fontScale + FONT_SCALE_STEP);
  }, [fontScale, setFontScale]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Apariencia</Text>
        <Text style={styles.sectionSubtitle}>
          Selecciona un tema para la app.
        </Text>
        <View>
          {themeOptions.map((option) => {
            const isActive = option === theme;
            return (
              <Pressable
                key={option}
                accessibilityLabel={`Tema ${option}`}
                accessibilityState={{ selected: isActive }}
                onPress={() => setTheme(option)}
                style={[
                  styles.optionRow,
                  isActive && styles.optionRowActive,
                ]}
              >
                <View
                  style={[
                    styles.radioOuter,
                    isActive && styles.radioOuterActive,
                  ]}
                >
                  {isActive ? <View style={styles.radioInner} /> : null}
                </View>
                <Text style={styles.optionLabel}>{option}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Texto</Text>
        <Text style={styles.sectionSubtitle}>
          Ajusta el tamano general de la tipografia en la app.
        </Text>
        <View style={styles.sliderContainer}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sliderLabel}>Tamano de fuente</Text>
            <Text style={styles.sliderValue}>{Math.round(fontScale * 100)}%</Text>
          </View>
          <View style={styles.sliderRow}>
            <Pressable
              accessibilityLabel="Reducir tamano de letra"
              onPress={handleDecrease}
              style={styles.stepButton}
            >
              <Text style={styles.stepButtonLabel}>-</Text>
            </Pressable>
            <View
              style={styles.sliderTrack}
              onLayout={handleTrackLayout}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={handleSliderEvent}
              onResponderMove={handleSliderEvent}
              onResponderRelease={handleSliderEvent}
            >
              <View
                pointerEvents="none"
                style={[styles.sliderFill, { width: fillWidth }]}
              />
              <View
                pointerEvents="none"
                style={[
                  styles.sliderThumb,
                  {
                    transform: [
                      {
                        translateX: thumbTranslateX,
                      },
                    ],
                  },
                ]}
              />
            </View>
            <Pressable
              accessibilityLabel="Aumentar tamano de letra"
              onPress={handleIncrease}
              style={styles.stepButton}
            >
              <Text style={styles.stepButtonLabel}>+</Text>
            </Pressable>
          </View>
          <View style={styles.previewBox}>
            <Text style={styles.previewTitle}>Vista previa</Text>
            <View style={styles.previewRow}>
              <Text style={styles.previewVerseNumber}>1</Text>
              <Text style={styles.previewText}>
                Asi se mostrara el texto de los versiculos con el tamano
                seleccionado.
              </Text>
            </View>
          </View>
        </View>
      </View>
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
      paddingHorizontal: 24,
      paddingVertical: 24,
      gap: 24,
    },
    section: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: 16,
      padding: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
    },
    sectionTitle: {
      fontSize: getFontSize(16),
      fontWeight: "600",
      marginBottom: 4,
      color: colors.headerText,
    },
    sectionSubtitle: {
      fontSize: getFontSize(14),
      color: colors.placeholderText,
      marginBottom: 16,
    },
    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.divider,
      marginBottom: 12,
    },
    optionRowActive: {
      backgroundColor: colors.accentSubtle,
      borderColor: colors.accent,
    },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.divider,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    radioOuterActive: {
      borderColor: colors.accent,
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.accent,
    },
    optionLabel: {
      fontSize: getFontSize(15),
      color: colors.bodyText,
      fontWeight: "500",
    },
    sliderContainer: {
      gap: 16,
    },
    sliderHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    sliderLabel: {
      fontSize: getFontSize(14),
      color: colors.bodyText,
      fontWeight: "500",
    },
    sliderValue: {
      fontSize: getFontSize(14),
      color: colors.placeholderText,
      fontWeight: "600",
    },
    sliderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    stepButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
      backgroundColor: colors.surfaceMuted,
      justifyContent: "center",
      alignItems: "center",
    },
    stepButtonLabel: {
      fontSize: getFontSize(18),
      fontWeight: "600",
      color: colors.bodyText,
    },
    sliderTrack: {
      flex: 1,
      height: TRACK_HEIGHT,
      borderRadius: TRACK_HEIGHT / 2,
      backgroundColor: colors.surfaceMuted,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
      position: "relative",
      overflow: "visible",
    },
    sliderFill: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      backgroundColor: colors.accent,
      borderRadius: TRACK_HEIGHT / 2,
    },
    sliderThumb: {
      position: "absolute",
      left: 0,
      top: -(THUMB_SIZE - TRACK_HEIGHT) / 2,
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      borderRadius: THUMB_SIZE / 2,
      backgroundColor: colors.accent,
      borderWidth: 2,
      borderColor: colors.backgroundPrimary,
      elevation: 2,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
    },
    previewBox: {
      borderRadius: 12,
      padding: 16,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
      gap: 12,
    },
    previewTitle: {
      fontSize: getFontSize(14),
      fontWeight: "600",
      color: colors.headerText,
    },
    previewRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    previewVerseNumber: {
      width: 24,
      fontSize: getFontSize(14),
      fontWeight: "600",
      color: colors.verseNumber,
    },
    previewText: {
      flex: 1,
      fontSize: getFontSize(15),
      color: colors.bodyText,
      lineHeight: Math.round(getFontSize(15) * 1.46),
    },
  });
