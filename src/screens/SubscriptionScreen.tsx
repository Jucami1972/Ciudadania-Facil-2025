// src/screens/SubscriptionScreen.tsx
// Pantalla de suscripción premium con planes disponibles
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { usePremium } from '../context/PremiumContext';
import {
  getAvailableProducts,
  purchaseProduct,
  restorePurchases,
  PRODUCT_IDS,
  arePaymentsAvailable,
} from '../services/paymentService';
import * as InAppPurchase from 'react-native-iap';
import { trackEvent, AnalyticsEvent } from '../utils/analytics';
import WebLayout from '../components/layout/WebLayout';
import { useIsWebDesktop } from '../hooks/useIsWebDesktop';

interface Plan {
  id: 'monthly' | 'yearly' | 'lifetime';
  title: string;
  price: string;
  originalPrice?: string;
  period: string;
  productId: string;
  features: string[];
  popular?: boolean;
  savings?: string;
}

const SubscriptionScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { isPremium, isLoading: premiumLoading, refreshPremiumStatus } = usePremium();
  const isWebDesktop = useIsWebDesktop();
  const isWeb = Platform.OS === 'web';

  const [products, setProducts] = useState<InAppPurchase.Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  // Planes por defecto (se actualizarán con precios reales de las tiendas)
  const defaultPlans: Plan[] = [
    {
      id: 'monthly',
      title: 'Premium Mensual',
      price: '$2.99',
      period: 'por mes',
      productId: PRODUCT_IDS.MONTHLY,
      features: [
        'Acceso completo a todas las preguntas',
        'Entrevista AI ilimitada',
        'Modo offline completo',
        'Sin anuncios',
        'Soporte prioritario',
      ],
    },
    {
      id: 'yearly',
      title: 'Premium Anual',
      price: '$19.99',
      originalPrice: '$35.88',
      period: 'por año',
      productId: PRODUCT_IDS.YEARLY,
      features: [
        'Todo lo de Premium Mensual',
        'Ahorra 44% vs mensual',
        'Actualizaciones prioritarias',
        'Contenido exclusivo',
      ],
      popular: true,
      savings: 'Ahorra $15.89',
    },
    {
      id: 'lifetime',
      title: 'Premium Lifetime',
      price: '$49.99',
      period: 'pago único',
      productId: PRODUCT_IDS.LIFETIME,
      features: [
        'Acceso de por vida',
        'Todas las actualizaciones futuras',
        'Soporte premium de por vida',
        'Mejor valor a largo plazo',
      ],
    },
  ];

  const [plans, setPlans] = useState<Plan[]>(defaultPlans);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    if (!arePaymentsAvailable()) {
      setLoading(false);
      return;
    }

    try {
      const availableProducts = await getAvailableProducts();
      setProducts(availableProducts);

      // Actualizar planes con precios reales
      const updatedPlans = defaultPlans.map((plan) => {
        const product = availableProducts.find((p) => p.productId === plan.productId);
        if (product) {
          return {
            ...plan,
            price: product.localizedPrice || plan.price,
          };
        }
        return plan;
      });

      setPlans(updatedPlans);
    } catch (error) {
      console.error('Error cargando productos:', error);
      Alert.alert(
        'Error',
        'No se pudieron cargar los planes. Por favor, verifica tu conexión a internet.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (plan: Plan) => {
    if (!user) {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para realizar una compra.');
      navigation.navigate('AuthStack' as any);
      return;
    }

    if (!arePaymentsAvailable()) {
      Alert.alert('No disponible', 'Las compras in-app no están disponibles en esta plataforma.');
      return;
    }

    setPurchasing(plan.productId);

    try {
      await purchaseProduct(plan.productId, user.uid);
      
      // Refrescar estado premium
      await refreshPremiumStatus();

      Alert.alert(
        '¡Compra exitosa!',
        `¡Bienvenido a ${plan.title}! Ya tienes acceso a todas las funciones premium.`,
        [
          {
            text: 'Continuar',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error en compra:', error);

      // No mostrar error si el usuario canceló
      if (error.code !== 'E_USER_CANCELLED') {
        Alert.alert(
          'Error en la compra',
          error.message || 'No se pudo completar la compra. Por favor, intenta de nuevo.'
        );
      }
    } finally {
      setPurchasing(null);
    }
  };

  const handleRestore = async () => {
    if (!user) {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para restaurar compras.');
      return;
    }

    setRestoring(true);

    try {
      const restored = await restorePurchases(user.uid);

      if (restored) {
        await refreshPremiumStatus();
        Alert.alert('Compras restauradas', 'Tus compras se han restaurado correctamente.');
      } else {
        Alert.alert('Sin compras', 'No se encontraron compras para restaurar.');
      }
    } catch (error: any) {
      console.error('Error restaurando compras:', error);
      Alert.alert('Error', 'No se pudieron restaurar las compras. Por favor, intenta de nuevo.');
    } finally {
      setRestoring(false);
    }
  };

  const renderPlan = (plan: Plan) => {
    const isPurchasing = purchasing === plan.productId;
    const isPopular = plan.popular;

    return (
      <View
        key={plan.id}
        style={[
          styles.planCard,
          isPopular && styles.planCardPopular,
          isWeb && styles.planCardWeb,
        ]}
      >
        {isPopular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>MÁS POPULAR</Text>
          </View>
        )}

        <View style={styles.planHeader}>
          <Text style={styles.planTitle}>{plan.title}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.planPrice}>{plan.price}</Text>
            <Text style={styles.planPeriod}>{plan.period}</Text>
          </View>
          {plan.originalPrice && (
            <Text style={styles.originalPrice}>{plan.originalPrice}</Text>
          )}
          {plan.savings && (
            <Text style={styles.savingsText}>{plan.savings}</Text>
          )}
        </View>

        <View style={styles.featuresContainer}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.purchaseButton,
            isPopular && styles.purchaseButtonPopular,
            isPurchasing && styles.purchaseButtonDisabled,
          ]}
          onPress={() => handlePurchase(plan)}
          disabled={isPurchasing || isPremium}
        >
          {isPurchasing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : isPremium ? (
            <Text style={styles.purchaseButtonText}>Ya eres Premium</Text>
          ) : (
            <Text style={styles.purchaseButtonText}>Seleccionar Plan</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const content = (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        {!isWeb && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
          </TouchableOpacity>
        )}

        <View style={styles.headerContent}>
          <MaterialCommunityIcons name="crown" size={48} color="#F59E0B" />
          <Text style={styles.headerTitle}>Desbloquea Premium</Text>
          <Text style={styles.headerSubtitle}>
            Accede a todas las funciones y prepárate mejor para tu examen
          </Text>
        </View>
      </View>

      {/* Planes */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Cargando planes...</Text>
        </View>
      ) : (
        <View style={styles.plansContainer}>
          {plans.map(renderPlan)}
        </View>
      )}

      {/* Restaurar compras */}
      <TouchableOpacity
        style={styles.restoreButton}
        onPress={handleRestore}
        disabled={restoring}
      >
        {restoring ? (
          <ActivityIndicator color="#7C3AED" />
        ) : (
          <>
            <MaterialCommunityIcons name="refresh" size={20} color="#7C3AED" />
            <Text style={styles.restoreButtonText}>Restaurar compras</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Términos */}
      <View style={styles.termsContainer}>
        <Text style={styles.termsText}>
          Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad.
          Las suscripciones se renuevan automáticamente a menos que se cancelen.
        </Text>
      </View>
    </ScrollView>
  );

  // Web de escritorio: usar WebLayout
  if (isWeb && isWebDesktop) {
    return (
      <WebLayout headerTitle="Premium">
        {content}
      </WebLayout>
    );
  }

  // Web móvil o app móvil
  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
      {content}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingBottom: 40,
    ...Platform.select({
      web: {
        paddingHorizontal: 48,
        paddingTop: 40,
        maxWidth: 1200,
        alignSelf: 'center',
        width: '100%',
      },
    }),
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    alignItems: 'center',
    ...Platform.select({
      web: {
        paddingHorizontal: 0,
        paddingTop: 0,
      },
    }),
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 20,
    zIndex: 1,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  plansContainer: {
    paddingHorizontal: 20,
    gap: 20,
    ...Platform.select({
      web: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingHorizontal: 0,
        gap: 24,
      },
    }),
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    ...Platform.select({
      web: {
        flex: 1,
        maxWidth: 350,
        marginBottom: 0,
        cursor: 'default',
      },
    }),
  },
  planCardWeb: {
    minHeight: 500,
  },
  planCardPopular: {
    borderColor: '#7C3AED',
    borderWidth: 3,
    transform: [{ scale: 1.05 }],
    ...Platform.select({
      web: {
        transform: [{ scale: 1.08 }],
      },
    }),
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: [{ translateX: -60 }],
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  planTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 36,
    fontWeight: '700',
    color: '#7C3AED',
  },
  planPeriod: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 4,
  },
  originalPrice: {
    fontSize: 16,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginTop: 4,
  },
  savingsText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 4,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
    lineHeight: 22,
  },
  purchaseButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseButtonPopular: {
    backgroundColor: '#7C3AED',
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 8,
    gap: 8,
  },
  restoreButtonText: {
    color: '#7C3AED',
    fontSize: 15,
    fontWeight: '600',
  },
  termsContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
    ...Platform.select({
      web: {
        paddingHorizontal: 0,
        maxWidth: 800,
        alignSelf: 'center',
      },
    }),
  },
  termsText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
});

export default SubscriptionScreen;

