import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, Dimensions } from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  Divider, 
  List,
  Chip,
  SegmentedButtons
} from 'react-native-paper';
import { useAppTheme } from '../../context/ThemeContext';
import { 
  VictoryChart, 
  VictoryBar, 
  VictoryAxis, 
  VictoryTheme,
  VictoryGroup,
  VictoryLegend
} from 'victory-native';
import Svg from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Plan comparison tool for comparing nutrition and hydration plans
 * @param {Object} props - Component props
 * @param {Array} props.plans - Array of plans to compare
 * @param {string} props.planType - Type of plans to compare: 'nutrition' or 'hydration'
 * @param {function} props.onMergePlans - Function called when plans are merged
 */
const PlanComparisonTool = ({ 
  plans = [], 
  planType = 'nutrition',
  onMergePlans
}) => {
  const { theme, isDarkMode } = useAppTheme();
  const [selectedPlans, setSelectedPlans] = useState([]);
  const [comparisonMode, setComparisonMode] = useState('overview');
  const [diffHighlighting, setDiffHighlighting] = useState(true);
  
  // Handle plan selection
  const togglePlanSelection = (planId) => {
    if (selectedPlans.includes(planId)) {
      setSelectedPlans(selectedPlans.filter(id => id !== planId));
    } else {
      // Limit to 2 plans for comparison
      if (selectedPlans.length < 2) {
        setSelectedPlans([...selectedPlans, planId]);
      }
    }
  };
  
  // Get selected plans data
  const getSelectedPlansData = () => {
    return plans.filter(plan => selectedPlans.includes(plan.id));
  };
  
  // Calculate differences between plans
  const calculateDifferences = () => {
    const selectedPlansData = getSelectedPlansData();
    
    if (selectedPlansData.length !== 2) {
      return null;
    }
    
    const plan1 = selectedPlansData[0];
    const plan2 = selectedPlansData[1];
    
    const differences = {
      basicInfo: [],
      entries: []
    };
    
    // Compare basic info
    if (plan1.name !== plan2.name) {
      differences.basicInfo.push('name');
    }
    
    if (plan1.description !== plan2.description) {
      differences.basicInfo.push('description');
    }
    
    if (plan1.raceType !== plan2.raceType) {
      differences.basicInfo.push('raceType');
    }
    
    if (plan1.raceDuration !== plan2.raceDuration) {
      differences.basicInfo.push('raceDuration');
    }
    
    if (plan1.terrainType !== plan2.terrainType) {
      differences.basicInfo.push('terrainType');
    }
    
    if (plan1.weatherCondition !== plan2.weatherCondition) {
      differences.basicInfo.push('weatherCondition');
    }
    
    if (plan1.intensityLevel !== plan2.intensityLevel) {
      differences.basicInfo.push('intensityLevel');
    }
    
    // Compare entries
    const plan1Entries = plan1.entries || [];
    const plan2Entries = plan2.entries || [];
    
    // Find entries in plan1 but not in plan2
    plan1Entries.forEach(entry1 => {
      const matchingEntry = plan2Entries.find(entry2 => {
        if (planType === 'nutrition') {
          return entry1.foodType === entry2.foodType;
        } else {
          return entry1.liquidType === entry2.liquidType;
        }
      });
      
      if (!matchingEntry) {
        differences.entries.push({
          entry: entry1,
          status: 'only-in-plan1'
        });
      } else {
        // Check for differences in matching entries
        const entryDiffs = [];
        
        if (planType === 'nutrition') {
          if (entry1.calories !== matchingEntry.calories) entryDiffs.push('calories');
          if (entry1.carbs !== matchingEntry.carbs) entryDiffs.push('carbs');
          if (entry1.protein !== matchingEntry.protein) entryDiffs.push('protein');
          if (entry1.fat !== matchingEntry.fat) entryDiffs.push('fat');
        } else {
          if (entry1.volume !== matchingEntry.volume) entryDiffs.push('volume');
          if (entry1.electrolytes?.sodium !== matchingEntry.electrolytes?.sodium) entryDiffs.push('sodium');
          if (entry1.electrolytes?.potassium !== matchingEntry.electrolytes?.potassium) entryDiffs.push('potassium');
        }
        
        if (entry1.timing !== matchingEntry.timing) entryDiffs.push('timing');
        if (entry1.frequency !== matchingEntry.frequency) entryDiffs.push('frequency');
        
        if (entryDiffs.length > 0) {
          differences.entries.push({
            entry: entry1,
            matchingEntry,
            status: 'different',
            differences: entryDiffs
          });
        }
      }
    });
    
    // Find entries in plan2 but not in plan1
    plan2Entries.forEach(entry2 => {
      const matchingEntry = plan1Entries.find(entry1 => {
        if (planType === 'nutrition') {
          return entry2.foodType === entry1.foodType;
        } else {
          return entry2.liquidType === entry1.liquidType;
        }
      });
      
      if (!matchingEntry) {
        differences.entries.push({
          entry: entry2,
          status: 'only-in-plan2'
        });
      }
      // We already handled the differences for matching entries above
    });
    
    return differences;
  };
  
  // Prepare data for comparison chart
  const prepareComparisonChartData = () => {
    const selectedPlansData = getSelectedPlansData();
    
    if (selectedPlansData.length === 0) {
      return [];
    }
    
    if (planType === 'nutrition') {
      // Prepare nutrition comparison data
      return selectedPlansData.map(plan => {
        const entries = plan.entries || [];
        const totalCalories = entries.reduce((sum, entry) => sum + (entry.calories || 0), 0);
        const totalCarbs = entries.reduce((sum, entry) => sum + (entry.carbs || 0), 0);
        const totalProtein = entries.reduce((sum, entry) => sum + (entry.protein || 0), 0);
        const totalFat = entries.reduce((sum, entry) => sum + (entry.fat || 0), 0);
        
        return [
          { x: 'Calories', y: totalCalories, plan: plan.name },
          { x: 'Carbs', y: totalCarbs, plan: plan.name },
          { x: 'Protein', y: totalProtein, plan: plan.name },
          { x: 'Fat', y: totalFat, plan: plan.name }
        ];
      });
    } else {
      // Prepare hydration comparison data
      return selectedPlansData.map(plan => {
        const entries = plan.entries || [];
        const totalVolume = entries.reduce((sum, entry) => {
          let volume = entry.volume || 0;
          if (entry.volumeUnit === 'oz') {
            volume *= 29.5735; // Convert oz to ml
          } else if (entry.volumeUnit === 'L') {
            volume *= 1000; // Convert L to ml
          }
          return sum + volume;
        }, 0);
        
        const totalSodium = entries.reduce((sum, entry) => sum + (entry.electrolytes?.sodium || 0), 0);
        const totalPotassium = entries.reduce((sum, entry) => sum + (entry.electrolytes?.potassium || 0), 0);
        
        return [
          { x: 'Volume (ml)', y: totalVolume, plan: plan.name },
          { x: 'Sodium (mg)', y: totalSodium, plan: plan.name },
          { x: 'Potassium (mg)', y: totalPotassium, plan: plan.name }
        ];
      });
    }
  };
  
  // Handle merge plans
  const handleMergePlans = () => {
    const selectedPlansData = getSelectedPlansData();
    
    if (selectedPlansData.length !== 2) {
      return;
    }
    
    onMergePlans(selectedPlansData);
  };
  
  // Render plan selection
  const renderPlanSelection = () => {
    return (
      <Card style={styles.card}>
        <Card.Title title="Select Plans to Compare" />
        <Card.Content>
          <Text style={[styles.selectionHint, { color: isDarkMode ? '#fff' : '#000' }]}>
            Select up to 2 plans to compare
          </Text>
          
          <List.Section>
            {plans.map(plan => (
              <List.Item
                key={plan.id}
                title={plan.name}
                description={`${plan.description || ''} (${plan.entries?.length || 0} entries)`}
                left={props => (
                  <List.Icon
                    {...props}
                    icon={selectedPlans.includes(plan.id) ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  />
                )}
                onPress={() => togglePlanSelection(plan.id)}
                style={[
                  styles.planItem,
                  selectedPlans.includes(plan.id) && { 
                    backgroundColor: theme.colors.primaryContainer 
                  }
                ]}
              />
            ))}
          </List.Section>
        </Card.Content>
      </Card>
    );
  };
  
  // Render comparison controls
  const renderComparisonControls = () => {
    if (selectedPlans.length !== 2) {
      return null;
    }
    
    return (
      <Card style={styles.card}>
        <Card.Title title="Comparison Options" />
        <Card.Content>
          <SegmentedButtons
            value={comparisonMode}
            onValueChange={setComparisonMode}
            buttons={[
              { value: 'overview', label: 'Overview' },
              { value: 'details', label: 'Details' },
              { value: 'chart', label: 'Chart' }
            ]}
            style={styles.segmentedButtons}
          />
          
          <View style={styles.controlRow}>
            <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>
              Highlight Differences
            </Text>
            <Button
              mode={diffHighlighting ? 'contained' : 'outlined'}
              onPress={() => setDiffHighlighting(!diffHighlighting)}
            >
              {diffHighlighting ? 'On' : 'Off'}
            </Button>
          </View>
          
          <Button
            mode="contained"
            onPress={handleMergePlans}
            style={styles.mergeButton}
          >
            Merge Plans
          </Button>
        </Card.Content>
      </Card>
    );
  };
  
  // Render overview comparison
  const renderOverviewComparison = () => {
    const selectedPlansData = getSelectedPlansData();
    
    if (selectedPlansData.length !== 2) {
      return null;
    }
    
    const plan1 = selectedPlansData[0];
    const plan2 = selectedPlansData[1];
    const differences = diffHighlighting ? calculateDifferences() : null;
    
    return (
      <Card style={styles.card}>
        <Card.Title title="Plan Overview Comparison" />
        <Card.Content>
          <View style={styles.comparisonRow}>
            <View style={styles.comparisonHeader}>
              <Text style={styles.headerText}>Property</Text>
            </View>
            <View style={styles.comparisonHeader}>
              <Text style={styles.headerText}>{plan1.name}</Text>
            </View>
            <View style={styles.comparisonHeader}>
              <Text style={styles.headerText}>{plan2.name}</Text>
            </View>
          </View>
          
          <View style={styles.comparisonRow}>
            <View style={styles.comparisonCell}>
              <Text>Race Type</Text>
            </View>
            <View style={[
              styles.comparisonCell,
              diffHighlighting && differences?.basicInfo.includes('raceType') && styles.highlightedCell
            ]}>
              <Text>{plan1.raceType || 'N/A'}</Text>
            </View>
            <View style={[
              styles.comparisonCell,
              diffHighlighting && differences?.basicInfo.includes('raceType') && styles.highlightedCell
            ]}>
              <Text>{plan2.raceType || 'N/A'}</Text>
            </View>
          </View>
          
          <View style={styles.comparisonRow}>
            <View style={styles.comparisonCell}>
              <Text>Duration</Text>
            </View>
            <View style={[
              styles.comparisonCell,
              diffHighlighting && differences?.basicInfo.includes('raceDuration') && styles.highlightedCell
            ]}>
              <Text>{plan1.raceDuration || 'N/A'}</Text>
            </View>
            <View style={[
              styles.comparisonCell,
              diffHighlighting && differences?.basicInfo.includes('raceDuration') && styles.highlightedCell
            ]}>
              <Text>{plan2.raceDuration || 'N/A'}</Text>
            </View>
          </View>
          
          <View style={styles.comparisonRow}>
            <View style={styles.comparisonCell}>
              <Text>Terrain</Text>
            </View>
            <View style={[
              styles.comparisonCell,
              diffHighlighting && differences?.basicInfo.includes('terrainType') && styles.highlightedCell
            ]}>
              <Text>{plan1.terrainType || 'N/A'}</Text>
            </View>
            <View style={[
              styles.comparisonCell,
              diffHighlighting && differences?.basicInfo.includes('terrainType') && styles.highlightedCell
            ]}>
              <Text>{plan2.terrainType || 'N/A'}</Text>
            </View>
          </View>
          
          <View style={styles.comparisonRow}>
            <View style={styles.comparisonCell}>
              <Text>Weather</Text>
            </View>
            <View style={[
              styles.comparisonCell,
              diffHighlighting && differences?.basicInfo.includes('weatherCondition') && styles.highlightedCell
            ]}>
              <Text>{plan1.weatherCondition || 'N/A'}</Text>
            </View>
            <View style={[
              styles.comparisonCell,
              diffHighlighting && differences?.basicInfo.includes('weatherCondition') && styles.highlightedCell
            ]}>
              <Text>{plan2.weatherCondition || 'N/A'}</Text>
            </View>
          </View>
          
          <View style={styles.comparisonRow}>
            <View style={styles.comparisonCell}>
              <Text>Intensity</Text>
            </View>
            <View style={[
              styles.comparisonCell,
              diffHighlighting && differences?.basicInfo.includes('intensityLevel') && styles.highlightedCell
            ]}>
              <Text>{plan1.intensityLevel || 'N/A'}</Text>
            </View>
            <View style={[
              styles.comparisonCell,
              diffHighlighting && differences?.basicInfo.includes('intensityLevel') && styles.highlightedCell
            ]}>
              <Text>{plan2.intensityLevel || 'N/A'}</Text>
            </View>
          </View>
          
          <View style={styles.comparisonRow}>
            <View style={styles.comparisonCell}>
              <Text>Entries</Text>
            </View>
            <View style={styles.comparisonCell}>
              <Text>{plan1.entries?.length || 0}</Text>
            </View>
            <View style={styles.comparisonCell}>
              <Text>{plan2.entries?.length || 0}</Text>
            </View>
          </View>
          
          {planType === 'nutrition' && (
            <>
              <View style={styles.comparisonRow}>
                <View style={styles.comparisonCell}>
                  <Text>Total Calories</Text>
                </View>
                <View style={styles.comparisonCell}>
                  <Text>
                    {plan1.entries?.reduce((sum, entry) => sum + (entry.calories || 0), 0) || 0}
                  </Text>
                </View>
                <View style={styles.comparisonCell}>
                  <Text>
                    {plan2.entries?.reduce((sum, entry) => sum + (entry.calories || 0), 0) || 0}
                  </Text>
                </View>
              </View>
              
              <View style={styles.comparisonRow}>
                <View style={styles.comparisonCell}>
                  <Text>Total Carbs</Text>
                </View>
                <View style={styles.comparisonCell}>
                  <Text>
                    {plan1.entries?.reduce((sum, entry) => sum + (entry.carbs || 0), 0) || 0}g
                  </Text>
                </View>
                <View style={styles.comparisonCell}>
                  <Text>
                    {plan2.entries?.reduce((sum, entry) => sum + (entry.carbs || 0), 0) || 0}g
                  </Text>
                </View>
              </View>
            </>
          )}
          
          {planType === 'hydration' && (
            <>
              <View style={styles.comparisonRow}>
                <View style={styles.comparisonCell}>
                  <Text>Total Volume</Text>
                </View>
                <View style={styles.comparisonCell}>
                  <Text>
                    {(plan1.entries?.reduce((sum, entry) => {
                      let volume = entry.volume || 0;
                      if (entry.volumeUnit === 'oz') {
                        volume *= 29.5735; // Convert oz to ml
                      } else if (entry.volumeUnit === 'L') {
                        volume *= 1000; // Convert L to ml
                      }
                      return sum + volume;
                    }, 0) / 1000).toFixed(1) || 0}L
                  </Text>
                </View>
                <View style={styles.comparisonCell}>
                  <Text>
                    {(plan2.entries?.reduce((sum, entry) => {
                      let volume = entry.volume || 0;
                      if (entry.volumeUnit === 'oz') {
                        volume *= 29.5735; // Convert oz to ml
                      } else if (entry.volumeUnit === 'L') {
                        volume *= 1000; // Convert L to ml
                      }
                      return sum + volume;
                    }, 0) / 1000).toFixed(1) || 0}L
                  </Text>
                </View>
              </View>
            </>
          )}
        </Card.Content>
      </Card>
    );
  };
  
  // Render detailed comparison
  const renderDetailedComparison = () => {
    const selectedPlansData = getSelectedPlansData();
    
    if (selectedPlansData.length !== 2) {
      return null;
    }
    
    const differences = diffHighlighting ? calculateDifferences() : null;
    
    if (!differences || differences.entries.length === 0) {
      return (
        <Card style={styles.card}>
          <Card.Title title="Detailed Comparison" />
          <Card.Content>
            <Text style={{ textAlign: 'center' }}>
              No significant differences found between entries.
            </Text>
          </Card.Content>
        </Card>
      );
    }
    
    return (
      <Card style={styles.card}>
        <Card.Title title="Detailed Comparison" />
        <Card.Content>
          <List.Section>
            {differences.entries.map((diff, index) => {
              const entryName = planType === 'nutrition' 
                ? diff.entry.foodType 
                : diff.entry.liquidType;
                
              let statusText = '';
              let statusColor = '';
              
              if (diff.status === 'only-in-plan1') {
                statusText = `Only in ${selectedPlansData[0].name}`;
                statusColor = theme.colors.primary;
              } else if (diff.status === 'only-in-plan2') {
                statusText = `Only in ${selectedPlansData[1].name}`;
                statusColor = theme.colors.secondary;
              } else if (diff.status === 'different') {
                statusText = 'Different';
                statusColor = theme.colors.tertiary;
              }
              
              return (
                <List.Item
                  key={index}
                  title={entryName}
                  description={() => (
                    <View>
                      <Chip style={{ backgroundColor: statusColor, marginVertical: 4 }}>
                        {statusText}
                      </Chip>
                      
                      {diff.status === 'different' && diff.differences && (
                        <View style={styles.differencesList}>
                          <Text>Differences in: </Text>
                          {diff.differences.map((diffField, i) => (
                            <Chip key={i} style={styles.differenceChip}>
                              {diffField}
                            </Chip>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                  style={styles.diffItem}
                />
              );
            })}
          </List.Section>
        </Card.Content>
      </Card>
    );
  };
  
  // Render chart comparison
  const renderChartComparison = () => {
    const chartData = prepareComparisonChartData();
    
    if (chartData.length === 0) {
      return null;
    }
    
    const colors = [theme.colors.primary, theme.colors.secondary];
    
    return (
      <Card style={styles.card}>
        <Card.Title title="Chart Comparison" />
        <Card.Content>
          <View style={styles.chartContainer}>
            <Svg width={SCREEN_WIDTH - 64} height={300}>
              <VictoryChart
                width={SCREEN_WIDTH - 64}
                height={300}
                domainPadding={{ x: 40 }}
                theme={VictoryTheme.material}
              >
                <VictoryLegend
                  x={SCREEN_WIDTH / 2 - 150}
                  y={0}
                  centerTitle
                  orientation="horizontal"
                  data={chartData.map((data, i) => ({
                    name: getSelectedPlansData()[i].name,
                    symbol: { fill: colors[i] }
                  }))}
                />
                
                <VictoryGroup
                  offset={20}
                  colorScale={colors}
                >
                  {chartData.map((data, i) => (
                    <VictoryBar
                      key={i}
                      data={data}
                      x="x"
                      y="y"
                    />
                  ))}
                </VictoryGroup>
                
                <VictoryAxis
                  style={{
                    axis: { stroke: isDarkMode ? '#fff' : '#000' },
                    tickLabels: { fill: isDarkMode ? '#fff' : '#000' }
                  }}
                />
                <VictoryAxis
                  dependentAxis
                  style={{
                    axis: { stroke: isDarkMode ? '#fff' : '#000' },
                    tickLabels: { fill: isDarkMode ? '#fff' : '#000' }
                  }}
                />
              </VictoryChart>
            </Svg>
          </View>
        </Card.Content>
      </Card>
    );
  };
  
  return (
    <ScrollView style={styles.container}>
      {renderPlanSelection()}
      {renderComparisonControls()}
      
      {comparisonMode === 'overview' && renderOverviewComparison()}
      {comparisonMode === 'details' && renderDetailedComparison()}
      {comparisonMode === 'chart' && renderChartComparison()}
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
  selectionHint: {
    marginBottom: 8,
  },
  planItem: {
    marginBottom: 4,
    borderRadius: 8,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mergeButton: {
    marginTop: 8,
  },
  comparisonRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  comparisonHeader: {
    flex: 1,
    padding: 8,
    backgroundColor: '#f5f5f5',
  },
  headerText: {
    fontWeight: 'bold',
  },
  comparisonCell: {
    flex: 1,
    padding: 8,
  },
  highlightedCell: {
    backgroundColor: theme => theme.colors.errorContainer,
  },
  diffItem: {
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  differencesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 4,
  },
  differenceChip: {
    marginRight: 4,
    marginBottom: 4,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
  },
});

export default PlanComparisonTool;