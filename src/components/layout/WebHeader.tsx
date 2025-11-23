import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { NavigationProps } from '../../types/navigation';
import { colors } from '../../constants/colors';
import { fontSize, fontWeight } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

interface WebHeaderProps {
  title?: string;
  showNotifications?: boolean;
}

const routeTitles: Record<string, string> = {
  Home: 'Dashboard',
  TarjetasDeEstudio: 'Tarjetas de Estudio',
  PruebaPractica: 'Prueba Práctica',
  Vocabulario: 'Vocabulario',
  EntrevistaAI: 'Entrevista AI',
  Examen: 'Examen',
  StudyCards: 'Tarjetas de Estudio',
  Subcategorias: 'Secciones de Estudio',
};

const WebHeader: React.FC<WebHeaderProps> = ({ title, showNotifications = false }) => {
  const route = useRoute();
  const displayTitle = title || routeTitles[route.name] || route.name;

  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <Text style={styles.title}>{displayTitle}</Text>
        </View>

        <View style={styles.rightSection}>
          {showNotifications && (
            <TouchableOpacity style={styles.notificationButton}>
              <Text style={styles.notificationIcon}>🔔</Text>
              {/* Aquí puedes añadir un badge de notificaciones */}
            </TouchableOpacity>
          )}
          <View style={styles.userSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <Text style={styles.userName}>Estudiante</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 64,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.divider,
    ...Platform.select({
      web: {
        position: 'fixed' as any,
        top: 0,
        left: 280,
        right: 0,
        zIndex: 99,
      },
    }),
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    maxWidth: 1400,
    marginHorizontal: 'auto',
    width: '100%',
  },
  leftSection: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.dark,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface.light,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral.divider,
  },
  notificationIcon: {
    fontSize: 20,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
  },
  userName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text.dark,
  },
});

export default WebHeader;

