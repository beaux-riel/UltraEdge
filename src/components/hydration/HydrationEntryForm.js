import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Text, Divider, Card, SegmentedButtons } from 'react-native-paper';
import { useAppTheme } from '../../context/ThemeContext';
import FormField from '../common/FormField';
import UnitSelector from '../common/UnitSelector';
import LocationSelector from '../common/LocationSelector';

/**
 * Form for creating or editing a hydration entry
 * @param {Object} props - Component props
 * @param {Object} props.entry - Existing entry data (for editing)
 * @param {function} props.onSave - Function called when entry is saved
 * @param {function} props.onCancel - Function called when form is cancelled
 */
const HydrationEntryForm = ({ entry = null, onSave, onCancel }) => {
  const { theme, isDarkMode } = useAppTheme();
  const [formData, setFormData] = useState({
    liquidType: '',
    volume: '250',
    volumeUnit: 'ml',
    electrolytes: {
      sodium: '',
      potassium: '',
      magnesium: ''
    },
    timing: '',
    frequency: '',
    consumptionRate: '',
    temperature: 'cold',
    sourceLocation: 'carried',
    containerType: 'soft_flask'
  });
  const [errors, setErrors] = useState({});
  
  // Initialize form with existing entry data if provided
  useEffect(() => {
    if (entry) {
      setFormData({
        liquidType: entry.liquidType || '',
        volume: entry.volume ? entry.volume.toString() : '250',
        volumeUnit: entry.volumeUnit || 'ml',
        electrolytes: entry.electrolytes || {
          sodium: '',
          potassium: '',
          magnesium: ''
        },
        timing: entry.timing || '',
        frequency: entry.frequency || '',
        consumptionRate: entry.consumptionRate ? entry.consumptionRate.toString() : '',
        temperature: entry.temperature || 'cold',
        sourceLocation: entry.sourceLocation || 'carried',
        containerType: entry.containerType || 'soft_flask'
      });
    }
  }, [entry]);
  
  // Update form data
  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };
  
  // Update electrolytes data
  const updateElectrolytes = (field, value) => {
    setFormData(prev => ({
      ...prev,
      electrolytes: {
        ...prev.electrolytes,
        [field]: value
      }
    }));
    // Clear error for this field
    if (errors[`electrolytes.${field}`]) {
      setErrors(prev => ({ ...prev, [`electrolytes.${field}`]: null }));
    }
  };
  
  // Handle volume and unit change
  const handleVolumeChange = (value, unit) => {
    updateFormData('volume', value.toString());
    updateFormData('volumeUnit', unit);
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    // Required fields
    if (!formData.liquidType.trim()) {
      newErrors.liquidType = 'Liquid type is required';
    }
    
    // Numeric fields
    if (formData.volume && isNaN(Number(formData.volume))) {
      newErrors.volume = 'Must be a number';
    }
    
    if (formData.consumptionRate && isNaN(Number(formData.consumptionRate))) {
      newErrors.consumptionRate = 'Must be a number';
    }
    
    if (formData.electrolytes.sodium && isNaN(Number(formData.electrolytes.sodium))) {
      newErrors['electrolytes.sodium'] = 'Must be a number';
    }
    
    if (formData.electrolytes.potassium && isNaN(Number(formData.electrolytes.potassium))) {
      newErrors['electrolytes.potassium'] = 'Must be a number';
    }
    
    if (formData.electrolytes.magnesium && isNaN(Number(formData.electrolytes.magnesium))) {
      newErrors['electrolytes.magnesium'] = 'Must be a number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle save
  const handleSave = () => {
    if (validateForm()) {
      // Convert numeric strings to numbers
      const processedData = {
        ...formData,
        volume: formData.volume ? parseInt(formData.volume, 10) : 0,
        consumptionRate: formData.consumptionRate ? parseInt(formData.consumptionRate, 10) : 0,
        electrolytes: {
          sodium: formData.electrolytes.sodium ? parseInt(formData.electrolytes.sodium, 10) : 0,
          potassium: formData.electrolytes.potassium ? parseInt(formData.electrolytes.potassium, 10) : 0,
          magnesium: formData.electrolytes.magnesium ? parseInt(formData.electrolytes.magnesium, 10) : 0
        }
      };
      
      onSave(processedData);
    }
  };
  
  return (
    <Card style={styles.card}>
      <Card.Title title={entry ? 'Edit Hydration Entry' : 'Add Hydration Entry'} />
      <Card.Content>
        <ScrollView style={styles.scrollView}>
          <FormField
            label="Liquid Type"
            value={formData.liquidType}
            onChangeText={(value) => updateFormData('liquidType', value)}
            placeholder="e.g., Water, Sports Drink, etc."
            required
            error={errors.liquidType}
          />
          
          <UnitSelector
            label="Volume"
            value={parseInt(formData.volume, 10) || 0}
            unit={formData.volumeUnit}
            onChange={handleVolumeChange}
            units={[
              { value: 'ml', label: 'ml' },
              { value: 'oz', label: 'oz' },
              { value: 'L', label: 'L' }
            ]}
            error={errors.volume}
          />
          
          <Divider style={styles.divider} />
          
          <Text style={[
            styles.sectionTitle, 
            { color: isDarkMode ? theme.colors.onSurface : theme.colors.onBackground }
          ]}>
            Electrolytes
          </Text>
          
          <View style={styles.electrolytesRow}>
            <FormField
              label="Sodium (mg)"
              value={formData.electrolytes.sodium}
              onChangeText={(value) => updateElectrolytes('sodium', value)}
              placeholder="e.g., 100"
              keyboardType="numeric"
              error={errors['electrolytes.sodium']}
              style={styles.electrolytesField}
            />
            
            <FormField
              label="Potassium (mg)"
              value={formData.electrolytes.potassium}
              onChangeText={(value) => updateElectrolytes('potassium', value)}
              placeholder="e.g., 50"
              keyboardType="numeric"
              error={errors['electrolytes.potassium']}
              style={styles.electrolytesField}
            />
            
            <FormField
              label="Magnesium (mg)"
              value={formData.electrolytes.magnesium}
              onChangeText={(value) => updateElectrolytes('magnesium', value)}
              placeholder="e.g., 10"
              keyboardType="numeric"
              error={errors['electrolytes.magnesium']}
              style={styles.electrolytesField}
            />
          </View>
          
          <Divider style={styles.divider} />
          
          <FormField
            label="Timing"
            value={formData.timing}
            onChangeText={(value) => updateFormData('timing', value)}
            placeholder="e.g., Every 30 minutes, At aid stations, etc."
          />
          
          <FormField
            label="Frequency"
            value={formData.frequency}
            onChangeText={(value) => updateFormData('frequency', value)}
            placeholder="e.g., Hourly, Every 2 hours, etc."
          />
          
          <FormField
            label="Consumption Rate (ml/hour)"
            value={formData.consumptionRate}
            onChangeText={(value) => updateFormData('consumptionRate', value)}
            placeholder="e.g., 500"
            keyboardType="numeric"
            error={errors.consumptionRate}
          />
          
          <View style={styles.temperatureContainer}>
            <Text style={[
              styles.label, 
              { color: isDarkMode ? theme.colors.onSurface : theme.colors.onBackground }
            ]}>
              Temperature
            </Text>
            
            <SegmentedButtons
              value={formData.temperature}
              onValueChange={(value) => updateFormData('temperature', value)}
              buttons={[
                { value: 'cold', label: 'Cold' },
                { value: 'cool', label: 'Cool' },
                { value: 'room', label: 'Room Temp' },
                { value: 'warm', label: 'Warm' }
              ]}
            />
          </View>
          
          <LocationSelector
            label="Source Location"
            value={formData.sourceLocation}
            onChange={(value) => updateFormData('sourceLocation', value)}
          />
          
          <View style={styles.containerTypeContainer}>
            <Text style={[
              styles.label, 
              { color: isDarkMode ? theme.colors.onSurface : theme.colors.onBackground }
            ]}>
              Container Type
            </Text>
            
            <SegmentedButtons
              value={formData.containerType}
              onValueChange={(value) => updateFormData('containerType', value)}
              buttons={[
                { value: 'soft_flask', label: 'Soft Flask' },
                { value: 'bottle', label: 'Bottle' },
                { value: 'hydration_pack', label: 'Hydration Pack' },
                { value: 'cup', label: 'Cup' }
              ]}
            />
          </View>
        </ScrollView>
      </Card.Content>
      
      <Card.Actions style={styles.actions}>
        <Button onPress={onCancel} mode="outlined">Cancel</Button>
        <Button onPress={handleSave} mode="contained">Save</Button>
      </Card.Actions>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
  scrollView: {
    maxHeight: 500,
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  electrolytesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  electrolytesField: {
    flex: 1,
    marginHorizontal: 4,
  },
  temperatureContainer: {
    marginVertical: 8,
  },
  containerTypeContainer: {
    marginVertical: 8,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  actions: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});

export default HydrationEntryForm;