import React from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Text, Button, Card, Title, Paragraph, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRaces } from '../context/RaceContext';

const HomeScreen = ({ navigation }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { getRacesArray, loading } = useRaces();
  
  const races = getRacesArray();

  if (loading) {
    return (
      <View style={[
        styles.loadingContainer, 
        { 
          paddingTop: insets.top,
          paddingBottom: insets.bottom
        }
      ]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading your races...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top > 0 ? 0 : 16, // Only add padding if there's no notch
        paddingBottom: insets.bottom + 16
      }}
    >
      <Card style={styles.welcomeCard}>
        <Card.Content>
          <Title style={styles.title}>Ultra Endurance Planner</Title>
          <Paragraph style={styles.paragraph}>
            Plan, prepare, and conquer your next ultra marathon with confidence.
          </Paragraph>
        </Card.Content>
        <Card.Actions style={styles.cardActions}>
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('CreateRace')}
            style={styles.button}
          >
            Create New Race Plan
          </Button>
        </Card.Actions>
      </Card>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Upcoming Races</Text>
        
        {races.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Paragraph style={styles.emptyText}>
                You don't have any races planned yet. Create your first race plan to get started!
              </Paragraph>
            </Card.Content>
          </Card>
        ) : (
          races.map(race => (
            <Card key={race.id} style={styles.raceCard}>
              <Card.Content>
                <Title>{race.name}</Title>
                <Paragraph>{race.distance} miles • {race.date}</Paragraph>
              </Card.Content>
              <Card.Actions>
                <Button onPress={() => navigation.navigate('RaceDetails', { id: race.id })}>
                  View Details
                </Button>
              </Card.Actions>
            </Card>
          ))
        )}
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Training Tips</Text>
        <Card style={styles.tipCard}>
          <Card.Content>
            <Title>Nutrition Strategy</Title>
            <Paragraph>Proper fueling can make or break your race. Learn how to calculate your caloric needs.</Paragraph>
          </Card.Content>
          <Card.Actions>
            <Button>Read More</Button>
          </Card.Actions>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  welcomeCard: {
    margin: 16,
    elevation: 4,
    borderRadius: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  paragraph: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  cardActions: {
    justifyContent: 'center',
    paddingBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  sectionContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  raceCard: {
    marginBottom: 12,
    borderRadius: 8,
  },
  emptyCard: {
    marginBottom: 12,
    borderRadius: 8,
    padding: 8,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  tipCard: {
    marginBottom: 16,
    borderRadius: 8,
  },
});

export default HomeScreen;