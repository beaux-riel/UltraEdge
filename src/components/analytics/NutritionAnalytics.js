import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, Dimensions } from 'react-native';
import { Card, Title, Paragraph, SegmentedButtons } from 'react-native-paper';
import { useAppTheme } from '../../context/ThemeContext';
import { 
  VictoryPie, 
  VictoryChart, 
  VictoryLine, 
  VictoryAxis, 
  VictoryTheme,
  VictoryBar,
  VictoryLabel,
  VictoryLegend
} from 'victory-native';
import Svg from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Nutrition analytics component for visualizing nutrition data
 * @param {Object} props - Component props
 * @param {Array} props.nutritionEntries - Array of nutrition entries
 * @param {Object} props.raceInfo - Race information (duration, distance)
 * @param {string} props.mode - Display mode: 'time' or 'distance'
 */
const NutritionAnalytics = ({ 
  nutritionEntries = [], 
  raceInfo = {}, 
  mode = 'time' 
}) => {
  const { theme, isDarkMode } = useAppTheme();
  const [chartMode, setChartMode] = useState('calories');
  const [timeInterval, setTimeInterval] = useState('hourly');
  
  // Calculate total calories
  const totalCalories = nutritionEntries.reduce((sum, entry) => sum + (entry.calories || 0), 0);
  
  // Calculate total macronutrients
  const totalCarbs = nutritionEntries.reduce((sum, entry) => sum + (entry.carbs || 0), 0);
  const totalProtein = nutritionEntries.reduce((sum, entry) => sum + (entry.protein || 0), 0);
  const totalFat = nutritionEntries.reduce((sum, entry) => sum + (entry.fat || 0), 0);
  
  // Calculate total electrolytes
  const totalSodium = nutritionEntries.reduce((sum, entry) => sum + (entry.sodium || 0), 0);
  const totalPotassium = nutritionEntries.reduce((sum, entry) => sum + (entry.potassium || 0), 0);
  const totalMagnesium = nutritionEntries.reduce((sum, entry) => sum + (entry.magnesium || 0), 0);
  
  // Calculate calories per hour
  const raceDuration = raceInfo.duration || 720; // 12 hours default
  const caloriesPerHour = totalCalories / (raceDuration / 60);
  
  // Prepare data for macronutrient pie chart
  const macroData = [
    { x: 'Carbs', y: totalCarbs * 4 }, // 4 calories per gram
    { x: 'Protein', y: totalProtein * 4 }, // 4 calories per gram
    { x: 'Fat', y: totalFat * 9 }, // 9 calories per gram
  ];
  
  // Prepare data for calorie intake over time
  const prepareCalorieData = () => {
    const data = [];
    const interval = timeInterval === 'hourly' ? 60 : 30; // minutes
    const totalIntervals = raceDuration / interval;
    
    // Initialize data array with zeros
    for (let i = 0; i < totalIntervals; i++) {
      data.push({ 
        x: i * interval, 
        y: 0,
        label: timeInterval === 'hourly' ? `Hour ${i+1}` : `${i*30} min`
      });
    }
    
    // Add calories from entries
    nutritionEntries.forEach(entry => {
      // Parse timing to get the time point
      // This is a simplified example - you would need to parse the timing string
      const timingMatch = entry.timing?.match(/(\d+)/);
      if (timingMatch) {
        const minutes = parseInt(timingMatch[1], 10);
        const intervalIndex = Math.floor(minutes / interval);
        
        if (intervalIndex >= 0 && intervalIndex < data.length) {
          data[intervalIndex].y += entry.calories || 0;
        }
      }
    });
    
    return data;
  };
  
  // Prepare data for cumulative calorie intake
  const prepareCumulativeData = () => {
    const data = prepareCalorieData();
    let cumulative = 0;
    
    return data.map(point => {
      cumulative += point.y;
      return { ...point, y: cumulative };
    });
  };
  
  // Prepare data for electrolyte balance
  const prepareElectrolyteData = () => {
    return [
      { x: 'Sodium', y: totalSodium },
      { x: 'Potassium', y: totalPotassium },
      { x: 'Magnesium', y: totalMagnesium },
    ];
  };
  
  // Get chart data based on mode
  const getChartData = () => {
    switch (chartMode) {
      case 'calories':
        return prepareCalorieData();
      case 'cumulative':
        return prepareCumulativeData();
      case 'electrolytes':
        return prepareElectrolyteData();
      default:
        return [];
    }
  };
  
  // Render macronutrient pie chart
  const renderMacronutrientPieChart = () => {
    const colors = [theme.colors.primary, theme.colors.secondary, theme.colors.tertiary];
    
    return (
      <Card style={styles.card}>
        <Card.Title title="Macronutrient Distribution" />
        <Card.Content>
          <View style={styles.pieChartContainer}>
            <Svg width={SCREEN_WIDTH - 64} height={200}>
              <VictoryPie
                data={macroData}
                width={SCREEN_WIDTH - 64}
                height={200}
                colorScale={colors}
                innerRadius={40}
                labelRadius={80}
                style={{
                  labels: {
                    fill: isDarkMode ? 'white' : 'black',
                    fontSize: 12,
                  }
                }}
                labels={({ datum }) => `${datum.x}: ${Math.round(datum.y)} cal`}
              />
            </Svg>
          </View>
          
          <View style={styles.macroSummary}>
            <View style={styles.macroItem}>
              <View style={[styles.macroColor, { backgroundColor: colors[0] }]} />
              <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>
                Carbs: {totalCarbs}g ({Math.round(totalCarbs * 4 / totalCalories * 100)}%)
              </Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroColor, { backgroundColor: colors[1] }]} />
              <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>
                Protein: {totalProtein}g ({Math.round(totalProtein * 4 / totalCalories * 100)}%)
              </Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroColor, { backgroundColor: colors[2] }]} />
              <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>
                Fat: {totalFat}g ({Math.round(totalFat * 9 / totalCalories * 100)}%)
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };
  
  // Render calorie summary
  const renderCalorieSummary = () => {
    return (
      <Card style={styles.card}>
        <Card.Title title="Calorie Summary" />
        <Card.Content>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Title>{totalCalories}</Title>
              <Paragraph>Total Calories</Paragraph>
            </View>
            <View style={styles.summaryItem}>
              <Title>{Math.round(caloriesPerHour)}</Title>
              <Paragraph>Calories/Hour</Paragraph>
            </View>
            <View style={styles.summaryItem}>
              <Title>{Math.round(totalCalories / (raceInfo.distance || 50))}</Title>
              <Paragraph>Calories/Mile</Paragraph>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };
  
  // Render chart controls
  const renderChartControls = () => {
    return (
      <View style={styles.chartControls}>
        <SegmentedButtons
          value={chartMode}
          onValueChange={setChartMode}
          buttons={[
            { value: 'calories', label: 'Calories' },
            { value: 'cumulative', label: 'Cumulative' },
            { value: 'electrolytes', label: 'Electrolytes' }
          ]}
          style={styles.segmentedButtons}
        />
        
        {(chartMode === 'calories' || chartMode === 'cumulative') && (
          <SegmentedButtons
            value={timeInterval}
            onValueChange={setTimeInterval}
            buttons={[
              { value: 'hourly', label: 'Hourly' },
              { value: '30min', label: '30 Min' }
            ]}
            style={styles.segmentedButtons}
          />
        )}
      </View>
    );
  };
  
  // Render main chart
  const renderChart = () => {
    const data = getChartData();
    
    if (chartMode === 'electrolytes') {
      return (
        <Card style={styles.card}>
          <Card.Title title="Electrolyte Balance" />
          <Card.Content>
            <View style={styles.chartContainer}>
              <Svg width={SCREEN_WIDTH - 64} height={250}>
                <VictoryChart
                  width={SCREEN_WIDTH - 64}
                  height={250}
                  domainPadding={{ x: 40 }}
                  theme={VictoryTheme.material}
                >
                  <VictoryBar
                    data={data}
                    style={{
                      data: { 
                        fill: ({ datum }) => {
                          if (datum.x === 'Sodium') return theme.colors.error;
                          if (datum.x === 'Potassium') return theme.colors.primary;
                          return theme.colors.secondary;
                        }
                      }
                    }}
                    labels={({ datum }) => `${datum.y}mg`}
                    labelComponent={<VictoryLabel dy={-10} />}
                  />
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
    }
    
    return (
      <Card style={styles.card}>
        <Card.Title title={chartMode === 'calories' ? 'Calorie Intake Over Time' : 'Cumulative Calorie Intake'} />
        <Card.Content>
          <View style={styles.chartContainer}>
            <Svg width={SCREEN_WIDTH - 64} height={250}>
              <VictoryChart
                width={SCREEN_WIDTH - 64}
                height={250}
                theme={VictoryTheme.material}
              >
                {chartMode === 'calories' ? (
                  <VictoryBar
                    data={data}
                    style={{
                      data: { fill: theme.colors.primary }
                    }}
                  />
                ) : (
                  <VictoryLine
                    data={data}
                    style={{
                      data: { stroke: theme.colors.primary, strokeWidth: 2 }
                    }}
                  />
                )}
                <VictoryAxis
                  label={timeInterval === 'hourly' ? 'Hours' : 'Minutes'}
                  style={{
                    axis: { stroke: isDarkMode ? '#fff' : '#000' },
                    axisLabel: { fill: isDarkMode ? '#fff' : '#000', padding: 30 },
                    tickLabels: { fill: isDarkMode ? '#fff' : '#000' }
                  }}
                  tickFormat={(t) => timeInterval === 'hourly' ? t/60 : t}
                />
                <VictoryAxis
                  dependentAxis
                  label="Calories"
                  style={{
                    axis: { stroke: isDarkMode ? '#fff' : '#000' },
                    axisLabel: { fill: isDarkMode ? '#fff' : '#000', padding: 40 },
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
      {renderCalorieSummary()}
      {renderMacronutrientPieChart()}
      {renderChartControls()}
      {renderChart()}
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  pieChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  macroSummary: {
    marginTop: 16,
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  macroColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  chartControls: {
    marginVertical: 8,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 250,
  },
});

export default NutritionAnalytics;