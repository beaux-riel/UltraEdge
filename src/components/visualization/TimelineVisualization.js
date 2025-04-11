import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Text, 
  TouchableOpacity, 
  Dimensions,
  Animated,
  PanResponder
} from 'react-native';
import { Card, IconButton, Tooltip, Portal, Modal, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import Svg, { Line, Circle, Rect, Text as SvgText, G } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Timeline visualization component for nutrition and hydration entries
 * @param {Object} props - Component props
 * @param {Array} props.nutritionEntries - Array of nutrition entries
 * @param {Array} props.hydrationEntries - Array of hydration entries
 * @param {Object} props.raceInfo - Race information (start time, end time, milestones)
 * @param {string} props.mode - Display mode: 'time' or 'distance'
 * @param {function} props.onEntryPress - Function called when an entry is pressed
 */
const TimelineVisualization = ({ 
  nutritionEntries = [], 
  hydrationEntries = [], 
  raceInfo = {}, 
  mode = 'time',
  onEntryPress = () => {}
}) => {
  const { theme, isDarkMode } = useAppTheme();
  const scrollViewRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [timelineWidth, setTimelineWidth] = useState(SCREEN_WIDTH * 2);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [timelineHeight, setTimelineHeight] = useState(200);
  
  // Pan and zoom handling
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value
        });
      },
      onPanResponderMove: Animated.event(
        [
          null,
          { dx: pan.x, dy: pan.y }
        ],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      }
    })
  ).current;
  
  // Handle zoom in
  const handleZoomIn = () => {
    const newZoomLevel = Math.min(zoomLevel + 0.5, 4);
    setZoomLevel(newZoomLevel);
    setTimelineWidth(SCREEN_WIDTH * 2 * newZoomLevel);
    Animated.spring(scale, {
      toValue: newZoomLevel,
      friction: 3,
      useNativeDriver: false
    }).start();
  };
  
  // Handle zoom out
  const handleZoomOut = () => {
    const newZoomLevel = Math.max(zoomLevel - 0.5, 0.5);
    setZoomLevel(newZoomLevel);
    setTimelineWidth(SCREEN_WIDTH * 2 * newZoomLevel);
    Animated.spring(scale, {
      toValue: newZoomLevel,
      friction: 3,
      useNativeDriver: false
    }).start();
  };
  
  // Handle entry press
  const handleEntryPress = (entry) => {
    setSelectedEntry(entry);
    setModalVisible(true);
  };
  
  // Calculate timeline position for an entry
  const calculateTimelinePosition = (entry) => {
    if (mode === 'time') {
      // Calculate position based on timing
      // This is a simplified example - you would need to parse the timing string
      // and convert it to a position on the timeline
      const timingMatch = entry.timing?.match(/(\d+)/);
      if (timingMatch) {
        const minutes = parseInt(timingMatch[1], 10);
        return (minutes / (raceInfo.duration || 720)) * timelineWidth;
      }
      return 100; // Default position if timing can't be parsed
    } else {
      // Calculate position based on distance
      // This would depend on your data structure
      return (entry.distance / (raceInfo.distance || 50)) * timelineWidth;
    }
  };
  
  // Get color for entry type
  const getEntryColor = (entry, isNutrition) => {
    if (isNutrition) {
      // Color based on nutrition type
      if (entry.foodType?.toLowerCase().includes('gel')) {
        return theme.colors.primary;
      } else if (entry.foodType?.toLowerCase().includes('bar')) {
        return theme.colors.secondary;
      } else if (entry.foodType?.toLowerCase().includes('drink')) {
        return theme.colors.tertiary;
      }
      return theme.colors.primary;
    } else {
      // Color based on hydration type
      if (entry.liquidType?.toLowerCase().includes('water')) {
        return theme.colors.blue;
      } else if (entry.liquidType?.toLowerCase().includes('electrolyte')) {
        return theme.colors.purple;
      } else if (entry.liquidType?.toLowerCase().includes('soda')) {
        return theme.colors.orange;
      }
      return theme.colors.blue;
    }
  };
  
  // Render timeline markers
  const renderTimelineMarkers = () => {
    const markers = [];
    const totalDuration = raceInfo.duration || 720; // 12 hours default
    const interval = mode === 'time' ? 60 : 5; // 1 hour or 5 miles
    const totalIntervals = mode === 'time' ? totalDuration / interval : raceInfo.distance / interval;
    
    for (let i = 0; i <= totalIntervals; i++) {
      const position = (i / totalIntervals) * timelineWidth;
      const label = mode === 'time' 
        ? `${Math.floor(i * interval / 60)}h${i * interval % 60 ? i * interval % 60 + 'm' : ''}`
        : `${i * interval} ${raceInfo.distanceUnit || 'mi'}`;
        
      markers.push(
        <G key={`marker-${i}`}>
          <Line
            x1={position}
            y1={0}
            x2={position}
            y2={timelineHeight}
            stroke={isDarkMode ? '#555' : '#ddd'}
            strokeWidth={i % 5 === 0 ? 2 : 1}
          />
          <SvgText
            x={position}
            y={timelineHeight - 5}
            fill={isDarkMode ? '#aaa' : '#666'}
            fontSize={12}
            textAnchor="middle"
          >
            {label}
          </SvgText>
        </G>
      );
    }
    
    return markers;
  };
  
  // Render milestone markers
  const renderMilestones = () => {
    if (!raceInfo.milestones || !raceInfo.milestones.length) return null;
    
    return raceInfo.milestones.map((milestone, index) => {
      const position = mode === 'time'
        ? (milestone.time / (raceInfo.duration || 720)) * timelineWidth
        : (milestone.distance / (raceInfo.distance || 50)) * timelineWidth;
        
      return (
        <G key={`milestone-${index}`}>
          <Line
            x1={position}
            y1={0}
            x2={position}
            y2={timelineHeight}
            stroke={theme.colors.error}
            strokeWidth={2}
            strokeDasharray="5,5"
          />
          <Circle
            cx={position}
            cy={20}
            r={8}
            fill={theme.colors.error}
          />
          <SvgText
            x={position}
            y={40}
            fill={theme.colors.error}
            fontSize={12}
            textAnchor="middle"
          >
            {milestone.name}
          </SvgText>
        </G>
      );
    });
  };
  
  // Render nutrition entries
  const renderNutritionEntries = () => {
    return nutritionEntries.map((entry, index) => {
      const position = calculateTimelinePosition(entry);
      const color = getEntryColor(entry, true);
      
      return (
        <G 
          key={`nutrition-${index}`}
          onPress={() => handleEntryPress({ ...entry, type: 'nutrition' })}
        >
          <Circle
            cx={position}
            cy={60}
            r={10}
            fill={color}
          />
          <SvgText
            x={position}
            y={80}
            fill={isDarkMode ? '#fff' : '#000'}
            fontSize={10}
            textAnchor="middle"
          >
            {entry.foodType?.substring(0, 10)}
          </SvgText>
        </G>
      );
    });
  };
  
  // Render hydration entries
  const renderHydrationEntries = () => {
    return hydrationEntries.map((entry, index) => {
      const position = calculateTimelinePosition(entry);
      const color = getEntryColor(entry, false);
      
      return (
        <G 
          key={`hydration-${index}`}
          onPress={() => handleEntryPress({ ...entry, type: 'hydration' })}
        >
          <Rect
            x={position - 8}
            y={100}
            width={16}
            height={16}
            fill={color}
            rx={4}
          />
          <SvgText
            x={position}
            y={130}
            fill={isDarkMode ? '#fff' : '#000'}
            fontSize={10}
            textAnchor="middle"
          >
            {entry.liquidType?.substring(0, 10)}
          </SvgText>
        </G>
      );
    });
  };
  
  // Render entry details modal
  const renderEntryDetailsModal = () => {
    if (!selectedEntry) return null;
    
    const isNutrition = selectedEntry.type === 'nutrition';
    
    return (
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card>
            <Card.Title 
              title={isNutrition ? selectedEntry.foodType : selectedEntry.liquidType}
              subtitle={isNutrition ? 'Nutrition Entry' : 'Hydration Entry'}
            />
            <Card.Content>
              {isNutrition ? (
                <View>
                  <Text style={styles.detailLabel}>Calories: {selectedEntry.calories || 0}</Text>
                  <Text style={styles.detailLabel}>Carbs: {selectedEntry.carbs || 0}g</Text>
                  <Text style={styles.detailLabel}>Protein: {selectedEntry.protein || 0}g</Text>
                  <Text style={styles.detailLabel}>Fat: {selectedEntry.fat || 0}g</Text>
                  <Text style={styles.detailLabel}>Timing: {selectedEntry.timing || 'N/A'}</Text>
                  <Text style={styles.detailLabel}>Frequency: {selectedEntry.frequency || 'N/A'}</Text>
                  {selectedEntry.notes && (
                    <Text style={styles.detailLabel}>Notes: {selectedEntry.notes}</Text>
                  )}
                </View>
              ) : (
                <View>
                  <Text style={styles.detailLabel}>Volume: {selectedEntry.volume || 0} {selectedEntry.volumeUnit || 'ml'}</Text>
                  <Text style={styles.detailLabel}>Timing: {selectedEntry.timing || 'N/A'}</Text>
                  <Text style={styles.detailLabel}>Frequency: {selectedEntry.frequency || 'N/A'}</Text>
                  {selectedEntry.consumptionRate && (
                    <Text style={styles.detailLabel}>Consumption Rate: {selectedEntry.consumptionRate} ml/hr</Text>
                  )}
                  {selectedEntry.temperature && (
                    <Text style={styles.detailLabel}>Temperature: {selectedEntry.temperature}</Text>
                  )}
                </View>
              )}
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => setModalVisible(false)}>Close</Button>
              <Button 
                onPress={() => {
                  setModalVisible(false);
                  onEntryPress(selectedEntry);
                }}
              >
                Edit
              </Button>
            </Card.Actions>
          </Card>
        </Modal>
      </Portal>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#000' }]}>
          {mode === 'time' ? 'Timeline (Time)' : 'Timeline (Distance)'}
        </Text>
        <View style={styles.controls}>
          <IconButton
            icon="magnify-minus"
            size={24}
            onPress={handleZoomOut}
            disabled={zoomLevel <= 0.5}
          />
          <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>
            {Math.round(zoomLevel * 100)}%
          </Text>
          <IconButton
            icon="magnify-plus"
            size={24}
            onPress={handleZoomIn}
            disabled={zoomLevel >= 4}
          />
          <IconButton
            icon={mode === 'time' ? 'clock-outline' : 'map-marker-distance'}
            size={24}
            onPress={() => {}}
          />
        </View>
      </View>
      
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={true}
        style={styles.scrollView}
        contentContainerStyle={{ width: timelineWidth }}
      >
        <Animated.View
          style={[
            styles.timelineContainer,
            {
              transform: [
                { translateX: pan.x },
                { translateY: pan.y },
                { scale: scale }
              ]
            }
          ]}
          {...panResponder.panHandlers}
        >
          <Svg width={timelineWidth} height={timelineHeight}>
            {/* Main timeline line */}
            <Line
              x1={0}
              y1={timelineHeight / 2}
              x2={timelineWidth}
              y2={timelineHeight / 2}
              stroke={isDarkMode ? '#fff' : '#000'}
              strokeWidth={2}
            />
            
            {/* Time/distance markers */}
            {renderTimelineMarkers()}
            
            {/* Milestone markers */}
            {renderMilestones()}
            
            {/* Nutrition entries */}
            {renderNutritionEntries()}
            
            {/* Hydration entries */}
            {renderHydrationEntries()}
          </Svg>
        </Animated.View>
      </ScrollView>
      
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
          <View style={[styles.legendColor, { backgroundColor: theme.colors.error }]} />
          <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>Milestone</Text>
        </View>
      </View>
      
      {renderEntryDetailsModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  timelineContainer: {
    height: 200,
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
    borderRadius: 6,
    marginRight: 4,
  },
  modalContainer: {
    padding: 16,
    margin: 16,
  },
  detailLabel: {
    marginBottom: 4,
  },
});

export default TimelineVisualization;