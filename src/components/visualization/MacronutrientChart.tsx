import React from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
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
  const pieData = [
    { value: carbCalories, color: theme.colors.primary, text: `${carbPercentage}%`, name: 'Carbs' },
    { value: proteinCalories, color: theme.colors.secondary, text: `${proteinPercentage}%`, name: 'Protein' },
    { value: fatCalories, color: theme.colors.tertiary, text: `${fatPercentage}%`, name: 'Fat' }
  ].filter(item => item.value > 0);
  
  // If no data, show empty state
  if (pieData.length === 0 || totalCalories === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>
          No macronutrient data available
        </Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#000' }]}>
        Macronutrient Distribution
      </Text>
      
      <View style={styles.chartContainer}>
        <PieChart
          data={pieData}
          donut
          showGradient={false}
          sectionAutoFocus
          radius={size / 2.5}
          innerRadius={size / 5}
          innerCircleColor={isDarkMode ? '#1e1e1e' : '#fff'}
          centerLabelComponent={() => (
            <View style={styles.calorieContainer}>
              <Text style={[styles.calorieValue, { color: isDarkMode ? '#fff' : '#000' }]}>
                {totalCalories}
              </Text>
              <Text style={[styles.calorieLabel, { color: isDarkMode ? '#ccc' : '#666' }]}>
                calories
              </Text>
            </View>
          )}
          textColor={isDarkMode ? '#fff' : '#000'}
          textSize={14}
          fontWeight="bold"
          strokeWidth={0}
          focusOnPress
          showValuesAsLabels={false}
          showText
        />
      </View>
      
      {showLegend && (
        <View style={styles.legendContainer}>
          {pieData.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>
                {item.name}: {item.text}
              </Text>
            </View>
          ))}
        </View>
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
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
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