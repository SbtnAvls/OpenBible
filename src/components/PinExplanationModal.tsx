import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { Pin, ArrowRight, BookOpen } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import type { ThemeColors, GetFontSize } from '../context/ThemeContext';

interface PinExplanationModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PinExplanationModal: React.FC<PinExplanationModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors, getFontSize } = useTheme();
  const styles = createStyles(colors, getFontSize);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.backgroundPrimary }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Pin size={32} color={colors.accent} fill={colors.accent} />
              </View>
              <Text style={[styles.title, { color: colors.headerText }]}>
                Anclas de Lectura
              </Text>
              <Text style={[styles.subtitle, { color: colors.placeholderText }]}>
                Continúa tu lectura automáticamente
              </Text>
            </View>

            <View style={styles.content}>
              <View style={styles.feature}>
                <View style={[styles.featureIcon, { backgroundColor: colors.accentSubtle }]}>
                  <Pin size={20} color={colors.accent} />
                </View>
                <View style={styles.featureText}>
                  <Text style={[styles.featureTitle, { color: colors.bodyText }]}>
                    Ancla tus lecturas
                  </Text>
                  <Text style={[styles.featureDescription, { color: colors.placeholderText }]}>
                    Puedes anclar hasta 3 lecturas recientes. Estas nunca se borrarán automáticamente.
                  </Text>
                </View>
              </View>

              <View style={styles.feature}>
                <View style={[styles.featureIcon, { backgroundColor: colors.accentSubtle }]}>
                  <ArrowRight size={20} color={colors.accent} />
                </View>
                <View style={styles.featureText}>
                  <Text style={[styles.featureTitle, { color: colors.bodyText }]}>
                    Actualización automática
                  </Text>
                  <Text style={[styles.featureDescription, { color: colors.placeholderText }]}>
                    Cuando avanzas al siguiente capítulo, el ancla se actualiza automáticamente y el capítulo anterior se elimina de la lista.
                  </Text>
                </View>
              </View>

              <View style={styles.feature}>
                <View style={[styles.featureIcon, { backgroundColor: colors.accentSubtle }]}>
                  <BookOpen size={20} color={colors.accent} />
                </View>
                <View style={styles.featureText}>
                  <Text style={[styles.featureTitle, { color: colors.bodyText }]}>
                    Fin de libro
                  </Text>
                  <Text style={[styles.featureDescription, { color: colors.placeholderText }]}>
                    Al terminar un libro, podrás elegir si continuar al siguiente libro o eliminar el ancla.
                  </Text>
                </View>
              </View>
            </View>

            <Pressable
              style={[styles.button, { backgroundColor: colors.accent }]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                Entendido
              </Text>
            </Pressable>
          </ScrollView>
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
      maxWidth: 450,
      maxHeight: '85%',
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
      alignItems: 'center',
      marginBottom: 24,
    },
    iconContainer: {
      marginBottom: 16,
    },
    title: {
      fontSize: getFontSize(24),
      fontWeight: '700',
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: getFontSize(15),
      textAlign: 'center',
    },
    content: {
      marginBottom: 24,
    },
    feature: {
      flexDirection: 'row',
      marginBottom: 20,
    },
    featureIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    featureText: {
      flex: 1,
    },
    featureTitle: {
      fontSize: getFontSize(16),
      fontWeight: '600',
      marginBottom: 4,
    },
    featureDescription: {
      fontSize: getFontSize(14),
      lineHeight: getFontSize(20),
    },
    button: {
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center',
    },
    buttonText: {
      fontSize: getFontSize(16),
      fontWeight: '600',
    },
  });
