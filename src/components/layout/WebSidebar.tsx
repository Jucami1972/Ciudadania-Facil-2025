import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NavigationProps, RootStackParamList } from '../../types/navigation';
import { PracticeMode } from '../../types/question';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/colors';
import { fontSize, fontWeight } from '../../constants/typography';
import { spacing, radius } from '../../constants/spacing';

interface SidebarItem {
  label: string;
  icon?: string;
  route: keyof RootStackParamList;
  gradient: readonly [string, string];
}

const sidebarItems: SidebarItem[] = [
  {
    label: 'Dashboard',
    icon: '🏠',
    route: 'Home',
    gradient: ['#270483', '#8146cc'],
  },
  {
    label: 'Tarjetas de Estudio',
    icon: '📚',
    route: 'Study' as any,
    gradient: ['#270483', '#8146cc'],
  },
  {
    label: 'Prueba Práctica',
    icon: '✍️',
    route: 'Practice' as any,
    gradient: ['#470a56', '#ce32b1'],
  },
  {
    label: 'Vocabulario',
    icon: '📖',
    route: 'Practice' as any,
    gradient: ['#270483', '#8146cc'],
  },
  {
    label: 'Entrevista AI',
    icon: '🤖',
    route: 'Practice' as any,
    gradient: ['#470a56', '#ce32b1'],
  },
  {
    label: 'Examen',
    icon: '📝',
    route: 'Practice' as any,
    gradient: ['#1B5E20', '#4CAF50'],
  },
];

const WebSidebar: React.FC = () => {
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute();

  const handleNavigate = (routeName: keyof RootStackParamList, index: number) => {
    if (routeName === 'Home') {
      navigation.navigate('Home');
    } else if (routeName === 'Study') {
      // Navegar a Study tab y luego a StudyHome
      navigation.navigate('Study', { screen: 'StudyHome' });
    } else if (routeName === 'Practice') {
      // Navegar a Practice tab y luego a la pantalla correspondiente
      const practiceRoutes: Record<number, string> = {
        2: 'PruebaPracticaHome', // Prueba Práctica
        3: 'VocabularioHome',     // Vocabulario
        4: 'EntrevistaAIHome',    // Entrevista AI
        5: 'ExamenHome',          // Examen
      };
      const targetScreen = practiceRoutes[index] || 'PruebaPracticaHome';
      navigation.navigate('Practice', { screen: targetScreen });
    } else {
      // Fallback para otras rutas
      (navigation as any).navigate(routeName);
    }
  };

  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Logo/Brand */}
      <View style={styles.brandSection}>
        <Text style={styles.logoText}>📘</Text>
        <Text style={styles.brandTitle}>Ciudadanía</Text>
        <Text style={styles.brandSubtitle}>Fácil 2025</Text>
      </View>

      {/* Navigation Items */}
      <View style={styles.navSection}>
        {sidebarItems.map((item, index) => {
          // Determinar si el item está activo basado en la ruta actual
          const isActive = 
            (item.route === 'Home' && (route.name === 'Home' || route.name === 'AppTabs')) ||
            (item.route === 'Study' && (route.name === 'StudyHome' || route.name === 'StudyCards' || route.name === 'Subcategorias' || route.name === 'StudyCardsByType')) ||
            (item.route === 'Practice' && (
              route.name === 'PruebaPracticaHome' ||
              route.name === 'VocabularioHome' ||
              route.name === 'EntrevistaAIHome' ||
              route.name === 'ExamenHome' ||
              route.name === 'CategoryPracticeHome' ||
              route.name === 'QuestionTypePracticeHome' ||
              route.name === 'Random20PracticeHome' ||
              route.name === 'PhotoMemoryHome'
            ));
          
          return (
            <TouchableOpacity
              key={index}
              onPress={() => handleNavigate(item.route, index)}
              style={styles.navItem}
            >
              {isActive ? (
                <LinearGradient
                  colors={item.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.navItemActive}
                >
                  <Text style={styles.navIcon}>{item.icon}</Text>
                  <Text style={styles.navLabelActive}>{item.label}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.navItemInactive}>
                  <Text style={styles.navIcon}>{item.icon}</Text>
                  <Text style={styles.navLabel}>{item.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Footer */}
      <View style={styles.footerSection}>
        <Text style={styles.footerText}>Versión 2025</Text>
        <Text style={styles.footerSubtext}>128 Preguntas</Text>
      </View>
    </View>
  );
};

const baseContainerStyle = {
  width: 280,
  backgroundColor: '#FFFFFF',
  borderRightWidth: 1,
  borderRightColor: colors.neutral.divider,
  flexDirection: 'column' as const,
  paddingTop: spacing.xl,
  paddingBottom: spacing.lg,
};

const webContainerStyle = Platform.OS === 'web' ? {
  position: 'fixed' as any,
  left: 0,
  top: 0,
  bottom: 0,
  zIndex: 100,
} : {
  height: '100%' as const,
};

const styles = StyleSheet.create({
  container: {
    ...baseContainerStyle,
    ...webContainerStyle,
  } as any,
  brandSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.divider,
    marginBottom: spacing.lg,
  },
  logoText: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  brandTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.dark,
    textAlign: 'center',
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.light,
    textAlign: 'center',
  },
  navSection: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  navItem: {
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  navItemActive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  navItemInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'transparent',
  },
  navIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  navLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text.dark,
  },
  navLabelActive: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: '#FFFFFF',
  },
  footerSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.divider,
    marginTop: spacing.lg,
  },
  footerText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.dark,
    textAlign: 'center',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: fontSize.xs,
    color: colors.text.light,
    textAlign: 'center',
  },
});

export default WebSidebar;

