import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Switch, Text, Divider, Card } from 'react-native-paper';
import { useAppTheme } from '../../context/ThemeContext';
import FormField from '../common/FormField';
import UnitSelector from '../common/UnitSelector';
import LocationSelector from '../common/LocationSelector';

/**
 * Form for creating or editing a nutrition entry
 * @param {Object} props - Component props
 * @param {Object} props.entry - Existing entry data (for editing)
 * @param {function} props.onSave - Function called when entry is saved
 * @param {function} props.onCancel - Function called when form is cancelled
 */
const NutritionEntryForm = ({ entry = null, onSave, onCancel }) => {
  const { theme, isDarkMode } = useAppTheme();
  const [formData, setFormData] = useState({
    foodType: '',
    calories: '',
    carbs: '',
    protein: '',
    fat: '',
    timing: '',
    frequency: '',
    quantity: '1',
    quantityUnit: 'pcs',
    sodium: '',
    potassium: '',
    magnesium: '',
    isEssential: false,
    sourceLocation: 'carried',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  
  // Initialize form with existing entry data if provided
  useEffect(() => {
    if (entry) {
      setFormData({
        foodType: entry.foodType || '',
        calories: entry.calories ? entry.calories.toString() : '',
        carbs: entry.carbs ? entry.carbs.toString() : '',
        protein: entry.protein ? entry.protein.toString() : '',
        fat: entry.fat ? entry.fat.toString() : '',
        timing: entry.timing || '',
        frequency: entry.frequency || '',
        quantity: entry.quantity ? entry.quantity.toString() : '1',
        quantityUnit: entry.quantityUnit || 'pcs',
        sodium: entry.sodium ? entry.sodium.toString() : '',
        potassium: entry.potassium ? entry.potassium.toString() : '',
        magnesium: entry.magnesium ? entry.magnesium.toString() : '',
        isEssential: entry.isEssential || false,
        sourceLocation: entry.sourceLocation || 'carried',
        notes: entry.notes || ''
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
  
  // Handle quantity and unit change
  const handleQuantityChange = (value, unit) => {
    updateFormData('quantity', value.toString());
    updateFormData('quantityUnit', unit);
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    // Required fields
    if (!formData.foodType.trim()) {
      newErrors.foodType = 'Food type is required';
    }
    
    // Numeric fields
    if (formData.calories && isNaN(Number(formData.calories))) {
      newErrors.calories = 'Must be a number';
    }
    
    if (formData.carbs && isNaN(Number(formData.carbs))) {
      newErrors.carbs = 'Must be a number';
    }
    
    if (formData.protein && isNaN(Number(formData.protein))) {
      newErrors.protein = 'Must be a number';
    }
    
    if (formData.fat && isNaN(Number(formData.fat))) {
      newErrors.fat = 'Must be a number';
    }
    
    if (formData.sodium && isNaN(Number(formData.sodium))) {
      newErrors.sodium = 'Must be a number';
    }
    
    if (formData.potassium && isNaN(Number(formData.potassium))) {
      newErrors.potassium = 'Must be a number';
    }
    
    if (formData.magnesium && isNaN(Number(formData.magnesium))) {
      newErrors.magnesium = 'Must be a number';
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
        calories: formData.calories ? parseInt(formData.calories, 10) : 0,
        carbs: formData.carbs ? parseInt(formData.carbs, 10) : 0,
        protein: formData.protein ? parseInt(formData.protein, 10) : 0,
        fat: formData.fat ? parseInt(formData.fat, 10) : 0,
        quantity: formData.quantity ? parseInt(formData.quantity, 10) : 1,
        sodium: formData.sodium ? parseInt(formData.sodium, 10) : 0,
        potassium: formData.potassium ? parseInt(formData.potassium, 10) : 0,
        magnesium: formData.magnesium ? parseInt(formData.magnesium, 10) : 0,
      };
      
      onSave(processedData);
    }
  };
  
  return (
    <Card style={styles.card}>
      <Card.Title title={entry ? 'Edit Nutrition Entry' : 'Add Nutrition Entry'} />
      <Card.Content>
        <ScrollView style={styles.scrollView}>
          <FormField
            label="Food Type"
            value={formData.foodType}
            onChangeText={(value) => updateFormData('foodType', value)}
            placeholder="e.g., Energy Gel, Banana, etc."
            required
            error={errors.foodType}
          />
          
          <UnitSelector
            label="Quantity"
            value={parseInt(formData.quantity, 10) || 1}
            unit={formData.quantityUnit}
            onChange={handleQuantityChange}
            units={[
              { value: 'pcs', label: 'pcs' },
              { value: 'g', label: 'g' },
              { value: 'oz', label: 'oz' },
              { value: 'ml', label: 'ml' }
            ]}
          />
          
          <FormField
            label="Calories"
            value={formData.calories}
            onChangeText={(value) => updateFormData('calories', value)}
            placeholder="e.g., 100"
            keyboardType="numeric"
            error={errors.calories}
          />
          
          <View style={styles.macroRow}>
            <FormField
              label="Carbs (g)"
              value={formData.carbs}
              onChangeText={(value) => updateFormData('carbs', value)}
              placeholder="e.g., 25"
              keyboardType="numeric"
              error={errors.carbs}
              style={styles.macroField}
            />
            
            <FormField
              label="Protein (g)"
              value={formData.protein}
              onChangeText={(value) => updateFormData('protein', value)}
              placeholder="e.g., 5"
              keyboardType="numeric"
              error={errors.protein}
              style={styles.macroField}
            />
            
            <FormField
              label="Fat (g)"
              value={formData.fat}
              onChangeText={(value) => updateFormData('fat', value)}
              placeholder="e.g., 2"
              keyboardType="numeric"
              error={errors.fat}
              style={styles.macroField}
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
          
          <Divider style={styles.divider} />
          
          <View style={styles.macroRow}>
            <FormField
              label="Sodium (mg)"
              value={formData.sodium}
              onChangeText={(value) => updateFormData('sodium', value)}
              placeholder="e.g., 100"
              keyboardType="numeric"
              error={errors.sodium}
              style={styles.macroField}
            />
            
            <FormField
              label="Potassium (mg)"
              value={formData.potassium}
              onChangeText={(value) => updateFormData('potassium', value)}
              placeholder="e.g., 50"
              keyboardType="numeric"
              error={errors.potassium}
              style={styles.macroField}
            />
            
            <FormField
              label="Magnesium (mg)"
              value={formData.magnesium}
              onChangeText={(value) => updateFormData('magnesium', value)}
              placeholder="e.g., 10"
              keyboardType="numeric"
              error={errors.magnesium}
              style={styles.macroField}
            />
          </View>
          
          <LocationSelector
            label="Source Location"
            value={formData.sourceLocation}
            onChange={(value) => updateFormData('sourceLocation', value)}
          />
          
          <View style={styles.switchContainer}>
            <Text style={{ color: isDarkMode ? theme.colors.onSurface : theme.colors.onBackground }}>
              Essential Item
            </Text>
            <Switch
              value={formData.isEssential}
              onValueChange={(value) => updateFormData('isEssential', value)}
              color={theme.colors.primary}
            />
          </View>
          
          <FormField
            label="Notes"
            value={formData.notes}
            onChangeText={(value) => updateFormData('notes', value)}
            placeholder="Additional notes about this item..."
            multiline
            numberOfLines={3}
          />
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
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroField: {
    flex: 1,
    marginHorizontal: 4,
  },
  divider: {
    marginVertical: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  actions: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});

export default NutritionEntryForm;