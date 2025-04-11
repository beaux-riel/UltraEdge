import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Button, Divider, Text, SegmentedButtons } from 'react-native-paper';
import { useAppTheme } from '../../context/ThemeContext';
import { useNutritionHydration } from '../../context/NutritionHydrationContext';
import FormField from '../common/FormField';
import TimeDistancePicker from '../common/TimeDistancePicker';
import NutritionEntryList from './NutritionEntryList';
import NutritionEntryForm from './NutritionEntryForm';

/**
 * Form for creating or editing a nutrition plan
 * @param {Object} props - Component props
 * @param {Object} props.plan - Existing plan data (for editing)
 * @param {function} props.onSave - Function called when plan is saved
 * @param {function} props.onCancel - Function called when form is cancelled
 * @param {boolean} props.isEditing - Whether we're editing an existing plan
 */
const NutritionPlanForm = ({ plan = null, onSave, onCancel, isEditing = false }) => {
  const { theme, isDarkMode } = useAppTheme();
  const { getNutritionPlanTemplates, createPlanFromTemplate } = useNutritionHydration();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    raceType: '',
    raceDuration: 0,
    raceDurationUnit: 'hours',
    terrainType: '',
    weatherCondition: '',
    intensityLevel: 'moderate',
    entries: []
  });
  const [errors, setErrors] = useState({});
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(!isEditing && !plan);
  
  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      const result = await getNutritionPlanTemplates();
      if (result.success) {
        setTemplates(result.templates || []);
      }
    };
    
    if (showTemplates) {
      loadTemplates();
    }
  }, [showTemplates]);
  
  // Initialize form with existing plan data if provided
  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name || '',
        description: plan.description || '',
        raceType: plan.raceType || '',
        raceDuration: plan.raceDuration ? parseFloat(plan.raceDuration) : 0,
        raceDurationUnit: 'hours',
        terrainType: plan.terrainType || '',
        weatherCondition: plan.weatherCondition || '',
        intensityLevel: plan.intensityLevel || 'moderate',
        entries: plan.entries || []
      });
    }
  }, [plan]);
  
  // Update form data
  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };
  
  // Handle race duration change
  const handleRaceDurationChange = (value, unit) => {
    updateFormData('raceDuration', value);
    updateFormData('raceDurationUnit', unit);
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Plan name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle save
  const handleSave = () => {
    if (validateForm()) {
      // Format race duration
      let formattedRaceDuration = null;
      if (formData.raceDuration) {
        formattedRaceDuration = formData.raceDuration;
      }
      
      const processedData = {
        ...formData,
        raceDuration: formattedRaceDuration
      };
      
      onSave(processedData);
    }
  };
  
  // Handle add entry
  const handleAddEntry = () => {
    setEditingEntry(null);
    setShowEntryForm(true);
  };
  
  // Handle edit entry
  const handleEditEntry = (entryId) => {
    const entry = formData.entries.find(e => e.id === entryId);
    if (entry) {
      setEditingEntry(entry);
      setShowEntryForm(true);
    }
  };
  
  // Handle delete entry
  const handleDeleteEntry = (entryId) => {
    const updatedEntries = formData.entries.filter(e => e.id !== entryId);
    updateFormData('entries', updatedEntries);
  };
  
  // Handle save entry
  const handleSaveEntry = (entryData) => {
    if (editingEntry) {
      // Update existing entry
      const updatedEntries = formData.entries.map(e => 
        e.id === editingEntry.id ? { ...entryData, id: editingEntry.id } : e
      );
      updateFormData('entries', updatedEntries);
    } else {
      // Add new entry
      const newEntry = {
        ...entryData,
        id: Math.random().toString(36).substr(2, 9) // Simple ID generation
      };
      updateFormData('entries', [...formData.entries, newEntry]);
    }
    
    setShowEntryForm(false);
    setEditingEntry(null);
  };
  
  // Handle cancel entry form
  const handleCancelEntryForm = () => {
    setShowEntryForm(false);
    setEditingEntry(null);
  };
  
  // Handle template selection
  const handleSelectTemplate = async (templateId) => {
    const result = await createPlanFromTemplate(templateId, 'nutrition');
    if (result.success) {
      // Navigate to the new plan
      setShowTemplates(false);
      onSave(result.plan);
    } else {
      Alert.alert('Error', 'Failed to create plan from template');
    }
  };
  
  // Render template selection
  const renderTemplateSelection = () => (
    <Card style={styles.card}>
      <Card.Title title="Select a Template" />
      <Card.Content>
        <Text style={styles.templateDescription}>
          Choose a template to start with, or create a plan from scratch.
        </Text>
        
        <ScrollView style={styles.templateList}>
          {templates.map(template => (
            <Card 
              key={template.id}
              style={styles.templateCard}
              onPress={() => handleSelectTemplate(template.id)}
            >
              <Card.Title title={template.name} />
              <Card.Content>
                <Text>{template.description}</Text>
                {template.race_type && (
                  <Text style={styles.templateDetail}>Race Type: {template.race_type}</Text>
                )}
                {template.intensity_level && (
                  <Text style={styles.templateDetail}>Intensity: {template.intensity_level}</Text>
                )}
              </Card.Content>
            </Card>
          ))}
        </ScrollView>
        
        <Button 
          mode="outlined" 
          onPress={() => setShowTemplates(false)}
          style={styles.createFromScratchButton}
        >
          Create from Scratch
        </Button>
      </Card.Content>
    </Card>
  );
  
  // If showing template selection
  if (showTemplates) {
    return renderTemplateSelection();
  }
  
  // If showing entry form
  if (showEntryForm) {
    return (
      <NutritionEntryForm
        entry={editingEntry}
        onSave={handleSaveEntry}
        onCancel={handleCancelEntryForm}
      />
    );
  }
  
  // Main form
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title={isEditing ? 'Edit Nutrition Plan' : 'Create Nutrition Plan'} />
        <Card.Content>
          <FormField
            label="Plan Name"
            value={formData.name}
            onChangeText={(value) => updateFormData('name', value)}
            placeholder="e.g., My 50K Nutrition Plan"
            required
            error={errors.name}
          />
          
          <FormField
            label="Description"
            value={formData.description}
            onChangeText={(value) => updateFormData('description', value)}
            placeholder="Brief description of this plan..."
            multiline
            numberOfLines={3}
          />
          
          <Divider style={styles.divider} />
          
          <FormField
            label="Race Type"
            value={formData.raceType}
            onChangeText={(value) => updateFormData('raceType', value)}
            placeholder="e.g., Ultra Marathon, Trail Race, etc."
          />
          
          <TimeDistancePicker
            label="Race Duration"
            value={formData.raceDuration}
            unit={formData.raceDurationUnit}
            onChange={handleRaceDurationChange}
            mode="time"
          />
          
          <FormField
            label="Terrain Type"
            value={formData.terrainType}
            onChangeText={(value) => updateFormData('terrainType', value)}
            placeholder="e.g., Mountain, Trail, Road, etc."
          />
          
          <FormField
            label="Weather Condition"
            value={formData.weatherCondition}
            onChangeText={(value) => updateFormData('weatherCondition', value)}
            placeholder="e.g., Hot, Cold, Rainy, etc."
          />
          
          <View style={styles.intensityContainer}>
            <Text style={[
              styles.label, 
              { color: isDarkMode ? theme.colors.onSurface : theme.colors.onBackground }
            ]}>
              Intensity Level
            </Text>
            
            <SegmentedButtons
              value={formData.intensityLevel}
              onValueChange={(value) => updateFormData('intensityLevel', value)}
              buttons={[
                { value: 'low', label: 'Low' },
                { value: 'moderate', label: 'Moderate' },
                { value: 'high', label: 'High' }
              ]}
            />
          </View>
        </Card.Content>
      </Card>
      
      <Card style={styles.entriesCard}>
        <NutritionEntryList
          entries={formData.entries}
          onEdit={handleEditEntry}
          onDelete={handleDeleteEntry}
          onAdd={handleAddEntry}
        />
      </Card>
      
      <View style={styles.actions}>
        <Button onPress={onCancel} mode="outlined" style={styles.actionButton}>
          Cancel
        </Button>
        <Button onPress={handleSave} mode="contained" style={styles.actionButton}>
          Save Plan
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
  divider: {
    marginVertical: 16,
  },
  intensityContainer: {
    marginVertical: 8,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  entriesCard: {
    marginVertical: 8,
    marginHorizontal: 16,
    minHeight: 200,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  templateDescription: {
    marginBottom: 16,
  },
  templateList: {
    maxHeight: 400,
  },
  templateCard: {
    marginVertical: 8,
  },
  templateDetail: {
    marginTop: 4,
    opacity: 0.7,
  },
  createFromScratchButton: {
    marginTop: 16,
  },
});

export default NutritionPlanForm;