import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TextInput } from 'react-native-paper';
import { useAppTheme } from '../../context/ThemeContext';

/**
 * A standard form field component with label and validation
 * @param {Object} props - Component props
 * @param {string} props.label - Label for the field
 * @param {string} props.value - Current value
 * @param {function} props.onChangeText - Function called when text changes
 * @param {boolean} props.required - Whether the field is required
 * @param {string} props.error - Error message to display
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.keyboardType - Keyboard type (default, numeric, email-address, etc.)
 * @param {boolean} props.multiline - Whether the input is multiline
 * @param {number} props.numberOfLines - Number of lines for multiline input
 * @param {Object} props.style - Additional style for the container
 * @param {Object} props.inputProps - Additional props for the TextInput component
 */
const FormField = ({ 
  label, 
  value, 
  onChangeText, 
  required = false,
  error = null,
  placeholder = '',
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  style = {},
  inputProps = {}
}) => {
  const { theme, isDarkMode } = useAppTheme();
  
  return (
    <View style={[styles.container, style]}>
      <Text style={[
        styles.label, 
        { color: isDarkMode ? theme.colors.onSurface : theme.colors.onBackground }
      ]}>
        {label} {required && <Text style={{ color: theme.colors.error }}>*</Text>}
      </Text>
      
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        mode="outlined"
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : 1}
        error={!!error}
        style={[
          styles.input,
          multiline && { height: 24 * numberOfLines + 24 }
        ]}
        {...inputProps}
      />
      
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
  input: {
    backgroundColor: 'transparent',
  },
});

export default FormField;