import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, IconButton, Surface } from 'react-native-paper';
import { useAppTheme } from '../context/ThemeContext';

const RaceCard = ({ race, onPress, progress = 0 }) => {
  const { isDarkMode, theme } = useAppTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Surface
        style={[
          styles.container,
          { backgroundColor: isDarkMode ? theme.colors.surface : '#ffffff' },
        ]}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <Text
                style={[
                  styles.title,
                  { color: isDarkMode ? '#ffffff' : '#333333' },
                ]}
              >
                {race.name}
              </Text>
              <Text
                style={[
                  styles.details,
                  { color: isDarkMode ? '#e0e0e0' : '#666666' },
                ]}
              >
                {race.distance} miles • {race.date}
              </Text>
            </View>
            <IconButton
              icon="chevron-right"
              color={theme.colors.primary}
              size={24}
              onPress={onPress}
            />
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { 
                    width: `${progress}%`, 
                    backgroundColor: theme.colors.primary 
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.progressText,
                { color: isDarkMode ? '#9e9e9e' : '#757575' },
              ]}
            >
              {progress}% of training complete
            </Text>
          </View>
        </View>
      </Surface>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  details: {
    fontSize: 14,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    marginTop: 6,
  },
});

export default RaceCard;