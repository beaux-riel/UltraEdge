import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Text, TextInput, Button, Avatar, Divider, useTheme as usePaperTheme, Switch, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useSupabase } from '../context/SupabaseContext';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

// This function is no longer needed as we're using the UserContext

const EditProfileScreen = ({ route, navigation }) => {
  const paperTheme = usePaperTheme();
  const { isDarkMode, theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { userData: contextUserData, updateUserData } = useUser();
  const { user, isPremium } = useSupabase();
  
  // Create a local copy of the user data for editing
  const [localUserData, setLocalUserData] = useState({
    name: contextUserData.name || '',
    email: contextUserData.email || '',
    profileImage: contextUserData.profileImage || null,
    location: contextUserData.location || '',
    bio: contextUserData.bio || '',
    preferences: {
      distanceUnit: contextUserData.preferences?.distanceUnit || 'miles',
      elevationUnit: contextUserData.preferences?.elevationUnit || 'ft',
      notifications: contextUserData.preferences?.notifications || true,
    }
  });
  
  const [loading, setLoading] = useState(false);
  
  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      // Handle nested fields like preferences.distanceUnit
      const [parent, child] = field.split('.');
      setLocalUserData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setLocalUserData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };
  
  const handlePickImage = async () => {
    try {
      // Request permission to access the media library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to change your profile picture.');
        return;
      }
      
      // Launch the image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Update the profile image
        setLocalUserData(prev => ({
          ...prev,
          profileImage: result.assets[0].uri
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'There was a problem selecting your image. Please try again.');
    }
  };
  
  const handleSaveProfile = async () => {
    // Validate required fields
    if (!localUserData.name.trim()) {
      Alert.alert('Missing Information', 'Please enter your name.');
      return;
    }
    
    if (!localUserData.email.trim()) {
      Alert.alert('Missing Information', 'Please enter your email address.');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(localUserData.email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    
    setLoading(true);
    
    try {
      // Update user data in the context (this will trigger the automatic backup for premium users)
      updateUserData(localUserData);
      
      // Navigate back to profile screen
      navigation.navigate('Profile');
      
      // Show a success message
      Alert.alert('Success', 'Your profile has been updated successfully.');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Create dynamic styles based on theme
  const dynamicStyles = {
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? theme.colors.background : '#f5f5f5',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 16,
      textAlign: 'center',
      color: isDarkMode ? theme.colors.text : '#000000',
    },
    card: {
      marginBottom: 16,
      borderRadius: 8,
      backgroundColor: isDarkMode ? theme.colors.surface : '#ffffff',
    },
    input: {
      marginBottom: 16,
      backgroundColor: isDarkMode ? theme.colors.surface : '#ffffff',
    },
    sectionLabel: {
      fontSize: 16,
      fontWeight: 'bold',
      marginTop: 16,
      marginBottom: 8,
      color: isDarkMode ? theme.colors.text : '#000000',
    },
    divider: {
      marginVertical: 16,
      backgroundColor: isDarkMode ? theme.colors.border : '#e0e0e0',
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    switchLabel: {
      fontSize: 16,
      color: isDarkMode ? theme.colors.text : '#000000',
    },
    profileImageContainer: {
      alignItems: 'center',
      marginBottom: 24,
    },
    profileImage: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: isDarkMode ? '#333333' : '#e0e0e0',
    },
    changePhotoButton: {
      marginTop: 8,
    },
    changePhotoText: {
      color: theme.colors.primary,
      fontSize: 16,
    },
    cameraIconContainer: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: theme.colors.primary,
      borderRadius: 20,
      padding: 8,
    },
  };

  return (
    <ScrollView 
      style={dynamicStyles.container}
      contentContainerStyle={{
        padding: 16,
        paddingTop: insets.top > 0 ? insets.top : 16,
        paddingBottom: insets.bottom + 16
      }}
    >
      <Text style={dynamicStyles.title}>Edit Profile</Text>
      
      {/* Profile Image */}
      <View style={dynamicStyles.profileImageContainer}>
        <TouchableOpacity onPress={handlePickImage}>
          {localUserData.profileImage ? (
            <Image 
              source={{ uri: localUserData.profileImage }} 
              style={dynamicStyles.profileImage}
            />
          ) : (
            <Avatar.Image
              size={120}
              source={require('../../assets/default-profile.png')}
              style={dynamicStyles.profileImage}
            />
          )}
          <View style={dynamicStyles.cameraIconContainer}>
            <Ionicons name="camera" size={20} color="#ffffff" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={dynamicStyles.changePhotoButton}
          onPress={handlePickImage}
        >
          <Text style={dynamicStyles.changePhotoText}>Change Photo</Text>
        </TouchableOpacity>
      </View>
      
      {/* Basic Information */}
      <Text style={dynamicStyles.sectionLabel}>Basic Information</Text>
      <TextInput
        label="Full Name"
        value={localUserData.name}
        onChangeText={(text) => handleInputChange('name', text)}
        style={dynamicStyles.input}
        mode="outlined"
        theme={paperTheme}
      />
      
      <TextInput
        label="Email"
        value={localUserData.email}
        onChangeText={(text) => handleInputChange('email', text)}
        style={dynamicStyles.input}
        mode="outlined"
        keyboardType="email-address"
        theme={paperTheme}
      />
      
      <TextInput
        label="Location"
        value={localUserData.location}
        onChangeText={(text) => handleInputChange('location', text)}
        style={dynamicStyles.input}
        mode="outlined"
        theme={paperTheme}
      />
      
      <TextInput
        label="Bio"
        value={localUserData.bio}
        onChangeText={(text) => handleInputChange('bio', text)}
        style={[dynamicStyles.input, { height: 120 }]}
        mode="outlined"
        multiline
        numberOfLines={5}
        theme={paperTheme}
      />
      
      <Divider style={dynamicStyles.divider} />
      
      {/* Preferences */}
      <Text style={dynamicStyles.sectionLabel}>Preferences</Text>
      
      <View style={dynamicStyles.switchRow}>
        <Text style={dynamicStyles.switchLabel}>Distance Unit</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[dynamicStyles.switchLabel, { marginRight: 8, opacity: localUserData.preferences.distanceUnit === 'miles' ? 1 : 0.5 }]}>
            Miles
          </Text>
          <Switch
            value={localUserData.preferences.distanceUnit === 'km'}
            onValueChange={(value) => handleInputChange('preferences.distanceUnit', value ? 'km' : 'miles')}
            color={theme.colors.primary}
          />
          <Text style={[dynamicStyles.switchLabel, { marginLeft: 8, opacity: localUserData.preferences.distanceUnit === 'km' ? 1 : 0.5 }]}>
            Kilometers
          </Text>
        </View>
      </View>
      
      <View style={dynamicStyles.switchRow}>
        <Text style={dynamicStyles.switchLabel}>Elevation Unit</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[dynamicStyles.switchLabel, { marginRight: 8, opacity: localUserData.preferences.elevationUnit === 'ft' ? 1 : 0.5 }]}>
            Feet
          </Text>
          <Switch
            value={localUserData.preferences.elevationUnit === 'm'}
            onValueChange={(value) => handleInputChange('preferences.elevationUnit', value ? 'm' : 'ft')}
            color={theme.colors.primary}
          />
          <Text style={[dynamicStyles.switchLabel, { marginLeft: 8, opacity: localUserData.preferences.elevationUnit === 'm' ? 1 : 0.5 }]}>
            Meters
          </Text>
        </View>
      </View>
      
      <View style={dynamicStyles.switchRow}>
        <Text style={dynamicStyles.switchLabel}>Notifications</Text>
        <Switch
          value={localUserData.preferences.notifications}
          onValueChange={(value) => handleInputChange('preferences.notifications', value)}
          color={theme.colors.primary}
        />
      </View>
      
      <Divider style={dynamicStyles.divider} />
      
      {/* Save Button */}
      <Button
        mode="contained"
        onPress={handleSaveProfile}
        style={{ marginTop: 16 }}
        loading={loading}
        disabled={loading}
      >
        Save Profile
      </Button>
      
      <Button
        mode="outlined"
        onPress={() => navigation.goBack()}
        style={{ marginTop: 16 }}
        disabled={loading}
      >
        Cancel
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // Base styles are defined in dynamicStyles
});

export default EditProfileScreen;