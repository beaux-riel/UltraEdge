import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Button, Paragraph, Surface } from 'react-native-paper';
import { useAppTheme } from '../context/ThemeContext';

const EmptyState = ({
  image,
  title,
  description,
  buttonText,
  onButtonPress,
  style,
}) => {
  const { isDarkMode, theme } = useAppTheme();

  return (
    <Surface
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? theme.colors.surface : '#ffffff' },
        style,
      ]}
    >
      <View style={styles.content}>
        {image && (
          <Image
            source={image}
            style={styles.image}
            resizeMode="contain"
          />
        )}
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
            { color: isDarkMode ? '#9e9e9e' : '#757575' },
          ]}
        >
          {description}
        </Paragraph>
        {buttonText && onButtonPress && (
          <Button
            mode="outlined"
            onPress={onButtonPress}
            style={styles.button}
            color={theme.colors.primary}
          >
            {buttonText}
          </Button>
        )}
      </View>
    </Surface>
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
    marginBottom: 16,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  image: {
    width: 80,
    height: 80,
    opacity: 0.5,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  button: {
    borderRadius: 8,
    marginTop: 8,
  },
});

export default EmptyState;