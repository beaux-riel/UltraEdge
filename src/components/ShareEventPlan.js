import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button, Checkbox, Divider, useTheme as usePaperTheme } from 'react-native-paper';
import { useAppTheme } from '../context/ThemeContext';

const ShareEventPlan = ({ crewMember, onShare }) => {
  const paperTheme = usePaperTheme();
  const { isDarkMode, theme } = useAppTheme();
  const [shareOptions, setShareOptions] = useState({
    raceDetails: true,
    aidStations: true,
    crewInstructions: true,
    nutrition: false,
    gear: false,
    dropBags: false
  });

  const handleOptionToggle = (option) => {
    setShareOptions({
      ...shareOptions,
      [option]: !shareOptions[option]
    });
  };

  const handleShare = () => {
    // Check if at least one option is selected
    const hasSelection = Object.values(shareOptions).some(value => value === true);
    
    if (!hasSelection) {
      Alert.alert('Share Error', 'Please select at least one item to share.');
      return;
    }
    
    // Check if crew member has email
    if (!crewMember.email) {
      Alert.alert('Share Error', 'This crew member does not have an email address. Please add an email address to share the plan.');
      return;
    }
    
    // Call the onShare callback with the selected options
    onShare(crewMember, shareOptions);
  };

  // Create dynamic styles based on theme
  const dynamicStyles = {
    container: {
      marginTop: 16,
    },
    sectionLabel: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 8,
      color: isDarkMode ? theme.colors.text : '#000000',
    },
    optionsContainer: {
      marginVertical: 8,
    },
    divider: {
      marginVertical: 12,
      backgroundColor: isDarkMode ? theme.colors.border : '#e0e0e0',
    },
    buttonContainer: {
      marginTop: 16,
    },
    subtitle: {
      fontSize: 14,
      marginBottom: 16,
      opacity: 0.7,
      color: isDarkMode ? theme.colors.text : '#000000',
    },
  };

  return (
    <View style={dynamicStyles.container}>
      <Text style={dynamicStyles.sectionLabel}>Share Event Plan</Text>
      <Text style={dynamicStyles.subtitle}>
        Select what information to share with {crewMember.name}
      </Text>
      
      <View style={dynamicStyles.optionsContainer}>
        <Checkbox.Item
          label="Race Details"
          status={shareOptions.raceDetails ? 'checked' : 'unchecked'}
          onPress={() => handleOptionToggle('raceDetails')}
        />
        <Checkbox.Item
          label="Aid Stations"
          status={shareOptions.aidStations ? 'checked' : 'unchecked'}
          onPress={() => handleOptionToggle('aidStations')}
        />
        <Checkbox.Item
          label="Crew Instructions"
          status={shareOptions.crewInstructions ? 'checked' : 'unchecked'}
          onPress={() => handleOptionToggle('crewInstructions')}
        />
        <Checkbox.Item
          label="Nutrition Plan"
          status={shareOptions.nutrition ? 'checked' : 'unchecked'}
          onPress={() => handleOptionToggle('nutrition')}
        />
        <Checkbox.Item
          label="Gear List"
          status={shareOptions.gear ? 'checked' : 'unchecked'}
          onPress={() => handleOptionToggle('gear')}
        />
        <Checkbox.Item
          label="Drop Bags"
          status={shareOptions.dropBags ? 'checked' : 'unchecked'}
          onPress={() => handleOptionToggle('dropBags')}
        />
      </View>
      
      <Divider style={dynamicStyles.divider} />
      
      <View style={dynamicStyles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleShare}
          icon="share"
        >
          Share with {crewMember.name}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({});

export default ShareEventPlan;