// src/screens/MyStateScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, FlatList, SafeAreaView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { STATE_NAMES, getStateInfo } from '../data/stateData';
import {
  getUserState, saveUserState, selectState, UserStateData,
} from '../services/userStateService';
import { NavigationProps } from '../types/navigation';

export default function MyStateScreen() {
  const navigation = useNavigation<NavigationProps>();
  const insets = useSafeAreaInsets();

  const [data, setData] = useState<UserStateData | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [edited, setEdited] = useState<UserStateData | null>(null);

  useEffect(() => {
    getUserState().then(d => {
      setData(d);
      setEdited(d);
    });
  }, []);

  const filteredStates = STATE_NAMES.filter(s =>
    s.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectState = useCallback(async (stateName: string) => {
    setShowPicker(false);
    setSearch('');
    const newData = await selectState(stateName);
    setData(newData);
    setEdited(newData);
  }, []);

  const handleSave = async () => {
    if (!edited) return;
    setSaving(true);
    try {
      await saveUserState(edited);
      setData(edited);
      Alert.alert('Guardado', 'Tu información de estado fue actualizada.');
    } finally {
      setSaving(false);
    }
  };

  const resetField = (field: keyof Omit<UserStateData, 'state'>) => {
    if (!edited) return;
    const defaults = getStateInfo(edited.state);
    if (!defaults) return;
    setEdited({ ...edited, [field]: defaults[field] });
  };

  const hasChanges = JSON.stringify(data) !== JSON.stringify(edited);

  const fields: Array<{ key: keyof Omit<UserStateData, 'state'>; label: string; icon: string; questionHint: string }> = [
    { key: 'senator',        label: 'Senador',           icon: 'account-tie',    questionHint: 'Pregunta 20' },
    { key: 'representative', label: 'Representante',     icon: 'account-group',  questionHint: 'Pregunta 23' },
    { key: 'governor',       label: 'Gobernador',        icon: 'star-circle',    questionHint: 'Pregunta 43' },
    { key: 'capital',        label: 'Capital del estado',icon: 'city',           questionHint: 'Pregunta 44' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <LinearGradient
        colors={['#1E3A8A', '#1E40AF', '#3B82F6']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Mi Estado</Text>
            <Text style={styles.headerSubtitle}>Preguntas dependientes de tu estado</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {/* Selector de estado */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Estado actual</Text>
          <TouchableOpacity style={styles.statePicker} onPress={() => setShowPicker(true)}>
            <MaterialCommunityIcons name="map-marker" size={20} color="#1E40AF" />
            <Text style={styles.statePickerText}>
              {edited?.state ?? 'Selecciona tu estado'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
          </TouchableOpacity>
          {edited?.state && (
            <Text style={styles.cardHint}>
              Toca para cambiar si te mudaste a otro estado.
            </Text>
          )}
        </View>

        {/* Campos editables */}
        {edited && (
          <>
            <Text style={styles.sectionTitle}>Nombres para el examen</Text>
            <Text style={styles.sectionHint}>
              Puedes corregir si hubo una elección reciente o si tu representante cambió.
            </Text>

            {fields.map(f => (
              <View key={f.key} style={styles.card}>
                <View style={styles.fieldHeader}>
                  <MaterialCommunityIcons name={f.icon as any} size={18} color="#1E40AF" />
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{f.questionHint}</Text>
                  </View>
                </View>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={edited[f.key]}
                    onChangeText={v => setEdited({ ...edited, [f.key]: v })}
                    placeholder={`Nombre del ${f.label.toLowerCase()}`}
                    placeholderTextColor="#94A3B8"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.resetBtn}
                    onPress={() => resetField(f.key)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialCommunityIcons name="restore" size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {hasChanges && (
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                <MaterialCommunityIcons name="content-save" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {!edited && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="map-marker-question" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>Selecciona tu estado para personalizar las preguntas del examen.</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal selector de estado */}
      <Modal visible={showPicker} animationType="slide" onRequestClose={() => setShowPicker(false)}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecciona tu estado</Text>
            <TouchableOpacity onPress={() => { setShowPicker(false); setSearch(''); }}>
              <MaterialCommunityIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <View style={styles.searchBox}>
            <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar estado..."
              value={search}
              onChangeText={setSearch}
              autoFocus
              autoCorrect={false}
            />
          </View>
          <FlatList
            data={filteredStates}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.stateItem, edited?.state === item && styles.stateItemSelected]}
                onPress={() => handleSelectState(item)}
              >
                <Text style={[styles.stateItemText, edited?.state === item && styles.stateItemTextSelected]}>
                  {item}
                </Text>
                {edited?.state === item && (
                  <MaterialCommunityIcons name="check" size={20} color="#1E40AF" />
                )}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingBottom: 16 },
  headerContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  backButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  body: { flex: 1 },
  bodyContent: { padding: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    marginBottom: 12, elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2,
  },
  cardLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardHint: { fontSize: 12, color: '#94A3B8', marginTop: 8 },
  statePicker: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#EFF6FF', borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  statePickerText: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1E40AF' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 4, marginTop: 8 },
  sectionHint: { fontSize: 13, color: '#64748B', marginBottom: 16, lineHeight: 18 },
  fieldHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  fieldLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#334155' },
  badge: { backgroundColor: '#EFF6FF', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, color: '#1E40AF', fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },
  resetBtn: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center',
  },
  saveButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#1E40AF', borderRadius: 12, paddingVertical: 14,
    marginTop: 8,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 16 },
  emptyText: { fontSize: 15, color: '#94A3B8', textAlign: 'center', lineHeight: 22, paddingHorizontal: 32 },
  // Modal
  modalSafe: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: 12, paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#F1F5F9', borderRadius: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1E293B' },
  stateItem: { paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center' },
  stateItemSelected: { backgroundColor: '#EFF6FF' },
  stateItemText: { flex: 1, fontSize: 16, color: '#334155' },
  stateItemTextSelected: { fontWeight: '700', color: '#1E40AF' },
  separator: { height: 1, backgroundColor: '#F1F5F9' },
});
