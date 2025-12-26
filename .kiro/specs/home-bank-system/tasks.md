# Implementation Plan: Home Bank System

## Overview

Реалізація домашньої банківської системи з React фронтендом, Node.js бекендом та SQLite базою даних. Проект використовує монорепо структуру з окремими пакетами для клієнта та сервера.

## Tasks

- [x] 1. Налаштування проекту
  - [x] 1.1 Створити структуру монорепо з npm workspaces
    - Створити кореневий package.json з workspaces
    - Створити директорії client/ та server/
    - _Requirements: 5.5_
  - [x] 1.2 Налаштувати бекенд (Node.js + Express + TypeScript)
    - Ініціалізувати server/package.json
    - Встановити express, better-sqlite3, jsonwebtoken, cors
    - Налаштувати TypeScript та tsconfig.json
    - _Requirements: 5.5_
  - [x] 1.3 Налаштувати фронтенд (React + Vite + TypeScript)
    - Створити Vite проект з React та TypeScript
    - Встановити tailwindcss, framer-motion, zustand
    - Встановити html5-qrcode, qrcode.react
    - _Requirements: 6.1, 6.2_

- [x] 2. База даних та моделі
  - [x] 2.1 Створити SQLite схему
    - Написати schema.sql з таблицями users та transactions
    - Створити database.ts для підключення
    - Додати seed дані (адмін користувач)
    - _Requirements: 5.5_
  - [x] 2.2 Створити спільні TypeScript типи
    - Створити types/index.ts з User, Transaction, API types
    - _Requirements: 2.1, 3.4, 4.2_
  - [x] 2.3 Написати property test для збереження даних
    - **Property 9: Data Persistence**
    - **Validates: Requirements 5.5**

- [x] 3. Утиліти
  - [x] 3.1 Реалізувати QR encode/decode
    - Створити utils/qr.ts з encodeQR та decodeQR
    - Додати checksum для безпеки
    - _Requirements: 1.1, 7.4_
  - [x] 3.2 Написати property test для QR round-trip
    - **Property 1: QR Code Round-Trip**
    - **Validates: Requirements 1.1, 7.4**
  - [x] 3.3 Реалізувати форматування
    - Створити utils/format.ts з formatAmount та formatDate
    - _Requirements: 2.3_
  - [x] 3.4 Написати property test для форматування
    - **Property 3: Balance Format Correctness**
    - **Validates: Requirements 2.3**
  - [x] 3.5 Реалізувати хешування PIN
    - Створити utils/crypto.ts з hashPin та verifyPin
    - _Requirements: 1.3_
  - [x] 3.6 Написати property test для PIN verification
    - **Property 2: PIN Verification Consistency**
    - **Validates: Requirements 1.3**

- [x] 4. Checkpoint - Утиліти готові
  - Переконатися що всі тести проходять
  - Запитати користувача якщо є питання

- [x] 5. Backend API
  - [x] 5.1 Створити Express сервер
    - Налаштувати index.ts з middleware (cors, json, auth)
    - Створити JWT middleware
    - _Requirements: 1.2, 1.3_
  - [x] 5.2 Реалізувати Auth контролер
    - POST /api/auth/login — авторизація через QR + PIN
    - GET /api/auth/me — поточний користувач
    - Логіка блокування після 3 невдалих спроб
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 5.3 Реалізувати Bank контролер
    - GET /api/bank/balance — баланс
    - POST /api/bank/transfer — переказ
    - GET /api/bank/history — історія
    - GET /api/bank/users — список користувачів
    - _Requirements: 2.1, 3.1, 3.2, 3.4, 4.1_
  - [x] 5.4 Написати property test для transfer invariant
    - **Property 4: Transfer Invariant (Conservation of Money)**
    - **Validates: Requirements 3.2, 3.4**
  - [x] 5.5 Написати property test для insufficient funds
    - **Property 5: Insufficient Funds Rejection**
    - **Validates: Requirements 3.3**
  - [x] 5.6 Реалізувати Admin контролер
    - POST /api/admin/deposit — поповнення
    - POST /api/admin/create-user — створення користувача
    - GET /api/admin/users — всі користувачі
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [x] 5.7 Написати property test для admin deposit
    - **Property 10: Admin Deposit Increases Balance**
    - **Validates: Requirements 5.2**
  - [x] 5.8 Написати property test для QR uniqueness
    - **Property 8: QR Code Uniqueness**
    - **Validates: Requirements 5.3, 7.1**

- [ ] 6. Checkpoint - Backend готовий
  - Переконатися що всі API endpoints працюють
  - Запитати користувача якщо є питання

- [x] 7. Frontend - UI компоненти
  - [x] 7.1 Створити базові UI компоненти
    - Button.tsx — 3D кнопка з анімацією
    - Card.tsx — картка з тінню
    - _Requirements: 6.1, 6.2, 6.3_
  - [x] 7.2 Створити PinPad компонент
    - Клавіатура для введення PIN
    - Анімація натискання
    - _Requirements: 1.2, 6.5_
  - [x] 7.3 Створити AmountInput компонент
    - Введення суми з форматуванням
    - _Requirements: 3.2_
  - [x] 7.4 Створити TransactionItem компонент
    - Відображення транзакції з кольором
    - _Requirements: 4.2, 4.3_
  - [x] 7.5 Написати property test для transaction display
    - **Property 7: Transaction Display Completeness**
    - **Validates: Requirements 4.2**

- [x] 8. Frontend - API клієнт та store
  - [x] 8.1 Створити API клієнт
    - Реалізувати api/client.ts
    - Методи для всіх endpoints
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.2_
  - [x] 8.2 Створити Zustand store
    - UI стан (currentScreen, loading, error)
    - Кешування даних користувача
    - _Requirements: 2.1, 4.1_

- [x] 9. Frontend - Екрани
  - [x] 9.1 Створити ScanScreen
    - Інтеграція html5-qrcode
    - Обробка успішного сканування
    - _Requirements: 1.1, 1.5_
  - [x] 9.2 Створити PinScreen
    - Введення PIN після сканування
    - Показ помилок
    - _Requirements: 1.2, 1.3, 1.4_
  - [x] 9.3 Створити MainMenu
    - Кнопки: Баланс, Переказ, Історія, Вихід
    - Адмін кнопка для адмінів
    - _Requirements: 2.1, 3.1, 4.1, 5.1_
  - [x] 9.4 Створити BalanceScreen
    - Анімація показу балансу
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 9.5 Створити TransferScreen
    - Вибір отримувача
    - Введення суми
    - Підтвердження PIN
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 9.6 Створити HistoryScreen
    - Список транзакцій
    - Деталі при натисканні
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 9.7 Написати property test для history ordering
    - **Property 6: Transaction History Ordering**
    - **Validates: Requirements 4.1**

- [x] 10. Frontend - Адмін панель
  - [x] 10.1 Створити AdminPanel
    - Меню адміністратора
    - _Requirements: 5.1_
  - [x] 10.2 Створити CreateCard екран
    - Форма створення користувача
    - Генерація та відображення QR-коду
    - Інструкція для друку
    - _Requirements: 5.3, 7.1, 7.2, 7.3, 7.4_
  - [x] 10.3 Створити DepositScreen
    - Вибір користувача
    - Введення суми
    - _Requirements: 5.2_
  - [x] 10.4 Створити UsersScreen
    - Список всіх користувачів з балансами
    - _Requirements: 5.4_

- [ ] 11. Checkpoint - Frontend готовий
  - Переконатися що всі екрани працюють
  - Запитати користувача якщо є питання

- [x] 12. Стилізація та анімації
  - [x] 12.1 Налаштувати Tailwind тему
    - Темна тема з градієнтами
    - Кольори як у Monobank
    - _Requirements: 6.1_
  - [x] 12.2 Додати Framer Motion анімації
    - Переходи між екранами
    - Анімація балансу
    - _Requirements: 6.2_
  - [x] 12.3 Додати 3D ефекти
    - Тіні на кнопках
    - Підсвітка при hover
    - _Requirements: 6.3_
  - [x] 12.4 Адаптувати для планшета
    - Великі кнопки та шрифти
    - Touch-friendly інтерфейс
    - _Requirements: 6.4, 6.5_
  - [x] 12.5 Додати вібрацію
    - Тактильний відгук при натисканні
    - _Requirements: 6.6_

- [ ] 13. Final checkpoint
  - Переконатися що всі тести проходять
  - Перевірити всі user flows
  - Запитати користувача якщо є питання

## Notes

- Всі тести є обов'язковими
- Кожна задача посилається на конкретні вимоги
- Checkpoints дозволяють перевірити прогрес
- Property тести використовують fast-check бібліотеку
- Vitest для запуску тестів

