# 🌍 Estrategia de Internacionalización (i18n) - Ciudadanía Fácil 2025

## 📋 Resumen Ejecutivo

Este documento describe la estrategia completa para implementar soporte multiidioma en la aplicación, permitiendo que usuarios de diferentes países (India, Brasil, etc.) puedan usar la app en su idioma nativo.

---

## 🎯 Objetivos

1. **Soporte Multiidioma**: Español, Inglés, Portugués, Hindi, y otros idiomas según demanda
2. **Experiencia Nativa**: Textos, números, fechas y formatos adaptados a cada región
3. **Mantenibilidad**: Sistema escalable y fácil de mantener
4. **Rendimiento**: Sin impacto significativo en el rendimiento de la app
5. **Compatibilidad**: Funciona en iOS, Android y Web

---

## 🛠️ Tecnología Recomendada

### **react-i18next** (Recomendado)

**Ventajas:**
- ✅ Librería más popular y madura para React Native
- ✅ Excelente documentación y comunidad
- ✅ Soporte para pluralización, interpolación, y formateo
- ✅ Compatible con Expo
- ✅ Carga lazy de traducciones (mejor rendimiento)
- ✅ Soporte para RTL (Right-to-Left) para árabe/hebreo
- ✅ TypeScript support completo

**Instalación:**
```bash
npm install i18next react-i18next
npm install --save-dev @types/i18next
```

**Alternativas consideradas:**
- `expo-localization` + `i18n-js`: Más simple pero menos features
- `react-intl`: Más complejo, orientado a web

---

## 📁 Estructura de Archivos Propuesta

```
src/
├── i18n/
│   ├── index.ts                 # Configuración principal de i18next
│   ├── locales/
│   │   ├── es/
│   │   │   ├── common.json      # Textos comunes (botones, mensajes)
│   │   │   ├── auth.json        # Login, registro, autenticación
│   │   │   ├── onboarding.json  # Pantallas de onboarding
│   │   │   ├── home.json        # Pantalla principal
│   │   │   ├── study.json       # Módulo de estudio
│   │   │   ├── practice.json    # Módulo de práctica
│   │   │   ├── navigation.json  # Títulos de navegación
│   │   │   └── errors.json      # Mensajes de error
│   │   ├── en/
│   │   │   └── [mismos archivos]
│   │   ├── pt/
│   │   │   └── [mismos archivos]
│   │   ├── hi/
│   │   │   └── [mismos archivos]
│   │   └── zh/                  # Chino (futuro)
│   │       └── [mismos archivos]
│   └── types.ts                 # TypeScript types para traducciones
├── context/
│   └── LanguageContext.tsx      # Context para cambiar idioma
└── hooks/
    └── useTranslation.ts        # Hook personalizado (wrapper)
```

---

## 🔧 Configuración Inicial

### 1. Archivo de Configuración (`src/i18n/index.ts`)

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importar traducciones
import esCommon from './locales/es/common.json';
import esAuth from './locales/es/auth.json';
import esOnboarding from './locales/es/onboarding.json';
// ... más imports

import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
// ... más imports

import ptCommon from './locales/pt/common.json';
// ... más imports

import hiCommon from './locales/hi/common.json';
// ... más imports

const LANGUAGE_STORAGE_KEY = '@app:language';

// Detectar idioma del dispositivo
const getDeviceLanguage = (): string => {
  const deviceLang = Localization.locale.split('-')[0]; // 'es', 'en', 'pt', etc.
  const supportedLanguages = ['es', 'en', 'pt', 'hi', 'zh'];
  
  if (supportedLanguages.includes(deviceLang)) {
    return deviceLang;
  }
  
  return 'es'; // Idioma por defecto
};

// Cargar idioma guardado o detectar del dispositivo
const loadSavedLanguage = async (): Promise<string> => {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved) return saved;
    return getDeviceLanguage();
  } catch {
    return getDeviceLanguage();
  }
};

// Inicializar i18next
const initI18n = async () => {
  const savedLanguage = await loadSavedLanguage();
  
  await i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3', // Para React Native
      lng: savedLanguage,
      fallbackLng: 'es',
      
      resources: {
        es: {
          common: esCommon,
          auth: esAuth,
          onboarding: esOnboarding,
          // ... más namespaces
        },
        en: {
          common: enCommon,
          auth: enAuth,
          onboarding: enOnboarding,
          // ... más namespaces
        },
        pt: {
          common: ptCommon,
          auth: ptAuth,
          onboarding: ptOnboarding,
          // ... más namespaces
        },
        hi: {
          common: hiCommon,
          auth: hiAuth,
          onboarding: hiOnboarding,
          // ... más namespaces
        },
      },
      
      defaultNS: 'common',
      ns: ['common', 'auth', 'onboarding', 'home', 'study', 'practice', 'navigation', 'errors'],
      
      interpolation: {
        escapeValue: false, // React ya escapa valores
      },
      
      react: {
        useSuspense: false, // Importante para React Native
      },
    });
};

initI18n();

// Función para cambiar idioma
export const changeLanguage = async (lang: string) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    await i18n.changeLanguage(lang);
  } catch (error) {
    console.error('Error changing language:', error);
  }
};

export default i18n;
```

### 2. Context para Idioma (`src/context/LanguageContext.tsx`)

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../i18n';
import { View, ActivityIndicator } from 'react-native';

interface LanguageContextType {
  currentLanguage: string;
  availableLanguages: { code: string; name: string; nativeName: string }[];
  setLanguage: (lang: string) => Promise<void>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  
  const availableLanguages = [
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'zh', name: 'Chinese', nativeName: '中文' },
  ];
  
  useEffect(() => {
    // Esperar a que i18n esté listo
    if (i18n.isInitialized) {
      setIsLoading(false);
    }
  }, [i18n.isInitialized]);
  
  const setLanguage = async (lang: string) => {
    setIsLoading(true);
    await changeLanguage(lang);
    setIsLoading(false);
  };
  
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  
  return (
    <LanguageContext.Provider
      value={{
        currentLanguage: i18n.language,
        availableLanguages,
        setLanguage,
        isLoading,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
```

### 3. Hook Personalizado (`src/hooks/useTranslation.ts`)

```typescript
import { useTranslation as useI18nTranslation } from 'react-i18next';

// Wrapper para facilitar el uso y agregar funcionalidades adicionales
export const useTranslation = (namespace?: string) => {
  const { t, i18n } = useI18nTranslation(namespace);
  
  return {
    t, // Función de traducción
    i18n, // Instancia de i18next
    currentLanguage: i18n.language,
    isRTL: i18n.dir() === 'rtl', // Para idiomas RTL (árabe, hebreo)
  };
};
```

---

## 📝 Ejemplos de Archivos de Traducción

### `src/i18n/locales/es/common.json`

```json
{
  "buttons": {
    "continue": "Continuar",
    "next": "Siguiente",
    "previous": "Anterior",
    "skip": "Omitir",
    "finish": "Finalizar",
    "cancel": "Cancelar",
    "save": "Guardar",
    "delete": "Eliminar",
    "edit": "Editar",
    "close": "Cerrar"
  },
  "messages": {
    "loading": "Cargando...",
    "error": "Error",
    "success": "Éxito",
    "noData": "No hay datos disponibles"
  },
  "app": {
    "name": "Ciudadanía Fácil",
    "tagline": "Prepárate para el examen de ciudadanía"
  }
}
```

### `src/i18n/locales/es/onboarding.json`

```json
{
  "welcome": {
    "title": "Bienvenido a Ciudadanía Fácil",
    "description": "La app #1 para aprobar el examen de ciudadanía estadounidense. Domina las 128 preguntas oficiales con más de 10 formas diferentes de estudiar.",
    "features": {
      "feature1": "✨ 10+ formas diferentes de practicar",
      "feature2": "✅ 128 preguntas oficiales",
      "feature3": "🎯 Nueva edición 2025"
    }
  },
  "smartStudy": {
    "title": "Aprende de Forma Inteligente",
    "description": "Sistema de repetición espaciada que se adapta a tu ritmo. Tarjetas bilingües con audio profesional en inglés para practicar pronunciación.",
    "features": {
      "feature1": "🎯 Repetición espaciada inteligente",
      "feature2": "🔊 Audio profesional en inglés",
      "feature3": "📚 Tarjetas en inglés y español"
    }
  }
}
```

### `src/i18n/locales/pt/common.json` (Português)

```json
{
  "buttons": {
    "continue": "Continuar",
    "next": "Próximo",
    "previous": "Anterior",
    "skip": "Pular",
    "finish": "Finalizar",
    "cancel": "Cancelar",
    "save": "Salvar",
    "delete": "Excluir",
    "edit": "Editar",
    "close": "Fechar"
  },
  "messages": {
    "loading": "Carregando...",
    "error": "Erro",
    "success": "Sucesso",
    "noData": "Nenhum dado disponível"
  },
  "app": {
    "name": "Cidadania Fácil",
    "tagline": "Prepare-se para o exame de cidadania"
  }
}
```

### `src/i18n/locales/hi/common.json` (हिन्दी)

```json
{
  "buttons": {
    "continue": "जारी रखें",
    "next": "अगला",
    "previous": "पिछला",
    "skip": "छोड़ें",
    "finish": "समाप्त करें",
    "cancel": "रद्द करें",
    "save": "सहेजें",
    "delete": "हटाएं",
    "edit": "संपादित करें",
    "close": "बंद करें"
  },
  "messages": {
    "loading": "लोड हो रहा है...",
    "error": "त्रुटि",
    "success": "सफलता",
    "noData": "कोई डेटा उपलब्ध नहीं"
  },
  "app": {
    "name": "नागरिकता आसान",
    "tagline": "नागरिकता परीक्षा के लिए तैयारी करें"
  }
}
```

---

## 🔄 Migración de Código Existente

### Antes (Hardcoded):

```typescript
// Onboarding.tsx
<Text style={styles.stepTitle}>Bienvenido a Ciudadanía Fácil</Text>
<Text style={styles.stepDescription}>
  La app #1 para aprobar el examen...
</Text>
<TouchableOpacity>
  <Text>Siguiente</Text>
</TouchableOpacity>
```

### Después (Con i18n):

```typescript
// Onboarding.tsx
import { useTranslation } from '../hooks/useTranslation';

const Onboarding = () => {
  const { t } = useTranslation('onboarding');
  const { t: tCommon } = useTranslation('common');
  
  return (
    <>
      <Text style={styles.stepTitle}>
        {t('welcome.title')}
      </Text>
      <Text style={styles.stepDescription}>
        {t('welcome.description')}
      </Text>
      <TouchableOpacity>
        <Text>{tCommon('buttons.next')}</Text>
      </TouchableOpacity>
    </>
  );
};
```

---

## 🎨 Componente Selector de Idioma

```typescript
// src/components/LanguageSelector.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const LanguageSelector: React.FC = () => {
  const { currentLanguage, availableLanguages, setLanguage } = useLanguage();
  const [isVisible, setIsVisible] = React.useState(false);
  
  return (
    <>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setIsVisible(true)}
      >
        <MaterialCommunityIcons name="translate" size={24} color="#1E40AF" />
        <Text style={styles.currentLang}>
          {availableLanguages.find(l => l.code === currentLanguage)?.nativeName}
        </Text>
      </TouchableOpacity>
      
      <Modal
        visible={isVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Idioma</Text>
            {availableLanguages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.langOption,
                  currentLanguage === lang.code && styles.langOptionActive
                ]}
                onPress={async () => {
                  await setLanguage(lang.code);
                  setIsVisible(false);
                }}
              >
                <Text style={styles.langName}>{lang.nativeName}</Text>
                <Text style={styles.langEnglish}>({lang.name})</Text>
                {currentLanguage === lang.code && (
                  <MaterialCommunityIcons name="check" size={24} color="#10B981" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  currentLang: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#F3F4F6',
  },
  langOptionActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#1E40AF',
  },
  langName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  langEnglish: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
});
```

---

## 📊 Consideraciones Especiales

### 1. **Idiomas RTL (Right-to-Left)**
Para árabe, hebreo, urdu:
```typescript
import { I18nManager } from 'react-native';

const { isRTL } = useTranslation();

useEffect(() => {
  if (isRTL) {
    I18nManager.forceRTL(true);
  } else {
    I18nManager.forceRTL(false);
  }
}, [isRTL]);
```

### 2. **Pluralización**
```json
{
  "questions": {
    "count_one": "{{count}} pregunta",
    "count_other": "{{count}} preguntas"
  }
}
```

```typescript
t('questions.count', { count: 1 }); // "1 pregunta"
t('questions.count', { count: 5 }); // "5 preguntas"
```

### 3. **Formateo de Fechas y Números**
```typescript
import { format } from 'date-fns';
import { es, enUS, ptBR, hi } from 'date-fns/locale';

const locales = { es, en: enUS, pt: ptBR, hi };
const { currentLanguage } = useTranslation();

const formattedDate = format(new Date(), 'PP', {
  locale: locales[currentLanguage]
});
```

### 4. **Preguntas del Examen**
Las preguntas ya tienen `questionEn` y `questionEs`. Para más idiomas:

```typescript
// En questions.tsx, agregar más campos:
interface Question {
  questionEn: string;
  questionEs: string;
  questionPt?: string;  // Portugués
  questionHi?: string;  // Hindi
  // ...
}
```

O mejor: crear un servicio de traducción que use i18n:

```typescript
// src/services/questionTranslationService.ts
export const getQuestionText = (question: Question, lang: string): string => {
  switch (lang) {
    case 'en': return question.questionEn;
    case 'es': return question.questionEs;
    case 'pt': return question.questionPt || question.questionEn;
    case 'hi': return question.questionHi || question.questionEn;
    default: return question.questionEs;
  }
};
```

---

## 🚀 Plan de Implementación (Fases)

### **Fase 1: Setup Básico** (1-2 días)
1. ✅ Instalar dependencias
2. ✅ Crear estructura de carpetas
3. ✅ Configurar i18next
4. ✅ Crear LanguageContext
5. ✅ Integrar en App.tsx

### **Fase 2: Traducciones Comunes** (2-3 días)
1. ✅ Traducir textos comunes (botones, mensajes)
2. ✅ Traducir pantallas de autenticación
3. ✅ Traducir onboarding
4. ✅ Crear componente LanguageSelector

### **Fase 3: Traducciones de Contenido** (3-5 días)
1. ✅ Traducir HomeScreen
2. ✅ Traducir módulos de estudio
3. ✅ Traducir módulos de práctica
4. ✅ Traducir navegación y títulos

### **Fase 4: Idiomas Adicionales** (2-3 días por idioma)
1. ✅ Portugués (Brasil)
2. ✅ Hindi (India)
3. ✅ Chino (futuro)
4. ✅ Otros según demanda

### **Fase 5: Optimización** (1-2 días)
1. ✅ Lazy loading de traducciones
2. ✅ Caché de traducciones
3. ✅ Testing de todos los idiomas
4. ✅ Documentación

---

## 📈 Métricas de Éxito

- ✅ App funciona en 5+ idiomas
- ✅ Cambio de idioma sin reiniciar app
- ✅ Sin impacto en rendimiento (<50ms overhead)
- ✅ 100% de textos traducidos (sin hardcoded)
- ✅ Soporte RTL funcional

---

## 💰 Costos Estimados

### **Traducción Profesional** (por idioma):
- **Portugués**: $500-800 (Brasil)
- **Hindi**: $600-900 (India)
- **Chino**: $700-1000
- **Otros**: $500-1000 según complejidad

### **Tiempo de Desarrollo**:
- Setup inicial: 2-3 días
- Migración de código: 5-7 días
- Testing: 2-3 días
- **Total**: ~10-15 días de desarrollo

---

## 🎯 Recomendaciones Finales

1. **Empezar con Español e Inglés** (ya tienes contenido bilingüe)
2. **Agregar Portugués** (mercado grande en Brasil)
3. **Luego Hindi** (mercado enorme en India)
4. **Usar servicios de traducción profesional** para contenido oficial (examen de ciudadanía)
5. **Mantener traducciones en repositorio** para versionado
6. **Considerar Crowdin o similar** para gestión de traducciones si el equipo crece

---

## 📚 Recursos

- [Documentación react-i18next](https://react.i18next.com/)
- [i18next Best Practices](https://www.i18next.com/principles/fallback)
- [Expo Localization](https://docs.expo.dev/versions/latest/sdk/localization/)
- [RTL Support React Native](https://reactnative.dev/docs/native-modules-ios#writing-native-modules)

---

**Última actualización**: 2025-01-XX
**Autor**: Equipo de Desarrollo Ciudadanía Fácil

