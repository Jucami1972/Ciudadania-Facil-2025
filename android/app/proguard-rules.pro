# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Expo
-keep class expo.modules.** { *; }
-keep class org.unimodules.** { *; }

# Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# React Navigation
-keep class com.swmansion.** { *; }
-keep class com.th3rdwave.** { *; }

# React Native Paper
-keep class com.callstack.** { *; }

# React Native Voice
-keep class com.wenkesj.** { *; }

# Tu código
-keep class com.ciudadaniafacil.** { *; }

# Mantener nombres de clases para debugging (opcional, comentar en producción final)
# -keepnames class * { *; }

# Optimizaciones
-optimizationpasses 5
-dontusemixedcaseclassnames
-dontskipnonpubliclibraryclasses
-verbose
