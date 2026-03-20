// src/screens/practice/N400PracticeHomeScreen.tsx

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  n400Categories,
  n400Protocol,
  n400Definitions,
  TOTAL_N400_QUESTIONS,
  TOTAL_N400_VARIATIONS,
} from '../../data/n400FormPractice';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 12) / 2;

const N400PracticeHomeScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [progress, setProgress] = useState<{ [catId: string]: number }>({});

  const loadProgress = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem('@n400:progress');
      if (raw) setProgress(JSON.parse(raw));
    } catch {
      // silently ignore
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress])
  );

  const totalCompleted = Object.values(progress).reduce((s, v) => s + v, 0);

  const handleCategoryPress = (categoryId: string) => {
    navigation.navigate('N400SectionPractice', { categoryId, mode: 'study' });
  };

  const handleQuickRound = () => {
    navigation.navigate('N400SectionPractice', { categoryId: 'all', mode: 'quick' });
  };

  const handleProtocol = () => {
    navigation.navigate('N400SectionPractice', { categoryId: 'protocol', mode: 'study' });
  };

  const handleDefinitions = () => {
    navigation.navigate('N400SectionPractice', { categoryId: 'definitions', mode: 'study' });
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <LinearGradient
        colors={['#1E3A8A', '#1E40AF', '#3B82F6'] as [string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Práctica N-400</Text>
            <Text style={styles.headerSubtitle}>Formulario de Naturalización</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Progress summary */}
        <View style={styles.headerStats}>
          <View style={styles.statBadge}>
            <Text style={styles.statValue}>{TOTAL_N400_QUESTIONS}</Text>
            <Text style={styles.statLabel}>Preguntas</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statValue}>{TOTAL_N400_VARIATIONS}</Text>
            <Text style={styles.statLabel}>Variaciones</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statValue}>{totalCompleted}</Text>
            <Text style={styles.statLabel}>Completadas</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro card */}
        <View style={styles.introCard}>
          <MaterialCommunityIcons name="information-outline" size={22} color="#1E40AF" />
          <Text style={styles.introText}>
            El oficial de USCIS te hará preguntas sobre tu formulario N-400. Aquí practicarás 
            entender y responder cada sección.
          </Text>
        </View>

        {/* Quick Round button */}
        <TouchableOpacity activeOpacity={0.8} onPress={handleQuickRound}>
          <LinearGradient
            colors={['#F59E0B', '#D97706'] as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.quickRoundCard}
          >
            <View style={styles.quickRoundLeft}>
              <MaterialCommunityIcons name="lightning-bolt" size={28} color="#FFFFFF" />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.quickRoundTitle}>Ronda Rápida</Text>
                <Text style={styles.quickRoundSub}>20 preguntas al azar de todas las categorías</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Section title */}
        <Text style={styles.sectionTitle}>Secciones del N-400</Text>

        {/* Category grid */}
        <View style={styles.grid}>
          {n400Categories.map((cat) => {
            const completed = progress[cat.id] || 0;
            const total = cat.questions.length;
            const pct = total > 0 ? (completed / total) * 100 : 0;

            return (
              <TouchableOpacity
                key={cat.id}
                activeOpacity={0.8}
                onPress={() => handleCategoryPress(cat.id)}
                style={styles.gridItem}
              >
                <LinearGradient
                  colors={cat.gradient as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.categoryCard}
                >
                  <View style={styles.cardIconRow}>
                    <View style={styles.iconCircle}>
                      <MaterialCommunityIcons
                        name={cat.icon as any}
                        size={24}
                        color="#FFFFFF"
                      />
                    </View>
                    <View style={styles.variationsBadge}>
                      <Text style={styles.variationsText}>
                        {cat.questions.reduce((s, q) => s + q.variations.length, 0)} vars
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.cardTitle} numberOfLines={2}>{cat.title}</Text>
                  <Text style={styles.cardQuestions}>{total} preguntas</Text>

                  {/* Progress bar */}
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={styles.progressText}>
                    {completed}/{total}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Extra sections */}
        <Text style={styles.sectionTitle}>Extras</Text>

        <TouchableOpacity activeOpacity={0.8} onPress={handleProtocol} style={styles.extraCard}>
          <View style={[styles.extraIcon, { backgroundColor: '#EEF2FF' }]}>
            <MaterialCommunityIcons name="hand-wave" size={24} color="#1E40AF" />
          </View>
          <View style={styles.extraInfo}>
            <Text style={styles.extraTitle}>Protocolo de Entrevista</Text>
            <Text style={styles.extraSub}>
              {n400Protocol.length} frases: juramento, documentos, transiciones
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.8} onPress={handleDefinitions} style={styles.extraCard}>
          <View style={[styles.extraIcon, { backgroundColor: '#FEF3C7' }]}>
            <MaterialCommunityIcons name="book-open-variant" size={24} color="#D97706" />
          </View>
          <View style={styles.extraInfo}>
            <Text style={styles.extraTitle}>Vocabulario Difícil</Text>
            <Text style={styles.extraSub}>
              {n400Definitions.length} términos clave del N-400
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color="#94A3B8" />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

export default N400PracticeHomeScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  statBadge: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  introCard: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 10,
    alignItems: 'flex-start',
  },
  introText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 19,
  },
  quickRoundCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  quickRoundLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  quickRoundTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quickRoundSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  gridItem: {
    width: CARD_WIDTH,
  },
  categoryCard: {
    borderRadius: 16,
    padding: 14,
    minHeight: 160,
    justifyContent: 'space-between',
  },
  cardIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  variationsBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  variationsText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardQuestions: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    textAlign: 'right',
  },
  extraCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  extraIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraInfo: {
    flex: 1,
    marginLeft: 12,
  },
  extraTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  extraSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});
