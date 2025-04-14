import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * A component for selecting a source location with icons
 * @param {Object} props - Component props
 * @param {string} props.label - Label for the selector
 * @param {string} props.value - Current selected location
 * @param {function} props.onChange - Function called when location changes
 * @param {Array} props.locations - Array of location objects: [{ value: 'aid_station', label: 'Aid Station', icon: 'tent' }, ...]
 * @param {boolean} props.required - Whether the field is required
 * @param {string} props.error - Error message to display
 */
const LocationSelector = ({ 
  label, 
  value, 
  onChange, 
  locations = [
    { value: 'aid_station', label: 'Aid Station', icon: 'tent' },
    { value: 'drop_bag', label: 'Drop Bag', icon: 'bag-personal' },
    { value: 'carried', label: 'Carried', icon: 'bag-carry-on' },
    { value: 'crew', label: 'Crew', icon: 'account-group' }
  ],
  required = false,
  error = null
}) => {
  const { theme, isDarkMode } = useAppTheme();
  
  return (
    <View style={styles.container}>
      <Text style={[
        styles.label, 
        { color: isDarkMode ? theme.colors.onSurface : theme.colors.onBackground }
      ]}>
        {label} {required && <Text style={{ color: theme.colors.error }}>*</Text>}
      </Text>
      
      <View style={styles.locationsContainer}>
        {locations.map((location) => (
          <TouchableOpacity
            key={location.value}
            style={[
              styles.locationButton,
              value === location.value && { 
                backgroundColor: theme.colors.primaryContainer,
                borderColor: theme.colors.primary
              }
            ]}
            onPress={() => onChange(location.value)}
          >
            <MaterialCommunityIcons
              name={location.icon}
              size={24}
              color={value === location.value ? theme.colors.primary : theme.colors.onSurfaceVariant}
            />
            <Text
              style={[
                styles.locationLabel,
                { color: value === location.value ? theme.colors.primary : theme.colors.onSurfaceVariant }
              ]}
            >
              {location.label}
            </Text>
          </TouchableOpacity>
        ))}
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
  locationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  locationButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    margin: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: 80,
    height: 80,
  },
  locationLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default LocationSelector;