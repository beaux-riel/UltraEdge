# UltraEdge

An Open Source React Native application for planning and managing ultra marathon races and endurance events.

## Features

- Create and manage race plans for ultra marathons and endurance events
- Set up aid stations with detailed information:
  - Distance (miles/kilometers)
  - Cut-off times
  - Available supplies
  - Drop bag and crew access options
  - Medical support availability
- Track crew members and assign them to specific aid stations
- View race details including elevation, distance, and mandatory equipment
- Premium features:
  - Cloud backup of race data to Supabase
  - Restore race data from cloud backups
  - Secure user authentication

## Technical Details

- Built with React Native for cross-platform compatibility
- Uses React Navigation for app navigation
- Implements React Native Paper for UI components
- Stores data locally using AsyncStorage
- Integrates with Supabase for cloud storage and authentication

## Getting Started

### Prerequisites

- Node.js
- npm or yarn
- Expo CLI

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/ultra-endurance-planner.git
cd ultra-endurance-planner
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Configure Supabase (for premium features)
```bash
# See instructions in /supabase/README.md
```

4. Start the development server
```bash
npx expo start
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
