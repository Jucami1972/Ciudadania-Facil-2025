// src/screens/ExamenScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NavigationProps } from '../types/navigation';

const TOTAL_QUESTIONS = 10;
const PASS_THRESHOLD = 6;

export default function ExamenScreen() {
  const navigation = useNavigation<NavigationProps>();
  const insets = useSafeAreaInsets();
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    const correct = Math.floor(Math.random() * (TOTAL_QUESTIONS + 1));
    setScore(correct);
  }, []);

  const passed = score !== null ? score >= PASS_THRESHOLD : false;

  return (
    <View style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#1E3A8A', '#1E40AF', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
              <View style={styles.headerContent}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                  <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                  <Text style={styles.headerTitle}>Examen</Text>
                  <Text style={styles.headerSubtitle}>Resultado de tu prueba</Text>
                </View>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Home')}>
                  <MaterialCommunityIcons name="home" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>

        {score === null ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#1E40AF" />
            <Text style={styles.loadingText}>Cargando examen…</Text>
          </View>
        ) : (
          <View style={styles.center}>
            <View style={styles.resultCard}>
              <View style={[styles.resultIconWrapper, { backgroundColor: passed ? '#D1FAE5' : '#FEE2E2' }]}>
                <MaterialCommunityIcons
                  name={passed ? 'check-circle' : 'close-circle'}
                  size={48}
                  color={passed ? '#10B981' : '#EF4444'}
                />
              </View>

              <Text style={styles.resultTitle}>
                {passed ? '¡Aprobado!' : 'Reprobado'}
              </Text>

              <Text style={styles.resultSubtitle}>
                Obtuviste {score} de {TOTAL_QUESTIONS} preguntas correctas
              </Text>

              <View style={styles.scoreContainer}>
                <View style={styles.scoreBox}>
                  <Text style={styles.scoreLabel}>CORRECTAS</Text>
                  <Text style={[styles.scoreValue, { color: '#10B981' }]}>{score}</Text>
                </View>
                <View style={styles.scoreDivider} />
                <View style={styles.scoreBox}>
                  <Text style={styles.scoreLabel}>INCORRECTAS</Text>
                  <Text style={[styles.scoreValue, { color: '#EF4444' }]}>{TOTAL_QUESTIONS - score}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Home')}>
                <MaterialCommunityIcons name="home" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>Volver al inicio</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1E3A8A',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    textAlign: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  resultIconWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center',
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  scoreContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  scoreBox: {
    flex: 1,
    alignItems: 'center',
  },
  scoreDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E5E7EB',
  },
  scoreLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#1E40AF',
    paddingVertical: 15,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
