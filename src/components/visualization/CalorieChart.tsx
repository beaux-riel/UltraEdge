import React from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import * as Victory from "victory-native";
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

  console.log({ Victory });
  
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

      <Victory.CartesianChart
        width={width * 0.9}
        height={250}
        domainPadding={{ x: 20 }}
        padding={{ top: 20, bottom: 50, left: 50, right: 20 }}
      >
        <Victory.CartesianAxis
          tickFormat={(t) => t}
          style={{
            axis: { stroke: isDarkMode ? "#fff" : "#000" },
            tickLabels: {
              fill: isDarkMode ? "#fff" : "#000",
              fontSize: 10,
              angle: -45,
              textAnchor: "end",
            },
            grid: {
              stroke: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
            },
          }}
        />
        <Victory.CartesianAxis
          dependentAxis
          tickFormat={(t) => `${t}`}
          style={{
            axis: { stroke: isDarkMode ? "#fff" : "#000" },
            tickLabels: {
              fill: isDarkMode ? "#fff" : "#000",
              fontSize: 10,
            },
            grid: {
              stroke: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
            },
          }}
        />
        <Victory.Bar
          data={groupedEntries}
          x="interval"
          y="calories"
          style={{
            data: {
              fill: ({ datum }) =>
                datum.calories >= targetCalories / timeIntervals
                  ? theme.colors.primary
                  : theme.colors.error,
              width: 20,
            },
          }}
          animate={{
            duration: 500,
            onLoad: { duration: 300 },
          }}
        />
      </Victory.CartesianChart>
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
  }
});

export default CalorieChart;
