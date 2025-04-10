import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  Text,
  List,
  Switch,
  Divider,
  Button,
  RadioButton,
  useTheme as usePaperTheme,
  Dialog,
  Portal,
  TextInput,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../context/ThemeContext";
import { useSupabase } from "../context/SupabaseContext";
import { useSettings } from "../context/SettingsContext";
import { useUser } from "../context/UserContext";
import { useRaces } from "../context/RaceContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

const SettingsScreen = () => {
  const navigation = useNavigation();
  const paperTheme = usePaperTheme();
  const { isDarkMode, toggleTheme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const {
    user,
    isPremium,
    lastBackupDate,
    signIn,
    signUp,
    signOut,
    backupRaces,
    restoreRaces,
    upgradeToPremium,
  } = useSupabase();

  // Get settings from context
  const { settings, saveSetting } = useSettings();
  const { backupUserDataToSupabase } = useUser();
  const { backupRacesToSupabase } = useRaces();

  // Auth state
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showSignupDialog, setShowSignupDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Backup state
  const [showBackupDialog, setShowBackupDialog] = useState(false);

  // We no longer need to load settings from AsyncStorage directly
  // as the SettingsContext handles this for us

  // Handle setting changes using the SettingsContext
  const handleNotificationsChange = (value) => {
    saveSetting("notifications", value);
  };

  const handleDistanceUnitChange = (value) => {
    saveSetting("distanceUnit", value);
  };

  const handleElevationUnitChange = (value) => {
    saveSetting("elevationUnit", value);
  };

  const handleSyncWithStravaChange = (value) => {
    saveSetting("syncWithStrava", value);
  };

  const handleAutoBackupChange = (value) => {
    saveSetting("autoBackup", value);
  };

  // Handle dark mode toggle
  const handleDarkModeChange = () => {
    toggleTheme();
  };

  // Handle login
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setIsLoading(true);
    const { success, error } = await signIn(email, password);
    setIsLoading(false);

    if (success) {
      setShowLoginDialog(false);
      setEmail("");
      setPassword("");
      Alert.alert("Success", "You have been logged in successfully");
    } else {
      Alert.alert("Error", error || "Failed to log in");
    }
  };

  // Handle signup
  const handleSignup = async () => {
    if (!email || !password || !name) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    const { success, error } = await signUp(email, password, name);
    setIsLoading(false);

    if (success) {
      setShowSignupDialog(false);
      setEmail("");
      setPassword("");
      setName("");
      Alert.alert(
        "Success",
        "Your account has been created. Please check your email to verify your account."
      );
    } else {
      Alert.alert("Error", error || "Failed to create account");
    }
  };

  // Handle logout
  const handleLogout = async () => {
    setIsLoading(true);
    const { success, error } = await signOut();
    setIsLoading(false);

    if (success) {
      Alert.alert("Success", "You have been logged out");
    } else {
      Alert.alert("Error", error || "Failed to log out");
    }
  };

  // Handle backup
  const handleBackup = async () => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }

    if (!isPremium) {
      setShowBackupDialog(true);
      return;
    }

    setIsLoading(true);

    try {
      // Backup both user data and races
      const userResult = await backupUserDataToSupabase();
      const racesResult = await backupRacesToSupabase();

      if (userResult.success && racesResult.success) {
        Alert.alert("Success", "Your data has been backed up to the cloud");
      } else {
        let errorMessage = "Failed to backup data: ";
        if (!userResult.success)
          errorMessage += userResult.error || "User data backup failed. ";
        if (!racesResult.success)
          errorMessage += racesResult.error || "Race data backup failed.";
        Alert.alert("Error", errorMessage);
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle restore
  const handleRestore = async () => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }

    if (!isPremium) {
      setShowBackupDialog(true);
      return;
    }

    Alert.alert(
      "Restore Data",
      "This will replace your current race data with the backup. Continue?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Restore",
          onPress: async () => {
            setIsLoading(true);
            const { success, error, backupDate } = await restoreRaces();
            setIsLoading(false);

            if (success) {
              Alert.alert(
                "Success",
                `Your race data has been restored from backup (${backupDate.toLocaleDateString()})`
              );
              // Force reload the app or refresh races context
              // This would typically reload the app or navigate to the home screen
            } else {
              Alert.alert("Error", error || "Failed to restore data");
            }
          },
        },
      ]
    );
  };

  // Handle upgrade to premium
  const handleUpgradeToPremium = () => {
    if (!user) {
      navigation.navigate("Premium");
      return;
    }

    // Navigate to the Premium screen
    navigation.navigate("Premium");
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
    <>
      <ScrollView
        style={dynamicStyles.container}
        contentContainerStyle={{
          paddingTop: insets.top > 0 ? 0 : 16,
          paddingBottom: insets.bottom + 16,
        }}
      >
        <Text style={dynamicStyles.title}>Settings</Text>

        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>App Preferences</Text>

          <List.Item
            title="Notifications"
            description="Receive reminders about upcoming races"
            titleStyle={{ color: isDarkMode ? "#ffffff" : "#000000" }}
            descriptionStyle={{ color: isDarkMode ? "#e0e0e0" : "#757575" }}
            left={(props) => (
              <List.Icon
                {...props}
                icon="bell-outline"
                color={isDarkMode ? "#ffffff" : "#FFC5D3"}
              />
            )}
            right={(props) => (
              <Switch
                value={settings.notifications}
                onValueChange={handleNotificationsChange}
                color={paperTheme.colors.primary}
              />
            )}
          />

          <Divider />

          <List.Item
            title="Dark Mode"
            description="Use dark theme throughout the app"
            titleStyle={{ color: isDarkMode ? "#ffffff" : "#000000" }}
            descriptionStyle={{ color: isDarkMode ? "#e0e0e0" : "#757575" }}
            left={(props) => (
              <List.Icon
                {...props}
                icon={isDarkMode ? "weather-night" : "weather-sunny"}
                color={isDarkMode ? "#ffffff" : "#FFC5D3"}
              />
            )}
            right={(props) => (
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
            titleStyle={{ color: isDarkMode ? "#ffffff" : "#000000" }}
            descriptionStyle={{ color: isDarkMode ? "#e0e0e0" : "#757575" }}
            left={(props) => (
              <List.Icon
                {...props}
                icon="cloud-upload-outline"
                color={isDarkMode ? "#ffffff" : "#FFC5D3"}
              />
            )}
            right={(props) => (
              <Switch
                value={settings.autoBackup}
                onValueChange={handleAutoBackupChange}
                color={paperTheme.colors.primary}
              />
            )}
          />
        </View>

        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Units</Text>

          <Text style={dynamicStyles.subsectionTitle}>Distance</Text>
          <RadioButton.Group
            onValueChange={handleDistanceUnitChange}
            value={settings.distanceUnit}
          >
            <View style={styles.radioOption}>
              <RadioButton
                value="miles"
                color={paperTheme.colors.primary}
                uncheckedColor={isDarkMode ? "#e0e0e0" : "#FFC5D3"}
              />
              <Text style={dynamicStyles.radioLabel}>Miles</Text>
            </View>
            <View style={styles.radioOption}>
              <RadioButton
                value="km"
                color={paperTheme.colors.primary}
                uncheckedColor={isDarkMode ? "#e0e0e0" : "#FFC5D3"}
              />
              <Text style={dynamicStyles.radioLabel}>Kilometers</Text>
            </View>
          </RadioButton.Group>

          <Divider style={dynamicStyles.divider} />

          <Text style={dynamicStyles.subsectionTitle}>Elevation</Text>
          <RadioButton.Group
            onValueChange={handleElevationUnitChange}
            value={settings.elevationUnit}
          >
            <View style={styles.radioOption}>
              <RadioButton
                value="ft"
                color={paperTheme.colors.primary}
                uncheckedColor={isDarkMode ? "#e0e0e0" : "#FFC5D3"}
              />
              <Text style={dynamicStyles.radioLabel}>Feet</Text>
            </View>
            <View style={styles.radioOption}>
              <RadioButton
                value="m"
                color={paperTheme.colors.primary}
                uncheckedColor={isDarkMode ? "#e0e0e0" : "#FFC5D3"}
              />
              <Text style={dynamicStyles.radioLabel}>Meters</Text>
            </View>
          </RadioButton.Group>
        </View>

        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Cloud Backup</Text>

          <List.Item
            title="Backup to Cloud"
            description={
              lastBackupDate
                ? `Last backup: ${lastBackupDate.toLocaleDateString()}`
                : "Backup your race data to the cloud"
            }
            titleStyle={{ color: isDarkMode ? "#ffffff" : "#000000" }}
            descriptionStyle={{ color: isDarkMode ? "#e0e0e0" : "#757575" }}
            left={(props) => (
              <List.Icon
                {...props}
                icon="cloud-upload-outline"
                color={isDarkMode ? "#ffffff" : "#FFC5D3"}
              />
            )}
            onPress={handleBackup}
          />

          <Divider />

          <List.Item
            title="Restore from Cloud"
            description="Restore your race data from the cloud"
            titleStyle={{ color: isDarkMode ? "#ffffff" : "#000000" }}
            descriptionStyle={{ color: isDarkMode ? "#e0e0e0" : "#757575" }}
            left={(props) => (
              <List.Icon
                {...props}
                icon="cloud-download-outline"
                color={isDarkMode ? "#ffffff" : "#FFC5D3"}
              />
            )}
            onPress={handleRestore}
          />

          {!isPremium && (
            <>
              <Divider />
              <List.Item
                title="Upgrade to Premium"
                description="Get cloud backup and more features"
                titleStyle={{ color: isDarkMode ? "#ffffff" : "#000000" }}
                descriptionStyle={{ color: isDarkMode ? "#e0e0e0" : "#757575" }}
                left={(props) => (
                  <List.Icon
                    {...props}
                    icon="star"
                    color={isDarkMode ? "#ffd700" : "#ffc107"}
                  />
                )}
                onPress={handleUpgradeToPremium}
              />
            </>
          )}
        </View>

        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Integrations</Text>

          <List.Item
            title="Sync with Strava"
            description="Connect your Strava account"
            titleStyle={{ color: isDarkMode ? "#ffffff" : "#000000" }}
            descriptionStyle={{ color: isDarkMode ? "#e0e0e0" : "#757575" }}
            left={(props) => (
              <List.Icon
                {...props}
                icon="run"
                color={isDarkMode ? "#ffffff" : "#FFC5D3"}
              />
            )}
            right={(props) => (
              <Switch
                value={settings.syncWithStrava}
                onValueChange={handleSyncWithStravaChange}
                color={paperTheme.colors.primary}
              />
            )}
          />

          <Divider />

          <List.Item
            title="Import GPX Files"
            description="Import race courses from GPX files"
            titleStyle={{ color: isDarkMode ? "#ffffff" : "#000000" }}
            descriptionStyle={{ color: isDarkMode ? "#e0e0e0" : "#757575" }}
            left={(props) => (
              <List.Icon
                {...props}
                icon="map-outline"
                color={isDarkMode ? "#ffffff" : "#FFC5D3"}
              />
            )}
            onPress={() => {
              /* Handle import */
            }}
          />
        </View>

        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Account</Text>

          {user ? (
            <>
              <List.Item
                title={user.user_metadata?.name || user.email}
                description={isPremium ? "Premium Account" : "Free Account"}
                titleStyle={{ color: isDarkMode ? "#ffffff" : "#000000" }}
                descriptionStyle={{ color: isDarkMode ? "#e0e0e0" : "#757575" }}
                left={(props) => (
                  <List.Icon
                    {...props}
                    icon="account"
                    color={isDarkMode ? "#ffffff" : "#FFC5D3"}
                  />
                )}
              />

              <Divider />

              <List.Item
                title="Edit Profile"
                description="Change your name, email, and photo"
                titleStyle={{ color: isDarkMode ? "#ffffff" : "#000000" }}
                descriptionStyle={{ color: isDarkMode ? "#e0e0e0" : "#757575" }}
                left={(props) => (
                  <List.Icon
                    {...props}
                    icon="account-edit-outline"
                    color={isDarkMode ? "#ffffff" : "#FFC5D3"}
                  />
                )}
                onPress={() => {
                  navigation.navigate("EditProfile");
                }}
              />

              <Divider />

              <List.Item
                title="Change Password"
                description="Update your account password"
                titleStyle={{ color: isDarkMode ? "#ffffff" : "#000000" }}
                descriptionStyle={{ color: isDarkMode ? "#e0e0e0" : "#757575" }}
                left={(props) => (
                  <List.Icon
                    {...props}
                    icon="lock-outline"
                    color={isDarkMode ? "#ffffff" : "#FFC5D3"}
                  />
                )}
                onPress={() => {
                  /* Handle password change */
                }}
              />
            </>
          ) : (
            <>
              <List.Item
                title="Sign In"
                description="Log in to your account"
                titleStyle={{ color: isDarkMode ? "#ffffff" : "#000000" }}
                descriptionStyle={{ color: isDarkMode ? "#e0e0e0" : "#757575" }}
                left={(props) => (
                  <List.Icon
                    {...props}
                    icon="login"
                    color={isDarkMode ? "#ffffff" : "#FFC5D3"}
                  />
                )}
                onPress={() => setShowLoginDialog(true)}
              />

              <Divider />

              <List.Item
                title="Create Account"
                description="Sign up for a new account"
                titleStyle={{ color: isDarkMode ? "#ffffff" : "#000000" }}
                descriptionStyle={{ color: isDarkMode ? "#e0e0e0" : "#757575" }}
                left={(props) => (
                  <List.Icon
                    {...props}
                    icon="account-plus-outline"
                    color={isDarkMode ? "#ffffff" : "#FFC5D3"}
                  />
                )}
                onPress={() => setShowSignupDialog(true)}
              />
            </>
          )}

          <Divider />

          <List.Item
            title="Privacy Settings"
            description="Manage your data and privacy"
            titleStyle={{ color: isDarkMode ? "#ffffff" : "#000000" }}
            descriptionStyle={{ color: isDarkMode ? "#e0e0e0" : "#757575" }}
            left={(props) => (
              <List.Icon
                {...props}
                icon="shield-outline"
                color={isDarkMode ? "#ffffff" : "#FFC5D3"}
              />
            )}
            onPress={() => {
              /* Navigate to privacy settings */
            }}
          />
        </View>

        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Support</Text>

          <List.Item
            title="Help & FAQ"
            description="Get answers to common questions"
            titleStyle={{ color: isDarkMode ? "#ffffff" : "#000000" }}
            descriptionStyle={{ color: isDarkMode ? "#e0e0e0" : "#757575" }}
            left={(props) => (
              <List.Icon
                {...props}
                icon="help-circle-outline"
                color={isDarkMode ? "#ffffff" : "#FFC5D3"}
              />
            )}
            onPress={() => {
              /* Navigate to help */
            }}
          />

          <Divider />

          <List.Item
            title="Contact Support"
            description="Reach out to our support team"
            titleStyle={{ color: isDarkMode ? "#ffffff" : "#000000" }}
            descriptionStyle={{ color: isDarkMode ? "#e0e0e0" : "#757575" }}
            left={(props) => (
              <List.Icon
                {...props}
                icon="email-outline"
                color={isDarkMode ? "#ffffff" : "#FFC5D3"}
              />
            )}
            onPress={() => {
              /* Handle contact */
            }}
          />

          <Divider />

          <List.Item
            title="About"
            description="App version and information"
            titleStyle={{ color: isDarkMode ? "#ffffff" : "#000000" }}
            descriptionStyle={{ color: isDarkMode ? "#e0e0e0" : "#757575" }}
            left={(props) => (
              <List.Icon
                {...props}
                icon="information-outline"
                color={isDarkMode ? "#ffffff" : "#FFC5D3"}
              />
            )}
            onPress={() => {
              navigation.navigate("About");
            }}
          />
        </View>

        {user && (
          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              style={[
                styles.logoutButton,
                { borderColor: isDarkMode ? "#ff6b6b" : "#f44336" },
              ]}
              labelStyle={{ color: isDarkMode ? "#ff6b6b" : "#f44336" }}
              color={isDarkMode ? "#ff6b6b" : "#f44336"}
              onPress={handleLogout}
              loading={isLoading}
              disabled={isLoading}
            >
              Log Out
            </Button>
          </View>
        )}
      </ScrollView>

      <Portal>
        <Dialog
          visible={showLoginDialog}
          onDismiss={() => setShowLoginDialog(false)}
        >
          <Dialog.Title>Sign In</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={{ marginBottom: 12 }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry
              style={{ marginBottom: 12 }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowLoginDialog(false)}>Cancel</Button>
            <Button
              onPress={() =>
                setShowSignupDialog(true) || setShowLoginDialog(false)
              }
            >
              Sign Up
            </Button>
            <Button
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
            >
              Login
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Signup Dialog */}
      <Portal>
        <Dialog
          visible={showSignupDialog}
          onDismiss={() => setShowSignupDialog(false)}
        >
          <Dialog.Title>Create Account</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={{ marginBottom: 12 }}
            />
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={{ marginBottom: 12 }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry
              style={{ marginBottom: 12 }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowSignupDialog(false)}>Cancel</Button>
            <Button
              onPress={() =>
                setShowLoginDialog(true) || setShowSignupDialog(false)
              }
            >
              Sign In
            </Button>
            <Button
              onPress={handleSignup}
              loading={isLoading}
              disabled={isLoading}
            >
              Sign Up
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Premium Upgrade Dialog */}
      <Portal>
        <Dialog
          visible={showBackupDialog}
          onDismiss={() => setShowBackupDialog(false)}
        >
          <Dialog.Title>Premium Feature</Dialog.Title>
          <Dialog.Content>
            <Text style={{ marginBottom: 12 }}>
              Cloud backup and restore are premium features. Upgrade to premium
              to enable these features.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowBackupDialog(false)}>Cancel</Button>
            <Button
              onPress={() => {
                setShowBackupDialog(false);
                handleUpgradeToPremium();
              }}
            >
              Upgrade
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
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
