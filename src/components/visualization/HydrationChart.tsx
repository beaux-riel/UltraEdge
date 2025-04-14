import React from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useAppTheme } from '../../context/ThemeContext';
import { HydrationEntry } from '../../context/NutritionHydrationContext';

const { width } = Dimensions.get('window');

interface HydrationChartProps {
  entries: HydrationEntry[];
  targetVolume?: number;
  timeIntervals?: number;
}

/**
 * Hydration intake chart component
 */
const HydrationChart: React.FC<HydrationChartProps> = ({ 
  entries, 
  targetVolume = 500, 
  timeIntervals = 6 
}) => {
  const { theme, isDarkMode } = useAppTheme();
  
  // Group entries by time intervals
  const groupedEntries = React.useMemo(() => {
    const groups: { [key: string]: number } = {};
    
    // Initialize time intervals
    for (let i = 0; i < timeIntervals; i++) {
      const intervalLabel = `${i * (24 / timeIntervals)}`;
      groups[intervalLabel] = 0;
    }
    
    // Sum volumes for each interval
    entries.forEach(entry => {
      // Parse timing to determine which interval it belongs to
      // This is a simplified example - you would need to parse the timing string
      // and determine the appropriate interval
      const timingMatch = entry.timing?.match(/(\d+)/);
      if (timingMatch) {
        const minutes = parseInt(timingMatch[1], 10);
        const hours = minutes / 60;
        const intervalIndex = Math.min(Math.floor(hours / (24 / timeIntervals)), timeIntervals - 1);
        const intervalLabel = `${intervalIndex * (24 / timeIntervals)}`;
        
        groups[intervalLabel] += entry.volume || 0;
      }
    });
    
    // Convert to array format for LineChart
    return Object.entries(groups).map(([time, volume]) => ({
      time: parseFloat(time),
      volume,
    })).sort((a, b) => a.time - b.time);
  }, [entries, timeIntervals]);
  
  // Calculate cumulative volume over time
  const cumulativeData = React.useMemo(() => {
    let cumulative = 0;
    return groupedEntries.map(entry => {
      cumulative += entry.volume;
      return {
        time: entry.time,
        volume: cumulative
      };
    });
  }, [groupedEntries]);
  
  // Format data for react-native-gifted-charts
  const lineData = cumulativeData.map(entry => ({
    value: entry.volume,
    label: `${entry.time}h`,
    dataPointText: entry.volume.toString(),
  }));
  
  // Create target line data
  const targetLineData = [
    { value: 0, label: '0h' },
    { value: targetVolume, label: '24h' }
  ];
  
  // Calculate total volume
  const totalVolume = entries.reduce((sum, entry) => sum + (entry.volume || 0), 0);
  
  // Calculate average volume per hour
  const avgVolumePerHour = totalVolume / 24;
  
  // If no data, show empty state
  if (entries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>
          No hydration data available
        </Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#000' }]}>
        Hydration Intake Over Time
      </Text>
      
      <View style={{ marginVertical: 10 }}>
        <LineChart
          data={lineData}
          width={width * 0.9}
          height={250}
          areaChart
          curved
          color={theme.colors.blue}
          dataPointsColor={theme.colors.blue}
          startFillColor={theme.colors.blue}
          endFillColor={isDarkMode ? '#1e1e1e' : '#fff'}
          startOpacity={0.4}
          endOpacity={0.1}
          spacing={width * 0.9 / (timeIntervals + 1)}
          thickness={3}
          hideRules
          yAxisColor={isDarkMode ? '#fff' : '#000'}
          xAxisColor={isDarkMode ? '#fff' : '#000'}
          yAxisTextStyle={{ color: isDarkMode ? '#fff' : '#000' }}
          xAxisTextStyle={{ color: isDarkMode ? '#fff' : '#000' }}
          yAxisLabelSuffix="ml"
          backgroundColor={isDarkMode ? '#1e1e1e' : '#fff'}
          rulesColor={isDarkMode ? '#444' : '#e0e0e0'}
          rulesType="dashed"
          showYAxisIndices={true}
          showAnimation={true}
          animationDuration={500}
          disableScroll={true}
          secondaryData={targetLineData}
          secondaryLineConfig={{
            color: theme.colors.secondary,
            thickness: 2,
            dashWidth: 5,
            dashGap: 5,
            dataPointsRadius: 0,
          }}
        />
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: isDarkMode ? '#fff' : '#000' }]}>
            {totalVolume}ml
          </Text>
          <Text style={[styles.statLabel, { color: isDarkMode ? '#ccc' : '#666' }]}>
            Total Volume
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: isDarkMode ? '#fff' : '#000' }]}>
            {Math.round(avgVolumePerHour)}ml
          </Text>
          <Text style={[styles.statLabel, { color: isDarkMode ? '#ccc' : '#666' }]}>
            Avg ml/Hour
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: isDarkMode ? '#fff' : '#000' }]}>
            {targetVolume}ml
          </Text>
          <Text style={[styles.statLabel, { color: isDarkMode ? '#ccc' : '#666' }]}>
            Target Volume
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

export default HydrationChart;