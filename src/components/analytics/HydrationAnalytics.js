import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, Dimensions } from 'react-native';
import { Card, Title, Paragraph, SegmentedButtons, ProgressBar } from 'react-native-paper';
import { useAppTheme } from '../../context/ThemeContext';
import { 
  VictoryChart, 
  VictoryLine, 
  VictoryAxis, 
  VictoryTheme,
  VictoryBar,
  VictoryLabel,
  VictoryLegend,
  VictoryScatter
} from 'victory-native';
import Svg from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Hydration analytics component for visualizing hydration data
 * @param {Object} props - Component props
 * @param {Array} props.hydrationEntries - Array of hydration entries
 * @param {Object} props.raceInfo - Race information (duration, distance, weather)
 * @param {string} props.mode - Display mode: 'time' or 'distance'
 */
const HydrationAnalytics = ({ 
  hydrationEntries = [], 
  raceInfo = {}, 
  mode = 'time' 
}) => {
  const { theme, isDarkMode } = useAppTheme();
  const [chartMode, setChartMode] = useState('volume');
  const [timeInterval, setTimeInterval] = useState('hourly');
  
  // Calculate total fluid volume
  const totalVolume = hydrationEntries.reduce((sum, entry) => {
    // Convert to ml for consistency
    let volume = entry.volume || 0;
    if (entry.volumeUnit === 'oz') {
      volume *= 29.5735; // Convert oz to ml
    } else if (entry.volumeUnit === 'L') {
      volume *= 1000; // Convert L to ml
    }
    return sum + volume;
  }, 0);
  
  // Calculate total electrolytes
  const totalElectrolytes = hydrationEntries.reduce((sum, entry) => {
    const sodium = entry.electrolytes?.sodium || 0;
    const potassium = entry.electrolytes?.potassium || 0;
    const magnesium = entry.electrolytes?.magnesium || 0;
    return sum + sodium + potassium + magnesium;
  }, 0);
  
  // Calculate fluid per hour
  const raceDuration = raceInfo.duration || 720; // 12 hours default
  const fluidPerHour = totalVolume / (raceDuration / 60);
  
  // Calculate carried weight
  const carriedVolume = hydrationEntries
    .filter(entry => entry.sourceLocation === 'carried')
    .reduce((sum, entry) => {
      let volume = entry.volume || 0;
      if (entry.volumeUnit === 'oz') {
        volume *= 29.5735; // Convert oz to ml
      } else if (entry.volumeUnit === 'L') {
        volume *= 1000; // Convert L to ml
      }
      return sum + volume;
    }, 0);
  
  const carriedWeight = carriedVolume / 1000; // 1L = 1kg
  
  // Calculate hydration status based on weather and intensity
  const calculateHydrationStatus = () => {
    // Base rate in ml/hour
    let baseRate = 500; // Default moderate rate
    
    // Adjust for weather
    if (raceInfo.weather === 'hot') {
      baseRate += 250;
    } else if (raceInfo.weather === 'cold') {
      baseRate -= 100;
    }
    
    // Adjust for intensity
    if (raceInfo.intensity === 'high') {
      baseRate += 200;
    } else if (raceInfo.intensity === 'low') {
      baseRate -= 100;
    }
    
    // Calculate recommended total fluid
    const recommendedTotal = baseRate * (raceDuration / 60);
    
    // Calculate status as percentage of recommended
    return Math.min(totalVolume / recommendedTotal, 1);
  };
  
  // Prepare data for fluid intake over time
  const prepareVolumeData = () => {
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
    
    // Add volume from entries
    hydrationEntries.forEach(entry => {
      // Parse timing to get the time point
      // This is a simplified example - you would need to parse the timing string
      const timingMatch = entry.timing?.match(/(\d+)/);
      if (timingMatch) {
        const minutes = parseInt(timingMatch[1], 10);
        const intervalIndex = Math.floor(minutes / interval);
        
        if (intervalIndex >= 0 && intervalIndex < data.length) {
          // Convert to ml for consistency
          let volume = entry.volume || 0;
          if (entry.volumeUnit === 'oz') {
            volume *= 29.5735; // Convert oz to ml
          } else if (entry.volumeUnit === 'L') {
            volume *= 1000; // Convert L to ml
          }
          
          data[intervalIndex].y += volume;
        }
      }
    });
    
    return data;
  };
  
  // Prepare data for cumulative fluid intake
  const prepareCumulativeData = () => {
    const data = prepareVolumeData();
    let cumulative = 0;
    
    return data.map(point => {
      cumulative += point.y;
      return { ...point, y: cumulative };
    });
  };
  
  // Prepare data for electrolyte concentration
  const prepareElectrolyteData = () => {
    const data = [];
    const interval = timeInterval === 'hourly' ? 60 : 30; // minutes
    const totalIntervals = raceDuration / interval;
    
    // Initialize data arrays with zeros
    for (let i = 0; i < totalIntervals; i++) {
      data.push({ 
        x: i * interval, 
        y: 0,
        volume: 0
      });
    }
    
    // Add electrolytes and volume from entries
    hydrationEntries.forEach(entry => {
      // Parse timing to get the time point
      const timingMatch = entry.timing?.match(/(\d+)/);
      if (timingMatch) {
        const minutes = parseInt(timingMatch[1], 10);
        const intervalIndex = Math.floor(minutes / interval);
        
        if (intervalIndex >= 0 && intervalIndex < data.length) {
          // Convert to ml for consistency
          let volume = entry.volume || 0;
          if (entry.volumeUnit === 'oz') {
            volume *= 29.5735; // Convert oz to ml
          } else if (entry.volumeUnit === 'L') {
            volume *= 1000; // Convert L to ml
          }
          
          // Add electrolytes
          const sodium = entry.electrolytes?.sodium || 0;
          const potassium = entry.electrolytes?.potassium || 0;
          const magnesium = entry.electrolytes?.magnesium || 0;
          
          data[intervalIndex].volume += volume;
          data[intervalIndex].y += sodium + potassium + magnesium;
        }
      }
    });
    
    // Calculate concentration (mg/L)
    return data.map(point => ({
      ...point,
      y: point.volume > 0 ? (point.y / point.volume) * 1000 : 0
    }));
  };
  
  // Get chart data based on mode
  const getChartData = () => {
    switch (chartMode) {
      case 'volume':
        return prepareVolumeData();
      case 'cumulative':
        return prepareCumulativeData();
      case 'electrolytes':
        return prepareElectrolyteData();
      default:
        return [];
    }
  };
  
  // Render hydration status
  const renderHydrationStatus = () => {
    const status = calculateHydrationStatus();
    let statusText = 'Adequate';
    let statusColor = theme.colors.primary;
    
    if (status < 0.7) {
      statusText = 'Insufficient';
      statusColor = theme.colors.error;
    } else if (status > 0.9) {
      statusText = 'Optimal';
      statusColor = theme.colors.success;
    }
    
    return (
      <Card style={styles.card}>
        <Card.Title title="Hydration Status" />
        <Card.Content>
          <View style={styles.statusContainer}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusText}
            </Text>
            <ProgressBar
              progress={status}
              color={statusColor}
              style={styles.statusBar}
            />
            <Text style={{ color: isDarkMode ? '#fff' : '#000', textAlign: 'center', marginTop: 8 }}>
              {Math.round(status * 100)}% of recommended intake
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };
  
  // Render fluid summary
  const renderFluidSummary = () => {
    return (
      <Card style={styles.card}>
        <Card.Title title="Fluid Summary" />
        <Card.Content>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Title>{(totalVolume / 1000).toFixed(1)}L</Title>
              <Paragraph>Total Volume</Paragraph>
            </View>
            <View style={styles.summaryItem}>
              <Title>{Math.round(fluidPerHour)}ml</Title>
              <Paragraph>ml/Hour</Paragraph>
            </View>
            <View style={styles.summaryItem}>
              <Title>{carriedWeight.toFixed(1)}kg</Title>
              <Paragraph>Carried Weight</Paragraph>
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
            { value: 'volume', label: 'Volume' },
            { value: 'cumulative', label: 'Cumulative' },
            { value: 'electrolytes', label: 'Electrolytes' }
          ]}
          style={styles.segmentedButtons}
        />
        
        {(chartMode === 'volume' || chartMode === 'cumulative') && (
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
          <Card.Title title="Electrolyte Concentration" />
          <Card.Content>
            <View style={styles.chartContainer}>
              <Svg width={SCREEN_WIDTH - 64} height={250}>
                <VictoryChart
                  width={SCREEN_WIDTH - 64}
                  height={250}
                  theme={VictoryTheme.material}
                >
                  <VictoryLine
                    data={data}
                    style={{
                      data: { stroke: theme.colors.primary, strokeWidth: 2 }
                    }}
                  />
                  <VictoryScatter
                    data={data}
                    size={4}
                    style={{
                      data: { fill: theme.colors.primary }
                    }}
                  />
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
                    label="Concentration (mg/L)"
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
    }
    
    return (
      <Card style={styles.card}>
        <Card.Title title={chartMode === 'volume' ? 'Fluid Intake Over Time' : 'Cumulative Fluid Intake'} />
        <Card.Content>
          <View style={styles.chartContainer}>
            <Svg width={SCREEN_WIDTH - 64} height={250}>
              <VictoryChart
                width={SCREEN_WIDTH - 64}
                height={250}
                theme={VictoryTheme.material}
              >
                {chartMode === 'volume' ? (
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
                  label="Volume (ml)"
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
      {renderHydrationStatus()}
      {renderFluidSummary()}
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
  statusContainer: {
    marginVertical: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  statusBar: {
    height: 10,
    borderRadius: 5,
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

export default HydrationAnalytics;