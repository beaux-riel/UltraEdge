import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Button, Paragraph, Surface, IconButton } from 'react-native-paper';
import { useAppTheme } from '../context/ThemeContext';

const TipCard = ({ 
  title, 
  description, 
  icon, 
  iconBackgroundColor, 
  onPress,
  buttonText = 'Read More',
  style
}) => {
  const { isDarkMode, theme } = useAppTheme();

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <Surface
        style={[
          styles.container,
          { backgroundColor: isDarkMode ? theme.colors.surface : '#ffffff' },
          style
        ]}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <IconButton
              icon={icon}
              color="#ffffff"
              size={24}
              style={[styles.icon, { backgroundColor: iconBackgroundColor || theme.colors.primary }]}
            />
          </View>
          <Text
            style={[
              styles.title,
              { color: isDarkMode ? '#ffffff' : '#333333' },
            ]}
          >
            {title}
          </Text>
          <Paragraph
            style={[
              styles.description,
              { color: isDarkMode ? '#e0e0e0' : '#666666' },
            ]}
            numberOfLines={2}
          >
            {description}
          </Paragraph>
          <Button
            mode="text"
            color={theme.colors.primary}
            style={styles.button}
            onPress={onPress}
          >
            {buttonText}
          </Button>
        </View>
      </Surface>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  content: {
    padding: 16,
  },
  iconContainer: {
    marginBottom: 12,
  },
  icon: {
    borderRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 0,
  },
});

export default TipCard;