import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, List, Switch, Divider, Button, RadioButton, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SettingsScreen = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  // Settings state
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [distanceUnit, setDistanceUnit] = useState('miles');
  const [elevationUnit, setElevationUnit] = useState('ft');
  const [syncWithStrava, setSyncWithStrava] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top > 0 ? 0 : 16,
        paddingBottom: insets.bottom + 16
      }}
    >
      <Text style={styles.title}>Settings</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Preferences</Text>
        
        <List.Item
          title="Notifications"
          description="Receive reminders about upcoming races"
          left={props => <List.Icon {...props} icon="bell-outline" />}
          right={props => (
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              color={theme.colors.primary}
            />
          )}
        />
        
        <Divider />
        
        <List.Item
          title="Dark Mode"
          description="Use dark theme throughout the app"
          left={props => <List.Icon {...props} icon="moon-outline" />}
          right={props => (
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              color={theme.colors.primary}
            />
          )}
        />
        
        <Divider />
        
        <List.Item
          title="Auto Backup"
          description="Automatically backup your race plans"
          left={props => <List.Icon {...props} icon="cloud-upload-outline" />}
          right={props => (
            <Switch
              value={autoBackup}
              onValueChange={setAutoBackup}
              color={theme.colors.primary}
            />
          )}
        />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Units</Text>
        
        <Text style={styles.subsectionTitle}>Distance</Text>
        <RadioButton.Group onValueChange={value => setDistanceUnit(value)} value={distanceUnit}>
          <View style={styles.radioOption}>
            <RadioButton value="miles" color={theme.colors.primary} />
            <Text style={styles.radioLabel}>Miles</Text>
          </View>
          <View style={styles.radioOption}>
            <RadioButton value="km" color={theme.colors.primary} />
            <Text style={styles.radioLabel}>Kilometers</Text>
          </View>
        </RadioButton.Group>
        
        <Divider style={styles.divider} />
        
        <Text style={styles.subsectionTitle}>Elevation</Text>
        <RadioButton.Group onValueChange={value => setElevationUnit(value)} value={elevationUnit}>
          <View style={styles.radioOption}>
            <RadioButton value="ft" color={theme.colors.primary} />
            <Text style={styles.radioLabel}>Feet</Text>
          </View>
          <View style={styles.radioOption}>
            <RadioButton value="m" color={theme.colors.primary} />
            <Text style={styles.radioLabel}>Meters</Text>
          </View>
        </RadioButton.Group>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Integrations</Text>
        
        <List.Item
          title="Sync with Strava"
          description="Connect your Strava account"
          left={props => <List.Icon {...props} icon="run" />}
          right={props => (
            <Switch
              value={syncWithStrava}
              onValueChange={setSyncWithStrava}
              color={theme.colors.primary}
            />
          )}
        />
        
        <Divider />
        
        <List.Item
          title="Import GPX Files"
          description="Import race courses from GPX files"
          left={props => <List.Icon {...props} icon="map-outline" />}
          onPress={() => {/* Handle import */}}
        />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <List.Item
          title="Edit Profile"
          description="Change your name, email, and photo"
          left={props => <List.Icon {...props} icon="account-outline" />}
          onPress={() => {/* Navigate to edit profile */}}
        />
        
        <Divider />
        
        <List.Item
          title="Change Password"
          description="Update your account password"
          left={props => <List.Icon {...props} icon="lock-outline" />}
          onPress={() => {/* Handle password change */}}
        />
        
        <Divider />
        
        <List.Item
          title="Privacy Settings"
          description="Manage your data and privacy"
          left={props => <List.Icon {...props} icon="shield-outline" />}
          onPress={() => {/* Navigate to privacy settings */}}
        />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        
        <List.Item
          title="Help & FAQ"
          description="Get answers to common questions"
          left={props => <List.Icon {...props} icon="help-circle-outline" />}
          onPress={() => {/* Navigate to help */}}
        />
        
        <Divider />
        
        <List.Item
          title="Contact Support"
          description="Reach out to our support team"
          left={props => <List.Icon {...props} icon="email-outline" />}
          onPress={() => {/* Handle contact */}}
        />
        
        <Divider />
        
        <List.Item
          title="About"
          description="App version and information"
          left={props => <List.Icon {...props} icon="information-outline" />}
          onPress={() => {/* Show about info */}}
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <Button 
          mode="outlined" 
          style={styles.logoutButton}
          onPress={() => {/* Handle logout */}}
        >
          Log Out
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    marginTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginHorizontal: 16,
    marginBottom: 16,
  },
  section: {
    backgroundColor: "white",
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
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  radioLabel: {
    fontSize: 16,
    marginLeft: 8,
  },
  divider: {
    marginVertical: 16,
  },
  buttonContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  logoutButton: {
    borderColor: "#f44336",
    borderWidth: 1,
  },
  logoutText: {
    color: "#f44336",
  },
});

export default SettingsScreen;