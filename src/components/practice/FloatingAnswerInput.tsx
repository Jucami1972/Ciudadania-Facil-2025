/**
 * Componente flotante para ingresar la respuesta
 */

import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/colors';

interface FloatingAnswerInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}

export const FloatingAnswerInput: React.FC<FloatingAnswerInputProps> = ({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'Escribe tu respuesta aquí...',
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tu respuesta</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        multiline
        textAlignVertical="top"
      />
      {value.trim().length > 0 && (
        <TouchableOpacity style={styles.submitButton} onPress={onSubmit}>
          <Text style={styles.submitButtonText}>Confirmar respuesta</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 0.5,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  label: {
    fontSize: 16, // Accesibilidad: mínimo 16pt para texto de cuerpo
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10, // Más espaciado
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16, // Más padding para mejor interacción
    fontSize: 16, // Accesibilidad: mínimo 16pt para texto de cuerpo
    minHeight: 80, // Más altura para mejor legibilidad
    maxHeight: 120,
    color: '#111827',
    backgroundColor: '#f9fafb',
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 12, // Más espaciado
    backgroundColor: colors.primary.main,
    paddingVertical: 14, // Área de toque mínimo 44dp
    minHeight: 44, // Accesibilidad: mínimo 44x44 dp
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16, // Accesibilidad: mínimo 16pt para botones
    letterSpacing: 0.3,
  },
});

