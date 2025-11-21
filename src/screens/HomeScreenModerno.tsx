// src/screens/HomeScreenModerno.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar,
  ImageBackground,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProps } from '../types/navigation';
import { PracticeMode } from '../types/question';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const BREAKPOINT = 768;
const isWeb = Platform.OS === 'web';
const isDesktop = isWeb && width >= BREAKPOINT;

interface MenuItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  route: string;
  stackRoute?: string; // Ruta dentro del stack
  params?: any;
  disabled?: boolean;
}

const HomeScreenModerno = () => {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();
  const [studyProgress, setStudyProgress] = useState<number>(0);

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const viewedRaw = await AsyncStorage.getItem('@study:viewed');
        const viewed = new Set<number>(viewedRaw ? JSON.parse(viewedRaw) : []);
        const total = 128;
        const pct = Math.max(0, Math.min(100, Math.round((viewed.size / total) * 100)));
        setStudyProgress(pct);
      } catch {}
    };
    const unsubscribe = navigation.addListener('focus', loadProgress);
    loadProgress();
    return unsubscribe;
  }, [navigation]);

  // Helpers para navegación a stacks
  const navigateToPracticeStack = (screenName: string) => {
    navigation.navigate('Practice', { screen: screenName });
  };

  const navigateToStudyStack = (screenName: string) => {
    navigation.navigate('Study', { screen: screenName });
  };

  const menuItems: MenuItem[] = [
    {
      id: 'study-cards',
      title: 'Tarjetas de Estudio',
      subtitle: 'Aprende con tarjetas interactivas',
      icon: 'cards-heart',
      color: '#1E40AF', // Azul profesional
      route: 'Study',
      stackRoute: 'StudyHome', // Primero va a StudyHome (categorías), luego el usuario selecciona
    },
    {
      id: 'practice-test',
      title: 'Prueba Práctica',
      subtitle: 'Simula el examen de Ciudadanía',
      icon: 'clipboard-check',
      color: '#ec4899',
      route: 'Practice',
      stackRoute: 'PruebaPracticaHome',
    },
    {
      id: 'vocabulary',
      title: 'Vocabulario',
      subtitle: 'Palabras clave del examen',
      icon: 'book-open-variant',
      color: '#06b6d4',
      route: 'Practice',
      stackRoute: 'VocabularioHome',
    },
    {
      id: 'photo-memory',
      title: 'Memoria Fotográfica',
      subtitle: 'Asocia imágenes con respuestas',
      icon: 'image-outline',
      color: '#1E40AF', // Azul profesional
      route: 'Practice',
      stackRoute: 'PhotoMemoryHome',
    },
    {
      id: 'ai-interview-placeholder',
      title: 'Entrevista AI (Próximamente)',
      subtitle: 'Oficial virtual para practicar la entrevista N-400',
      icon: 'microphone-outline',
      color: '#9ca3af',
      route: 'Practice',
      stackRoute: 'EntrevistaAIHome',
      disabled: true,
    },
    {
      id: 'exam',
      title: 'Examen',
      subtitle: '20 preguntas (pasa con 12)',
      icon: 'star-outline',
      color: '#14b8a6',
      route: 'Practice',
      stackRoute: 'ExamenHome',
    },
  ];

  const handleMenuPress = (item: MenuItem) => {
    if (item.disabled) {
      return;
    }
    
    if (item.route === 'Study' && item.stackRoute) {
      navigateToStudyStack(item.stackRoute);
    } else if (item.route === 'Practice' && item.stackRoute) {
      navigateToPracticeStack(item.stackRoute);
    } else {
      // Fallback para rutas directas (si existen)
      navigation.navigate(item.route as any, item.params);
    }
  };

  const renderMobileLayout = () => (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* TARJETA DE PROGRESO */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Tu Progreso</Text>
          <Text style={styles.progressPercentage}>{studyProgress}%</Text>
        </View>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill,
              { width: `${studyProgress}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {studyProgress === 0 
            ? 'Comienza tu preparación' 
            : `¡Vas muy bien! Continúa practicando`}
        </Text>
      </View>

      {/* GRID DE OPCIONES */}
      <View style={styles.menuGrid}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItemWrapper}
            onPress={() => handleMenuPress(item)}
            activeOpacity={0.8}
            disabled={item.disabled}
          >
            <View style={[styles.menuItem, { borderLeftColor: item.color, opacity: item.disabled ? 0.5 : 1 }]}>
              <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                <MaterialCommunityIcons 
                  name={item.icon as any} 
                  size={24} 
                  color="#fff" 
                />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.menuSubtitle} numberOfLines={2}>
                  {item.subtitle}
                </Text>
              </View>
              <MaterialCommunityIcons 
                name="chevron-right" 
                size={20} 
                color="#ccc" 
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* SECCIÓN DE CONSEJOS */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsSectionTitle}>Consejos para Estudiar</Text>
        
        <View style={styles.tipCard}>
          <View style={[styles.tipIcon, { backgroundColor: '#fef3c7' }]}>
            <MaterialCommunityIcons name="lightbulb" size={20} color="#f59e0b" />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Practica Diariamente</Text>
            <Text style={styles.tipText}>
              Dedica 30 minutos al día para mejorar tu retención
            </Text>
          </View>
        </View>

        <View style={styles.tipCard}>
          <View style={[styles.tipIcon, { backgroundColor: '#dbeafe' }]}>
            <MaterialCommunityIcons name="microphone" size={20} color="#06b6d4" />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Usa la Entrevista AI</Text>
            <Text style={styles.tipText}>
              Practica pronunciación y respuestas orales
            </Text>
          </View>
        </View>

        <View style={styles.tipCard}>
          <View style={[styles.tipIcon, { backgroundColor: '#dcfce7' }]}>
            <MaterialCommunityIcons name="image" size={20} color="#10b981" />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Memoria Visual</Text>
            <Text style={styles.tipText}>
              Asocia imágenes con preguntas para mejor retención
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderDesktopLayout = () => (
    <View style={styles.desktopContainer}>
      {/* Columna Izquierda: Progreso y Opciones */}
      <View style={styles.desktopLeftColumn}>
        {/* TARJETA DE PROGRESO */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Tu Progreso</Text>
            <Text style={styles.progressPercentage}>{studyProgress}%</Text>
          </View>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill,
                { width: `${studyProgress}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {studyProgress === 0 
              ? 'Comienza tu preparación' 
              : `¡Vas muy bien! Continúa practicando`}
          </Text>
        </View>

        {/* GRID DE OPCIONES (2 Columnas) */}
        <View style={styles.desktopMenuGrid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.desktopMenuItemWrapper}
              onPress={() => handleMenuPress(item)}
              activeOpacity={0.8}
              disabled={item.disabled}
            >
              <View style={[styles.desktopMenuItem, { borderLeftColor: item.color, opacity: item.disabled ? 0.5 : 1 }]}>
                <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                  <MaterialCommunityIcons 
                    name={item.icon as any} 
                    size={24} 
                    color="#fff" 
                  />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.menuSubtitle} numberOfLines={2}>
                    {item.subtitle}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Columna Derecha: Consejos y Estadísticas (Tips Section) */}
      <View style={styles.desktopRightColumn}>
        <Text style={styles.tipsSectionTitle}>Consejos para Estudiar</Text>
        
        <View style={styles.tipCard}>
          <View style={[styles.tipIcon, { backgroundColor: '#fef3c7' }]}>
            <MaterialCommunityIcons name="lightbulb" size={20} color="#f59e0b" />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Practica Diariamente</Text>
            <Text style={styles.tipText}>
              Dedica 30 minutos al día para mejorar tu retención
            </Text>
          </View>
        </View>

        <View style={styles.tipCard}>
          <View style={[styles.tipIcon, { backgroundColor: '#dbeafe' }]}>
            <MaterialCommunityIcons name="microphone" size={20} color="#06b6d4" />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Usa la Entrevista AI</Text>
            <Text style={styles.tipText}>
              Practica pronunciación y respuestas orales
            </Text>
          </View>
        </View>

        <View style={styles.tipCard}>
          <View style={[styles.tipIcon, { backgroundColor: '#dcfce7' }]}>
            <MaterialCommunityIcons name="image" size={20} color="#10b981" />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Memoria Visual</Text>
            <Text style={styles.tipText}>
              Asocia imágenes con preguntas para mejor retención
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />
      
      {/* HEADER MODERNO (Solo visible en móvil, en desktop se usa el Sidebar) */}
      {!isDesktop && (
        <View style={styles.headerWrapper}>
          <ImageBackground
            source={require('../assets/header.webp')}
            style={styles.headerBackground}
            resizeMode="cover"
          >
            <View style={styles.headerOverlay} />
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Ciudadanía Fácil</Text>
                <Text style={styles.headerSubtitle}>Prepárate para el examen</Text>
              </View>
              {user && (
                <TouchableOpacity 
                  style={styles.profileButton}
                  onPress={logout}
                >
                  <MaterialCommunityIcons name="logout" size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </ImageBackground>
        </View>
      )}

      {isDesktop ? renderDesktopLayout() : renderMobileLayout()}

      {/* FOOTER (Solo visible en móvil o en la parte inferior del scroll en desktop) */}
      {!isDesktop && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {user ? `Conectado como: ${user.email}` : 'Versión 2.1'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerWrapper: {
    width: '100%',
    height: 100,
    overflow: 'hidden',
    borderBottomRightRadius: 45,
    ...Platform.select({
      web: {
        marginHorizontal: 'auto',
        maxWidth: 1200,
        borderRadius: 20,
        marginTop: 10,
        marginBottom: 20,
      },
    }),
  },
  headerBackground: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Platform.OS === 'web' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.4)',
  },
  header: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
    padding: 24,
    maxWidth: 1200,
    marginHorizontal: 'auto',
  },
  desktopLeftColumn: {
    flex: 2, // Ocupa 2/3 del espacio
    marginRight: 24,
  },
  desktopRightColumn: {
    flex: 1, // Ocupa 1/3 del espacio
    paddingTop: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E40AF', // Azul profesional
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1E40AF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: '#666',
  },
  menuGrid: {
    marginBottom: 24,
  },
  desktopMenuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  desktopMenuItemWrapper: {
    width: '48%', // Dos columnas
    marginBottom: 16,
  },
  desktopMenuItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    height: 80, // Altura fija para uniformidad
  },
  menuItemWrapper: {
    marginBottom: 12,
  },
  menuItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#999',
    lineHeight: 16,
  },
  tipsSection: {
    marginBottom: 24,
  },
  tipsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  tipCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tipIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});

export default HomeScreenModerno;