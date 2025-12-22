import React from 'react';
import { View, Text, Modal, StyleSheet, Pressable } from 'react-native';
import { BookOpen, X } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import type { ThemeColors, GetFontSize } from '../context/ThemeContext';

interface EndOfBookModalProps {
  visible: boolean;
  bookName: string;
  nextBookName: string;
  onContinue: () => void;
  onRemovePin: () => void;
}

export const EndOfBookModal: React.FC<EndOfBookModalProps> = ({
  visible,
  bookName,
  nextBookName,
  onContinue,
  onRemovePin,
}) => {
  const { colors, getFontSize } = useTheme();
  const styles = createStyles(colors, getFontSize);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRemovePin}
    >
      <View style={styles.overlay}>
        <View
          style={[styles.modal, { backgroundColor: colors.backgroundPrimary }]}
        >
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <BookOpen size={24} color={colors.accent} />
              <Text style={[styles.title, { color: colors.headerText }]}>
                Fin de {bookName}
              </Text>
            </View>
          </View>

          <Text style={[styles.message, { color: colors.bodyText }]}>
            Has terminado {bookName}. ¿Qué deseas hacer con tu lectura anclada?
          </Text>

          <View style={styles.buttons}>
            <Pressable
              style={[
                styles.button,
                styles.secondaryButton,
                { borderColor: colors.divider },
              ]}
              onPress={onRemovePin}
            >
              <X size={18} color={colors.bodyText} />
              <Text style={[styles.buttonText, { color: colors.bodyText }]}>
                Eliminar ancla
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.button,
                styles.primaryButton,
                { backgroundColor: colors.accent },
              ]}
              onPress={onContinue}
            >
              <BookOpen size={18} color="#FFFFFF" />
              <Text style={[styles.buttonText, styles.primaryButtonText]}>
                Continuar a {nextBookName}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors, getFontSize: GetFontSize) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modal: {
      borderRadius: 16,
      padding: 24,
      width: '100%',
      maxWidth: 400,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    header: {
      marginBottom: 16,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    title: {
      fontSize: getFontSize(20),
      fontWeight: '700',
    },
    message: {
      fontSize: getFontSize(15),
      lineHeight: getFontSize(22),
      marginBottom: 24,
    },
    buttons: {
      gap: 12,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 12,
    },
    secondaryButton: {
      borderWidth: 1.5,
    },
    primaryButton: {
      // backgroundColor set dynamically
    },
    buttonText: {
      fontSize: getFontSize(15),
      fontWeight: '600',
    },
    primaryButtonText: {
      color: '#FFFFFF',
    },
  });
