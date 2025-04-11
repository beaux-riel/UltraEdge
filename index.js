import { AppRegistry } from 'react-native';
import TestApp from './TestApp';
import { name as appName } from './app.json';

// Register the app
AppRegistry.registerComponent('main', () => TestApp);
