import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gem, Shield } from 'lucide-react-native';
import { useTheme, type ThemeColors } from '../context/ThemeContext';
import { STREAK_COLORS, type ShopItem } from '../types/streak';

interface ShopItemCardProps {
  item: ShopItem;
  canPurchase: boolean;
  onPurchase: () => void;
}

export function ShopItemCard({
  item,
  canPurchase,
  onPurchase,
}: ShopItemCardProps) {
  const { colors, getFontSize } = useTheme();
  const styles = getStyles(colors, getFontSize);

  return (
    <View style={styles.container}>
      {/* Icono */}
      <View style={styles.iconContainer}>
        <Shield size={28} color={STREAK_COLORS.frozen} />
        {item.quantity > 1 && (
          <View style={styles.quantityBadge}>
            <Text style={styles.quantityText}>x{item.quantity}</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>

      {/* Botón de compra */}
      <Pressable
        style={({ pressed }) => [
          styles.buyButton,
          !canPurchase && styles.buyButtonDisabled,
          pressed && canPurchase && { opacity: 0.8 },
        ]}
        onPress={onPurchase}
        disabled={!canPurchase}
      >
        <Gem
          size={16}
          color={canPurchase ? STREAK_COLORS.gems : colors.placeholderText}
        />
        <Text
          style={[styles.priceText, !canPurchase && styles.priceTextDisabled]}
        >
          {item.price}
        </Text>
      </Pressable>
    </View>
  );
}

const getStyles = (
  colors: ThemeColors,
  getFontSize: (size: number) => number,
) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceMuted,
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
    },
    iconContainer: {
      width: 52,
      height: 52,
      borderRadius: 14,
      backgroundColor: `${STREAK_COLORS.frozen}20`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    quantityBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      backgroundColor: STREAK_COLORS.frozen,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    quantityText: {
      fontSize: 11,
      fontWeight: '700',
      color: 'white',
    },
    info: {
      flex: 1,
    },
    name: {
      fontSize: getFontSize(15),
      fontWeight: '600',
      color: colors.headerText,
    },
    description: {
      fontSize: getFontSize(13),
      color: colors.placeholderText,
      marginTop: 2,
    },
    buyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: `${STREAK_COLORS.gems}20`,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      gap: 6,
      borderWidth: 1,
      borderColor: STREAK_COLORS.gems,
    },
    buyButtonDisabled: {
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.divider,
    },
    priceText: {
      fontSize: getFontSize(15),
      fontWeight: '700',
      color: STREAK_COLORS.gems,
    },
    priceTextDisabled: {
      color: colors.placeholderText,
    },
  });
