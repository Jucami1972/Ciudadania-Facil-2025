// src/screens/ExamSelectionScreen.tsx
// Pantalla de selección de examen — se muestra una sola vez tras el primer login.
// El usuario puede cambiar de modo en cualquier momento desde el chip del HomeScreen.

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useExamMode, ExamMode } from '../context/ExamModeContext';

const CARDS: {
  mode: ExamMode;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  accentColor: string;
  bgColor: string;
}[] = [
  {
    mode: '100',
    icon: 'clipboard-check-outline',
    title: 'Examen de Cívica',
    subtitle: '100 preguntas oficiales',
    badge: 'Aplicantes hasta el 19 oct 2025',
    description:
      'Las 100 preguntas del examen de ciudadanía. Versión vigente para quienes presentaron su N-400 hasta el 19 de octubre de 2025.',
    accentColor: '#3B82F6',
    bgColor: '#EFF6FF',
  },
  {
    mode: '128',
    icon: 'star-circle-outline',
    title: 'Examen de Cívica 2025',
    subtitle: '128 preguntas oficiales',
    badge: 'NUEVO • Aplicantes después del 20 oct 2025',
    description:
      'Las 128 preguntas del nuevo examen oficial de ciudadanía del USCIS. Versión vigente para quienes presentaron su N-400 después del 20 de octubre de 2025.',
    accentColor: '#16A34A',
    bgColor: '#F0FDF4',
  },
];

export default function ExamSelectionScreen() {
  const insets = useSafeAreaInsets();
  const { setExamMode } = useExamMode();
  const [selected, setSelected] = useState<ExamMode | null>(null);
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    if (!selected || saving) return;
    setSaving(true);
    await setExamMode(selected);
    // ExamModeProvider cambia isExamModeSelected → AppNavigator navega al Home
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

        {/* Header estándar azul — sin botón de regreso */}
        <LinearGradient
          colors={['#1E3A8A', '#1E40AF', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 8 }]}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Ciudadanía Fácil</Text>
              <Text style={styles.headerSubtitle}>¿Cuál es tu examen?</Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.hint}>Selecciona la versión del examen que vas a presentar</Text>

          {CARDS.map(card => {
            const isSelected = selected === card.mode;
            return (
              <TouchableOpacity
                key={card.mode}
                style={[
                  styles.card,
                  { backgroundColor: card.bgColor, borderColor: card.accentColor },
                  isSelected && styles.cardSelected,
                ]}
                onPress={() => setSelected(card.mode)}
                activeOpacity={0.85}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: card.accentColor }]}>
                    <MaterialCommunityIcons name={card.icon} size={26} color="#fff" />
                  </View>
                  <View style={styles.cardTitles}>
                    <Text style={styles.cardTitle}>{card.title}</Text>
                    <Text style={[styles.cardSubtitle, { color: card.accentColor }]}>
                      {card.subtitle}
                    </Text>
                  </View>
                  {isSelected && (
                    <MaterialCommunityIcons name="check-circle" size={22} color={card.accentColor} />
                  )}
                </View>

                <View style={[styles.badgeRow]}>
                  <View style={[styles.badge, { backgroundColor: card.accentColor + '18' }]}>
                    <MaterialCommunityIcons
                      name={card.mode === '128' ? 'star' : 'calendar-check'}
                      size={11}
                      color={card.accentColor}
                    />
                    <Text style={[styles.badgeText, { color: card.accentColor }]}>
                      {card.badge}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardDesc}>{card.description}</Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={[styles.btn, !selected && styles.btnDisabled]}
            onPress={handleConfirm}
            disabled={!selected || saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.btnText}>Continuar</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.footer}>
            Puedes cambiar de versión en cualquier momento desde la pantalla de Inicio.
          </Text>
        </ScrollView>
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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  hint: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 18,
    fontWeight: '500',
    lineHeight: 18,
  },
  card: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 18,
    marginBottom: 14,
  },
  cardSelected: {
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitles: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  cardDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
  },
  btn: {
    backgroundColor: '#1E40AF',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  btnDisabled: {
    backgroundColor: '#94A3B8',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
});
