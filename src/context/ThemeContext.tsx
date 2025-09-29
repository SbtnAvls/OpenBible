import React, { createContext, useContext, useMemo, useState } from "react";
import type { StatusBarStyle } from "react-native";

export type ThemeName = "Claro" | "Oscuro";

export type ThemeColors = {
  backgroundPrimary: string;
  backgroundSecondary: string;
  surfaceMuted: string;
  surfaceElevated: string;
  divider: string;
  headerText: string;
  bodyText: string;
  accent: string;
  accentText: string;
  accentSubtle: string;
  placeholderText: string;
  verseNumber: string;
  menuIcon: string;
};

type ThemePreset = {
  colors: ThemeColors;
  statusBarStyle: StatusBarStyle;
};

type ThemeContextValue = {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  colors: ThemeColors;
  statusBarStyle: StatusBarStyle;
};

const THEME_PRESETS: Record<ThemeName, ThemePreset> = {
  Claro: {
    colors: {
      backgroundPrimary: "#f8f9fb",
      backgroundSecondary: "#ffffff",
      surfaceMuted: "#f1f3f8",
      surfaceElevated: "#ffffff",
      divider: "#d0d4db",
      headerText: "#111111",
      bodyText: "#1d2333",
      accent: "#2f3ec9",
      accentText: "#ffffff",
      accentSubtle: "#eef2ff",
      placeholderText: "#555566",
      verseNumber: "#2f3ec9",
      menuIcon: "#111111",
    },
    statusBarStyle: "dark-content",
  },
  Oscuro: {
    colors: {
      backgroundPrimary: "#11131a",
      backgroundSecondary: "#1a1d27",
      surfaceMuted: "#262b38",
      surfaceElevated: "#1f2431",
      divider: "#2a2e3a",
      headerText: "#f4f5f9",
      bodyText: "#e2e6f3",
      accent: "#4a5cff",
      accentText: "#ffffff",
      accentSubtle: "#2c3350",
      placeholderText: "#8a90a6",
      verseNumber: "#99a2ff",
      menuIcon: "#f4f5f9",
    },
    statusBarStyle: "light-content",
  },
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>("Claro");

  const value = useMemo<ThemeContextValue>(() => {
    const preset = THEME_PRESETS[theme];
    return {
      theme,
      setTheme,
      colors: preset.colors,
      statusBarStyle: preset.statusBarStyle,
    };
  }, [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme debe usarse dentro de un ThemeProvider");
  }
  return context;
}

export const themeOptions: ThemeName[] = ["Claro", "Oscuro"];
