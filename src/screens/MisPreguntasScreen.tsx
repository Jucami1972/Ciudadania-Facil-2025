// src/screens/MisPreguntasScreen.tsx
// Pantalla unificada para preguntas Incorrectas y Marcadas con tabs

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

type TabType = 'incorrect' | 'marked';

interface FilteredQuestion extends PracticeQuestion {
  attempts?: number;
  markedDate?: string;
}

const MisPreguntasScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProps>();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('incorrect');
  const [incorrectQuestions, setIncorrectQuestions] = useState<FilteredQuestion[]>([]);
  const [markedQuestions, setMarkedQuestions] = useState<FilteredQuestion[]>([]);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setIsLoading(true);
      const [incorrectData, markedData] = await Promise.all([
        AsyncStorage.getItem('@practice:incorrect'),
        AsyncStorage.getItem('@practice:marked'),
      ]);

      if (incorrectData) {
        const incorrectIds: number[] = JSON.parse(incorrectData);
        setIncorrectQuestions(
          practiceQuestions
            .filter(q => incorrectIds.includes(q.id))
            .map(q => ({ ...q, attempts: 1 }))
        );
      } else {
        setIncorrectQuestions([]);
      }

      if (markedData) {
        const markedIds: number[] = JSON.parse(markedData);
        setMarkedQuestions(
          practiceQuestions
            .filter(q => markedIds.includes(q.id))
            .map(q => ({ ...q, markedDate: new Date().toISOString() }))
        );
      } else {
        setMarkedQuestions([]);
      }
    } catch (error) {
      if (__DEV__) console.error('Error loading questions:', error);
      setIncorrectQuestions([]);
      setMarkedQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const activeQuestions = activeTab === 'incorrect' ? incorrectQuestions : markedQuestions;

  const startPractice = () => {
    if (activeQuestions.length === 0) return;
    navigation.navigate('CategoryPractice', {
      questionType: activeTab,
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

  const renderQuestion = ({ item }: { item: FilteredQuestion }) => {
    const isIncorrectTab = activeTab === 'incorrect';
    const accentColor = isIncorrectTab ? '#ef4444' : '#10b981';

    return (
      <View style={styles.questionCard}>
        <View style={styles.questionHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: `${accentColor}15` }]}>
            <MaterialCommunityIcons
              name={item.category === 'government' ? 'bank' :
                    item.category === 'history' ? 'book-open-variant' : 'school'}
              size={14}
              color={accentColor}
            />
            <Text style={[styles.categoryText, { color: accentColor }]}>
              {getCategoryLabel(item.category)}
            </Text>
          </View>
          {isIncorrectTab && item.attempts ? (
            <View style={styles.attemptsBadge}>
              <MaterialCommunityIcons name="reload" size={12} color="#f59e0b" />
              <Text style={styles.attemptsText}>{item.attempts}</Text>
            </View>
          ) : (
            <View style={styles.bookmarkBadge}>
              <MaterialCommunityIcons name="bookmark" size={12} color="#10b981" />
            </View>
          )}
        </View>
        <Text style={styles.questionText} numberOfLines={3}>
          {item.question}
        </Text>
        <View style={[styles.answerPreview, { borderLeftColor: accentColor }]}>
          <Text style={styles.answerLabel}>Respuesta:</Text>
          <Text style={styles.answerText} numberOfLines={2}>
            {item.answer}
          </Text>
        </View>
      </View>
    );
  };

  const ListEmptyComponent = () => {
    const isIncorrectTab = activeTab === 'incorrect';
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          name={isIncorrectTab ? 'check-circle' : 'bookmark-outline'}
          size={64}
          color={isIncorrectTab ? '#10b981' : '#6b7280'}
        />
        <Text style={styles.emptyTitle}>
          {isIncorrectTab ? '¡Excelente trabajo!' : 'No hay preguntas marcadas'}
        </Text>
        <Text style={styles.emptyDescription}>
          {isIncorrectTab
            ? 'No tienes preguntas incorrectas. Sigue practicando para mantener tu nivel.'
            : 'Marca las preguntas que quieras repasar más tarde desde las tarjetas de estudio.'}
        </Text>
      </View>
    );
  };

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
                <Text style={styles.headerTitle}>Mis Preguntas</Text>
                <Text style={styles.headerSubtitle}>Incorrectas y marcadas</Text>
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

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'incorrect' && styles.tabActiveIncorrect]}
            onPress={() => setActiveTab('incorrect')}
          >
            <MaterialCommunityIcons
              name="alert-circle"
              size={16}
              color={activeTab === 'incorrect' ? designSystem.colors.functional.error : designSystem.colors.text.tertiary}
            />
            <Text style={[styles.tabText, activeTab === 'incorrect' && styles.tabTextActiveIncorrect]}>
              Incorrectas ({incorrectQuestions.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'marked' && styles.tabActiveMarked]}
            onPress={() => setActiveTab('marked')}
          >
            <MaterialCommunityIcons
              name="bookmark"
              size={16}
              color={activeTab === 'marked' ? designSystem.colors.functional.success : designSystem.colors.text.tertiary}
            />
            <Text style={[styles.tabText, activeTab === 'marked' && styles.tabTextActiveMarked]}>
              Marcadas ({markedQuestions.length})
            </Text>
          </TouchableOpacity>
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
            {activeQuestions.length > 0 && (
              <View style={styles.introCard}>
                <View style={[
                  styles.introIconContainer,
                  { backgroundColor: activeTab === 'incorrect' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)' }
                ]}>
                  <MaterialCommunityIcons
                    name={activeTab === 'incorrect' ? 'alert-circle' : 'bookmark'}
                    size={24}
                    color={activeTab === 'incorrect' ? designSystem.colors.functional.error : designSystem.colors.functional.success}
                  />
                </View>
                <Text style={styles.introTitle}>
                  {activeQuestions.length} {activeQuestions.length === 1 ? 'pregunta' : 'preguntas'}
                  {activeTab === 'incorrect' ? ' para repasar' : ' marcadas'}
                </Text>
                <Text style={styles.introSubtitle}>
                  {activeTab === 'incorrect'
                    ? 'Repasa estas preguntas para mejorar tu comprensión'
                    : 'Practica estas preguntas para reforzar tu conocimiento'}
                </Text>
              </View>
            )}

            <FlatList
              data={activeQuestions}
              renderItem={renderQuestion}
              keyExtractor={item => `${activeTab}-${item.id}`}
              scrollEnabled={false}
              ListEmptyComponent={ListEmptyComponent}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              windowSize={10}
              initialNumToRender={10}
              updateCellsBatchingPeriod={50}
            />
          </ScrollView>

          {activeQuestions.length > 0 && (
            <View style={styles.bottomContainer}>
              <TouchableOpacity
                style={[
                  styles.startButton,
                  { backgroundColor: activeTab === 'incorrect' ? designSystem.colors.functional.error : designSystem.colors.functional.success }
                ]}
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: designSystem.spacing.md,
    paddingVertical: designSystem.spacing.sm + 4,
    gap: designSystem.spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: designSystem.borderRadius.md,
    backgroundColor: designSystem.colors.background.primary,
    gap: 6,
    ...designSystem.shadows.sm,
  },
  tabActiveIncorrect: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1.5,
    borderColor: designSystem.colors.functional.error,
  },
  tabActiveMarked: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1.5,
    borderColor: designSystem.colors.functional.success,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: designSystem.colors.text.tertiary,
  },
  tabTextActiveIncorrect: {
    color: designSystem.colors.functional.error,
    fontWeight: '700',
  },
  tabTextActiveMarked: {
    color: designSystem.colors.functional.success,
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: designSystem.spacing.md,
    paddingTop: designSystem.spacing.sm,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: designSystem.borderRadius.md,
    gap: 5,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  attemptsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: designSystem.borderRadius.sm,
    gap: 4,
  },
  attemptsText: {
    fontSize: 11,
    fontWeight: '700',
    color: designSystem.colors.functional.warning,
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

export default MisPreguntasScreen;
