# HomeBank QR Scanner

Приложение для сканирования QR-кодов карт HomeBank.

## Сборка

1. Откройте проект в Android Studio
2. Sync Gradle
3. Build > Generate Signed APK

## Звуки

Звуки генерируются программно через ToneGenerator:
- Успех: короткий высокий тон (TONE_PROP_ACK)
- Ошибка: низкий тон (TONE_PROP_NACK)

## Конфигурация

Измените `SERVER_URL` в `MainActivity.kt`:
```kotlin
private val SERVER_URL = "http://45.94.156.61:3001"
```

## Требования

- Android 7.0+ (API 24)
- Камера
- Доступ к интернету

## Как работает

1. Сканер читает QR-код карты
2. Отправляет на сервер `/api/scanner/scan`
3. Сервер находит пользователя и отправляет данные через WebSocket
4. Планшет показывает уведомление с данными карты
