// src/services/paymentService.ts
// Servicio para manejar compras in-app usando react-native-iap
import { Platform } from 'react-native';
import * as InAppPurchase from 'react-native-iap';
import { activatePremium } from '../context/PremiumContext';
import { trackEvent, AnalyticsEvent } from '../utils/analytics';
import { captureException } from '../config/sentry';

// IDs de productos (deben coincidir con los configurados en App Store Connect y Google Play Console)
export const PRODUCT_IDS = {
  MONTHLY: Platform.select({
    ios: 'com.ciudadaniafacil.app.premium.monthly',
    android: 'com.ciudadaniafacil.app.premium.monthly',
    default: 'com.ciudadaniafacil.app.premium.monthly',
  }) as string,
  YEARLY: Platform.select({
    ios: 'com.ciudadaniafacil.app.premium.yearly',
    android: 'com.ciudadaniafacil.app.premium.yearly',
    default: 'com.ciudadaniafacil.app.premium.yearly',
  }) as string,
  LIFETIME: Platform.select({
    ios: 'com.ciudadaniafacil.app.premium.lifetime',
    android: 'com.ciudadaniafacil.app.premium.lifetime',
    default: 'com.ciudadaniafacil.app.premium.lifetime',
  }) as string,
};

// Tipos de suscripción
export type SubscriptionType = 'monthly' | 'yearly' | 'lifetime';

// Estado de inicialización
let isInitialized = false;
let purchaseUpdateSubscription: any = null;
let purchaseErrorSubscription: any = null;

/**
 * Inicializar el servicio de pagos
 */
export const initializePayments = async (): Promise<boolean> => {
  try {
    if (isInitialized) {
      return true;
    }

    // Conectar al servicio de pagos
    await InAppPurchase.initConnection();
    
    // Configurar listeners para actualizaciones de compras
    purchaseUpdateSubscription = InAppPurchase.purchaseUpdatedListener(
      async (purchase: InAppPurchase.Purchase) => {
        await handlePurchaseUpdate(purchase);
      }
    );

    purchaseErrorSubscription = InAppPurchase.purchaseErrorListener(
      (error: InAppPurchase.PurchaseError) => {
        handlePurchaseError(error);
      }
    );

    isInitialized = true;
    
    if (__DEV__) {
      console.log('✅ Servicio de pagos inicializado');
    }

    return true;
  } catch (error) {
    console.error('Error inicializando servicio de pagos:', error);
    captureException(error as Error, { context: 'initializePayments' });
    return false;
  }
};

/**
 * Obtener productos disponibles
 */
export const getAvailableProducts = async (): Promise<InAppPurchase.Product[]> => {
  try {
    if (!isInitialized) {
      await initializePayments();
    }

    const productIds = Object.values(PRODUCT_IDS);
    const products = await InAppPurchase.getProducts(productIds);

    if (__DEV__) {
      console.log('📦 Productos disponibles:', products);
    }

    return products;
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    captureException(error as Error, { context: 'getAvailableProducts' });
    throw error;
  }
};

/**
 * Obtener compras restauradas
 */
export const getRestoredPurchases = async (): Promise<InAppPurchase.Purchase[]> => {
  try {
    if (!isInitialized) {
      await initializePayments();
    }

    const purchases = await InAppPurchase.getAvailablePurchases();

    if (__DEV__) {
      console.log('🔄 Compras restauradas:', purchases);
    }

    return purchases;
  } catch (error) {
    console.error('Error obteniendo compras restauradas:', error);
    captureException(error as Error, { context: 'getRestoredPurchases' });
    throw error;
  }
};

/**
 * Comprar un producto
 */
export const purchaseProduct = async (
  productId: string,
  userId: string
): Promise<InAppPurchase.Purchase> => {
  try {
    if (!isInitialized) {
      await initializePayments();
    }

    // Trackear inicio de compra
    trackEvent(AnalyticsEvent.PREMIUM_PURCHASE_INITIATED, {
      product_id: productId,
      platform: Platform.OS,
    });

    // Iniciar compra
    const purchase = await InAppPurchase.requestPurchase(productId, false);

    if (__DEV__) {
      console.log('💳 Compra iniciada:', purchase);
    }

    return purchase;
  } catch (error: any) {
    console.error('Error iniciando compra:', error);
    
    // Trackear error de compra
    trackEvent(AnalyticsEvent.PREMIUM_PURCHASE_FAILED, {
      product_id: productId,
      error_code: error.code,
      error_message: error.message,
    });

    captureException(error as Error, { 
      context: 'purchaseProduct',
      productId,
      userId,
    });

    throw error;
  }
};

/**
 * Manejar actualización de compra
 */
const handlePurchaseUpdate = async (purchase: InAppPurchase.Purchase) => {
  try {
    const { transactionReceipt, productId, transactionId } = purchase;

    // Determinar tipo de suscripción basado en productId
    let subscriptionType: SubscriptionType = 'monthly';
    if (productId === PRODUCT_IDS.YEARLY) {
      subscriptionType = 'yearly';
    } else if (productId === PRODUCT_IDS.LIFETIME) {
      subscriptionType = 'lifetime';
    }

    // Obtener userId (debe pasarse desde el contexto)
    // Por ahora, lo obtenemos de AsyncStorage
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const userId = await AsyncStorage.getItem('@user:uid');

    if (!userId) {
      throw new Error('Usuario no autenticado');
    }

    // Validar la compra con el backend (opcional pero recomendado)
    // Por ahora, confiamos en la validación de la tienda
    const isValid = await validatePurchase(purchase);

    if (!isValid) {
      throw new Error('Compra no válida');
    }

    // Activar premium
    await activatePremium(userId, subscriptionType, transactionId || productId);

    // Finalizar la transacción
    if (purchase.transactionReceipt) {
      await InAppPurchase.finishTransaction(purchase);
    }

    // Trackear compra exitosa
    trackEvent(AnalyticsEvent.PREMIUM_PURCHASE_COMPLETED, {
      product_id: productId,
      subscription_type: subscriptionType,
      transaction_id: transactionId,
      platform: Platform.OS,
    });

    if (__DEV__) {
      console.log('✅ Compra completada y premium activado');
    }
  } catch (error) {
    console.error('Error procesando compra:', error);
    captureException(error as Error, { context: 'handlePurchaseUpdate' });
    throw error;
  }
};

/**
 * Manejar errores de compra
 */
const handlePurchaseError = (error: InAppPurchase.PurchaseError) => {
  console.error('Error en compra:', error);

  // Trackear error
  trackEvent(AnalyticsEvent.PREMIUM_PURCHASE_FAILED, {
    error_code: error.code,
    error_message: error.message,
    platform: Platform.OS,
  });

  captureException(error as Error, { context: 'handlePurchaseError' });
};

/**
 * Validar compra (simplificado - en producción deberías validar con tu backend)
 */
const validatePurchase = async (purchase: InAppPurchase.Purchase): Promise<boolean> => {
  try {
    // En producción, deberías enviar el receipt a tu backend
    // para validarlo con Apple/Google
    // Por ahora, retornamos true si tiene transactionReceipt
    return !!purchase.transactionReceipt;
  } catch (error) {
    console.error('Error validando compra:', error);
    return false;
  }
};

/**
 * Restaurar compras
 */
export const restorePurchases = async (userId: string): Promise<boolean> => {
  try {
    if (!isInitialized) {
      await initializePayments();
    }

    const purchases = await getRestoredPurchases();

    if (purchases.length === 0) {
      return false;
    }

    // Procesar cada compra restaurada
    for (const purchase of purchases) {
      await handlePurchaseUpdate(purchase);
    }

    return true;
  } catch (error) {
    console.error('Error restaurando compras:', error);
    captureException(error as Error, { context: 'restorePurchases', userId });
    throw error;
  }
};

/**
 * Desconectar del servicio de pagos
 */
export const disconnectPayments = async (): Promise<void> => {
  try {
    if (purchaseUpdateSubscription) {
      purchaseUpdateSubscription.remove();
      purchaseUpdateSubscription = null;
    }

    if (purchaseErrorSubscription) {
      purchaseErrorSubscription.remove();
      purchaseErrorSubscription = null;
    }

    await InAppPurchase.endConnection();
    isInitialized = false;

    if (__DEV__) {
      console.log('🔌 Servicio de pagos desconectado');
    }
  } catch (error) {
    console.error('Error desconectando servicio de pagos:', error);
  }
};

/**
 * Verificar si las compras están disponibles
 */
export const arePaymentsAvailable = (): boolean => {
  return Platform.OS === 'ios' || Platform.OS === 'android';
};

