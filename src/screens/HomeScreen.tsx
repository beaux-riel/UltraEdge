import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Title, Paragraph } from 'react-native-paper';
import { useAppTheme } from '../context/ThemeContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useNavigation } from '@react-navigation/native';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  
  return (
    <ScrollView 
      style={[
        styles.container, 
        { backgroundColor: isDarkMode ? '#121212' : '#f5f5f5' }
      ]}
      contentContainerStyle={styles.content}
    >
      <Card style={styles.card}>
        <Card.Content>
          <Title>Welcome to UltraEdge</Title>
          <Paragraph>Your ultimate companion for ultra-endurance race planning</Paragraph>
        </Card.Content>
        <Card.Actions>
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('NutritionHydration')}
          >
            Nutrition & Hydration
          </Button>
        </Card.Actions>
      </Card>
      
      <Card style={styles.card}>
        <Card.Content>
          <Title>Quick Start</Title>
          <Paragraph>Create your first nutrition and hydration plan</Paragraph>
        </Card.Content>
        <Card.Actions>
          <Button 
            mode="outlined" 
            onPress={() => {}}
          >
            Create Plan
          </Button>
        </Card.Actions>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
});

export default HomeScreen;