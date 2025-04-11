import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TextInput, SegmentedButtons } from 'react-native-paper';
import { useAppTheme } from '../../context/ThemeContext';

/**
 * A component for inputting a value with a unit selector
 * @param {Object} props - Component props
 * @param {string} props.label - Label for the input
 * @param {number} props.value - Current value
 * @param {string} props.unit - Current unit
 * @param {function} props.onChange - Function called when value changes: (value, unit) => void
 * @param {Array} props.units - Array of unit objects: [{ value: 'g', label: 'Grams' }, ...]
 * @param {boolean} props.required - Whether the field is required
 * @param {string} props.error - Error message to display
 */
const UnitSelector = ({ 
  label, 
  value, 
  unit, 
  onChange, 
  units = [
    { value: 'g', label: 'g' },
    { value: 'oz', label: 'oz' },
    { value: 'ml', label: 'ml' },
    { value: 'pcs', label: 'pcs' }
  ],
  required = false,
  error = null
}) => {
  const { theme, isDarkMode } = useAppTheme();
  
  // Handle value change
  const handleValueChange = (newValue) => {
    // Convert to number and validate
    const numValue = parseFloat(newValue) || 0;
    onChange(numValue, unit);
  };
  
  // Handle unit change
  const handleUnitChange = (newUnit) => {
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
      
      <View style={styles.inputContainer}>
        <TextInput
          value={value !== undefined && value !== null ? value.toString() : ''}
          onChangeText={handleValueChange}
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
          error={!!error}
        />
        
        <SegmentedButtons
          value={unit}
          onValueChange={handleUnitChange}
          buttons={units}
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

export default UnitSelector;