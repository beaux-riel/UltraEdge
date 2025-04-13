import React from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { VictoryLine, VictoryChart, VictoryAxis, VictoryTheme, VictoryArea, VictoryScatter } from 'victory-native';
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
    
    // Convert to array format for VictoryLine
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
      
      <VictoryChart
        width={width * 0.9}
        height={250}
        theme={VictoryTheme.material}
      >
        <VictoryAxis
          tickFormat={(t) => `${t}h`}
          style={{
            axis: { stroke: isDarkMode ? '#fff' : '#000' },
            tickLabels: { fill: isDarkMode ? '#fff' : '#000' }
          }}
        />
        <VictoryAxis
          dependentAxis
          tickFormat={(t) => `${t}ml`}
          style={{
            axis: { stroke: isDarkMode ? '#fff' : '#000' },
            tickLabels: { fill: isDarkMode ? '#fff' : '#000' }
          }}
        />
        
        {/* Target volume line */}
        <VictoryLine
          data={[
            { time: 0, volume: 0 },
            { time: 24, volume: targetVolume }
          ]}
          x="time"
          y="volume"
          style={{
            data: { 
              stroke: theme.colors.secondary,
              strokeDasharray: '5,5',
              strokeWidth: 2
            }
          }}
        />
        
        {/* Cumulative volume area */}
        <VictoryArea
          data={cumulativeData}
          x="time"
          y="volume"
          style={{
            data: { 
              fill: theme.colors.blue,
              fillOpacity: 0.3,
              stroke: theme.colors.blue,
              strokeWidth: 2
            }
          }}
          animate={{
            duration: 500,
            onLoad: { duration: 300 }
          }}
        />
        
        {/* Data points */}
        <VictoryScatter
          data={cumulativeData}
          x="time"
          y="volume"
          size={5}
          style={{
            data: { 
              fill: theme.colors.blue
            }
          }}
        />
      </VictoryChart>
      
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