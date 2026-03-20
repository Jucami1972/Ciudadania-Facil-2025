// src/screens/ExamenScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing, radius, shadow } from '../constants/spacing';
// import SIN extensión
import { NavigationProps } from '../types/navigation';

const TOTAL_QUESTIONS = 10;
const PASS_THRESHOLD = 6;

export default function ExamenScreen() {
  const navigation = useNavigation<NavigationProps>();
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    // Simula un resultado aleatorio
    const correct = Math.floor(Math.random() * (TOTAL_QUESTIONS + 1));
    setScore(correct);
  }, []);

  if (score === null) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text.dark} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Examen</Text>
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Home')}>
              <MaterialCommunityIcons name="home" size={24} color={colors.text.dark} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.center}><Text>Cargando examen…</Text></View>
      </SafeAreaView>
    );
  }

  const passed = score >= PASS_THRESHOLD;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Examen</Text>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Home')}>
            <MaterialCommunityIcons name="home" size={24} color={colors.text.dark} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.center}>
        <Text style={styles.resultText}>
          Obtuviste {score} de {TOTAL_QUESTIONS} preguntas {'\n'}
          {passed ? '✅ Aprobado' : '❌ Reprobado'}
        </Text>
        <Button title="Volver al inicio" onPress={() => navigation.navigate('Home')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.neutral?.background || '#f5f5f5' },
  header: {
    backgroundColor: '#F5F5F5',
    paddingBottom: spacing.md,
    ...shadow.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 64,
    paddingHorizontal: spacing.lg,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text.dark },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  resultText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
});
