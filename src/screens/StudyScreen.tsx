// src/screens/StudyScreen.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Platform,
  ImageBackground,
  Dimensions,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { RootStackParamList, SubCategory } from '../types/navigation';
import { colors } from '../constants/colors';
import { spacing, radius, shadow } from '../constants/spacing';
import { fontSize, fontWeight } from '../constants/typography';

const { width, height } = Dimensions.get('window');
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type MainCategoryKey = 'GobiernoAmericano' | 'HistoriaAmericana' | 'EducacionCivica';

type NavigationItem = {
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  route: keyof RootStackParamList;
};

const categoryTitles = {
  GobiernoAmericano: 'Gobierno Americano',
  HistoriaAmericana: 'Historia Americana',
  EducacionCivica: 'Educación Cívica',
} as const;

const sections: Record<MainCategoryKey, SubCategory[]> = {
  GobiernoAmericano: [
    { title: 'Gobierno Americano', subtitle: 'A: Principles of American Government', questionRange: '1-15', category: 'government' },
    { title: 'Gobierno Americano', subtitle: 'B: System of Government', questionRange: '16-62', category: 'government' },
    { title: 'Gobierno Americano', subtitle: 'C: Rights and Responsibilities', questionRange: '63-72', category: 'government' },
  ],
  HistoriaAmericana: [
    { title: 'Historia Americana', subtitle: 'A: Colonial Period and Independence', questionRange: '73-89', category: 'history' },
    { title: 'Historia Americana', subtitle: 'B: 1800s', questionRange: '90-99', category: 'history' },
    { title: 'Historia Americana', subtitle: 'C: Recent American History and Other Important Historical Information', questionRange: '100-118', category: 'history' },
  ],
  EducacionCivica: [
    { title: 'Símbolos y Días Festivos', subtitle: 'A: Symbols', questionRange: '119-124', category: 'symbols_holidays' },
    { title: 'Símbolos y Días Festivos', subtitle: 'B: Holidays', questionRange: '125-128', category: 'symbols_holidays' },
  ],
};

const StudyScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [activeTab, setActiveTab] = useState<MainCategoryKey>('GobiernoAmericano');
  const fadeAnim = new Animated.Value(1);

  const navigationItems: NavigationItem[] = [
    { title: 'Inicio', icon: 'home', route: 'Home' },
    { title: 'Tarjetas', icon: 'cards', route: 'TarjetasDeEstudio' },
    { title: 'Práctica', icon: 'book-open-page-variant', route: 'PruebaPractica' },
    { title: 'Examen', icon: 'file-document', route: 'Examen' },
    { title: 'Vocabulario', icon: 'book-alphabet', route: 'Vocabulario' },
    { title: 'Entrevista', icon: 'robot', route: 'EntrevistaAI' },
  ];

  const handleTabPress = (tab: MainCategoryKey) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    setActiveTab(tab);
  };

  const isWeb = Platform.OS === 'web';
  const headerIconSize = isWeb ? 20 : 24;
  const listChevronSize = isWeb ? 18 : 24;
  const bottomIconSize = isWeb ? 18 : 24;

  return (
    <View style={styles.safeArea}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
            accessibilityLabel="Volver atrás"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="arrow-left" size={headerIconSize} color={colors.text.dark} />
          </TouchableOpacity>
          <Text 
            style={styles.headerTitle}
            accessibilityRole="header"
          >
            Categorías
          </Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Home')} 
            style={styles.homeButton}
            accessibilityLabel="Ir al inicio"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="home" size={headerIconSize} color={colors.text.dark} />
          </TouchableOpacity>
        </View>
      </View>

      {/* TABS */}
      <View style={styles.tabsContainer}>
        {(Object.keys(sections) as MainCategoryKey[]).map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, activeTab === key && styles.activeTab]}
            onPress={() => handleTabPress(key)}
            accessibilityLabel={`Ver ${categoryTitles[key]}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === key }}
          >
            <Text style={[styles.tabText, activeTab === key && styles.activeTabText]}>
              {categoryTitles[key]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* CONTENT */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View style={[styles.contentWrapper, { opacity: fadeAnim }]}>
          {sections[activeTab].map((sub, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.menuItemContainer}
              onPress={() => {
                navigation.navigate('StudyCards', {
                  category: sub.category,
                  title: sub.title,
                  subtitle: sub.subtitle,
                  questionRange: sub.questionRange,
                });
              }}
              accessibilityLabel={`${sub.subtitle}. ${sub.questionRange} preguntas`}
              accessibilityRole="button"
            >
              <LinearGradient
                colors={idx % 2 === 0 ? ['#270483', '#8146cc'] : ['#470a56', '#ce32b1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.menuItem}
              >
                <View style={styles.menuContent}>
                  <View style={styles.textContainer}>
                    <Text style={styles.menuTitle}>{sub.subtitle}</Text>
                    <Text style={styles.menuSubtitle}>Preguntas {sub.questionRange}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={listChevronSize} color="white" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </ScrollView>

      {/* BOTTOM NAVIGATION - Solo mostrar en web, en móvil el Tab Navigator ya proporciona navegación */}
      {Platform.OS === 'web' && (
        <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
          {navigationItems.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.navItemContainer}
              onPress={() => {
                if (item.route === 'Home') {
                  navigation.navigate('Home' as const);
                } else if (item.route === 'TarjetasDeEstudio') {
                  navigation.navigate('TarjetasDeEstudio' as const);
                } else if (item.route === 'PruebaPractica') {
                  navigation.navigate('PruebaPractica' as const, {
                    category: 'all',
                    section: 'all',
                    mode: 'random' as const
                  });
                } else if (item.route === 'Examen') {
                  navigation.navigate('Examen' as const);
                } else if (item.route === 'Vocabulario') {
                  navigation.navigate('Vocabulario' as const);
                } else if (item.route === 'EntrevistaAI') {
                  navigation.navigate('EntrevistaAI' as const);
                }
              }}
              accessibilityLabel={`Ir a ${item.title}`}
              accessibilityRole="button"
            >
              <LinearGradient
                colors={idx % 2 === 0 ? ['#270483', '#8146cc'] : ['#470a56', '#ce32b1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.navItem}
              >
                <View style={styles.navContent}>
                  <MaterialCommunityIcons name={item.icon} size={bottomIconSize} color="white" />
                  <Text style={styles.navText}>{item.title}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  header: {
    backgroundColor: '#F5F5F5',
    paddingBottom: 4,
    ...shadow.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: Platform.select({ web: 56, ios: 60, android: 70 }) as number,
    paddingHorizontal: Platform.select({ web: spacing.md, default: spacing.lg }) as number,
    maxWidth: Platform.select({ web: 1100, default: undefined }) as number | undefined,
    width: '100%',
    alignSelf: Platform.select({ web: 'center', default: 'auto' }) as any,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  homeButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: Platform.select({ web: fontSize.lg, default: fontSize.xl }) as number,
    fontWeight: fontWeight.bold,
    color: colors.text.dark,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    padding: Platform.select({ web: 4, default: spacing.xs }) as number,
    ...shadow.md,
    marginBottom: Platform.select({ web: 4, default: spacing.xs }) as number,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    maxWidth: Platform.select({ web: 1100, default: undefined }) as number | undefined,
    width: '100%',
    alignSelf: Platform.select({ web: 'center', default: 'auto' }) as any,
  },
  tab: {
    flex: 1,
    paddingVertical: Platform.select({ web: 6, default: spacing.xs }) as number,
    alignItems: 'center',
    borderRadius: Platform.select({ web: radius.md, default: radius.lg }) as number,
    marginHorizontal: Platform.select({ web: 2, default: 2 }) as number,
    backgroundColor: 'white',
    ...shadow.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.49)',
  },
  activeTab: {
    backgroundColor: colors.primary.main,
    ...shadow.md,
    borderColor: colors.primary.dark,
  },
  tabText: {
    fontSize: Platform.select({ web: fontSize.xs, default: fontSize.sm }) as number,
    color: colors.text.dark,
    fontWeight: fontWeight.medium,
  },
  activeTabText: {
    color: '#FFD700',
    fontWeight: fontWeight.bold,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  content: {
    flex: 1,
    padding: Platform.select({ web: spacing.md, default: spacing.lg }) as number,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    maxWidth: Platform.select({ web: 1100, default: undefined }) as number | undefined,
    width: '100%',
    alignSelf: Platform.select({ web: 'center', default: 'auto' }) as any,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    minHeight: height * 0.4,
  },
  menuItemContainer: {
    marginBottom: Platform.select({ web: spacing.sm, default: spacing.md }) as number,
    borderRadius: Platform.select({ web: radius.md, default: radius.lg }) as number,
    overflow: 'hidden',
    ...shadow.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    transform: [{ translateY: 2 }],
    width: '100%',
  },
  menuItem: {
    padding: Platform.select({ web: spacing.sm, default: spacing.md }) as number,
    borderRadius: Platform.select({ web: radius.md, default: radius.lg }) as number,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: '100%',
  },
  menuContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    minHeight: Platform.select({ web: 48, default: 60 }) as number,
  },
  textContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: Platform.select({ web: fontSize.xs, default: fontSize.sm }) as number,
    fontWeight: fontWeight.medium,
    color: 'white',
    marginBottom: Platform.select({ web: 2, default: spacing.xs }) as number,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    width: '100%',
    textAlign: 'left',
  },
  menuSubtitle: {
    fontSize: Platform.select({ web: 10, default: fontSize.xs }) as number,
    color: '#FFD700',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    textAlign: 'left',
  },
  bottomNav: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Platform.select({ web: 6, default: spacing.sm }) as number,
    backgroundColor: '#F5F5F5',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    ...shadow.md,
    maxWidth: Platform.select({ web: 1100, default: undefined }) as number | undefined,
    width: '100%',
    alignSelf: Platform.select({ web: 'center', default: 'auto' }) as any,
  },
  navItemContainer: {
    width: Platform.select({ web: '16.66%', default: (width < 400 ? '50%' : '33.33%') }) as any,
    padding: Platform.select({ web: 4, default: spacing.xs }) as number,
  },
  navItem: {
    borderRadius: Platform.select({ web: radius.md, default: radius.lg }) as number,
    padding: Platform.select({ web: 6, default: spacing.sm }) as number,
    ...shadow.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  navContent: {
    alignItems: 'center',
  },
  navText: {
    color: '#FFD700',
    fontSize: Platform.select({ web: 10, default: fontSize.xs }) as number,
    fontWeight: fontWeight.medium,
    marginTop: Platform.select({ web: 2, default: spacing.xs }) as number,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default StudyScreen;