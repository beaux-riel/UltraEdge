import React from "react";
import { View, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import {
  Text,
  Button,
  Card,
  Title,
  Paragraph,
  useTheme as usePaperTheme,
} from "react-native-paper";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRaces } from "../context/RaceContext";
import { useAppTheme } from "../context/ThemeContext";

const HomeScreen = ({ navigation }) => {
  const paperTheme = usePaperTheme();
  const { isDarkMode, theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { getRacesArray, loading } = useRaces();

  const races = getRacesArray();

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            backgroundColor: isDarkMode ? "#121212" : "#f5f5f5",
          },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text
          style={[
            styles.loadingText,
            { color: isDarkMode ? "#ffffff" : "#000000" },
          ]}
        >
          Loading your races...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? "#121212" : "#f5f5f5" },
      ]}
      contentContainerStyle={{
        paddingTop: insets.top > 0 ? 0 : 16, // Only add padding if there's no notch
        paddingBottom: insets.bottom + 16,
      }}
    >
      <Card
        style={[
          styles.welcomeCard,
          { backgroundColor: isDarkMode ? "#1e1e1e" : "#ffffff" },
        ]}
      >
        <Card.Content>
          <Title
            style={[
              styles.title,
              { color: isDarkMode ? "#ffffff" : "#000000" },
            ]}
          >
            UltraEdge
          </Title>
          <Paragraph
            style={[
              styles.paragraph,
              { color: isDarkMode ? "#e0e0e0" : "#333333" },
            ]}
          >
            Plan, prepare, and conquer your next ultra marathon with confidence.
          </Paragraph>
        </Card.Content>
        <Card.Actions style={styles.cardActions}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate("CreateRace")}
            style={styles.button}
            color={theme.colors.primary}
          >
            Create New Race Plan
          </Button>
        </Card.Actions>
      </Card>

      <View style={styles.sectionContainer}>
        <Text
          style={[
            styles.sectionTitle,
            { color: isDarkMode ? "#ffffff" : "#000000" },
          ]}
        >
          Upcoming Races
        </Text>

        {races.length === 0 ? (
          <Card
            style={[
              styles.emptyCard,
              { backgroundColor: isDarkMode ? "#1e1e1e" : "#ffffff" },
            ]}
          >
            <Card.Content>
              <Paragraph
                style={[
                  styles.emptyText,
                  { color: isDarkMode ? "#9e9e9e" : "#757575" },
                ]}
              >
                You don't have any races planned yet. Create your first race
                plan to get started!
              </Paragraph>
            </Card.Content>
          </Card>
        ) : (
          races.map((race) => (
            <Card
              key={race.id}
              style={[
                styles.raceCard,
                { backgroundColor: isDarkMode ? "#1e1e1e" : "#ffffff" },
              ]}
            >
              <Card.Content>
                <Title style={{ color: isDarkMode ? "#ffffff" : "#000000" }}>
                  {race.name}
                </Title>
                <Paragraph
                  style={{ color: isDarkMode ? "#e0e0e0" : "#333333" }}
                >
                  {race.distance} miles • {race.date}
                </Paragraph>
              </Card.Content>
              <Card.Actions>
                <Button
                  onPress={() =>
                    navigation.navigate("RaceDetails", { id: race.id })
                  }
                  color={theme.colors.primary}
                >
                  View Details
                </Button>
              </Card.Actions>
            </Card>
          ))
        )}
      </View>

      <View style={styles.sectionContainer}>
        <Text
          style={[
            styles.sectionTitle,
            { color: isDarkMode ? "#ffffff" : "#000000" },
          ]}
        >
          Training Tips
        </Text>
        <Card
          style={[
            styles.tipCard,
            { backgroundColor: isDarkMode ? "#1e1e1e" : "#ffffff" },
          ]}
        >
          <Card.Content>
            <Title style={{ color: isDarkMode ? "#ffffff" : "#000000" }}>
              Nutrition Strategy
            </Title>
            <Paragraph style={{ color: isDarkMode ? "#e0e0e0" : "#333333" }}>
              Proper fueling can make or break your race. Learn how to calculate
              your caloric needs.
            </Paragraph>
          </Card.Content>
          <Card.Actions>
            <Button color={theme.colors.primary}>Read More</Button>
          </Card.Actions>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    fontWeight: "bold",
    textAlign: "center",
  },
  paragraph: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 8,
  },
  cardActions: {
    justifyContent: "center",
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
    fontWeight: "bold",
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
    textAlign: "center",
    opacity: 0.7,
  },
  tipCard: {
    marginBottom: 16,
    borderRadius: 8,
  },
});

export default HomeScreen;
