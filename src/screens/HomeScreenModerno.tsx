// src/screens/HomeScreenModerno.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';

type NavCardProps = {
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
};

const NavCard = ({ icon, title, subtitle, color, onPress }: NavCardProps) => (
  <TouchableOpacity 
    style={[styles.card, { borderLeftColor: color }]} 
    onPress={onPress} 
    activeOpacity={0.85}
  >
    <View style={[styles.iconContainer, { backgroundColor: `${color}12` }]}>
      <MaterialCommunityIcons name={icon as any} size={22} color={color} />
    </View>
    <View style={styles.textContainer}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
    </View>
    <MaterialCommunityIcons name="chevron-right" size={18} color="#d1d5db" />
  </TouchableOpacity>
);

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
      } catch (error) {
        console.error('Error loading progress:', error);
      }
    };
    const unsubscribe = navigation.addListener('focus', loadProgress);
    loadProgress();
    return unsubscribe;
  }, [navigation]);

  const navigateToPracticeStack = (screenName: string, params?: Record<string, any>) => {
    navigation.navigate('Practice', { screen: screenName, params });
  };

  const navigateToStudyStack = (screenName: string) => {
    navigation.navigate('Study', { screen: screenName });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Ciudadanía Fácil</Text>
            <Text style={styles.headerSubtitle}>Preparación para el examen</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={logout}
          >
            <MaterialCommunityIcons name="account-circle" size={24} color="#1f2937" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Tu progreso</Text>
            <Text style={styles.progressPercentage}>{studyProgress}%</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View 
              style={[styles.progressBarFill, { width: `${studyProgress}%` }]} 
            />
          </View>
          <Text style={styles.progressSubtitle}>
            {studyProgress < 50 
              ? '¡Sigue estudiando para tu examen!' 
              : studyProgress < 100 
              ? '¡Vas muy bien, continúa así!'
              : '¡Felicidades, has completado todo!'}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="book-open-variant" size={18} color="#7c3aed" />
            <Text style={styles.sectionHeaderText}>Estudio</Text>
          </View>
          <NavCard
            icon="book-open-variant"
            title="Tarjetas de Estudio"
            subtitle="Aprende las 128 preguntas por categoría"
            color="#7c3aed"
            onPress={() => navigateToStudyStack('StudyHome')}
          />
          <NavCard
            icon="image-multiple"
            title="Memoria Fotográfica"
            subtitle="Asocia preguntas con imágenes"
            color="#10b981"
            onPress={() => navigateToPracticeStack('PhotoMemoryHome')}
          />
          <NavCard
            icon="alphabetical-variant"
            title="Vocabulario"
            subtitle="Palabras clave con pronunciación"
            color="#f59e0b"
            onPress={() => navigateToPracticeStack('VocabularioHome')}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="pencil-box" size={18} color="#10b981" />
            <Text style={styles.sectionHeaderText}>Práctica</Text>
          </View>
          <NavCard
            icon="microphone-variant"
            title="Entrevista AI (N-400)"
            subtitle="Simula una entrevista real"
            color="#ef4444"
            onPress={() => navigateToPracticeStack('EntrevistaAIHome')}
          />
          <NavCard
            icon="format-list-numbered"
            title="Práctica por Tipo"
            subtitle="¿Quién?, ¿Qué?, ¿Cuándo?"
            color="#06b6d4"
            onPress={() => navigateToPracticeStack('QuestionTypePracticeHome')}
          />
          <NavCard
            icon="clipboard-check"
            title="Examen de 20 Preguntas"
            subtitle="Simulación real, necesitas 12 correctas"
            color="#7c3aed"
            onPress={() => navigateToPracticeStack('Random20PracticeHome')}
          />
          <NavCard
            icon="pencil-box-multiple"
            title="Prueba Práctica"
            subtitle="Categorías, aleatorias, incorrectas y marcadas"
            color="#10b981"
            onPress={() => navigateToPracticeStack('PruebaPracticaHome')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 1,
    letterSpacing: 0.1,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7c3aed',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#7c3aed',
    borderRadius: 3,
  },
  progressSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
    lineHeight: 14,
  },
});

export default HomeScreenModerno;
