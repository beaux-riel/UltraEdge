import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Dimensions,
  Animated,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  Button,
  Title,
  Paragraph,
  Surface,
  useTheme as usePaperTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRaces } from "../context/RaceContext";
import { useAppTheme } from "../context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";

// Import custom components
import EmptyState from "../components/EmptyState";
import RaceCard from "../components/RaceCard";
import TipCard from "../components/TipCard";

const { width } = Dimensions.get("window");

const HomeScreen = ({ navigation }) => {
  const paperTheme = usePaperTheme();
  const { isDarkMode, theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { getRacesArray, loading } = useRaces();

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Get races and sort them by date (closest date first)
  const races = getRacesArray().sort((a, b) => {
    // Parse MM/DD/YYYY dates
    const partsA = a.date.split("/");
    const partsB = b.date.split("/");

    // Create date objects (months are 0-based in JavaScript Date)
    const dateA = new Date(
      parseInt(partsA[2]), // year
      parseInt(partsA[0]) - 1, // month (0-based)
      parseInt(partsA[1]), // day
      ...(a.startTime ? a.startTime.split(":").map(Number) : [0, 0]) // hours and minutes
    );

    const dateB = new Date(
      parseInt(partsB[2]), // year
      parseInt(partsB[0]) - 1, // month (0-based)
      parseInt(partsB[1]), // day
      ...(b.startTime ? b.startTime.split(":").map(Number) : [0, 0]) // hours and minutes
    );

    return dateA - dateB;
  });

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            backgroundColor: isDarkMode ? theme.colors.background : "#f8f9fa",
          },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text
          style={[
            styles.loadingText,
            { color: isDarkMode ? theme.colors.text : theme.colors.text },
          ]}
        >
          Loading your races...
        </Text>
      </View>
    );
  }

  // Define gradient colors based on theme
  const headerGradientColors = isDarkMode
    ? ["#0a2e25", "#1e1a42"]
    : ["#e8f8f4", "#f3f1ff"];

  console.log("Sorted Races:", races);

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? theme.colors.background : "#f8f9fa" },
      ]}
      contentContainerStyle={{
        paddingTop: insets.top > 0 ? 0 : 16,
        paddingBottom: insets.bottom + 16,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <LinearGradient
          colors={headerGradientColors}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <Image
              source={require("../../assets/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Title
              style={[
                styles.headerTitle,
                { color: isDarkMode ? "#ffffff" : "#000" },
              ]}
            >
              UltraEdge
            </Title>
            <Paragraph
              style={[
                styles.headerSubtitle,
                { color: isDarkMode ? "#ffffff" : "#000" },
              ]}
            >
              Your ultra marathon companion
            </Paragraph>
          </View>
        </LinearGradient>

        <Surface
          style={[
            styles.actionCard,
            { backgroundColor: isDarkMode ? theme.colors.surface : "#ffffff" },
          ]}
        >
          <View style={styles.actionCardContent}>
            <Text
              style={[
                styles.actionTitle,
                { color: isDarkMode ? theme.colors.text : theme.colors.text },
              ]}
            >
              Ready for your next challenge?
            </Text>
            <Paragraph
              style={[
                styles.actionDescription,
                {
                  color: isDarkMode
                    ? theme.colors.textSecondary
                    : theme.colors.textSecondary,
                },
              ]}
            >
              Plan, prepare, and conquer your next ultra marathon with
              confidence.
            </Paragraph>
            <Button
              mode="contained"
              onPress={() => navigation.navigate("CreateRace")}
              style={styles.actionButton}
              contentStyle={styles.actionButtonContent}
              labelStyle={styles.actionButtonLabel}
              color={theme.colors.primary}
            >
              Create New Race Plan
            </Button>
          </View>
        </Surface>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderContainer}>
            <Text
              style={[
                styles.sectionTitle,
                { color: isDarkMode ? theme.colors.text : theme.colors.text },
              ]}
            >
              Upcoming Races
            </Text>
            {races.length > 0 && (
              <TouchableOpacity>
                <Text style={{ color: theme.colors.primary }}>See All</Text>
              </TouchableOpacity>
            )}
          </View>

          {races.length === 0 ? (
            <EmptyState
              image={require("../../assets/logo.png")}
              title="No races yet"
              description="Track your upcoming ultra marathons and get personalized training plans."
              buttonText="Add Your First Race"
              onButtonPress={() => navigation.navigate("CreateRace")}
            />
          ) : (
            races.map((race) => (
              <RaceCard
                key={race.id}
                race={race}
                progress={60}
                date={race.date}
                time={race.startTime}
                onPress={() =>
                  navigation.navigate("RaceDetails", { id: race.id })
                }
              />
            ))
          )}
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderContainer}>
            <Text
              style={[
                styles.sectionTitle,
                { color: isDarkMode ? theme.colors.text : theme.colors.text },
              ]}
            >
              Training Tips
            </Text>
            <TouchableOpacity>
              <Text style={{ color: theme.colors.primary }}>More</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tipsScrollContainer}
          >
            <TipCard
              title="Nutrition Strategy"
              description="Proper fueling can make or break your race. Learn how to calculate your caloric needs."
              icon="food-apple"
              iconBackgroundColor={theme.colors.success}
              style={{ width: width * 0.7, marginRight: 16 }}
              onPress={() => {}}
            />

            <TipCard
              title="Gear Selection"
              description="Choosing the right shoes and equipment for your ultra marathon."
              icon="shoe-print"
              iconBackgroundColor={theme.colors.secondary}
              style={{ width: width * 0.7, marginRight: 16 }}
              onPress={() => {}}
            />

            <TipCard
              title="Training Schedule"
              description="Build endurance with a progressive training plan tailored to your race."
              icon="run-fast"
              iconBackgroundColor={theme.colors.tertiary}
              style={{ width: width * 0.7, marginRight: 16 }}
              onPress={() => {}}
            />
          </ScrollView>
        </View>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
  },
  headerGradient: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    alignItems: "center",
    paddingTop: 32,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 4,
  },
  actionCard: {
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionCardContent: {
    padding: 20,
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  actionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  actionButton: {
    borderRadius: 8,
    marginTop: 8,
  },
  actionButtonContent: {
    height: 48,
  },
  actionButtonLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  sectionContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  tipsScrollContainer: {
    paddingBottom: 8,
    paddingRight: 16,
  },
});

export default HomeScreen;
