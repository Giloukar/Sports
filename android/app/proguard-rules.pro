# Règles ProGuard par défaut pour React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Garde les libraires tierces utilisées par l'app
-keep class com.dieam.reactnativepushnotification.** { *; }
-keep class com.google.android.gms.** { *; }
-keep class com.swmansion.** { *; }
