// src/screens/VocabularioScreenModernoV2.tsx
// Vocabulario con dos secciones: Examen Cívico y Entrevista N-400

import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  FlatList,
  Modal,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';

import { NavigationProps } from '../types/navigation';
import WebLayout from '../components/layout/WebLayout';
import { useIsWebDesktop } from '../hooks/useIsWebDesktop';
import { vocabulary, VocabEntry } from '../data/vocabulary';
import { designSystem } from '../config/designSystem';
import { vocabTermAudioMap, vocabDefAudioMap } from '../assets/audio/vocabulary/vocabularyAudioMap';
import { audioManager } from '../services/AudioManagerService';

const isWeb = Platform.OS === 'web';

// --- Tipos ---
type MainTab = 'civics' | 'interview';

interface VocabularyWord {
  id: string;
  word: string;
  wordEs: string;
  definitionEs: string;
  definitionEn: string;
  originalCategory: string;
  tags: string[];
}

// --- Subcategorías temáticas ---
interface SubCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const civicsSubCategories: SubCategory[] = [
  { id: 'all', name: 'Todos', icon: 'view-grid', color: '#1E40AF' },
  { id: 'government', name: 'Gobierno', icon: 'bank', color: '#1E40AF' },
  { id: 'history', name: 'Historia', icon: 'book-open-variant', color: '#7C3AED' },
  { id: 'rights', name: 'Derechos', icon: 'shield-check', color: '#059669' },
  { id: 'geography', name: 'Geografía', icon: 'earth', color: '#0891B2' },
  { id: 'symbols', name: 'Símbolos', icon: 'flag', color: '#DC2626' },
  { id: 'holidays', name: 'Feriados', icon: 'calendar-star', color: '#D97706' },
  { id: 'civics', name: 'Cívica', icon: 'school', color: '#3B82F6' },
];

const interviewSubCategories: SubCategory[] = [
  { id: 'all', name: 'Todos', icon: 'view-grid', color: '#1E40AF' },
  { id: 'identidad', name: 'Identidad', icon: 'card-account-details', color: '#1E40AF' },
  { id: 'dirección', name: 'Dirección', icon: 'home-map-marker', color: '#7C3AED' },
  { id: 'empleo', name: 'Empleo', icon: 'briefcase', color: '#059669' },
  { id: 'familia', name: 'Familia', icon: 'account-group', color: '#D97706' },
  { id: 'viajes', name: 'Viajes', icon: 'airplane', color: '#0891B2' },
  { id: 'legal', name: 'Legal', icon: 'gavel', color: '#DC2626' },
  { id: 'impuestos', name: 'Impuestos', icon: 'cash-multiple', color: '#059669' },
  { id: 'juramento', name: 'Juramento', icon: 'hand-heart', color: '#1E3A8A' },
  { id: 'protocolo', name: 'Protocolo', icon: 'clipboard-check', color: '#6D28D9' },
  { id: 'frases', name: 'Frases Clave', icon: 'message-text', color: '#3B82F6' },
];

// Mapear tags del vocabulario a subcategorías de entrevista
const tagToInterviewSub = (tags: string[]): string => {
  const tagMap: Record<string, string> = {
    identidad: 'identidad', nombre: 'identidad', documentos: 'identidad',
    verificación: 'identidad', fecha: 'identidad', nacimiento: 'identidad',
    nacionalidad: 'identidad', ciudadanía: 'identidad', SSN: 'identidad',
    'formato americano': 'identidad', LPR: 'identidad', cita: 'identidad',
    USCIS: 'identidad', país: 'identidad', residencia: 'identidad',
    dirección: 'dirección', domicilio: 'dirección', mudanza: 'dirección',
    historial: 'dirección', tiempo: 'dirección',
    empleo: 'empleo', trabajo: 'empleo', ocupación: 'empleo',
    empresa: 'empleo', empleador: 'empleo', profesión: 'empleo',
    'duración': 'empleo', 'historial laboral': 'empleo',
    familia: 'familia', matrimonio: 'familia', cónyuge: 'familia',
    hijos: 'familia', dependientes: 'familia', 'estado civil': 'familia',
    viajes: 'viajes', salidas: 'viajes', pasaporte: 'viajes',
    'residencia continua': 'viajes', presencia: 'viajes', continuidad: 'viajes',
    razón: 'viajes', motivo: 'viajes',
    impuestos: 'impuestos', IRS: 'impuestos', deuda: 'impuestos',
    pago: 'impuestos', declaración: 'impuestos', estatus: 'impuestos',
    legal: 'legal', arresto: 'legal', policía: 'legal',
    'ciudadanía falsa': 'legal', fraude: 'legal', seguridad: 'legal',
    organización: 'legal', discriminación: 'legal', daño: 'legal',
    moral: 'legal', honestidad: 'legal',
    juramento: 'juramento', lealtad: 'juramento', militar: 'juramento',
    defensa: 'juramento', 'servicio': 'juramento', 'no combate': 'juramento',
    constitución: 'juramento', gobierno: 'juramento', renuncia: 'juramento',
    'servicio civil': 'juramento', emergencia: 'juramento',
    protocolo: 'protocolo', inicio: 'protocolo', verdad: 'protocolo',
    modales: 'protocolo', cortesía: 'protocolo', preparación: 'protocolo',
    frases: 'frases', respuesta: 'frases',
  };
  for (const tag of tags) {
    if (tagMap[tag]) return tagMap[tag];
  }
  return 'identidad';
};

// Convertir datos de vocabulario
const allWords: VocabularyWord[] = vocabulary.map((entry: VocabEntry) => ({
  id: entry.id,
  word: entry.termEn,
  wordEs: entry.termEs,
  definitionEs: entry.definitionEs,
  definitionEn: entry.definitionEn,
  originalCategory: entry.category,
  tags: entry.tags || [],
}));

const civicsWords = allWords.filter((w) => w.originalCategory !== 'interview');
const interviewWords = allWords.filter((w) => w.originalCategory === 'interview');

const VocabularioScreenModernoV2 = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProps>();
  const isWebDesktop = useIsWebDesktop();

  const [mainTab, setMainTab] = useState<MainTab>('civics');
  const [searchQuery, setSearchQuery] = useState('');
  const [civicsSub, setCivicsSub] = useState('all');
  const [interviewSub, setInterviewSub] = useState('all');
  const [selectedWord, setSelectedWord] = useState<VocabularyWord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const selectedSub = mainTab === 'civics' ? civicsSub : interviewSub;
  const setSelectedSub = mainTab === 'civics' ? setCivicsSub : setInterviewSub;
  const subCategories = mainTab === 'civics' ? civicsSubCategories : interviewSubCategories;

  const filteredWords = useMemo(() => {
    const base = mainTab === 'civics' ? civicsWords : interviewWords;
    return base.filter((word) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        q === '' ||
        word.wordEs.toLowerCase().includes(q) ||
        word.word.toLowerCase().includes(q) ||
        word.definitionEs.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (selectedSub === 'all') return true;

      if (mainTab === 'civics') {
        return word.originalCategory === selectedSub;
      }
      // Entrevista: mapear tags a subcategoría
      return tagToInterviewSub(word.tags) === selectedSub;
    });
  }, [mainTab, searchQuery, selectedSub]);

  const subCategoryCounts = useMemo(() => {
    const base = mainTab === 'civics' ? civicsWords : interviewWords;
    const counts: Record<string, number> = { all: base.length };
    base.forEach((w) => {
      const sub = mainTab === 'civics' ? w.originalCategory : tagToInterviewSub(w.tags);
      counts[sub] = (counts[sub] || 0) + 1;
    });
    return counts;
  }, [mainTab]);

  const handlePlayTerm = useCallback(async (vocabId: string) => {
    setIsSpeaking(true);
    try {
      const audioSource = vocabTermAudioMap[vocabId];
      if (audioSource) {
        await audioManager.playAudio(audioSource);
      } else {
        // Fallback a expo-speech si no hay audio pregrabado
        const entry = allWords.find(w => w.id === vocabId);
        if (entry) await Speech.speak(entry.word, { language: 'en', rate: 0.9 });
      }
    } catch (error) {
      if (__DEV__) console.error('Error al reproducir término:', error);
    } finally {
      setIsSpeaking(false);
    }
  }, []);

  const handlePlayDefinition = useCallback(async (vocabId: string) => {
    setIsSpeaking(true);
    try {
      const audioSource = vocabDefAudioMap[vocabId];
      if (audioSource) {
        await audioManager.playAudio(audioSource);
      } else {
        const entry = allWords.find(w => w.id === vocabId);
        if (entry) await Speech.speak(entry.definitionEn, { language: 'en', rate: 0.9 });
      }
    } catch (error) {
      if (__DEV__) console.error('Error al reproducir definición:', error);
    } finally {
      setIsSpeaking(false);
    }
  }, []);

  const handleTabChange = useCallback((tab: MainTab) => {
    setMainTab(tab);
    setSearchQuery('');
  }, []);

  const renderSubCategory = (item: SubCategory) => {
    const isActive = selectedSub === item.id;
    const count = subCategoryCounts[item.id] || 0;
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.subCatChip, isActive && { backgroundColor: item.color }]}
        onPress={() => setSelectedSub(item.id)}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name={item.icon as any}
          size={16}
          color={isActive ? '#FFFFFF' : item.color}
        />
        <Text
          style={[styles.subCatChipText, isActive && { color: '#FFFFFF' }]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <View style={[styles.subCatBadge, isActive && { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
          <Text style={[styles.subCatBadgeText, isActive && { color: '#FFFFFF' }]}>
            {count}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderWord = ({ item }: { item: VocabularyWord }) => {
    const subCat = mainTab === 'civics'
      ? civicsSubCategories.find((s) => s.id === item.originalCategory)
      : interviewSubCategories.find((s) => s.id === tagToInterviewSub(item.tags));

    return (
      <TouchableOpacity
        style={styles.wordCard}
        onPress={() => { setSelectedWord(item); setShowDetailModal(true); }}
        activeOpacity={0.85}
      >
        <View style={styles.wordCardInner}>
          {/* Barra lateral de color */}
          <View style={[styles.wordAccent, { backgroundColor: subCat?.color || '#1E40AF' }]} />
          <View style={styles.wordBody}>
            <View style={styles.wordHeader}>
              <View style={styles.wordTitleContainer}>
                <Text style={styles.word} numberOfLines={2}>{item.word}</Text>
                <Text style={styles.wordEs} numberOfLines={1}>{item.wordEs}</Text>
              </View>
              <TouchableOpacity
                style={styles.audioButtonCard}
                onPress={() => handlePlayTerm(item.id)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="volume-high" size={18} color="#1E40AF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.definition} numberOfLines={3}>{item.definitionEs}</Text>
            {subCat && (
              <View style={[styles.tagChip, { backgroundColor: `${subCat.color}15` }]}>
                <MaterialCommunityIcons name={subCat.icon as any} size={12} color={subCat.color} />
                <Text style={[styles.tagChipText, { color: subCat.color }]}>{subCat.name}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const content = (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      {!isWeb && (
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#1E3A8A', '#1E40AF', '#3B82F6'] as [string, string, string]}
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
                <Text style={styles.headerTitle}>Vocabulario</Text>
                <Text style={styles.headerSubtitle}>
                  {mainTab === 'civics' ? 'Palabras clave del examen' : 'Preparación para la entrevista'}
                </Text>
              </View>
              <View style={{ width: 44 }} />
            </View>

            {/* Tabs principales dentro del header */}
            <View style={styles.mainTabs}>
              <TouchableOpacity
                style={[styles.mainTab, mainTab === 'civics' && styles.mainTabActive]}
                onPress={() => handleTabChange('civics')}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="school"
                  size={16}
                  color={mainTab === 'civics' ? '#1E40AF' : 'rgba(255,255,255,0.7)'}
                />
                <Text style={[styles.mainTabText, mainTab === 'civics' && styles.mainTabTextActive]}>
                  Examen Cívico
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mainTab, mainTab === 'interview' && styles.mainTabActive]}
                onPress={() => handleTabChange('interview')}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="account-tie"
                  size={16}
                  color={mainTab === 'interview' ? '#1E40AF' : 'rgba(255,255,255,0.7)'}
                />
                <Text style={[styles.mainTabText, mainTab === 'interview' && styles.mainTabTextActive]}>
                  Entrevista N-400
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      )}

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Barra de búsqueda */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#1E40AF" />
          <TextInput
            style={styles.searchInput}
            placeholder={
              mainTab === 'civics'
                ? 'Buscar vocabulario (ej: enmienda, Congress)...'
                : 'Buscar vocabulario de entrevista...'
            }
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <MaterialCommunityIcons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Subcategorías temáticas */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subCatScroll}
          style={styles.subCatContainer}
        >
          {subCategories.map(renderSubCategory)}
        </ScrollView>

        {/* Conteo de resultados */}
        <View style={styles.resultsContainer}>
          <Text style={styles.resultText}>
            {filteredWords.length} {filteredWords.length === 1 ? 'término' : 'términos'}
          </Text>
          {selectedSub !== 'all' && (
            <TouchableOpacity
              onPress={() => setSelectedSub('all')}
              style={styles.clearFilterBtn}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="close-circle" size={14} color="#1E40AF" />
              <Text style={styles.clearFilterText}>Ver todos</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Lista de palabras */}
        <FlatList
          data={filteredWords}
          renderItem={renderWord}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          numColumns={isWeb ? 2 : 1}
          columnWrapperStyle={isWeb ? styles.wordRow : undefined}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="text-search" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No se encontraron términos</Text>
              <Text style={styles.emptySubtext}>Intenta con otra búsqueda o categoría</Text>
            </View>
          }
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={10}
          updateCellsBatchingPeriod={50}
        />
      </ScrollView>

      {/* Modal de detalle */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowDetailModal(false)}
                style={styles.modalCloseButton}
              >
                <MaterialCommunityIcons name="close" size={24} color="#1f2937" />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>Detalle</Text>
              <View style={{ width: 40 }} />
            </View>

            {selectedWord && (
              <ScrollView
                style={styles.modalBody}
                contentContainerStyle={styles.modalContent}
                showsVerticalScrollIndicator={false}
              >
                <LinearGradient
                  colors={['#3B82F6', '#1E40AF', '#1E3A8A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalWordCard}
                >
                  <View style={styles.modalWordHeader}>
                    <View style={styles.modalWordTitleContainer}>
                      <Text style={styles.modalWord}>{selectedWord.word}</Text>
                      <Text style={styles.modalWordEs}>{selectedWord.wordEs}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.modalSpeakButton}
                      onPress={() => handlePlayTerm(selectedWord.id)}
                      disabled={isSpeaking}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="volume-high" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </LinearGradient>

                <View style={styles.infoCard}>
                  <View style={styles.sectionHeaderCard}>
                    <MaterialCommunityIcons name="translate" size={20} color="#1E40AF" />
                    <Text style={styles.sectionTitle}>Definición en Español</Text>
                  </View>
                  <Text style={styles.sectionText}>{selectedWord.definitionEs}</Text>
                </View>

                <View style={styles.infoCard}>
                  <View style={styles.sectionHeaderCard}>
                    <MaterialCommunityIcons name="book-open-page-variant" size={20} color="#1E40AF" />
                    <Text style={styles.sectionTitle}>Definition in English</Text>
                  </View>
                  <Text style={styles.sectionText}>{selectedWord.definitionEn}</Text>
                  <TouchableOpacity
                    style={styles.playDefButton}
                    onPress={() => handlePlayDefinition(selectedWord.id)}
                    disabled={isSpeaking}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="volume-high" size={16} color="#1E40AF" />
                    <Text style={styles.playDefText}>Escuchar definición</Text>
                  </TouchableOpacity>
                </View>

                {selectedWord.tags.length > 0 && (
                  <View style={styles.infoCard}>
                    <View style={styles.sectionHeaderCard}>
                      <MaterialCommunityIcons name="tag-multiple" size={20} color="#1E40AF" />
                      <Text style={styles.sectionTitle}>Temas Relacionados</Text>
                    </View>
                    <View style={styles.tagsRow}>
                      {selectedWord.tags.map((tag) => (
                        <View key={tag} style={styles.modalTag}>
                          <Text style={styles.modalTagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );

  if (isWeb && isWebDesktop) {
    return <WebLayout headerTitle="Vocabulario">{content}</WebLayout>;
  }

  return (
    <View style={styles.safeArea}>
      {content}
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
    paddingBottom: 12,
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
    marginTop: 1,
  },
  // Tabs principales
  mainTabs: {
    flexDirection: 'row',
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: 3,
  },
  mainTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  mainTabActive: {
    backgroundColor: '#FFFFFF',
  },
  mainTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  mainTabTextActive: {
    color: '#1E40AF',
  },
  // Contenido
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  // Búsqueda
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  // Subcategorías
  subCatContainer: {
    marginBottom: 14,
    maxHeight: 44,
  },
  subCatScroll: {
    gap: 8,
    paddingRight: 16,
  },
  subCatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  subCatChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  subCatBadge: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 22,
    alignItems: 'center',
  },
  subCatBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
  },
  // Resultados
  resultsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resultText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  clearFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
  },
  // Tarjetas de palabras
  wordCard: {
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    ...Platform.select({
      web: {
        flex: 1,
        marginHorizontal: 8,
        marginBottom: 16,
      },
    }),
  },
  wordCardInner: {
    flexDirection: 'row',
  },
  wordAccent: {
    width: 5,
  },
  wordBody: {
    flex: 1,
    padding: 14,
    gap: 8,
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  wordTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  word: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.2,
  },
  wordEs: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  definition: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  tagChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  audioButtonCard: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '60%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginTop: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  modalBody: {
    flex: 1,
  },
  modalContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 14,
    paddingBottom: 40,
  },
  modalWordCard: {
    borderRadius: 20,
    padding: 22,
    gap: 10,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalWordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalWordTitleContainer: {
    flex: 1,
  },
  modalWord: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  modalWordEs: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
  },
  modalSpeakButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  sectionHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  sectionText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 23,
    fontWeight: '500',
  },
  playDefButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  playDefText: {
    fontSize: 13,
    color: '#1E40AF',
    fontWeight: '600',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalTag: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  modalTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
  },
  wordRow: {
    ...Platform.select({
      web: {
        justifyContent: 'space-between',
        gap: 16,
      },
    }),
  },
});

export default VocabularioScreenModernoV2;