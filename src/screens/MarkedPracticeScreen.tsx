// src/screens/MarkedPracticeScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProps } from '../types/navigation';
import { practiceQuestions, PracticeQuestion } from '../data/practiceQuestions';
import { designSystem } from '../config/designSystem';

interface MarkedQuestion extends PracticeQuestion {
  markedDate?: string;
}

const MarkedPracticeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProps>();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [markedQuestions, setMarkedQuestions] = useState<MarkedQuestion[]>([]);

  useEffect(() => {
    loadMarkedQuestions();
  }, []);

  const loadMarkedQuestions = async () => {
    try {
      setIsLoading(true);
      // Cargar IDs de preguntas marcadas desde AsyncStorage
      const markedData = await AsyncStorage.getItem('@practice:marked');
      
      if (markedData) {
        const markedIds: number[] = JSON.parse(markedData);
        
        // Filtrar las preguntas reales usando los IDs
        const loadedQuestions = practiceQuestions.filter(q => 
          markedIds.includes(q.id)
        );
        
        // Mapear a MarkedQuestion con información adicional
        const questionsWithInfo: MarkedQuestion[] = loadedQuestions.map(q => ({
          ...q,
          markedDate: new Date().toISOString(), // Por ahora, se puede mejorar guardando la fecha real
        }));
        
        setMarkedQuestions(questionsWithInfo);
      } else {
        setMarkedQuestions([]);
      }
    } catch (error) {
      console.error('Error loading marked questions:', error);
      setMarkedQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const startPractice = () => {
    if (markedQuestions.length === 0) return;
    
    // Crear una práctica con las preguntas marcadas
    navigation.navigate('CategoryPractice', {
      questionType: 'marked',
    });
  };

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      government: 'Gobierno Americano',
      history: 'Historia Americana',
      civics: 'Educación Cívica',
    };
    return labels[category] || category;
  };

  const renderQuestion = ({ item }: { item: MarkedQuestion }) => (
    <View style={styles.questionCard}>
      <View style={styles.questionHeader}>
        <View style={styles.categoryBadge}>
          <MaterialCommunityIcons 
            name={item.category === 'government' ? 'bank' : 
                  item.category === 'history' ? 'book-open-variant' : 'school'} 
            size={14} 
            color="#10b981" 
          />
          <Text style={styles.categoryText}>{getCategoryLabel(item.category)}</Text>
        </View>
        <View style={styles.bookmarkBadge}>
          <MaterialCommunityIcons name="bookmark" size={12} color="#10b981" />
        </View>
      </View>
      <Text style={styles.questionText} numberOfLines={3}>
        {item.question}
      </Text>
      <View style={styles.answerPreview}>
        <Text style={styles.answerLabel}>Respuesta:</Text>
        <Text style={styles.answerText} numberOfLines={2}>
          {item.answer}
        </Text>
      </View>
    </View>
  );

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons 
        name="bookmark-outline" 
        size={64} 
        color="#6b7280" 
      />
      <Text style={styles.emptyTitle}>No hay preguntas marcadas</Text>
      <Text style={styles.emptyDescription}>
        Marca las preguntas que quieras repasar más tarde desde las tarjetas de estudio o durante la práctica.
      </Text>
    </View>
  );

  return (
    <View style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#1E3A8A', '#1E40AF', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.header, { paddingTop: insets.top + 8 }]}
          >
            <View style={styles.headerContent}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                accessibilityLabel="Volver atrás"
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="arrow-left" size={22} color="white" />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>Preguntas Marcadas</Text>
                <Text style={styles.headerSubtitle}>Guardadas para repasar</Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('Home')}
                style={styles.backButton}
                accessibilityLabel="Ir al inicio"
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="home" size={22} color="white" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={designSystem.colors.brand.primary} />
          <Text style={styles.loadingText}>Cargando preguntas...</Text>
        </View>
      ) : (
        <>
          <ScrollView 
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {markedQuestions.length > 0 && (
              <View style={styles.introCard}>
                <View style={styles.introIconContainer}>
                  <MaterialCommunityIcons name="bookmark" size={24} color={designSystem.colors.functional.success} />
                </View>
                <Text style={styles.introTitle}>
                  {markedQuestions.length} {markedQuestions.length === 1 ? 'pregunta marcada' : 'preguntas marcadas'}
                </Text>
                <Text style={styles.introSubtitle}>
                  Practica estas preguntas para reforzar tu conocimiento
                </Text>
              </View>
            )}

            <FlatList
              data={markedQuestions}
              renderItem={renderQuestion}
              keyExtractor={item => item.id.toString()}
              scrollEnabled={false}
              ListEmptyComponent={ListEmptyComponent}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              windowSize={10}
              initialNumToRender={10}
              updateCellsBatchingPeriod={50}
            />
          </ScrollView>

          {markedQuestions.length > 0 && (
            <View style={styles.bottomContainer}>
              <TouchableOpacity
                style={styles.startButton}
                onPress={startPractice}
              >
                <MaterialCommunityIcons name="play-circle" size={20} color="#fff" />
                <Text style={styles.buttonText}>Comenzar Práctica</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1E3A8A',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: designSystem.colors.background.secondary,
  },
  headerContainer: {},
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: designSystem.spacing.md,
    paddingTop: designSystem.spacing.md,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: designSystem.spacing.lg,
  },
  loadingText: {
    marginTop: designSystem.spacing.md,
    fontSize: 14,
    color: designSystem.colors.text.secondary,
    textAlign: 'center',
  },
  introCard: {
    backgroundColor: designSystem.colors.background.primary,
    borderRadius: designSystem.borderRadius.lg,
    padding: designSystem.spacing.md,
    alignItems: 'center',
    marginBottom: designSystem.spacing.md,
    ...designSystem.shadows.sm,
  },
  introIconContainer: {
    width: 48,
    height: 48,
    borderRadius: designSystem.borderRadius.md,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: designSystem.spacing.sm + 4,
  },
  introTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: designSystem.colors.text.primary,
    marginBottom: 6,
    textAlign: 'center',
  },
  introSubtitle: {
    fontSize: 12,
    color: designSystem.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },
  questionCard: {
    backgroundColor: designSystem.colors.background.primary,
    borderRadius: designSystem.borderRadius.lg,
    padding: designSystem.spacing.md,
    marginBottom: designSystem.spacing.sm + 2,
    ...designSystem.shadows.sm,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designSystem.spacing.sm + 2,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: designSystem.borderRadius.md,
    gap: 5,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: designSystem.colors.functional.success,
  },
  bookmarkBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionText: {
    fontSize: 14,
    fontWeight: '600',
    color: designSystem.colors.text.primary,
    marginBottom: designSystem.spacing.sm + 2,
    lineHeight: 20,
  },
  answerPreview: {
    backgroundColor: designSystem.colors.background.secondary,
    padding: designSystem.spacing.sm + 2,
    borderRadius: designSystem.borderRadius.sm + 2,
    borderLeftWidth: 3,
    borderLeftColor: designSystem.colors.functional.success,
  },
  answerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: designSystem.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  answerText: {
    fontSize: 12,
    color: designSystem.colors.text.primary,
    fontWeight: '500',
    lineHeight: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: designSystem.spacing.xxl,
    minHeight: 300,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: designSystem.colors.text.primary,
    marginTop: designSystem.spacing.md,
    marginBottom: designSystem.spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: designSystem.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: designSystem.colors.background.primary,
    paddingHorizontal: designSystem.spacing.md,
    paddingVertical: designSystem.spacing.md,
    ...designSystem.shadows.lg,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: designSystem.colors.functional.success,
    paddingVertical: 14,
    borderRadius: designSystem.borderRadius.md,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default MarkedPracticeScreen;
