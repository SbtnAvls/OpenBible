import React, { useEffect } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { Pin } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import type { ThemeColors, GetFontSize } from '../context/ThemeContext';

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
  duration?: number;
  icon?: React.ReactNode;
  borderColor?: string;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  visible,
  onHide,
  duration = 2000,
  icon,
  borderColor,
}) => {
  const { colors, getFontSize } = useTheme();
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(duration),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onHide();
      });
    }
  }, [visible, duration, onHide, opacity]);

  if (!visible) {
    return null;
  }

  const styles = createStyles(colors, getFontSize);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          backgroundColor: colors.backgroundSecondary,
          borderColor: borderColor || colors.accent,
        },
      ]}
    >
      {icon || <Pin size={14} color={colors.accent} fill={colors.accent} />}
      <Text style={[styles.message, { color: colors.bodyText }]}>
        {message}
      </Text>
    </Animated.View>
  );
};

const createStyles = (colors: ThemeColors, getFontSize: GetFontSize) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 80,
      left: 20,
      right: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1.5,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    message: {
      fontSize: getFontSize(13),
      fontWeight: '500',
    },
  });
