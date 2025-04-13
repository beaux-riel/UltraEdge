# UltraEdge

UltraEdge is a comprehensive mobile application designed for ultra-endurance athletes to plan and manage their nutrition and hydration strategies for races.

## Features

- **Nutrition Planning**: Create detailed nutrition plans with specific food items, calories, macronutrients, and timing.
- **Hydration Planning**: Develop hydration strategies with liquid types, volumes, electrolytes, and consumption rates.
- **Race Integration**: Associate nutrition and hydration plans with specific races.
- **Aid Station Management**: Plan nutrition and hydration at race aid stations.
- **Timeline Visualization**: View nutrition and hydration entries on an interactive timeline.
- **Analytics**: Analyze calorie intake, macronutrient distribution, and hydration status.
- **Rule-Based Conditions**: Create rules for adjusting nutrition and hydration based on time, distance, or temperature.
- **Sharing**: Share plans with crew members and pacers.
- **Export Options**: Export plans in various formats for offline use.

## Technology Stack

- React Native
- TypeScript
- Expo
- React Navigation
- React Native Paper
- Victory Native (for data visualization)

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/UltraEdge.git
   ```

2. Install dependencies:
   ```
   cd UltraEdge
   npm install
   ```

3. Start the development server:
   ```
   npx expo start
   ```

4. Run on a device or emulator:
   - Press `a` to run on Android emulator
   - Press `i` to run on iOS simulator
   - Scan the QR code with the Expo Go app on your physical device

## Project Structure

```
UltraEdge/
├── assets/             # Images, fonts, and other static assets
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── common/     # Common UI components
│   │   ├── race/       # Race-related components
│   │   ├── sharing/    # Sharing-related components
│   │   └── ...
│   ├── context/        # React Context providers
│   ├── navigation/     # Navigation configuration
│   ├── screens/        # App screens
│   │   ├── nutrition/  # Nutrition-related screens
│   │   ├── hydration/  # Hydration-related screens
│   │   └── ...
│   └── utils/          # Utility functions
├── App.tsx             # Main app component
└── ...
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Thanks to all the ultra-endurance athletes who provided feedback and insights for this app.