import React from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTheme, VictoryGroup } from 'victory-native';
import { useAppTheme } from '../../context/ThemeContext';
import { NutritionEntry, HydrationEntry } from '../../context/NutritionHydrationContext';

const { width } = Dimensions.get('window');

interface ElectrolyteChartProps {
  nutritionEntries: NutritionEntry[];
  hydrationEntries: HydrationEntry[];
  targetSodium?: number;
  targetPotassium?: number;
  targetMagnesium?: number;
}

/**
 * Electrolyte intake chart component
 */
const ElectrolyteChart: React.FC<ElectrolyteChartProps> = ({ 
  nutritionEntries, 
  hydrationEntries,
  targetSodium = 1000,
  targetPotassium = 500,
  targetMagnesium = 200
}) => {
  const { theme, isDarkMode } = useAppTheme();
  
  // Calculate total electrolytes from nutrition entries
  const nutritionSodium = nutritionEntries.reduce((sum, entry) => sum + (entry.sodium || 0), 0);
  const nutritionPotassium = nutritionEntries.reduce((sum, entry) => sum + (entry.potassium || 0), 0);
  const nutritionMagnesium = nutritionEntries.reduce((sum, entry) => sum + (entry.magnesium || 0), 0);
  
  // Calculate total electrolytes from hydration entries
  const hydrationSodium = hydrationEntries.reduce((sum, entry) => sum + (entry.electrolytes?.sodium || 0), 0);
  const hydrationPotassium = hydrationEntries.reduce((sum, entry) => sum + (entry.electrolytes?.potassium || 0), 0);
  const hydrationMagnesium = hydrationEntries.reduce((sum, entry) => sum + (entry.electrolytes?.magnesium || 0), 0);
  
  // Total electrolytes
  const totalSodium = nutritionSodium + hydrationSodium;
  const totalPotassium = nutritionPotassium + hydrationPotassium;
  const totalMagnesium = nutritionMagnesium + hydrationMagnesium;
  
  // Prepare data for the chart
  const nutritionData = [
    { electrolyte: 'Sodium', amount: nutritionSodium },
    { electrolyte: 'Potassium', amount: nutritionPotassium },
    { electrolyte: 'Magnesium', amount: nutritionMagnesium }
  ];
  
  const hydrationData = [
    { electrolyte: 'Sodium', amount: hydrationSodium },
    { electrolyte: 'Potassium', amount: hydrationPotassium },
    { electrolyte: 'Magnesium', amount: hydrationMagnesium }
  ];
  
  const targetData = [
    { electrolyte: 'Sodium', amount: targetSodium },
    { electrolyte: 'Potassium', amount: targetPotassium },
    { electrolyte: 'Magnesium', amount: targetMagnesium }
  ];
  
  // If no data, show empty state
  if (nutritionEntries.length === 0 && hydrationEntries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>
          No electrolyte data available
        </Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#000' }]}>
        Electrolyte Intake
      </Text>
      
      <VictoryChart
        width={width * 0.9}
        height={250}
        domainPadding={{ x: 30 }}
        theme={VictoryTheme.material}
      >
        <VictoryAxis
          tickFormat={['Sodium', 'Potassium', 'Magnesium']}
          style={{
            axis: { stroke: isDarkMode ? '#fff' : '#000' },
            tickLabels: { fill: isDarkMode ? '#fff' : '#000' }
          }}
        />
        <VictoryAxis
          dependentAxis
          tickFormat={(t) => `${t}mg`}
          style={{
            axis: { stroke: isDarkMode ? '#fff' : '#000' },
            tickLabels: { fill: isDarkMode ? '#fff' : '#000' }
          }}
        />
        
        <VictoryGroup
          offset={20}
          colorScale={[theme.colors.primary, theme.colors.blue, theme.colors.secondary]}
        >
          <VictoryBar
            data={nutritionData}
            x="electrolyte"
            y="amount"
            animate={{
              duration: 500,
              onLoad: { duration: 300 }
            }}
          />
          <VictoryBar
            data={hydrationData}
            x="electrolyte"
            y="amount"
            animate={{
              duration: 500,
              onLoad: { duration: 300 }
            }}
          />
          <VictoryBar
            data={targetData}
            x="electrolyte"
            y="amount"
            style={{
              data: {
                fill: 'transparent',
                stroke: theme.colors.secondary,
                strokeWidth: 2,
                strokeDasharray: '5,5'
              }
            }}
            animate={{
              duration: 500,
              onLoad: { duration: 300 }
            }}
          />
        </VictoryGroup>
      </VictoryChart>
      
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: theme.colors.primary }]} />
          <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>Nutrition</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: theme.colors.blue }]} />
          <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>Hydration</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { 
            borderWidth: 2, 
            borderColor: theme.colors.secondary,
            backgroundColor: 'transparent'
          }]} />
          <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>Target</Text>
        </View>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: isDarkMode ? '#fff' : '#000' }]}>
            {totalSodium}mg
          </Text>
          <Text style={[styles.statLabel, { color: isDarkMode ? '#ccc' : '#666' }]}>
            Sodium
          </Text>
          <Text style={[styles.statPercent, { 
            color: totalSodium >= targetSodium ? theme.colors.success : theme.colors.error 
          }]}>
            {Math.round((totalSodium / targetSodium) * 100)}%
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: isDarkMode ? '#fff' : '#000' }]}>
            {totalPotassium}mg
          </Text>
          <Text style={[styles.statLabel, { color: isDarkMode ? '#ccc' : '#666' }]}>
            Potassium
          </Text>
          <Text style={[styles.statPercent, { 
            color: totalPotassium >= targetPotassium ? theme.colors.success : theme.colors.error 
          }]}>
            {Math.round((totalPotassium / targetPotassium) * 100)}%
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: isDarkMode ? '#fff' : '#000' }]}>
            {totalMagnesium}mg
          </Text>
          <Text style={[styles.statLabel, { color: isDarkMode ? '#ccc' : '#666' }]}>
            Magnesium
          </Text>
          <Text style={[styles.statPercent, { 
            color: totalMagnesium >= targetMagnesium ? theme.colors.success : theme.colors.error 
          }]}>
            {Math.round((totalMagnesium / targetMagnesium) * 100)}%
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
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    marginRight: 4,
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
  statPercent: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  emptyContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ElectrolyteChart;