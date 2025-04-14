import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, Alert } from 'react-native';
import { 
  Card, 
  Button, 
  TextInput, 
  SegmentedButtons, 
  Chip, 
  IconButton,
  Menu,
  Divider,
  List,
  Switch
} from 'react-native-paper';
import { useAppTheme } from '../../context/ThemeContext';

/**
 * Rule condition builder component for creating time/distance/temperature based rules
 * @param {Object} props - Component props
 * @param {Array} props.rules - Array of existing rules
 * @param {function} props.onAddRule - Function called when a rule is added
 * @param {function} props.onUpdateRule - Function called when a rule is updated
 * @param {function} props.onDeleteRule - Function called when a rule is deleted
 */
const RuleConditionBuilder = ({ 
  rules = [], 
  onAddRule, 
  onUpdateRule, 
  onDeleteRule 
}) => {
  const { theme, isDarkMode } = useAppTheme();
  const [ruleType, setRuleType] = useState('time');
  const [condition, setCondition] = useState('after');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('hours');
  const [action, setAction] = useState('increase');
  const [target, setTarget] = useState('sodium');
  const [amount, setAmount] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState({ x: 0, y: 0 });
  const [activeRuleId, setActiveRuleId] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  
  // Define available condition types
  const conditionTypes = {
    time: ['after', 'before', 'between', 'every'],
    distance: ['after', 'before', 'between', 'every', 'on uphill', 'on downhill', 'on flat'],
    temperature: ['above', 'below', 'between']
  };
  
  // Define available units
  const units = {
    time: ['hours', 'minutes'],
    distance: ['miles', 'kilometers'],
    temperature: ['°F', '°C']
  };
  
  // Define available targets
  const targets = {
    nutrition: ['calories', 'carbs', 'protein', 'fat', 'sodium', 'potassium', 'magnesium'],
    hydration: ['water', 'electrolytes', 'consumption rate']
  };
  
  // Check for rule conflicts
  useEffect(() => {
    detectConflicts();
  }, [rules]);
  
  // Detect conflicts between rules
  const detectConflicts = () => {
    const newConflicts = [];
    
    // Check each pair of rules for conflicts
    for (let i = 0; i < rules.length; i++) {
      for (let j = i + 1; j < rules.length; j++) {
        const rule1 = rules[i];
        const rule2 = rules[j];
        
        // Check if rules have the same type, condition, and target
        if (
          rule1.ruleType === rule2.ruleType &&
          rule1.condition === rule2.condition &&
          rule1.target === rule2.target
        ) {
          // Check if values overlap
          if (
            (rule1.condition === 'after' && rule2.condition === 'after') ||
            (rule1.condition === 'before' && rule2.condition === 'before') ||
            (rule1.condition === 'above' && rule2.condition === 'above') ||
            (rule1.condition === 'below' && rule2.condition === 'below')
          ) {
            // Check if actions conflict
            if (rule1.action !== rule2.action) {
              newConflicts.push({
                rule1Id: rule1.id,
                rule2Id: rule2.id,
                message: `Conflict: Rules ${i+1} and ${j+1} have contradictory actions for the same condition`
              });
            }
          }
        }
      }
    }
    
    setConflicts(newConflicts);
  };
  
  // Format rule text for display
  const formatRuleText = (rule) => {
    let conditionText = '';
    
    // Format condition
    if (rule.ruleType === 'time') {
      if (rule.condition === 'after') {
        conditionText = `After ${rule.value} ${rule.unit}`;
      } else if (rule.condition === 'before') {
        conditionText = `Before ${rule.value} ${rule.unit}`;
      } else if (rule.condition === 'between') {
        const [start, end] = rule.value.split('-');
        conditionText = `Between ${start} and ${end} ${rule.unit}`;
      } else if (rule.condition === 'every') {
        conditionText = `Every ${rule.value} ${rule.unit}`;
      }
    } else if (rule.ruleType === 'distance') {
      if (rule.condition === 'after') {
        conditionText = `After ${rule.value} ${rule.unit}`;
      } else if (rule.condition === 'before') {
        conditionText = `Before ${rule.value} ${rule.unit}`;
      } else if (rule.condition === 'between') {
        const [start, end] = rule.value.split('-');
        conditionText = `Between ${start} and ${end} ${rule.unit}`;
      } else if (rule.condition === 'every') {
        conditionText = `Every ${rule.value} ${rule.unit}`;
      } else if (['on uphill', 'on downhill', 'on flat'].includes(rule.condition)) {
        conditionText = rule.condition;
      }
    } else if (rule.ruleType === 'temperature') {
      if (rule.condition === 'above') {
        conditionText = `Above ${rule.value}${rule.unit}`;
      } else if (rule.condition === 'below') {
        conditionText = `Below ${rule.value}${rule.unit}`;
      } else if (rule.condition === 'between') {
        const [start, end] = rule.value.split('-');
        conditionText = `Between ${start} and ${end}${rule.unit}`;
      }
    }
    
    // Format action
    let actionText = '';
    if (rule.action === 'increase') {
      actionText = `increase ${rule.target} by ${rule.amount}`;
    } else if (rule.action === 'decrease') {
      actionText = `decrease ${rule.target} by ${rule.amount}`;
    } else if (rule.action === 'set') {
      actionText = `set ${rule.target} to ${rule.amount}`;
    }
    
    return `${conditionText}, ${actionText}`;
  };
  
  // Handle adding a new rule
  const handleAddRule = () => {
    // Validate inputs
    if (!validateRule()) {
      return;
    }
    
    const newRule = {
      id: isEditing ? editingRuleId : Date.now().toString(),
      ruleType,
      condition,
      value,
      unit,
      action,
      target,
      amount
    };
    
    if (isEditing) {
      onUpdateRule(newRule);
      setIsEditing(false);
      setEditingRuleId(null);
    } else {
      onAddRule(newRule);
    }
    
    // Reset form
    resetForm();
  };
  
  // Validate rule inputs
  const validateRule = () => {
    if (!value) {
      Alert.alert('Error', 'Please enter a value for the condition');
      return false;
    }
    
    if (condition === 'between' && !value.includes('-')) {
      Alert.alert('Error', 'For "between" condition, enter a range like "1-3"');
      return false;
    }
    
    if (!amount) {
      Alert.alert('Error', 'Please enter an amount for the action');
      return false;
    }
    
    return true;
  };
  
  // Reset form fields
  const resetForm = () => {
    setValue('');
    setAmount('');
    setIsEditing(false);
    setEditingRuleId(null);
  };
  
  // Handle editing a rule
  const handleEditRule = (rule) => {
    setRuleType(rule.ruleType);
    setCondition(rule.condition);
    setValue(rule.value);
    setUnit(rule.unit);
    setAction(rule.action);
    setTarget(rule.target);
    setAmount(rule.amount);
    setIsEditing(true);
    setEditingRuleId(rule.id);
    setMenuVisible(false);
  };
  
  // Handle deleting a rule
  const handleDeleteRule = (ruleId) => {
    Alert.alert(
      'Delete Rule',
      'Are you sure you want to delete this rule?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            onDeleteRule(ruleId);
            setMenuVisible(false);
          }
        }
      ]
    );
  };
  
  // Show context menu for a rule
  const showMenu = (event, ruleId) => {
    setMenuAnchor({ x: event.nativeEvent.pageX, y: event.nativeEvent.pageY });
    setMenuVisible(true);
    setActiveRuleId(ruleId);
  };
  
  // Render rule form
  const renderRuleForm = () => {
    return (
      <Card style={styles.card}>
        <Card.Title title={isEditing ? 'Edit Rule' : 'Create Rule'} />
        <Card.Content>
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              Condition Type
            </Text>
            <SegmentedButtons
              value={ruleType}
              onValueChange={setRuleType}
              buttons={[
                { value: 'time', label: 'Time' },
                { value: 'distance', label: 'Distance' },
                { value: 'temperature', label: 'Temperature' }
              ]}
              style={styles.segmentedButtons}
            />
          </View>
          
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              Condition
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <SegmentedButtons
                value={condition}
                onValueChange={setCondition}
                buttons={conditionTypes[ruleType].map(c => ({ value: c, label: c }))}
                style={styles.segmentedButtons}
              />
            </ScrollView>
          </View>
          
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              Value
            </Text>
            <View style={styles.valueContainer}>
              <TextInput
                value={value}
                onChangeText={setValue}
                placeholder={condition === 'between' ? '1-3' : '1'}
                keyboardType="numeric"
                mode="outlined"
                style={styles.valueInput}
              />
              <SegmentedButtons
                value={unit}
                onValueChange={setUnit}
                buttons={units[ruleType].map(u => ({ value: u, label: u }))}
                style={styles.unitButtons}
              />
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              Action
            </Text>
            <SegmentedButtons
              value={action}
              onValueChange={setAction}
              buttons={[
                { value: 'increase', label: 'Increase' },
                { value: 'decrease', label: 'Decrease' },
                { value: 'set', label: 'Set' }
              ]}
              style={styles.segmentedButtons}
            />
          </View>
          
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              Target
            </Text>
            <View style={styles.targetContainer}>
              <SegmentedButtons
                value={target}
                onValueChange={setTarget}
                buttons={[
                  ...targets.nutrition.map(t => ({ value: t, label: t })),
                  ...targets.hydration.map(t => ({ value: t, label: t }))
                ]}
                style={styles.targetButtons}
              />
            </View>
          </View>
          
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              Amount
            </Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="e.g., 10%"
              mode="outlined"
              style={styles.amountInput}
            />
          </View>
          
          <View style={styles.buttonContainer}>
            {isEditing && (
              <Button 
                mode="outlined" 
                onPress={resetForm}
                style={styles.button}
              >
                Cancel
              </Button>
            )}
            <Button 
              mode="contained" 
              onPress={handleAddRule}
              style={styles.button}
            >
              {isEditing ? 'Update Rule' : 'Add Rule'}
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };
  
  // Render rule list
  const renderRuleList = () => {
    if (rules.length === 0) {
      return (
        <Card style={styles.card}>
          <Card.Title title="Rules" />
          <Card.Content>
            <Text style={{ color: isDarkMode ? '#fff' : '#000', textAlign: 'center' }}>
              No rules defined yet. Create your first rule above.
            </Text>
          </Card.Content>
        </Card>
      );
    }
    
    return (
      <Card style={styles.card}>
        <Card.Title title="Rules" />
        <Card.Content>
          {conflicts.length > 0 && (
            <View style={styles.conflictsContainer}>
              <Text style={[styles.conflictsTitle, { color: theme.colors.error }]}>
                Rule Conflicts Detected:
              </Text>
              {conflicts.map((conflict, index) => (
                <Text key={index} style={{ color: theme.colors.error }}>
                  {conflict.message}
                </Text>
              ))}
            </View>
          )}
          
          <List.Section>
            {rules.map((rule, index) => {
              // Check if this rule has conflicts
              const hasConflict = conflicts.some(
                conflict => conflict.rule1Id === rule.id || conflict.rule2Id === rule.id
              );
              
              return (
                <List.Item
                  key={rule.id}
                  title={`Rule ${index + 1}`}
                  description={formatRuleText(rule)}
                  left={props => (
                    <List.Icon
                      {...props}
                      icon={
                        rule.ruleType === 'time' ? 'clock-outline' :
                        rule.ruleType === 'distance' ? 'map-marker-distance' :
                        'thermometer'
                      }
                    />
                  )}
                  right={props => (
                    <IconButton
                      {...props}
                      icon="dots-vertical"
                      onPress={(e) => showMenu(e, rule.id)}
                    />
                  )}
                  style={[
                    styles.ruleItem,
                    hasConflict && { backgroundColor: theme.colors.errorContainer }
                  ]}
                  titleStyle={hasConflict ? { color: theme.colors.error } : null}
                />
              );
            })}
          </List.Section>
        </Card.Content>
      </Card>
    );
  };
  
  return (
    <ScrollView style={styles.container}>
      {renderRuleForm()}
      {renderRuleList()}
      
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={menuAnchor}
      >
        <Menu.Item 
          onPress={() => {
            const rule = rules.find(r => r.id === activeRuleId);
            if (rule) {
              handleEditRule(rule);
            }
          }} 
          title="Edit" 
          leadingIcon="pencil"
        />
        <Divider />
        <Menu.Item 
          onPress={() => handleDeleteRule(activeRuleId)} 
          title="Delete" 
          leadingIcon="delete"
          titleStyle={{ color: theme.colors.error }}
        />
      </Menu>
    </ScrollView>
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
  formSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueInput: {
    flex: 1,
    marginRight: 8,
  },
  unitButtons: {
    flex: 1,
  },
  divider: {
    marginVertical: 16,
  },
  targetContainer: {
    marginBottom: 8,
  },
  targetButtons: {
    flexWrap: 'wrap',
  },
  amountInput: {
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    marginLeft: 8,
  },
  ruleItem: {
    marginBottom: 4,
  },
  conflictsContainer: {
    backgroundColor: theme => theme.colors.errorContainer,
    padding: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  conflictsTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
});

export default RuleConditionBuilder;