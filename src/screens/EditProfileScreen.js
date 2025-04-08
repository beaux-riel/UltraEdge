import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Text, TextInput, Button, Avatar, Divider, useTheme as usePaperTheme, Switch, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

// In a real app, we would have a user context to manage user data
// For now, we'll simulate this with a mock function
const saveUserData = async (userData) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return true;
};

const EditProfileScreen = ({ route, navigation }) => {
  const { userData: initialUserData } = route.params;
  const paperTheme = usePaperTheme();
  const { isDarkMode, theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  
  const [userData, setUserData] = useState({
    name: initialUserData.name || '',
    email: initialUserData.email || '',
    profileImage: initialUserData.profileImage || null,
    location: initialUserData.location || '',
    bio: initialUserData.bio || '',
    preferences: {
      distanceUnit: initialUserData.preferences?.distanceUnit || 'miles',
      elevationUnit: initialUserData.preferences?.elevationUnit || 'ft',
      notifications: initialUserData.preferences?.notifications || true,
    }
  });
  
  const [loading, setLoading] = useState(false);
  
  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      // Handle nested fields like preferences.distanceUnit
      const [parent, child] = field.split('.');
      setUserData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setUserData(prev => ({
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
        setUserData(prev => ({
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
    if (!userData.name.trim()) {
      Alert.alert('Missing Information', 'Please enter your name.');
      return;
    }
    
    if (!userData.email.trim()) {
      Alert.alert('Missing Information', 'Please enter your email address.');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    
    setLoading(true);
    
    try {
      // In a real app, this would save to a backend or local storage
      const success = await saveUserData(userData);
      
      if (success) {
        // Navigate back to profile screen with updated data
        navigation.navigate('Profile', { updatedUserData: userData });
      } else {
        Alert.alert('Error', 'Failed to save profile. Please try again.');
      }
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
          {userData.profileImage ? (
            <Image 
              source={{ uri: userData.profileImage }} 
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
        value={userData.name}
        onChangeText={(text) => handleInputChange('name', text)}
        style={dynamicStyles.input}
        mode="outlined"
        theme={paperTheme}
      />
      
      <TextInput
        label="Email"
        value={userData.email}
        onChangeText={(text) => handleInputChange('email', text)}
        style={dynamicStyles.input}
        mode="outlined"
        keyboardType="email-address"
        theme={paperTheme}
      />
      
      <TextInput
        label="Location"
        value={userData.location}
        onChangeText={(text) => handleInputChange('location', text)}
        style={dynamicStyles.input}
        mode="outlined"
        theme={paperTheme}
      />
      
      <TextInput
        label="Bio"
        value={userData.bio}
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
          <Text style={[dynamicStyles.switchLabel, { marginRight: 8, opacity: userData.preferences.distanceUnit === 'miles' ? 1 : 0.5 }]}>
            Miles
          </Text>
          <Switch
            value={userData.preferences.distanceUnit === 'km'}
            onValueChange={(value) => handleInputChange('preferences.distanceUnit', value ? 'km' : 'miles')}
            color={theme.colors.primary}
          />
          <Text style={[dynamicStyles.switchLabel, { marginLeft: 8, opacity: userData.preferences.distanceUnit === 'km' ? 1 : 0.5 }]}>
            Kilometers
          </Text>
        </View>
      </View>
      
      <View style={dynamicStyles.switchRow}>
        <Text style={dynamicStyles.switchLabel}>Elevation Unit</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[dynamicStyles.switchLabel, { marginRight: 8, opacity: userData.preferences.elevationUnit === 'ft' ? 1 : 0.5 }]}>
            Feet
          </Text>
          <Switch
            value={userData.preferences.elevationUnit === 'm'}
            onValueChange={(value) => handleInputChange('preferences.elevationUnit', value ? 'm' : 'ft')}
            color={theme.colors.primary}
          />
          <Text style={[dynamicStyles.switchLabel, { marginLeft: 8, opacity: userData.preferences.elevationUnit === 'm' ? 1 : 0.5 }]}>
            Meters
          </Text>
        </View>
      </View>
      
      <View style={dynamicStyles.switchRow}>
        <Text style={dynamicStyles.switchLabel}>Notifications</Text>
        <Switch
          value={userData.preferences.notifications}
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