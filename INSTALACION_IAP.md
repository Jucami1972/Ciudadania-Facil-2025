# 💳 Instalación de React Native IAP

## Paso 1: Instalar dependencia

```bash
npm install react-native-iap
```

## Paso 2: Configurar productos en App Store Connect (iOS)

1. Ve a https://appstoreconnect.apple.com/
2. Selecciona tu app
3. Ve a **Features > In-App Purchases**
4. Crea los siguientes productos:

### Producto 1: Premium Mensual
- **Type:** Auto-Renewable Subscription
- **Product ID:** `com.ciudadaniafacil.app.premium.monthly`
- **Price:** $2.99/mes
- **Subscription Group:** Crear nuevo grupo "Premium"

### Producto 2: Premium Anual
- **Type:** Auto-Renewable Subscription
- **Product ID:** `com.ciudadaniafacil.app.premium.yearly`
- **Price:** $19.99/año
- **Subscription Group:** Mismo grupo "Premium"

### Producto 3: Premium Lifetime
- **Type:** Non-Consumable
- **Product ID:** `com.ciudadaniafacil.app.premium.lifetime`
- **Price:** $49.99 (una vez)

## Paso 3: Configurar productos en Google Play Console (Android)

1. Ve a https://play.google.com/console/
2. Selecciona tu app
3. Ve a **Monetize > Products > Subscriptions**
4. Crea los siguientes productos:

### Producto 1: Premium Mensual
- **Product ID:** `com.ciudadaniafacil.app.premium.monthly`
- **Name:** Premium Mensual
- **Price:** $2.99/mes
- **Billing period:** 1 month

### Producto 2: Premium Anual
- **Product ID:** `com.ciudadaniafacil.app.premium.yearly`
- **Name:** Premium Anual
- **Price:** $19.99/año
- **Billing period:** 1 year

### Producto 3: Premium Lifetime
- Ve a **Monetize > Products > In-app products**
- **Product ID:** `com.ciudadaniafacil.app.premium.lifetime`
- **Name:** Premium Lifetime
- **Price:** $49.99 (una vez)
- **Type:** Managed product

## Paso 4: Configurar permisos (Android)

En `android/app/src/main/AndroidManifest.xml`, asegúrate de tener:

```xml
<uses-permission android:name="com.android.vending.BILLING" />
```

## Paso 5: Testing

### iOS (Sandbox)
1. Crea un usuario de prueba en App Store Connect
2. En el dispositivo, cierra sesión de tu cuenta real
3. Usa el usuario de prueba para comprar

### Android (Test)
1. Agrega tu cuenta de Gmail a la lista de testers
2. Usa la cuenta de tester para comprar

## Notas Importantes

- Los Product IDs deben coincidir EXACTAMENTE en ambos stores
- Las compras de prueba no cobran dinero real
- En desarrollo, usa cuentas de sandbox/test
- Valida siempre las compras en tu backend antes de activar premium

## Troubleshooting

### Error: "Product not found"
- Verifica que los Product IDs coincidan exactamente
- Asegúrate de que los productos estén aprobados en las tiendas
- En iOS, los productos pueden tardar hasta 24 horas en estar disponibles

### Error: "User cancelled"
- El usuario canceló la compra, no es un error

### Error: "Network error"
- Verifica conexión a internet
- En iOS, asegúrate de estar logueado en App Store

