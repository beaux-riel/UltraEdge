import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, useTheme as usePaperTheme } from 'react-native-paper';
import { useAppTheme } from '../context/ThemeContext';

const CrewNotes = ({ notes, onNotesChange }) => {
  const paperTheme = usePaperTheme();
  const { isDarkMode, theme } = useAppTheme();

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
    input: {
      marginBottom: 12,
      backgroundColor: isDarkMode ? theme.colors.surface : '#ffffff',
      minHeight: 120,
    },
  };

  return (
    <View style={dynamicStyles.container}>
      <Text style={dynamicStyles.sectionLabel}>Crew Member Notes</Text>
      <TextInput
        label="Notes"
        value={notes}
        onChangeText={onNotesChange}
        style={dynamicStyles.input}
        mode="outlined"
        theme={paperTheme}
        multiline
        numberOfLines={5}
        placeholder="Add specific notes for this crew member (e.g., dietary restrictions, special skills, availability)"
      />
    </View>
  );
};

const styles = StyleSheet.create({});

export default CrewNotes;