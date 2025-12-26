# HomeBank WebView App

Android-обёртка для веб-приложения HomeBank.

## Сборка

1. Откройте проект в Android Studio
2. Sync Gradle
3. Build > Generate Signed APK

## Конфигурация

Измените `SERVER_URL` в `MainActivity.kt` если нужен другой адрес:
```kotlin
private val SERVER_URL = "http://45.94.156.61:5173"
```

## Требования

- Android 7.0+ (API 24)
- Доступ к интернету
