import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, List, Switch, Divider, Button, RadioButton, useTheme as usePaperTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = () => {
  const paperTheme = usePaperTheme();
  const { isDarkMode, toggleTheme } = useAppTheme();
  const insets = useSafeAreaInsets();
  
  // Settings state
  const [notifications, setNotifications] = useState(true);
  const [distanceUnit, setDistanceUnit] = useState('miles');
  const [elevationUnit, setElevationUnit] = useState('ft');
  const [syncWithStrava, setSyncWithStrava] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  
  // Load settings from AsyncStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedNotifications = await AsyncStorage.getItem('notifications');
        const storedDistanceUnit = await AsyncStorage.getItem('distanceUnit');
        const storedElevationUnit = await AsyncStorage.getItem('elevationUnit');
        const storedSyncWithStrava = await AsyncStorage.getItem('syncWithStrava');
        const storedAutoBackup = await AsyncStorage.getItem('autoBackup');
        
        if (storedNotifications !== null) setNotifications(JSON.parse(storedNotifications));
        if (storedDistanceUnit !== null) setDistanceUnit(storedDistanceUnit);
        if (storedElevationUnit !== null) setElevationUnit(storedElevationUnit);
        if (storedSyncWithStrava !== null) setSyncWithStrava(JSON.parse(storedSyncWithStrava));
        if (storedAutoBackup !== null) setAutoBackup(JSON.parse(storedAutoBackup));
      } catch (error) {
        console.error('Failed to load settings from storage', error);
      }
    };
    
    loadSettings();
  }, []);
  
  // Save settings to AsyncStorage when they change
  const saveSettings = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to save ${key} to storage`, error);
    }
  };
  
  // Handle setting changes with storage
  const handleNotificationsChange = (value) => {
    setNotifications(value);
    saveSettings('notifications', value);
  };
  
  const handleDistanceUnitChange = (value) => {
    setDistanceUnit(value);
    saveSettings('distanceUnit', value);
  };
  
  const handleElevationUnitChange = (value) => {
    setElevationUnit(value);
    saveSettings('elevationUnit', value);
  };
  
  const handleSyncWithStravaChange = (value) => {
    setSyncWithStrava(value);
    saveSettings('syncWithStrava', value);
  };
  
  const handleAutoBackupChange = (value) => {
    setAutoBackup(value);
    saveSettings('autoBackup', value);
  };
  
  // Handle dark mode toggle
  const handleDarkModeChange = () => {
    toggleTheme();
  };
  
  // Create dynamic styles based on theme
  const dynamicStyles = {
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? "#121212" : "#f5f5f5",
      marginTop: 50,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginHorizontal: 16,
      marginBottom: 16,
      color: isDarkMode ? "#ffffff" : "#000000",
    },
    section: {
      backgroundColor: isDarkMode ? "#1e1e1e" : "white",
      borderRadius: 8,
      marginHorizontal: 16,
      marginBottom: 16,
      padding: 16,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.41,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 16,
      color: isDarkMode ? "#ffffff" : "#000000",
    },
    subsectionTitle: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 8,
      color: isDarkMode ? "#ffffff" : "#000000",
    },
    radioLabel: {
      fontSize: 16,
      marginLeft: 8,
      color: isDarkMode ? "#e0e0e0" : "#000000",
    },
    divider: {
      marginVertical: 16,
      backgroundColor: isDarkMode ? "#333333" : "#e0e0e0",
    },
  };

  return (
    <ScrollView 
      style={dynamicStyles.container}
      contentContainerStyle={{
        paddingTop: insets.top > 0 ? 0 : 16,
        paddingBottom: insets.bottom + 16
      }}
    >
      <Text style={dynamicStyles.title}>Settings</Text>
      
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionTitle}>App Preferences</Text>
        
        <List.Item
          title="Notifications"
          description="Receive reminders about upcoming races"
          titleStyle={{ color: isDarkMode ? '#ffffff' : '#000000' }}
          descriptionStyle={{ color: isDarkMode ? '#e0e0e0' : '#757575' }}
          left={props => <List.Icon {...props} icon="bell-outline" color={isDarkMode ? '#ffffff' : undefined} />}
          right={props => (
            <Switch
              value={notifications}
              onValueChange={handleNotificationsChange}
              color={paperTheme.colors.primary}
            />
          )}
        />
        
        <Divider />
        
        <List.Item
          title="Dark Mode"
          description="Use dark theme throughout the app"
          titleStyle={{ color: isDarkMode ? '#ffffff' : '#000000' }}
          descriptionStyle={{ color: isDarkMode ? '#e0e0e0' : '#757575' }}
          left={props => <List.Icon {...props} icon={isDarkMode ? "weather-night" : "weather-sunny"} color={isDarkMode ? '#ffffff' : undefined} />}
          right={props => (
            <Switch
              value={isDarkMode}
              onValueChange={handleDarkModeChange}
              color={paperTheme.colors.primary}
            />
          )}
        />
        
        <Divider />
        
        <List.Item
          title="Auto Backup"
          description="Automatically backup your race plans"
          titleStyle={{ color: isDarkMode ? '#ffffff' : '#000000' }}
          descriptionStyle={{ color: isDarkMode ? '#e0e0e0' : '#757575' }}
          left={props => <List.Icon {...props} icon="cloud-upload-outline" color={isDarkMode ? '#ffffff' : undefined} />}
          right={props => (
            <Switch
              value={autoBackup}
              onValueChange={handleAutoBackupChange}
              color={paperTheme.colors.primary}
            />
          )}
        />
      </View>
      
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionTitle}>Units</Text>
        
        <Text style={dynamicStyles.subsectionTitle}>Distance</Text>
        <RadioButton.Group onValueChange={handleDistanceUnitChange} value={distanceUnit}>
          <View style={styles.radioOption}>
            <RadioButton 
              value="miles" 
              color={paperTheme.colors.primary} 
              uncheckedColor={isDarkMode ? '#e0e0e0' : undefined}
            />
            <Text style={dynamicStyles.radioLabel}>Miles</Text>
          </View>
          <View style={styles.radioOption}>
            <RadioButton 
              value="km" 
              color={paperTheme.colors.primary} 
              uncheckedColor={isDarkMode ? '#e0e0e0' : undefined}
            />
            <Text style={dynamicStyles.radioLabel}>Kilometers</Text>
          </View>
        </RadioButton.Group>
        
        <Divider style={dynamicStyles.divider} />
        
        <Text style={dynamicStyles.subsectionTitle}>Elevation</Text>
        <RadioButton.Group onValueChange={handleElevationUnitChange} value={elevationUnit}>
          <View style={styles.radioOption}>
            <RadioButton 
              value="ft" 
              color={paperTheme.colors.primary} 
              uncheckedColor={isDarkMode ? '#e0e0e0' : undefined}
            />
            <Text style={dynamicStyles.radioLabel}>Feet</Text>
          </View>
          <View style={styles.radioOption}>
            <RadioButton 
              value="m" 
              color={paperTheme.colors.primary} 
              uncheckedColor={isDarkMode ? '#e0e0e0' : undefined}
            />
            <Text style={dynamicStyles.radioLabel}>Meters</Text>
          </View>
        </RadioButton.Group>
      </View>
      
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionTitle}>Integrations</Text>
        
        <List.Item
          title="Sync with Strava"
          description="Connect your Strava account"
          titleStyle={{ color: isDarkMode ? '#ffffff' : '#000000' }}
          descriptionStyle={{ color: isDarkMode ? '#e0e0e0' : '#757575' }}
          left={props => <List.Icon {...props} icon="run" color={isDarkMode ? '#ffffff' : undefined} />}
          right={props => (
            <Switch
              value={syncWithStrava}
              onValueChange={handleSyncWithStravaChange}
              color={paperTheme.colors.primary}
            />
          )}
        />
        
        <Divider />
        
        <List.Item
          title="Import GPX Files"
          description="Import race courses from GPX files"
          titleStyle={{ color: isDarkMode ? '#ffffff' : '#000000' }}
          descriptionStyle={{ color: isDarkMode ? '#e0e0e0' : '#757575' }}
          left={props => <List.Icon {...props} icon="map-outline" color={isDarkMode ? '#ffffff' : undefined} />}
          onPress={() => {/* Handle import */}}
        />
      </View>
      
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionTitle}>Account</Text>
        
        <List.Item
          title="Edit Profile"
          description="Change your name, email, and photo"
          titleStyle={{ color: isDarkMode ? '#ffffff' : '#000000' }}
          descriptionStyle={{ color: isDarkMode ? '#e0e0e0' : '#757575' }}
          left={props => <List.Icon {...props} icon="account-outline" color={isDarkMode ? '#ffffff' : undefined} />}
          onPress={() => {/* Navigate to edit profile */}}
        />
        
        <Divider />
        
        <List.Item
          title="Change Password"
          description="Update your account password"
          titleStyle={{ color: isDarkMode ? '#ffffff' : '#000000' }}
          descriptionStyle={{ color: isDarkMode ? '#e0e0e0' : '#757575' }}
          left={props => <List.Icon {...props} icon="lock-outline" color={isDarkMode ? '#ffffff' : undefined} />}
          onPress={() => {/* Handle password change */}}
        />
        
        <Divider />
        
        <List.Item
          title="Privacy Settings"
          description="Manage your data and privacy"
          titleStyle={{ color: isDarkMode ? '#ffffff' : '#000000' }}
          descriptionStyle={{ color: isDarkMode ? '#e0e0e0' : '#757575' }}
          left={props => <List.Icon {...props} icon="shield-outline" color={isDarkMode ? '#ffffff' : undefined} />}
          onPress={() => {/* Navigate to privacy settings */}}
        />
      </View>
      
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionTitle}>Support</Text>
        
        <List.Item
          title="Help & FAQ"
          description="Get answers to common questions"
          titleStyle={{ color: isDarkMode ? '#ffffff' : '#000000' }}
          descriptionStyle={{ color: isDarkMode ? '#e0e0e0' : '#757575' }}
          left={props => <List.Icon {...props} icon="help-circle-outline" color={isDarkMode ? '#ffffff' : undefined} />}
          onPress={() => {/* Navigate to help */}}
        />
        
        <Divider />
        
        <List.Item
          title="Contact Support"
          description="Reach out to our support team"
          titleStyle={{ color: isDarkMode ? '#ffffff' : '#000000' }}
          descriptionStyle={{ color: isDarkMode ? '#e0e0e0' : '#757575' }}
          left={props => <List.Icon {...props} icon="email-outline" color={isDarkMode ? '#ffffff' : undefined} />}
          onPress={() => {/* Handle contact */}}
        />
        
        <Divider />
        
        <List.Item
          title="About"
          description="App version and information"
          titleStyle={{ color: isDarkMode ? '#ffffff' : '#000000' }}
          descriptionStyle={{ color: isDarkMode ? '#e0e0e0' : '#757575' }}
          left={props => <List.Icon {...props} icon="information-outline" color={isDarkMode ? '#ffffff' : undefined} />}
          onPress={() => {/* Show about info */}}
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <Button 
          mode="outlined" 
          style={[
            styles.logoutButton,
            { borderColor: isDarkMode ? "#ff6b6b" : "#f44336" }
          ]}
          labelStyle={{ color: isDarkMode ? "#ff6b6b" : "#f44336" }}
          color={isDarkMode ? "#ff6b6b" : "#f44336"}
          onPress={() => {/* Handle logout */}}
        >
          Log Out
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  buttonContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  logoutButton: {
    borderWidth: 1,
  },
});

export default SettingsScreen;