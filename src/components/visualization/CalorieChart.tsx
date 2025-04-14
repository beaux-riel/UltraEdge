import React from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { useAppTheme } from '../../context/ThemeContext';
import { NutritionEntry } from '../../context/NutritionHydrationContext';

const { width } = Dimensions.get('window');

interface CalorieChartProps {
  entries: NutritionEntry[];
  targetCalories?: number;
  timeIntervals?: number;
}

/**
 * Calorie intake chart component
 */
const CalorieChart: React.FC<CalorieChartProps> = ({ 
  entries, 
  targetCalories = 300, 
  timeIntervals = 6 
}) => {
  const { theme, isDarkMode } = useAppTheme();
  
  // Group entries by time intervals
  const groupedEntries = React.useMemo(() => {
    const groups: { [key: string]: number } = {};
    
    // Initialize time intervals
    for (let i = 0; i < timeIntervals; i++) {
      const intervalLabel = `${i * (24 / timeIntervals)}-${(i + 1) * (24 / timeIntervals)}h`;
      groups[intervalLabel] = 0;
    }
    
    // Sum calories for each interval
    entries.forEach(entry => {
      // Parse timing to determine which interval it belongs to
      // This is a simplified example - you would need to parse the timing string
      // and determine the appropriate interval
      const timingMatch = entry.timing?.match(/(\d+)/);
      if (timingMatch) {
        const minutes = parseInt(timingMatch[1], 10);
        const hours = minutes / 60;
        const intervalIndex = Math.min(Math.floor(hours / (24 / timeIntervals)), timeIntervals - 1);
        const intervalLabel = `${intervalIndex * (24 / timeIntervals)}-${(intervalIndex + 1) * (24 / timeIntervals)}h`;
        
        groups[intervalLabel] += entry.calories || 0;
      }
    });
    
    // Convert to array format for BarChart
    return Object.entries(groups).map(([interval, calories]) => ({
      label: interval,
      value: calories,
      frontColor: calories >= targetCalories / timeIntervals ? theme.colors.primary : theme.colors.error,
      topLabelComponent: () => (
        <Text style={{ 
          color: isDarkMode ? '#fff' : '#000', 
          fontSize: 10,
          marginBottom: 4
        }}>
          {calories}
        </Text>
      )
    }));
  }, [entries, timeIntervals, targetCalories, theme.colors.primary, theme.colors.error, isDarkMode]);
  
  // Calculate total calories
  const totalCalories = entries.reduce((sum, entry) => sum + (entry.calories || 0), 0);
  
  // Calculate percentage of target
  const percentOfTarget = Math.round((totalCalories / targetCalories) * 100);
  
  if (entries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>
          No calorie data available
        </Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: isDarkMode ? "#fff" : "#000" }]}>
        Calorie Intake Over Time
      </Text>

      <View style={{ marginVertical: 10 }}>
        <BarChart
          data={groupedEntries}
          width={width * 0.9}
          height={250}
          barWidth={30}
          spacing={10}
          barBorderRadius={4}
          yAxisTextStyle={{ color: isDarkMode ? '#fff' : '#000' }}
          xAxisTextStyle={{ color: isDarkMode ? '#fff' : '#000', fontSize: 8 }}
          noOfSections={5}
          yAxisColor={isDarkMode ? '#fff' : '#000'}
          xAxisColor={isDarkMode ? '#fff' : '#000'}
          backgroundColor={isDarkMode ? '#1e1e1e' : '#fff'}
          rulesColor={isDarkMode ? '#444' : '#e0e0e0'}
          rulesType="dashed"
          showYAxisIndices={true}
          showAnimation={true}
          animationDuration={500}
          disableScroll={true}
          rotateLabel={true}
          xAxisLabelTextStyle={{ color: isDarkMode ? '#fff' : '#000', fontSize: 8 }}
          hideAxesAndRules={false}
        />
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: isDarkMode ? '#fff' : '#000' }]}>
            {totalCalories}
          </Text>
          <Text style={[styles.statLabel, { color: isDarkMode ? '#ccc' : '#666' }]}>
            Total Calories
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: isDarkMode ? '#fff' : '#000' }]}>
            {targetCalories}
          </Text>
          <Text style={[styles.statLabel, { color: isDarkMode ? '#ccc' : '#666' }]}>
            Target Calories
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { 
            color: percentOfTarget >= 100 ? theme.colors.success : theme.colors.error 
          }]}>
            {percentOfTarget}%
          </Text>
          <Text style={[styles.statLabel, { color: isDarkMode ? '#ccc' : '#666' }]}>
            of Target
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    height: 250
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
  }
});

export default CalorieChart;
