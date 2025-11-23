// src/screens/MarkedPracticeScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProps } from '../types/navigation';
import { practiceQuestions, PracticeQuestion } from '../data/practiceQuestions';

interface MarkedQuestion extends PracticeQuestion {
  markedDate?: string;
}

const MarkedPracticeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProps>();
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
      symbols_holidays: 'Educación Cívica',
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color="#1f2937" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Preguntas</Text>
            <Text style={styles.headerSubtitle}>Marcadas</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
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
                  <MaterialCommunityIcons name="bookmark" size={24} color="#10b981" />
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
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
  },
  headerTitleContainer: {
    alignItems: 'center',
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
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  introCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
  },
  introIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  introTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center',
  },
  introSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
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
    color: '#111827',
    marginBottom: 10,
    lineHeight: 20,
  },
  answerPreview: {
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  answerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  answerText: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '500',
    lineHeight: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 300,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 0.5,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default MarkedPracticeScreen;
