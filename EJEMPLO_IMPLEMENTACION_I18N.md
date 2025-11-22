# 📝 Ejemplo Práctico de Implementación i18n

Este documento muestra ejemplos concretos de cómo migrar componentes existentes a usar i18n.

---

## 🔄 Ejemplo 1: Onboarding.tsx

### **ANTES** (Código Actual):

```typescript
// src/components/Onboarding.tsx
const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    icon: 'book-education',
    title: 'Bienvenido a Ciudadanía Fácil',
    description: 'La app #1 para aprobar el examen...',
    features: [
      '✨ 10+ formas diferentes de practicar',
      '✅ 128 preguntas oficiales',
      '🎯 Nueva edición 2025',
    ],
    color: '#1E40AF',
  },
  // ...
];

// En el render:
<Text style={styles.stepTitle}>{step.title}</Text>
<Text style={styles.stepDescription}>{step.description}</Text>
```

### **DESPUÉS** (Con i18n):

```typescript
// src/components/Onboarding.tsx
import { useTranslation } from '../hooks/useTranslation';

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { t } = useTranslation('onboarding');
  const { t: tCommon } = useTranslation('common');
  const [currentStep, setCurrentStep] = useState(0);
  
  // Los steps ahora se construyen dinámicamente
  const getStepData = (stepId: string) => {
    const baseSteps = {
      welcome: {
        id: 'welcome',
        icon: 'book-education',
        color: '#1E40AF',
      },
      'smart-study': {
        id: 'smart-study',
        icon: 'brain',
        color: '#1E40AF',
      },
      // ...
    };
    
    return {
      ...baseSteps[stepId],
      title: t(`${stepId}.title`),
      description: t(`${stepId}.description`),
      features: [
        t(`${stepId}.features.feature1`),
        t(`${stepId}.features.feature2`),
        t(`${stepId}.features.feature3`),
      ],
    };
  };
  
  const step = getStepData(ONBOARDING_STEPS[currentStep].id);
  
  return (
    <View style={styles.container}>
      <Text style={styles.stepTitle}>{step.title}</Text>
      <Text style={styles.stepDescription}>{step.description}</Text>
      {step.features.map((feature, idx) => (
        <Text key={idx}>{feature}</Text>
      ))}
      <TouchableOpacity onPress={handleNext}>
        <Text>{tCommon('buttons.next')}</Text>
      </TouchableOpacity>
    </View>
  );
};
```

---

## 🔄 Ejemplo 2: LoginScreen.tsx

### **ANTES**:

```typescript
// src/screens/auth/LoginScreen.tsx
<Text style={styles.title}>Iniciar Sesión</Text>
<TextInput placeholder="Correo electrónico" />
<TextInput placeholder="Contraseña" secureTextEntry />
<TouchableOpacity>
  <Text>Iniciar Sesión</Text>
</TouchableOpacity>
<Text>¿No tienes cuenta? Regístrate</Text>
```

### **DESPUÉS**:

```typescript
// src/screens/auth/LoginScreen.tsx
import { useTranslation } from '../../hooks/useTranslation';

export const LoginScreen: React.FC = () => {
  const { t } = useTranslation('auth');
  const { t: tCommon } = useTranslation('common');
  
  return (
    <View>
      <Text style={styles.title}>{t('login.title')}</Text>
      <TextInput 
        placeholder={t('login.emailPlaceholder')} 
      />
      <TextInput 
        placeholder={t('login.passwordPlaceholder')} 
        secureTextEntry 
      />
      <TouchableOpacity>
        <Text>{t('login.submitButton')}</Text>
      </TouchableOpacity>
      <Text>
        {t('login.noAccount')} <Text>{t('login.registerLink')}</Text>
      </Text>
    </View>
  );
};
```

**Archivo de traducción** (`src/i18n/locales/es/auth.json`):

```json
{
  "login": {
    "title": "Iniciar Sesión",
    "emailPlaceholder": "Correo electrónico",
    "passwordPlaceholder": "Contraseña",
    "submitButton": "Iniciar Sesión",
    "noAccount": "¿No tienes cuenta?",
    "registerLink": "Regístrate"
  }
}
```

**Archivo de traducción** (`src/i18n/locales/pt/auth.json`):

```json
{
  "login": {
    "title": "Entrar",
    "emailPlaceholder": "E-mail",
    "passwordPlaceholder": "Senha",
    "submitButton": "Entrar",
    "noAccount": "Não tem uma conta?",
    "registerLink": "Registre-se"
  }
}
```

---

## 🔄 Ejemplo 3: HomeScreen.tsx

### **ANTES**:

```typescript
<Text style={styles.sectionTitle}>Estudiar</Text>
<Text style={styles.sectionTitle}>Practicar</Text>
<Text>Progreso: {studyProgress}%</Text>
```

### **DESPUÉS**:

```typescript
import { useTranslation } from '../hooks/useTranslation';

const HomeScreen = () => {
  const { t } = useTranslation('home');
  const { t: tCommon } = useTranslation('common');
  
  return (
    <View>
      <Text style={styles.sectionTitle}>
        {t('sections.study')}
      </Text>
      <Text style={styles.sectionTitle}>
        {t('sections.practice')}
      </Text>
      <Text>
        {t('progress.label')}: {studyProgress}%
      </Text>
    </View>
  );
};
```

---

## 🔄 Ejemplo 4: Mensajes de Error

### **ANTES**:

```typescript
Alert.alert('Error', 'Por favor completa todos los campos');
Alert.alert('Error de inicio de sesión', error.message);
```

### **DESPUÉS**:

```typescript
import { useTranslation } from '../hooks/useTranslation';

const { t } = useTranslation('errors');
const { t: tCommon } = useTranslation('common');

// Uso:
Alert.alert(
  tCommon('messages.error'),
  t('validation.requiredFields')
);

Alert.alert(
  t('auth.loginFailed'),
  error.message
);
```

**Archivo** (`src/i18n/locales/es/errors.json`):

```json
{
  "validation": {
    "requiredFields": "Por favor completa todos los campos",
    "invalidEmail": "Correo electrónico inválido",
    "weakPassword": "La contraseña debe tener al menos 6 caracteres"
  },
  "auth": {
    "loginFailed": "Error de inicio de sesión",
    "registerFailed": "Error al registrar",
    "logoutFailed": "Error al cerrar sesión"
  }
}
```

---

## 🔄 Ejemplo 5: Preguntas del Examen

### **ANTES** (Ya tienes bilingüe):

```typescript
// questions.tsx ya tiene:
questionEn: "What is the form of government...",
questionEs: "¿Cuál es la forma de gobierno...",
```

### **DESPUÉS** (Extender a más idiomas):

```typescript
// src/services/questionTranslationService.ts
import { useTranslation } from '../hooks/useTranslation';

export const useQuestionTranslation = () => {
  const { currentLanguage } = useTranslation();
  
  const getQuestionText = (question: Question): string => {
    switch (currentLanguage) {
      case 'en':
        return question.questionEn;
      case 'es':
        return question.questionEs;
      case 'pt':
        return question.questionPt || question.questionEn; // Fallback
      case 'hi':
        return question.questionHi || question.questionEn;
      default:
        return question.questionEs;
    }
  };
  
  const getAnswerText = (question: Question): string => {
    switch (currentLanguage) {
      case 'en':
        return Array.isArray(question.answerEn) 
          ? question.answerEn.join('\n')
          : question.answerEn;
      case 'es':
        return Array.isArray(question.answerEs)
          ? question.answerEs.join('\n')
          : question.answerEs;
      case 'pt':
        return question.answerPt || question.answerEn;
      case 'hi':
        return question.answerHi || question.answerEn;
      default:
        return question.answerEs;
    }
  };
  
  return { getQuestionText, getAnswerText };
};

// Uso en componente:
const FlipCard = ({ question }) => {
  const { getQuestionText, getAnswerText } = useQuestionTranslation();
  
  return (
    <View>
      <Text>{getQuestionText(question)}</Text>
      <Text>{getAnswerText(question)}</Text>
    </View>
  );
};
```

---

## 🔄 Ejemplo 6: Navegación (Títulos de Tabs)

### **ANTES**:

```typescript
// AppNavigator.tsx
<Tab.Screen 
  name="Study" 
  component={StudyStack}
  options={{ title: 'Estudiar' }}
/>
<Tab.Screen 
  name="Practice" 
  component={PracticeStack}
  options={{ title: 'Practicar' }}
/>
```

### **DESPUÉS**:

```typescript
// AppNavigator.tsx
import { useTranslation } from '../hooks/useTranslation';

const AppTabNavigator = () => {
  const { t } = useTranslation('navigation');
  
  return (
    <Tab.Navigator>
      <Tab.Screen 
        name="Study" 
        component={StudyStack}
        options={{ title: t('tabs.study') }}
      />
      <Tab.Screen 
        name="Practice" 
        component={PracticeStack}
        options={{ title: t('tabs.practice') }}
      />
    </Tab.Navigator>
  );
};
```

**Archivo** (`src/i18n/locales/es/navigation.json`):

```json
{
  "tabs": {
    "study": "Estudiar",
    "practice": "Practicar",
    "home": "Inicio",
    "profile": "Perfil"
  },
  "screens": {
    "studyCards": "Tarjetas de Estudio",
    "practiceMode": "Modo Práctica",
    "results": "Resultados"
  }
}
```

---

## 🎨 Ejemplo 7: Componente con Pluralización

```typescript
// Componente que muestra cantidad de preguntas
import { useTranslation } from '../hooks/useTranslation';

const QuestionCounter = ({ count }: { count: number }) => {
  const { t } = useTranslation('common');
  
  return (
    <Text>
      {t('questions.count', { count })}
    </Text>
  );
};
```

**Archivo** (`src/i18n/locales/es/common.json`):

```json
{
  "questions": {
    "count_one": "{{count}} pregunta",
    "count_other": "{{count}} preguntas"
  }
}
```

**Archivo** (`src/i18n/locales/en/common.json`):

```json
{
  "questions": {
    "count_one": "{{count}} question",
    "count_other": "{{count}} questions"
  }
}
```

**Archivo** (`src/i18n/locales/pt/common.json`):

```json
{
  "questions": {
    "count_one": "{{count}} pergunta",
    "count_other": "{{count}} perguntas"
  }
}
```

---

## 🔧 Integración en App.tsx

```typescript
// App.tsx
import React from 'react';
import { LanguageProvider } from './src/context/LanguageContext';
import './src/i18n'; // Importar configuración de i18n
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <LanguageProvider>
      <AppNavigator />
    </LanguageProvider>
  );
}
```

---

## 📱 Agregar Selector de Idioma en Settings/Profile

```typescript
// src/screens/ProfileScreen.tsx
import { LanguageSelector } from '../components/LanguageSelector';

const ProfileScreen = () => {
  return (
    <View>
      <Text>Configuración</Text>
      <LanguageSelector />
      {/* ... resto del contenido */}
    </View>
  );
};
```

---

## ✅ Checklist de Migración

Para cada componente:

- [ ] Importar `useTranslation` hook
- [ ] Identificar todos los textos hardcoded
- [ ] Crear keys en archivos JSON de traducción
- [ ] Reemplazar textos con `t('key')`
- [ ] Probar en todos los idiomas soportados
- [ ] Verificar que no haya textos sin traducir
- [ ] Verificar formato de números/fechas si aplica
- [ ] Verificar RTL si es idioma RTL

---

**Nota**: Esta es una guía práctica. La implementación real puede variar según las necesidades específicas del proyecto.

