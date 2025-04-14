import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Chip, TextInput, useTheme as usePaperTheme } from 'react-native-paper';
import { useAppTheme } from '../context/ThemeContext';

const commonRoles = [
  'Crew Manager',
  'Pacer',
  'Driver',
  'Nutrition Support',
  'Medical Support',
  'Gear Manager',
  'Photographer',
  'Emotional Support'
];

const commonResponsibilities = [
  'Medical Supplies',
  'Nutrition',
  'Hydration',
  'Gear Management',
  'Transportation',
  'Accommodation',
  'Navigation',
  'Pacing',
  'Photography',
  'Social Media',
  'Emergency Contact'
];

const CrewRoleSelector = ({ 
  selectedRole, 
  onRoleChange, 
  selectedResponsibilities, 
  onResponsibilitiesChange,
  customRole,
  onCustomRoleChange
}) => {
  const paperTheme = usePaperTheme();
  const { isDarkMode, theme } = useAppTheme();
  const [customResponsibility, setCustomResponsibility] = useState('');

  const handleRoleSelect = (role) => {
    if (role === selectedRole) {
      // Deselect if already selected
      onRoleChange('');
      onCustomRoleChange('');
    } else {
      onRoleChange(role);
      onCustomRoleChange('');
    }
  };

  const handleResponsibilitySelect = (responsibility) => {
    const updatedResponsibilities = [...selectedResponsibilities];
    const index = updatedResponsibilities.indexOf(responsibility);
    
    if (index === -1) {
      // Add responsibility
      updatedResponsibilities.push(responsibility);
    } else {
      // Remove responsibility
      updatedResponsibilities.splice(index, 1);
    }
    
    onResponsibilitiesChange(updatedResponsibilities);
  };

  const handleAddCustomResponsibility = () => {
    if (customResponsibility.trim() === '') return;
    
    if (!selectedResponsibilities.includes(customResponsibility)) {
      const updatedResponsibilities = [...selectedResponsibilities, customResponsibility];
      onResponsibilitiesChange(updatedResponsibilities);
      setCustomResponsibility('');
    }
  };

  // Create dynamic styles based on theme
  const dynamicStyles = {
    sectionLabel: {
      fontSize: 16,
      fontWeight: 'bold',
      marginTop: 16,
      marginBottom: 8,
      color: isDarkMode ? theme.colors.text : '#000000',
    },
    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 8,
    },
    chip: {
      margin: 4,
    },
    input: {
      marginBottom: 12,
      backgroundColor: isDarkMode ? theme.colors.surface : '#ffffff',
    },
  };

  return (
    <View>
      <Text style={dynamicStyles.sectionLabel}>Role</Text>
        <View style={dynamicStyles.chipContainer}>
          {commonRoles.map((role) => (
            <Chip
              key={role}
              selected={selectedRole === role}
              onPress={() => handleRoleSelect(role)}
              style={dynamicStyles.chip}
              selectedColor={theme.colors.primary}
              mode={selectedRole === role ? 'flat' : 'outlined'}
            >
              {role}
            </Chip>
          ))}
        </View>
      
      <TextInput
        label="Custom Role"
        value={customRole}
        onChangeText={onCustomRoleChange}
        style={dynamicStyles.input}
        mode="outlined"
        theme={paperTheme}
        placeholder="Enter a custom role if not listed above"
        onSubmitEditing={() => {
          if (customRole.trim() !== '') {
            onRoleChange('');
          }
        }}
      />
      
      <Text style={dynamicStyles.sectionLabel}>Responsibilities</Text>
      <View style={dynamicStyles.chipContainer}>
        {commonResponsibilities.map((responsibility) => (
          <Chip
            key={responsibility}
            selected={selectedResponsibilities.includes(responsibility)}
            onPress={() => handleResponsibilitySelect(responsibility)}
            style={dynamicStyles.chip}
            selectedColor={theme.colors.primary}
            mode={selectedResponsibilities.includes(responsibility) ? 'flat' : 'outlined'}
          >
            {responsibility}
          </Chip>
        ))}
      </View>
      
      <TextInput
        label="Add Custom Responsibility"
        value={customResponsibility}
        onChangeText={setCustomResponsibility}
        style={dynamicStyles.input}
        mode="outlined"
        theme={paperTheme}
        placeholder="Enter a custom responsibility"
        onSubmitEditing={handleAddCustomResponsibility}
        right={
          <TextInput.Icon
            icon="plus"
            onPress={handleAddCustomResponsibility}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({});

export default CrewRoleSelector;