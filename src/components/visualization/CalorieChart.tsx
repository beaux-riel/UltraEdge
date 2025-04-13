import React from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTheme, VictoryLabel } from 'victory-native';
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
    
    // Convert to array format for VictoryBar
    return Object.entries(groups).map(([interval, calories]) => ({
      interval,
      calories,
    }));
  }, [entries, timeIntervals]);
  
  // Calculate total calories
  const totalCalories = entries.reduce((sum, entry) => sum + (entry.calories || 0), 0);
  
  // Calculate average calories per hour
  const avgCaloriesPerHour = totalCalories / 24;
  
  // If no data, show empty state
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
      <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#000' }]}>
        Calorie Intake Over Time
      </Text>
      
      <VictoryChart
        width={width * 0.9}
        height={250}
        domainPadding={{ x: 20 }}
        theme={VictoryTheme.material}
      >
        <VictoryAxis
          tickFormat={(t) => t}
          style={{
            axis: { stroke: isDarkMode ? '#fff' : '#000' },
            tickLabels: { 
              fill: isDarkMode ? '#fff' : '#000',
              fontSize: 10,
              angle: -45,
              textAnchor: 'end'
            }
          }}
        />
        <VictoryAxis
          dependentAxis
          tickFormat={(t) => `${t}`}
          style={{
            axis: { stroke: isDarkMode ? '#fff' : '#000' },
            tickLabels: { fill: isDarkMode ? '#fff' : '#000' }
          }}
        />
        <VictoryBar
          data={groupedEntries}
          x="interval"
          y="calories"
          style={{
            data: {
              fill: ({ datum }) => datum.calories >= targetCalories / timeIntervals 
                ? theme.colors.primary 
                : theme.colors.error,
              width: 20
            }
          }}
          animate={{
            duration: 500,
            onLoad: { duration: 300 }
          }}
        />
      </VictoryChart>
      
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
            {Math.round(avgCaloriesPerHour)}
          </Text>
          <Text style={[styles.statLabel, { color: isDarkMode ? '#ccc' : '#666' }]}>
            Avg Cal/Hour
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
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
  },
  emptyContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CalorieChart;