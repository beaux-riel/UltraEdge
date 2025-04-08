# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands
- `npm start` or `npx expo start` - Start the development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run in web browser
- `npm run web-dev` - Run in web browser on port 12000

## Code Style Guidelines
- **Imports**: React/RN imports first, followed by external libraries, then contexts, lastly local components
- **Components**: Use functional components with hooks, PascalCase naming
- **State Management**: React Context API for global state, useState for local state
- **Error Handling**: Try/catch blocks with console.error for debugging and user-friendly alerts
- **Styling**: StyleSheet objects with dynamic theming for dark/light mode
- **Naming**: camelCase for variables/functions, PascalCase for components, use prefixes (handle*, toggle*, etc.)
- **File Structure**: Screens in /screens, contexts in /context, navigation in /navigation
- **Context Usage**: Import contexts with custom hooks (useRaces, useAppTheme)
- **UI Components**: Prefer React Native Paper components
- **Prop Types**: Document expected props in comments