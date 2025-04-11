import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, Share } from 'react-native';
import { 
  Card, 
  Text, 
  Button, 
  Divider, 
  List, 
  Chip, 
  RadioButton,
  Portal,
  Modal,
  SegmentedButtons,
  IconButton
} from 'react-native-paper';
import { useAppTheme } from '../../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Component for exporting and importing nutrition and hydration plans
 * @param {Object} props - Component props
 * @param {Array} props.nutritionPlans - Array of nutrition plan objects
 * @param {Array} props.hydrationPlans - Array of hydration plan objects
 * @param {function} props.onExportCSV - Function called when CSV export is requested
 * @param {function} props.onExportJSON - Function called when JSON export is requested
 * @param {function} props.onExportCalendar - Function called when calendar export is requested
 * @param {function} props.onImportData - Function called when data import is requested
 */
const ExportOptions = ({ 
  nutritionPlans = [], 
  hydrationPlans = [],
  onExportCSV,
  onExportJSON,
  onExportCalendar,
  onImportData
}) => {
  const { theme, isDarkMode } = useAppTheme();
  const [selectedPlans, setSelectedPlans] = useState([]);
  const [exportType, setExportType] = useState('csv');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('export'); // 'export' or 'import'
  const [importFormat, setImportFormat] = useState('json');
  const [exportOptions, setExportOptions] = useState({
    includeMetadata: true,
    includeEntries: true,
    includeRules: true
  });
  
  // Handle plan selection toggle
  const togglePlanSelection = (plan, type) => {
    const planKey = `${type}-${plan.id}`;
    
    if (selectedPlans.some(p => p.key === planKey)) {
      setSelectedPlans(selectedPlans.filter(p => p.key !== planKey));
    } else {
      setSelectedPlans([...selectedPlans, { key: planKey, plan, type }]);
    }
  };
  
  // Show export modal
  const showExportModal = () => {
    if (selectedPlans.length === 0) {
      Alert.alert('Error', 'Please select at least one plan to export');
      return;
    }
    
    setModalType('export');
    setExportType('csv');
    setExportOptions({
      includeMetadata: true,
      includeEntries: true,
      includeRules: true
    });
    setModalVisible(true);
  };
  
  // Show import modal
  const showImportModal = () => {
    setModalType('import');
    setImportFormat('json');
    setModalVisible(true);
  };
  
  // Handle export
  const handleExport = async () => {
    const planIds = selectedPlans.map(p => ({
      id: p.plan.id,
      type: p.type
    }));
    
    try {
      // Call the appropriate export function based on type
      let message = '';
      if (exportType === 'csv') {
        await onExportCSV(planIds, exportOptions);
        message = 'CSV export successful';
      } else if (exportType === 'json') {
        await onExportJSON(planIds, exportOptions);
        message = 'JSON export successful';
      } else if (exportType === 'calendar') {
        await onExportCalendar(planIds);
        message = 'Calendar export successful';
      }
      
      // Show success message
      Alert.alert('Success', message);
      
      // Share mock message
      if (Platform.OS !== 'web') {
        try {
          await Share.share({
            message: `UltraEdge ${exportType.toUpperCase()} Export`,
            title: 'UltraEdge Export'
          });
        } catch (error) {
          console.log('Error sharing:', error);
        }
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to export data');
    }
    
    setModalVisible(false);
  };
  
  // Handle import
  const handleImport = async () => {
    try {
      // Mock import functionality
      Alert.alert('Import', `Would import ${importFormat} data here`);
      
      // Call the import function with mock data
      const mockData = importFormat === 'json' 
        ? { plans: [], entries: [] } 
        : 'name,type,value\nTest,nutrition,100';
        
      await onImportData(mockData, importFormat);
      
      Alert.alert('Success', 'Data imported successfully');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to import data');
    }
    
    setModalVisible(false);
  };
  
  // Toggle export option
  const toggleExportOption = (option) => {
    setExportOptions({
      ...exportOptions,
      [option]: !exportOptions[option]
    });
  };
  
  // Render plan selection
  const renderPlanSelection = () => {
    return (
      <Card style={styles.card}>
        <Card.Title title="Select Plans to Export" />
        <Card.Content>
          <Text style={styles.sectionTitle}>Nutrition Plans</Text>
          <ScrollView style={styles.planList}>
            {nutritionPlans.length === 0 ? (
              <Text style={styles.emptyText}>No nutrition plans available</Text>
            ) : (
              nutritionPlans.map(plan => {
                const isSelected = selectedPlans.some(p => p.key === `nutrition-${plan.id}`);
                
                return (
                  <List.Item
                    key={`nutrition-${plan.id}`}
                    title={plan.name}
                    description={plan.description}
                    left={props => (
                      <List.Icon
                        {...props}
                        icon={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                      />
                    )}
                    onPress={() => togglePlanSelection(plan, 'nutrition')}
                    style={[
                      styles.planItem,
                      isSelected && { backgroundColor: theme.colors.primaryContainer }
                    ]}
                  />
                );
              })
            )}
          </ScrollView>
          
          <Divider style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Hydration Plans</Text>
          <ScrollView style={styles.planList}>
            {hydrationPlans.length === 0 ? (
              <Text style={styles.emptyText}>No hydration plans available</Text>
            ) : (
              hydrationPlans.map(plan => {
                const isSelected = selectedPlans.some(p => p.key === `hydration-${plan.id}`);
                
                return (
                  <List.Item
                    key={`hydration-${plan.id}`}
                    title={plan.name}
                    description={plan.description}
                    left={props => (
                      <List.Icon
                        {...props}
                        icon={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                      />
                    )}
                    onPress={() => togglePlanSelection(plan, 'hydration')}
                    style={[
                      styles.planItem,
                      isSelected && { backgroundColor: theme.colors.primaryContainer }
                    ]}
                  />
                );
              })
            )}
          </ScrollView>
        </Card.Content>
      </Card>
    );
  };
  
  // Render export/import options
  const renderOptions = () => {
    return (
      <Card style={styles.card}>
        <Card.Title title="Export/Import Options" />
        <Card.Content>
          <View style={styles.optionsRow}>
            <Button 
              mode="contained" 
              onPress={showExportModal}
              style={styles.optionButton}
              icon="export"
              disabled={selectedPlans.length === 0}
            >
              Export
            </Button>
            <Button 
              mode="contained" 
              onPress={showImportModal}
              style={styles.optionButton}
              icon="import"
            >
              Import
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };
  
  // Render export modal
  const renderExportModal = () => {
    return (
      <Card>
        <Card.Title title="Export Plans" />
        <Card.Content>
          <Text style={styles.sectionTitle}>Export Format</Text>
          <RadioButton.Group
            value={exportType}
            onValueChange={setExportType}
          >
            <View style={styles.radioRow}>
              <RadioButton.Item
                label="CSV (Spreadsheet)"
                value="csv"
              />
            </View>
            <View style={styles.radioRow}>
              <RadioButton.Item
                label="JSON (Data Backup)"
                value="json"
              />
            </View>
            <View style={styles.radioRow}>
              <RadioButton.Item
                label="Calendar (.ics)"
                value="calendar"
              />
            </View>
          </RadioButton.Group>
          
          {(exportType === 'csv' || exportType === 'json') && (
            <>
              <Divider style={styles.divider} />
              
              <Text style={styles.sectionTitle}>Export Options</Text>
              <View style={styles.optionRow}>
                <Text>Include Plan Metadata</Text>
                <IconButton
                  icon={exportOptions.includeMetadata ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  onPress={() => toggleExportOption('includeMetadata')}
                />
              </View>
              <View style={styles.optionRow}>
                <Text>Include Entries</Text>
                <IconButton
                  icon={exportOptions.includeEntries ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  onPress={() => toggleExportOption('includeEntries')}
                />
              </View>
              <View style={styles.optionRow}>
                <Text>Include Rules</Text>
                <IconButton
                  icon={exportOptions.includeRules ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  onPress={() => toggleExportOption('includeRules')}
                />
              </View>
            </>
          )}
          
          {exportType === 'calendar' && (
            <Text style={styles.formatNote}>
              Calendar export will create events for each nutrition and hydration entry based on timing.
            </Text>
          )}
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => setModalVisible(false)}>Cancel</Button>
          <Button 
            mode="contained"
            onPress={handleExport}
          >
            Export
          </Button>
        </Card.Actions>
      </Card>
    );
  };
  
  // Render import modal
  const renderImportModal = () => {
    return (
      <Card>
        <Card.Title title="Import Plans" />
        <Card.Content>
          <Text style={styles.sectionTitle}>Import Format</Text>
          <SegmentedButtons
            value={importFormat}
            onValueChange={setImportFormat}
            buttons={[
              { value: 'json', label: 'JSON' },
              { value: 'csv', label: 'CSV' }
            ]}
            style={styles.formatToggle}
          />
          
          <Text style={styles.formatNote}>
            {importFormat === 'json' 
              ? 'JSON import supports full plan data including entries and rules.'
              : 'CSV import supports basic plan data and entries.'}
          </Text>
          
          <Divider style={styles.divider} />
          
          <Button 
            mode="contained"
            onPress={handleImport}
            style={styles.selectFileButton}
            icon="file-upload"
          >
            Select File to Import
          </Button>
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => setModalVisible(false)}>Cancel</Button>
        </Card.Actions>
      </Card>
    );
  };
  
  return (
    <View style={styles.container}>
      {renderPlanSelection()}
      {renderOptions()}
      
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          {modalType === 'export' ? renderExportModal() : renderImportModal()}
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
  },
  card: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  planList: {
    maxHeight: 150,
  },
  planItem: {
    marginBottom: 4,
    borderRadius: 8,
  },
  divider: {
    marginVertical: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  optionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  modalContainer: {
    padding: 16,
    margin: 16,
  },
  radioRow: {
    marginBottom: 4,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formatToggle: {
    marginBottom: 16,
  },
  formatNote: {
    fontStyle: 'italic',
    opacity: 0.7,
  },
  selectFileButton: {
    marginTop: 16,
  },
});

export default ExportOptions;