import React from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { VictoryPie, VictoryLabel, VictoryLegend } from 'victory-native';
import { useAppTheme } from '../../context/ThemeContext';
import { NutritionEntry } from '../../context/NutritionHydrationContext';

const { width } = Dimensions.get('window');

interface MacronutrientChartProps {
  entries: NutritionEntry[];
  showLegend?: boolean;
  size?: number;
}

/**
 * Macronutrient distribution chart component
 */
const MacronutrientChart: React.FC<MacronutrientChartProps> = ({ 
  entries, 
  showLegend = true,
  size = width * 0.8
}) => {
  const { theme, isDarkMode } = useAppTheme();
  
  // Calculate total macronutrients
  const totalCarbs = entries.reduce((sum, entry) => sum + (entry.carbs || 0), 0);
  const totalProtein = entries.reduce((sum, entry) => sum + (entry.protein || 0), 0);
  const totalFat = entries.reduce((sum, entry) => sum + (entry.fat || 0), 0);
  
  // Calculate total calories from macronutrients
  const carbCalories = totalCarbs * 4;
  const proteinCalories = totalProtein * 4;
  const fatCalories = totalFat * 9;
  const totalCalories = carbCalories + proteinCalories + fatCalories;
  
  // Calculate percentages
  const carbPercentage = totalCalories > 0 ? Math.round((carbCalories / totalCalories) * 100) : 0;
  const proteinPercentage = totalCalories > 0 ? Math.round((proteinCalories / totalCalories) * 100) : 0;
  const fatPercentage = totalCalories > 0 ? Math.round((fatCalories / totalCalories) * 100) : 0;
  
  // Prepare data for the pie chart
  const chartData = [
    { x: `Carbs\n${carbPercentage}%`, y: carbCalories, color: theme.colors.primary },
    { x: `Protein\n${proteinPercentage}%`, y: proteinCalories, color: theme.colors.secondary },
    { x: `Fat\n${fatPercentage}%`, y: fatCalories, color: theme.colors.tertiary }
  ].filter(item => item.y > 0);
  
  // If no data, show empty state
  if (chartData.length === 0 || totalCalories === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>
          No macronutrient data available
        </Text>
      </View>
    );
  }
  
  // Legend data
  const legendData = [
    { name: `Carbs: ${totalCarbs}g (${carbPercentage}%)`, symbol: { fill: theme.colors.primary } },
    { name: `Protein: ${totalProtein}g (${proteinPercentage}%)`, symbol: { fill: theme.colors.secondary } },
    { name: `Fat: ${totalFat}g (${fatPercentage}%)`, symbol: { fill: theme.colors.tertiary } }
  ];
  
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#000' }]}>
        Macronutrient Distribution
      </Text>
      
      <View style={styles.chartContainer}>
        <VictoryPie
          data={chartData}
          width={size}
          height={size}
          colorScale={chartData.map(d => d.color)}
          innerRadius={size / 5}
          labelRadius={size / 3}
          style={{
            labels: {
              fill: isDarkMode ? '#fff' : '#000',
              fontSize: 14,
              fontWeight: 'bold'
            }
          }}
          animate={{ duration: 500 }}
        />
        
        <View style={styles.calorieContainer}>
          <Text style={[styles.calorieValue, { color: isDarkMode ? '#fff' : '#000' }]}>
            {totalCalories}
          </Text>
          <Text style={[styles.calorieLabel, { color: isDarkMode ? '#ccc' : '#666' }]}>
            calories
          </Text>
        </View>
      </View>
      
      {showLegend && (
        <VictoryLegend
          x={0}
          y={0}
          width={width * 0.9}
          height={80}
          centerTitle
          orientation="horizontal"
          gutter={20}
          style={{
            labels: { fill: isDarkMode ? '#fff' : '#000' }
          }}
          data={legendData}
        />
      )}
      
      <View style={styles.macroDetails}>
        <View style={styles.macroItem}>
          <Text style={[styles.macroValue, { color: theme.colors.primary }]}>
            {totalCarbs}g
          </Text>
          <Text style={[styles.macroLabel, { color: isDarkMode ? '#ccc' : '#666' }]}>
            Carbs
          </Text>
        </View>
        
        <View style={styles.macroItem}>
          <Text style={[styles.macroValue, { color: theme.colors.secondary }]}>
            {totalProtein}g
          </Text>
          <Text style={[styles.macroLabel, { color: isDarkMode ? '#ccc' : '#666' }]}>
            Protein
          </Text>
        </View>
        
        <View style={styles.macroItem}>
          <Text style={[styles.macroValue, { color: theme.colors.tertiary }]}>
            {totalFat}g
          </Text>
          <Text style={[styles.macroLabel, { color: isDarkMode ? '#ccc' : '#666' }]}>
            Fat
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
  chartContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calorieContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calorieValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  calorieLabel: {
    fontSize: 14,
  },
  macroDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 16,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  macroLabel: {
    fontSize: 14,
  },
  emptyContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MacronutrientChart;