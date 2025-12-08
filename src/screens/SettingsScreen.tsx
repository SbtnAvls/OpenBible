import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  GestureResponderEvent,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Check, Upload, Download, Trash2, Lightbulb } from "lucide-react-native";

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
import { useVerseOfTheDay } from "../context/VerseOfTheDayContext";

const TRACK_HEIGHT = 6;
const THUMB_SIZE = 22;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function SettingsScreen() {
  const { theme, setTheme, colors, fontScale, setFontScale, getFontSize } =
    useTheme();
  const {
    curatedVerses,
    isAdmin,
    checkAdminCode,
    exportCuratedList,
    importCuratedList,
    clearCuratedList,
  } = useVerseOfTheDay();
  const styles = useMemo(
    () => createStyles(colors, getFontSize),
    [colors, getFontSize]
  );
  const [trackWidth, setTrackWidth] = useState(0);
  const [adminCodeInput, setAdminCodeInput] = useState("");
  const [tempFontScale, setTempFontScale] = useState(fontScale);

  const hasUnsavedFontChanges = tempFontScale !== fontScale;

  const sliderPercent = clamp(
    (tempFontScale - FONT_SCALE_MIN) / (FONT_SCALE_MAX - FONT_SCALE_MIN),
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
      setTempFontScale(nextScale);
    },
    [trackWidth]
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
    setTempFontScale((prev) => Math.max(FONT_SCALE_MIN, prev - FONT_SCALE_STEP));
  }, []);

  const handleIncrease = useCallback(() => {
    setTempFontScale((prev) => Math.min(FONT_SCALE_MAX, prev + FONT_SCALE_STEP));
  }, []);

  const handleApplyFontScale = useCallback(() => {
    setFontScale(tempFontScale);
  }, [setFontScale, tempFontScale]);

  const handleCancelFontScale = useCallback(() => {
    setTempFontScale(fontScale);
  }, [fontScale]);

  const handleCheckAdminCode = useCallback(async () => {
    const isValid = await checkAdminCode(adminCodeInput);
    if (isValid) {
      Alert.alert('Modo Admin Activado', 'Ahora puedes agregar versículos a la lista curada');
      setAdminCodeInput('');
    } else {
      Alert.alert('Código Incorrecto', 'El código de administrador no es válido');
    }
  }, [adminCodeInput, checkAdminCode]);

  const handleImport = useCallback(() => {
    Alert.prompt(
      'Importar Lista',
      'Pega el JSON exportado:',
      async (text) => {
        if (text) {
          await importCuratedList(text);
        }
      },
      'plain-text'
    );
  }, [importCuratedList]);

  const handleClearList = useCallback(() => {
    Alert.alert(
      'Confirmar',
      `¿Estás seguro de eliminar los ${curatedVerses.length} versículos curados?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: clearCuratedList },
      ]
    );
  }, [clearCuratedList, curatedVerses.length]);

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
            <Text style={styles.sliderValue}>{Math.round(tempFontScale * 100)}%</Text>
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
            <Text style={styles.previewTitleStatic}>Vista previa</Text>
            <View style={styles.previewRow}>
              <Text style={[styles.previewVerseNumberStatic, { fontSize: Math.round(14 * tempFontScale) }]}>1</Text>
              <Text style={[styles.previewTextStatic, {
                fontSize: Math.round(15 * tempFontScale),
                lineHeight: Math.round(15 * tempFontScale * 1.46),
              }]}>
                Asi se mostrara el texto de los versiculos con el tamano
                seleccionado.
              </Text>
            </View>
          </View>
          {hasUnsavedFontChanges && (
            <View style={styles.fontScaleActions}>
              <Pressable
                onPress={handleCancelFontScale}
                style={[styles.fontScaleButton, styles.fontScaleButtonCancel]}
              >
                <Text style={styles.fontScaleButtonCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleApplyFontScale}
                style={[styles.fontScaleButton, styles.fontScaleButtonApply]}
              >
                <Text style={styles.fontScaleButtonApplyText}>Aplicar</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Administración</Text>
        <Text style={styles.sectionSubtitle}>
          Gestiona la lista de versículos del día
        </Text>

        {isAdmin && (
          <View style={[styles.adminBadge, { backgroundColor: colors.accentSubtle }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Check size={16} color={colors.accent} style={{ marginRight: 6 }} />
              <Text style={[styles.adminBadgeText, { color: colors.accent }]}>
                Modo Admin Activo
              </Text>
            </View>
          </View>
        )}

        {!isAdmin && (
          <View style={styles.adminCodeContainer}>
            <TextInput
              style={[
                styles.adminCodeInput,
                {
                  color: colors.bodyText,
                  borderColor: colors.divider,
                  backgroundColor: colors.backgroundSecondary,
                },
              ]}
              placeholder="Código de administrador"
              placeholderTextColor={colors.placeholderText}
              value={adminCodeInput}
              onChangeText={setAdminCodeInput}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              onPress={handleCheckAdminCode}
              style={[styles.adminCodeButton, { backgroundColor: colors.accent }]}
              disabled={!adminCodeInput.trim()}
            >
              <Text style={[styles.adminCodeButtonText, { color: colors.accentText }]}>
                Activar
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            Versículos curados: <Text style={styles.statsValue}>{curatedVerses.length}</Text>
          </Text>
        </View>

        <View style={styles.adminActions}>
          <Pressable
            onPress={exportCuratedList}
            style={[
              styles.adminButton,
              {
                backgroundColor: colors.surfaceMuted,
                borderColor: colors.divider,
              },
            ]}
            disabled={curatedVerses.length === 0}
          >
            <Upload size={20} color={colors.bodyText} style={{ opacity: curatedVerses.length === 0 ? 0.3 : 1, marginRight: 12 }} />
            <Text style={[styles.adminButtonText, { opacity: curatedVerses.length === 0 ? 0.3 : 1 }]}>
              Exportar Lista
            </Text>
          </Pressable>

          <Pressable
            onPress={handleImport}
            style={[
              styles.adminButton,
              {
                backgroundColor: colors.surfaceMuted,
                borderColor: colors.divider,
              },
            ]}
          >
            <Download size={20} color={colors.bodyText} style={{ marginRight: 12 }} />
            <Text style={styles.adminButtonText}>Importar Lista</Text>
          </Pressable>

          {isAdmin && curatedVerses.length > 0 && (
            <Pressable
              onPress={handleClearList}
              style={[
                styles.adminButton,
                styles.adminButtonDanger,
                {
                  borderColor: '#ff4444',
                },
              ]}
            >
              <Trash2 size={20} color="#ff4444" style={{ marginRight: 12 }} />
              <Text style={[styles.adminButtonText, { color: '#ff4444' }]}>
                Limpiar Lista
              </Text>
            </Pressable>
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <Lightbulb size={16} color={colors.placeholderText} style={{ marginRight: 6, marginTop: 2 }} />
          <Text style={[styles.adminHint, { flex: 1 }]}>
            En modo admin, al leer un versículo aparecerá un botón para agregarlo a la lista curada del "Versículo del Día"
          </Text>
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
    previewTitleStatic: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.headerText,
    },
    previewRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    previewVerseNumberStatic: {
      width: 24,
      fontWeight: "600",
      color: colors.verseNumber,
    },
    previewTextStatic: {
      flex: 1,
      color: colors.bodyText,
    },
    fontScaleActions: {
      flexDirection: "row",
      gap: 12,
      marginTop: 4,
    },
    fontScaleButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    fontScaleButtonCancel: {
      backgroundColor: colors.surfaceMuted,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
    },
    fontScaleButtonApply: {
      backgroundColor: colors.accent,
    },
    fontScaleButtonCancelText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.bodyText,
    },
    fontScaleButtonApplyText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.accentText,
    },
    adminBadge: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      alignSelf: 'flex-start',
      marginBottom: 16,
    },
    adminBadgeText: {
      fontSize: getFontSize(13),
      fontWeight: '700',
    },
    adminCodeContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    adminCodeInput: {
      flex: 1,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: getFontSize(14),
    },
    adminCodeButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    adminCodeButtonText: {
      fontSize: getFontSize(14),
      fontWeight: '600',
    },
    statsContainer: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
      marginBottom: 16,
    },
    statsText: {
      fontSize: getFontSize(14),
      color: colors.bodyText,
    },
    statsValue: {
      fontWeight: '700',
      color: colors.accent,
    },
    adminActions: {
      gap: 12,
      marginBottom: 16,
    },
    adminButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      gap: 12,
    },
    adminButtonDanger: {
      backgroundColor: 'rgba(255, 68, 68, 0.1)',
    },
    adminButtonText: {
      fontSize: getFontSize(14),
      fontWeight: '600',
      color: colors.bodyText,
    },
    adminHint: {
      fontSize: getFontSize(12),
      color: colors.placeholderText,
      lineHeight: Math.round(getFontSize(12) * 1.5),
      fontStyle: 'italic',
    },
  });
