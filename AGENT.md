# AGENT.md - NssaTools Development Guide

## Build & Deploy Commands
- **Deploy to Cloudflare Workers**: `npx wrangler deploy`
- **Local development**: `npx wrangler dev`
- **Deploy cron subproject**: `cd cron && npx wrangler deploy`
- **No tests found** - this is a simple HTML/JS project without test frameworks

## Project Structure
- **Main Worker**: `/worker.js` - Cloudflare Workers entry point with auth & static asset serving
- **Subprojects**: `/cron/` (webhook scheduler), `/Gomoku/` (game), `/mlg/` (game), `/auth/` (login)
- **Firebase Auth**: Uses Firebase for authentication with cookie-based sessions
- **Static Assets**: HTML/CSS/JS served directly through Cloudflare Workers ASSETS binding
- **Config**: `wrangler.toml` contains Firebase config and auth bypass paths

## Code Style & Conventions
- **Language**: Vanilla JavaScript (ES6+), no TypeScript
- **Modules**: ES6 imports/exports, IIFE patterns for encapsulation  
- **Functions**: Mix of traditional functions and arrow functions, async/await for Firebase
- **Variables**: `const` for constants/functions, `let` for variables
- **DOM**: `getElementById`, `addEventListener`, modern query selectors
- **Storage**: Custom `UserStorage` utility with module-based keys (`mlg_data_v2`, `gomoku_data_v2`)
- **Error Handling**: Try-catch blocks with fallback values, safe operations
- **Global Exports**: `window.ModuleName = { ... }` pattern for cross-module access
- **Firebase**: Global config via `window.__FIREBASE_CONFIG__`, async auth patterns
- **Themes**: CSS class-based with localStorage persistence and system theme detection
