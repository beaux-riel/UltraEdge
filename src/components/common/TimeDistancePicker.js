import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TextInput, SegmentedButtons } from 'react-native-paper';
import { useAppTheme } from '../../context/ThemeContext';

/**
 * A component for selecting time or distance intervals
 * @param {Object} props - Component props
 * @param {string} props.label - Label for the picker
 * @param {number} props.value - Current value
 * @param {string} props.unit - Current unit (minutes, hours, km, miles)
 * @param {function} props.onChange - Function called when value changes: (value, unit) => void
 * @param {string} props.mode - 'time' or 'distance' or 'both'
 * @param {boolean} props.required - Whether the field is required
 * @param {string} props.error - Error message to display
 */
const TimeDistancePicker = ({ 
  label, 
  value, 
  unit, 
  onChange, 
  mode = 'both',
  required = false,
  error = null
}) => {
  const { theme, isDarkMode } = useAppTheme();
  const [pickerMode, setPickerMode] = useState(mode === 'both' ? 'time' : mode);
  
  // Define available units based on mode
  const timeUnits = [
    { value: 'minutes', label: 'Minutes' },
    { value: 'hours', label: 'Hours' }
  ];
  
  const distanceUnits = [
    { value: 'km', label: 'Kilometers' },
    { value: 'miles', label: 'Miles' }
  ];
  
  // Set initial unit if not provided
  const initialUnit = unit || (pickerMode === 'time' ? 'minutes' : 'km');
  const [selectedUnit, setSelectedUnit] = useState(initialUnit);
  
  // Handle value change
  const handleValueChange = (newValue) => {
    // Convert to number and validate
    const numValue = parseFloat(newValue) || 0;
    onChange(numValue, selectedUnit);
  };
  
  // Handle unit change
  const handleUnitChange = (newUnit) => {
    setSelectedUnit(newUnit);
    onChange(value, newUnit);
  };
  
  // Handle mode change
  const handleModeChange = (newMode) => {
    setPickerMode(newMode);
    // Update unit based on new mode
    const newUnit = newMode === 'time' ? 'minutes' : 'km';
    setSelectedUnit(newUnit);
    onChange(value, newUnit);
  };
  
  return (
    <View style={styles.container}>
      <Text style={[
        styles.label, 
        { color: isDarkMode ? theme.colors.onSurface : theme.colors.onBackground }
      ]}>
        {label} {required && <Text style={{ color: theme.colors.error }}>*</Text>}
      </Text>
      
      {mode === 'both' && (
        <SegmentedButtons
          value={pickerMode}
          onValueChange={handleModeChange}
          buttons={[
            { value: 'time', label: 'Time' },
            { value: 'distance', label: 'Distance' }
          ]}
          style={styles.segmentedButtons}
        />
      )}
      
      <View style={styles.inputContainer}>
        <TextInput
          value={value ? value.toString() : ''}
          onChangeText={handleValueChange}
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
          error={!!error}
        />
        
        <SegmentedButtons
          value={selectedUnit}
          onValueChange={handleUnitChange}
          buttons={pickerMode === 'time' ? timeUnits : distanceUnits}
          style={styles.unitButtons}
        />
      </View>
      
      {error && (
        <Text style={{ color: theme.colors.error, marginTop: 4 }}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    marginRight: 8,
  },
  unitButtons: {
    flex: 2,
  },
});

export default TimeDistancePicker;