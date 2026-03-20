// src/screens/practice/N400PracticeHomeScreen.tsx

import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationProps } from '../../types/navigation';
import {
  n400Sections,
  n400Questions,
  N400SectionInfo,
} from '../../data/n400FormPractice';

const N400PracticeHomeScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const insets = useSafeAreaInsets();

  const getQuestionCount = (section: N400SectionInfo) =>
    n400Questions.filter((q) => q.section === section.id).length;

  const handleSectionPress = (section: N400SectionInfo) => {
    navigation.navigate('N400SectionPractice' as any, {
      sectionId: section.id,
      sectionKey: section.key,
      sectionTitle: section.titleEs,
    });
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#1E3A8A', '#1E40AF', '#3B82F6'] as [string, string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 8 }]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Formulario N-400</Text>
              <Text style={styles.headerSubtitle}>Práctica por sección</Text>
            </View>
            <View style={{ width: 44 }} />
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <LinearGradient
          colors={['#EFF6FF', '#DBEAFE'] as [string, string]}
          style={styles.infoCard}
        >
          <MaterialCommunityIcons name="information" size={20} color="#1E40AF" />
          <Text style={styles.infoText}>
            Practica las preguntas que un oficial de USCIS te hará durante la entrevista
            de ciudadanía, basadas en el formulario N-400.
          </Text>
        </LinearGradient>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="format-list-bulleted" size={18} color="#1E40AF" />
          <Text style={styles.sectionTitle}>Secciones del N-400</Text>
        </View>

        {/* Sections Grid */}
        <View style={styles.sectionsGrid}>
          {n400Sections.map((section) => {
            const count = getQuestionCount(section);
            return (
              <TouchableOpacity
                key={section.id}
                style={styles.sectionCard}
                onPress={() => handleSectionPress(section)}
                activeOpacity={0.85}
              >
                <View style={[styles.sectionIconContainer, { backgroundColor: section.color + '15' }]}>
                  <MaterialCommunityIcons
                    name={section.icon as any}
                    size={28}
                    color={section.color}
                  />
                </View>
                <Text style={styles.cardTitle}>{section.titleEs}</Text>
                <Text style={styles.cardSubtitle}>
                  {count} {count === 1 ? 'pregunta' : 'preguntas'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* All Sections Button */}
        <TouchableOpacity
          style={styles.allSectionsButton}
          onPress={() =>
            navigation.navigate('N400SectionPractice' as any, {
              sectionId: 'all',
              sectionKey: 'all',
              sectionTitle: 'Todas las secciones',
            })
          }
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#1E40AF', '#3B82F6'] as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.allSectionsGradient}
          >
            <MaterialCommunityIcons name="play-circle" size={24} color="white" />
            <Text style={styles.allSectionsText}>
              Practicar todas ({n400Questions.length} preguntas)
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Tips */}
        <LinearGradient
          colors={['#FEF3C7', '#FDE68A'] as [string, string]}
          style={styles.tipsCard}
        >
          <Text style={styles.tipsTitle}>💡 Consejos</Text>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>✓</Text>
            <Text style={styles.tipText}>Escucha el audio y practica respondiendo en voz alta</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>✓</Text>
            <Text style={styles.tipText}>
              Cada pregunta puede hacerse de diferentes maneras — practica las variaciones
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>✓</Text>
            <Text style={styles.tipText}>
              Responde con oraciones completas y de manera clara
            </Text>
          </View>
        </LinearGradient>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    backgroundColor: '#1E3A8A',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  infoCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#1E40AF',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E3A8A',
    lineHeight: 20,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A202C',
  },
  sectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  sectionCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    minHeight: 130,
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sectionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#718096',
    fontWeight: '500',
    textAlign: 'center',
  },
  allSectionsButton: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  allSectionsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  allSectionsText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  tipsCard: {
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  tipBullet: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  tipText: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 18,
    fontWeight: '500',
    flex: 1,
  },
});

export default N400PracticeHomeScreen;
