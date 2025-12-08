import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { StatusBarStyle } from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import { getDataFromStorage, saveDataOnStorage } from "../helpers/storageData";

export type ThemeName = "Claro" | "Oscuro";

export type AccentColorName = "Sunset" | "Ocean" | "Forest" | "Lavender" | "Rose";

export type AccentColorPreset = {
  name: AccentColorName;
  label: string;
  light: {
    accent: string;
    accentText: string;
    accentSubtle: string;
    verseNumber: string;
    gradientStart: string;
    gradientEnd: string;
    gradientAccent: string;
    glassBorder: string;
    // Tinted backgrounds
    backgroundPrimary: string;
    backgroundSecondary: string;
    surfaceMuted: string;
    divider: string;
    glassBackground: string;
  };
  dark: {
    accent: string;
    accentText: string;
    accentSubtle: string;
    verseNumber: string;
    gradientStart: string;
    gradientEnd: string;
    gradientAccent: string;
    glassBorder: string;
    // Tinted backgrounds
    backgroundPrimary: string;
    backgroundSecondary: string;
    surfaceMuted: string;
    divider: string;
    glassBackground: string;
  };
  preview: string; // Color for the selector preview
};

export const ACCENT_PRESETS: AccentColorPreset[] = [
  {
    name: "Sunset",
    label: "Atardecer",
    preview: "#FF6B6B",
    light: {
      accent: "#FF6B6B",
      accentText: "#FFFFFF",
      accentSubtle: "#FFE4E4",
      verseNumber: "#E85A4F",
      gradientStart: "#FF6B6B",
      gradientEnd: "#FF8E53",
      gradientAccent: "#9F7AEA",
      glassBorder: "rgba(255, 107, 107, 0.35)",
      backgroundPrimary: "#FEF6F4",
      backgroundSecondary: "#FFFFFF",
      surfaceMuted: "#FFEAE6",
      divider: "#FFDAD4",
      glassBackground: "rgba(255, 255, 255, 0.95)",
    },
    dark: {
      accent: "#FF8E53",
      accentText: "#1A1215",
      accentSubtle: "#4D2D30",
      verseNumber: "#FFB088",
      gradientStart: "#FF8E53",
      gradientEnd: "#FF6B6B",
      gradientAccent: "#B794F4",
      glassBorder: "rgba(255, 142, 83, 0.3)",
      backgroundPrimary: "#1A1215",
      backgroundSecondary: "#251A1D",
      surfaceMuted: "#352428",
      divider: "#4A3338",
      glassBackground: "rgba(37, 26, 29, 0.85)",
    },
  },
  {
    name: "Ocean",
    label: "Océano",
    preview: "#0EA5E9",
    light: {
      accent: "#0EA5E9",
      accentText: "#FFFFFF",
      accentSubtle: "#DBEEF9",
      verseNumber: "#0284C7",
      gradientStart: "#0EA5E9",
      gradientEnd: "#06B6D4",
      gradientAccent: "#8B5CF6",
      glassBorder: "rgba(14, 165, 233, 0.3)",
      backgroundPrimary: "#F4FAFD",
      backgroundSecondary: "#FFFFFF",
      surfaceMuted: "#E3F3FC",
      divider: "#C8E6F8",
      glassBackground: "rgba(255, 255, 255, 0.95)",
    },
    dark: {
      accent: "#38BDF8",
      accentText: "#0C1222",
      accentSubtle: "#1E3A5F",
      verseNumber: "#7DD3FC",
      gradientStart: "#38BDF8",
      gradientEnd: "#22D3EE",
      gradientAccent: "#A78BFA",
      glassBorder: "rgba(56, 189, 248, 0.3)",
      backgroundPrimary: "#0C1222",
      backgroundSecondary: "#152238",
      surfaceMuted: "#1E3348",
      divider: "#2A4158",
      glassBackground: "rgba(21, 34, 56, 0.85)",
    },
  },
  {
    name: "Forest",
    label: "Bosque",
    preview: "#10B981",
    light: {
      accent: "#10B981",
      accentText: "#FFFFFF",
      accentSubtle: "#CCFAE5",
      verseNumber: "#059669",
      gradientStart: "#10B981",
      gradientEnd: "#34D399",
      gradientAccent: "#F59E0B",
      glassBorder: "rgba(16, 185, 129, 0.3)",
      backgroundPrimary: "#F4FDF8",
      backgroundSecondary: "#FFFFFF",
      surfaceMuted: "#E2F9ED",
      divider: "#C2F0D8",
      glassBackground: "rgba(255, 255, 255, 0.95)",
    },
    dark: {
      accent: "#34D399",
      accentText: "#0D1512",
      accentSubtle: "#1A3D2E",
      verseNumber: "#6EE7B7",
      gradientStart: "#34D399",
      gradientEnd: "#10B981",
      gradientAccent: "#FBBF24",
      glassBorder: "rgba(52, 211, 153, 0.3)",
      backgroundPrimary: "#0D1512",
      backgroundSecondary: "#152B22",
      surfaceMuted: "#1A3D2E",
      divider: "#2A5240",
      glassBackground: "rgba(21, 43, 34, 0.85)",
    },
  },
  {
    name: "Lavender",
    label: "Lavanda",
    preview: "#8B5CF6",
    light: {
      accent: "#8B5CF6",
      accentText: "#FFFFFF",
      accentSubtle: "#E8E0FD",
      verseNumber: "#7C3AED",
      gradientStart: "#8B5CF6",
      gradientEnd: "#A78BFA",
      gradientAccent: "#EC4899",
      glassBorder: "rgba(139, 92, 246, 0.3)",
      backgroundPrimary: "#F9F7FE",
      backgroundSecondary: "#FFFFFF",
      surfaceMuted: "#EDE6FC",
      divider: "#D8CEFA",
      glassBackground: "rgba(255, 255, 255, 0.95)",
    },
    dark: {
      accent: "#A78BFA",
      accentText: "#1A1625",
      accentSubtle: "#2E2050",
      verseNumber: "#C4B5FD",
      gradientStart: "#A78BFA",
      gradientEnd: "#8B5CF6",
      gradientAccent: "#F472B6",
      glassBorder: "rgba(167, 139, 250, 0.3)",
      backgroundPrimary: "#1A1625",
      backgroundSecondary: "#261E38",
      surfaceMuted: "#352B50",
      divider: "#453A65",
      glassBackground: "rgba(38, 30, 56, 0.85)",
    },
  },
  {
    name: "Rose",
    label: "Rosa",
    preview: "#F43F5E",
    light: {
      accent: "#F43F5E",
      accentText: "#FFFFFF",
      accentSubtle: "#FFDDE1",
      verseNumber: "#E11D48",
      gradientStart: "#F43F5E",
      gradientEnd: "#FB7185",
      gradientAccent: "#8B5CF6",
      glassBorder: "rgba(244, 63, 94, 0.3)",
      backgroundPrimary: "#FEF5F6",
      backgroundSecondary: "#FFFFFF",
      surfaceMuted: "#FFE6E9",
      divider: "#FDC8CE",
      glassBackground: "rgba(255, 255, 255, 0.95)",
    },
    dark: {
      accent: "#FB7185",
      accentText: "#1A1215",
      accentSubtle: "#4D2030",
      verseNumber: "#FDA4AF",
      gradientStart: "#FB7185",
      gradientEnd: "#F43F5E",
      gradientAccent: "#A78BFA",
      glassBorder: "rgba(251, 113, 133, 0.3)",
      backgroundPrimary: "#1A1215",
      backgroundSecondary: "#2D1A20",
      surfaceMuted: "#452530",
      divider: "#5A3540",
      glassBackground: "rgba(45, 26, 32, 0.85)",
    },
  },
];

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
  // Gradient colors for modern UI
  gradientStart: string;
  gradientEnd: string;
  gradientAccent: string;
  // Glass effect colors
  glassBackground: string;
  glassBorder: string;
};

export type GetFontSize = (size: number) => number;

export type ThemeContextValue = {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  accentColor: AccentColorName;
  setAccentColor: (accent: AccentColorName) => void;
  tintedBackground: boolean;
  setTintedBackground: (value: boolean) => void;
  colors: ThemeColors;
  statusBarStyle: StatusBarStyle;
  fontScale: number;
  setFontScale: (scale: number) => void;
  getFontSize: GetFontSize;
};

export const FONT_SCALE_MIN = 0.85;
export const FONT_SCALE_MAX = 1.25;
export const FONT_SCALE_STEP = 0.05;
const DEFAULT_SCREEN_HEIGHT = 812;

// Base colors for themes (without accent - accent comes from ACCENT_PRESETS)
type BaseThemeColors = {
  backgroundPrimary: string;
  backgroundSecondary: string;
  surfaceMuted: string;
  surfaceElevated: string;
  divider: string;
  headerText: string;
  bodyText: string;
  placeholderText: string;
  menuIcon: string;
  glassBackground: string;
};

type ThemePreset = {
  colors: BaseThemeColors;
  statusBarStyle: StatusBarStyle;
};

const THEME_PRESETS: Record<ThemeName, ThemePreset> = {
  Claro: {
    colors: {
      backgroundPrimary: "#F8F8F8",
      backgroundSecondary: "#FFFFFF",
      surfaceMuted: "#F0F0F0",
      surfaceElevated: "#FFFFFF",
      divider: "#E0E0E0",
      headerText: "#1A1A1A",
      bodyText: "#2D2D2D",
      placeholderText: "#6B6B6B",
      menuIcon: "#1A1A1A",
      glassBackground: "rgba(255, 255, 255, 0.92)",
    },
    statusBarStyle: "dark-content",
  },
  Oscuro: {
    colors: {
      backgroundPrimary: "#0A0A0A",
      backgroundSecondary: "#171717",
      surfaceMuted: "#262626",
      surfaceElevated: "#1C1C1C",
      divider: "#303030",
      headerText: "#FAFAFA",
      bodyText: "#E5E5E5",
      placeholderText: "#A3A3A3",
      menuIcon: "#FAFAFA",
      glassBackground: "rgba(23, 23, 23, 0.85)",
    },
    statusBarStyle: "light-content",
  },
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_FILE = "theme-settings.json";

type StoredThemeSettings = {
  theme?: unknown;
  fontScale?: unknown;
  accentColor?: unknown;
  tintedBackground?: unknown;
};

function isThemeName(value: unknown): value is ThemeName {
  return value === "Claro" || value === "Oscuro";
}

function isAccentColorName(value: unknown): value is AccentColorName {
  return value === "Sunset" || value === "Ocean" || value === "Forest" || value === "Lavender" || value === "Rose";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>("Claro");
  const [accentColor, setAccentColor] = useState<AccentColorName>("Sunset");
  const [tintedBackground, setTintedBackground] = useState(true); // Default ON
  const [fontScaleState, setFontScaleState] = useState(1);

  const handleSetFontScale = useCallback((scale: number) => {
    setFontScaleState((prev) => {
      const next = clamp(Number(scale.toFixed(2)), FONT_SCALE_MIN, FONT_SCALE_MAX);
      return prev === next ? prev : next;
    });
  }, []);

  const hydrationRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const stored = await getDataFromStorage(THEME_STORAGE_FILE);
      if (!isMounted) {
        return;
      }
      if (stored && typeof stored === "object") {
        const { theme: storedTheme, fontScale, accentColor: storedAccent, tintedBackground: storedTinted } = stored as StoredThemeSettings;
        if (isThemeName(storedTheme)) {
          setTheme(storedTheme);
        }
        if (typeof fontScale === "number") {
          handleSetFontScale(fontScale);
        }
        if (isAccentColorName(storedAccent)) {
          setAccentColor(storedAccent);
        }
        if (typeof storedTinted === "boolean") {
          setTintedBackground(storedTinted);
        }
      }
      hydrationRef.current = true;
    })().catch(() => {
      if (isMounted) {
        hydrationRef.current = true;
      }
    });

    return () => {
      isMounted = false;
    };
  }, [handleSetFontScale]);

  useEffect(() => {
    if (!hydrationRef.current) {
      return;
    }
    void saveDataOnStorage(
      THEME_STORAGE_FILE,
      JSON.stringify({ theme, fontScale: fontScaleState, accentColor, tintedBackground })
    );
  }, [fontScaleState, theme, accentColor, tintedBackground]);

  const value = useMemo<ThemeContextValue>(() => {
    const basePreset = THEME_PRESETS[theme];
    const accentPreset = ACCENT_PRESETS.find(p => p.name === accentColor) ?? ACCENT_PRESETS[0];
    const accentColors = theme === "Claro" ? accentPreset.light : accentPreset.dark;

    // Combine base theme colors with accent colors
    // If tintedBackground is ON, use tinted backgrounds from accent preset
    const colors: ThemeColors = {
      ...basePreset.colors,
      // Apply tinted backgrounds if enabled
      ...(tintedBackground ? {
        backgroundPrimary: accentColors.backgroundPrimary,
        backgroundSecondary: accentColors.backgroundSecondary,
        surfaceMuted: accentColors.surfaceMuted,
        divider: accentColors.divider,
        glassBackground: accentColors.glassBackground,
      } : {}),
      // Always apply accent colors
      accent: accentColors.accent,
      accentText: accentColors.accentText,
      accentSubtle: accentColors.accentSubtle,
      verseNumber: accentColors.verseNumber,
      gradientStart: accentColors.gradientStart,
      gradientEnd: accentColors.gradientEnd,
      gradientAccent: accentColors.gradientAccent,
      glassBorder: accentColors.glassBorder,
    };

    return {
      theme,
      setTheme,
      accentColor,
      setAccentColor,
      tintedBackground,
      setTintedBackground,
      colors,
      statusBarStyle: basePreset.statusBarStyle,
      fontScale: fontScaleState,
      setFontScale: handleSetFontScale,
      getFontSize: (size: number) =>
        RFValue(size * fontScaleState, DEFAULT_SCREEN_HEIGHT),
    };
  }, [fontScaleState, handleSetFontScale, theme, accentColor, tintedBackground]);

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
export const accentColorOptions: AccentColorName[] = ["Sunset", "Ocean", "Forest", "Lavender", "Rose"];
