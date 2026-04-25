# Home Bank System

A full-stack banking-style demo system with a web client, backend server, and Android QR/scanner module.

> Repository name is still `literate-pancake`, but the actual project is organized as **Home Bank**.

## Features

- Web client built with TypeScript/React-style components
- Backend server workspace
- Android scanner module
- Admin QR page
- GitHub Actions workflow for Android build
- Monorepo layout with npm workspaces

## Project structure

```text
.
├── client/            # Web client
├── server/            # Backend server
├── android-scanner/   # Android scanner app
├── android-webview/   # Android WebView module
├── admin-qr.html      # QR/admin helper page
└── package.json       # Root workspace scripts
```

## Getting started

```bash
npm install
npm run dev
```

Run individual workspaces:

```bash
npm run dev:client
npm run dev:server
```

## Scripts

```bash
npm run build
npm run test
```

## Notes

This is a portfolio/demo project. Before production use, review authentication, validation, storage, and deployment security.
