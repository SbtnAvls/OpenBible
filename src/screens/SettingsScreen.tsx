import React, { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  themeOptions,
  useTheme,
} from "../context/ThemeContext";

type ThemeColors = ReturnType<typeof useTheme>["colors"];

export function SettingsScreen() {
  const { theme, setTheme, colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
    },
    content: {
      paddingHorizontal: 24,
      paddingVertical: 24,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 4,
      color: colors.headerText,
    },
    sectionSubtitle: {
      fontSize: 14,
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
      fontSize: 15,
      color: colors.bodyText,
      fontWeight: "500",
    },
  });
