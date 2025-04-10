import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  Card,
  Button,
  Avatar,
  Divider,
  List,
  useTheme as usePaperTheme,
  ProgressBar,
  Chip,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRaces } from "../context/RaceContext";
import { useAppTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";
import { Ionicons } from "@expo/vector-icons";

const ProfileScreen = ({ navigation, route }) => {
  const paperTheme = usePaperTheme();
  const { isDarkMode, theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { getRacesArray } = useRaces();
  const { userData, updateUserData, updateUserStats } = useUser();

  // Use useMemo to prevent recalculation on every render and sort by date
  const races = useMemo(() => {
    const allRaces = getRacesArray();
    // Sort races by date (ascending) to get the next upcoming race first
    return allRaces.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA - dateB;
    });
  }, [getRacesArray]);

  // Get the next upcoming race (first race in the future)
  const getUpcomingRace = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of day for proper comparison

    // Filter races to only include future races
    const futureRaces = races.filter((race) => {
      // Convert MM/DD/YYYY to a Date object
      const dateParts = race.date.split("/");
      const raceDate = new Date(
        parseInt(dateParts[2]), // Year
        parseInt(dateParts[0]) - 1, // Month (0-based)
        parseInt(dateParts[1]) // Day
      );
      return raceDate >= today;
    });

    // Return the first future race (which will be the closest one due to sorting)
    return futureRaces.length > 0 ? futureRaces[0] : null;
  }, [races]);

  // Calculate statistics
  const completionRate =
    userData.stats.racesCompleted / (userData.stats.racesPlanned || 1);

  // Handle updated user data from EditProfileScreen
  useEffect(() => {
    if (route.params?.updatedUserData) {
      updateUserData(route.params.updatedUserData);
    }
  }, [route.params?.updatedUserData, updateUserData]);

  // Update stats when races change
  useEffect(() => {
    // Only update if races array has content and is different from current data
    if (races && races.length > 0) {
      // Calculate new values
      const racesPlanned = races.length;
      const totalDistance = races.reduce(
        (sum, race) => sum + (race.distance || 0),
        0
      );
      const longestRace = Math.max(
        ...races.map((race) => race.distance || 0),
        0
      );

      // Get the upcoming race
      const upcomingRace = getUpcomingRace;

      // Check if any values have actually changed to prevent unnecessary updates
      if (
        userData.stats.racesPlanned !== racesPlanned ||
        userData.stats.totalDistance !== totalDistance ||
        userData.stats.longestRace !== longestRace ||
        userData.upcomingRace?.id !== upcomingRace?.id
      ) {
        // Update stats
        updateUserStats({
          racesPlanned,
          totalDistance,
          longestRace,
        });

        // Update upcoming race
        updateUserData({
          upcomingRace,
        });
      }
    }
  }, [
    races,
    userData.stats,
    userData.upcomingRace,
    updateUserStats,
    updateUserData,
    getUpcomingRace,
  ]);

  console.log("userData:", userData);

  const renderStatItem = (label, value, unit = "") => (
    <View style={styles.statItem}>
      <Text
        style={[
          styles.statValue,
          {
            color: theme.colors.primary,
            backgroundColor: isDarkMode
              ? "rgba(66, 133, 244, 0.15)"
              : "rgba(66, 133, 244, 0.1)",
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
            textAlign: "center",
            width: "100%",
          },
        ]}
      >
        {value}
        {unit}
      </Text>
      <Text
        style={[
          styles.statLabel,
          {
            color: isDarkMode ? "#e0e0e0" : "#555555",
            marginTop: 6,
            fontWeight: "500",
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? "#121212" : "#f5f5f5" },
      ]}
      contentContainerStyle={{
        paddingTop: insets.top > 0 ? 0 : 16,
        paddingBottom: insets.bottom + 16,
      }}
    >
      {/* Profile Header - Modern Gradient Design */}
      <View
        style={[
          styles.profileHeader,
          {
            backgroundColor: isDarkMode ? "#1e1e1e" : theme.colors.primary,
            shadowColor: isDarkMode ? "#000000" : "#000000",
          },
        ]}
      >
        <View style={styles.profileHeaderContent}>
          <Avatar.Image
            size={110}
            source={
              userData.profileImage ||
              require("../../assets/default-profile.png")
            }
            style={[
              styles.profileImage,
              {
                backgroundColor: isDarkMode ? "#333333" : "#e0e0e0",
              },
            ]}
          />
          <View style={styles.profileInfo}>
            <Text
              style={[
                styles.profileName,
                { color: isDarkMode ? "#ffffff" : "#ffffff" },
              ]}
            >
              {userData.name}
            </Text>
            <View style={styles.locationContainer}>
              <Ionicons
                name="location-outline"
                size={18}
                color={isDarkMode ? theme.colors.primary : "#ffffff"}
              />
              <Text
                style={[
                  styles.profileLocation,
                  { color: isDarkMode ? "#e0e0e0" : "#ffffff" },
                ]}
              >
                {userData.location}
              </Text>
            </View>
            <View style={styles.statsQuickView}>
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatValue}>
                  {userData.stats.racesPlanned}
                </Text>
                <Text style={styles.quickStatLabel}>Races</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatValue}>
                  {userData.stats.totalDistance}
                </Text>
                <Text style={styles.quickStatLabel}>Miles</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatValue}>
                  {userData.stats.racesCompleted}
                </Text>
                <Text style={styles.quickStatLabel}>Completed</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.editButtonContainer}>
          <Button
            mode="contained"
            compact
            style={[
              styles.editButton,
              {
                backgroundColor: isDarkMode ? theme.colors.primary : "#000",
                elevation: 2,
              },
            ]}
            color={isDarkMode ? "#fffff" : theme.colors.primary }
            onPress={() => navigation.navigate("EditProfile", { userData })}
            icon="pencil"
          >
            Edit Profile
          </Button>
        </View>
      </View>

      {/* Bio Section */}
      <Card
        style={[
          styles.bioCard,
          {
            backgroundColor: isDarkMode ? "#1e1e1e" : "white",
            borderRadius: 16,
            elevation: 3,
          },
        ]}
      >
        <Card.Content>
          <View style={styles.sectionTitleContainer}>
            <Ionicons
              name="person-circle-outline"
              size={24}
              color={theme.colors.primary}
            />
            <Text
              style={[
                styles.sectionTitle,
                { color: isDarkMode ? "#ffffff" : "#000000" },
              ]}
            >
              About Me
            </Text>
          </View>
          <Text
            style={[
              styles.bioText,
              { color: isDarkMode ? "#e0e0e0" : "#333333" },
            ]}
          >
            {userData.bio}
          </Text>
        </Card.Content>
      </Card>

      {/* Stats Overview */}
      <Card
        style={[
          styles.statsCard,
          {
            backgroundColor: isDarkMode ? "#1e1e1e" : "white",
            borderRadius: 16,
            elevation: 3,
          },
        ]}
      >
        <Card.Content>
          <View style={styles.sectionTitleContainer}>
            <Ionicons
              name="stats-chart"
              size={24}
              color={theme.colors.success}
            />
            <Text
              style={[
                styles.sectionTitle,
                { color: isDarkMode ? "#ffffff" : "#000000" },
              ]}
            >
              Running Stats
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statItemContainer}>
              {renderStatItem("Races Planned", userData.stats.racesPlanned)}
            </View>
            <View style={styles.statItemContainer}>
              {renderStatItem("Races Completed", userData.stats.racesCompleted)}
            </View>
            <View style={styles.statItemContainer}>
              {renderStatItem(
                "Total Distance",
                userData.stats.totalDistance,
                " mi"
              )}
            </View>
            <View style={styles.statItemContainer}>
              {renderStatItem(
                "Longest Race",
                userData.stats.longestRace,
                " mi"
              )}
            </View>
            <View style={styles.statItemContainer}>
              {renderStatItem("App Usage", userData.stats.appUsage, " times")}
            </View>
          </View>

          <View
            style={[
              styles.completionContainer,
              {
                backgroundColor: isDarkMode ? "#2a2a2a" : "#f5f5f5",
                borderRadius: 12,
                padding: 12,
                marginTop: 10,
              },
            ]}
          >
            <View style={styles.completionHeader}>
              <Text
                style={[
                  styles.completionLabel,
                  {
                    color: isDarkMode ? "#e0e0e0" : "#555555",
                    fontWeight: "500",
                  },
                ]}
              >
                Race Completion Rate
              </Text>
              <Text
                style={[
                  styles.completionValue,
                  {
                    color: theme.colors.primary,
                    backgroundColor: isDarkMode
                      ? "rgba(66, 133, 244, 0.2)"
                      : "rgba(66, 133, 244, 0.1)",
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                    borderRadius: 12,
                  },
                ]}
              >
                {Math.round(completionRate * 100)}%
              </Text>
            </View>
            <ProgressBar
              progress={completionRate}
              color={theme.colors.primary}
              style={[styles.progressBar, { height: 8, borderRadius: 4 }]}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Upcoming Race */}
      {userData.upcomingRace && (
        <Card
          style={[
            styles.upcomingCard,
            {
              backgroundColor: isDarkMode ? "#1e1e1e" : "white",
              borderRadius: 16,
              elevation: 3,
            },
          ]}
        >
          <Card.Content>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="flag" size={24} color={theme.colors.tertiary} />
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDarkMode ? "#ffffff" : "#000000" },
                ]}
              >
                Next Race
              </Text>
            </View>

            <TouchableOpacity
              onPress={() =>
                navigation.navigate("RaceDetails", {
                  id: userData.upcomingRace.id,
                })
              }
            >
              <View
                style={[
                  styles.upcomingRaceContainer,
                  {
                    backgroundColor: isDarkMode
                      ? "rgba(0,0,0,0.2)"
                      : "rgba(0,0,0,0.03)",
                    borderRadius: 12,
                    padding: 16,
                    marginTop: 8,
                  },
                ]}
              >
                <View style={styles.upcomingRaceInfo}>
                  <Text
                    style={[
                      styles.upcomingRaceName,
                      { color: isDarkMode ? "#ffffff" : "#000000" },
                    ]}
                  >
                    {userData.upcomingRace.name}
                  </Text>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 6,
                    }}
                  >
                    <Chip
                      icon="map-marker-distance"
                      style={{
                        backgroundColor: isDarkMode
                          ? "rgba(66, 133, 244, 0.2)"
                          : "rgba(66, 133, 244, 0.1)",
                        marginRight: 8,
                      }}
                      textStyle={{ color: isDarkMode ? "#e0e0e0" : "#333333" }}
                    >
                      {userData.upcomingRace.distance} miles
                    </Chip>

                    <Chip
                      icon="calendar"
                      style={{
                        backgroundColor: isDarkMode
                          ? "rgba(76, 175, 80, 0.2)"
                          : "rgba(76, 175, 80, 0.1)",
                      }}
                      textStyle={{ color: isDarkMode ? "#e0e0e0" : "#333333" }}
                    >
                      {userData.upcomingRace.date}
                    </Chip>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </Card.Content>
        </Card>
      )}

      {/* Achievements */}
      <Card
        style={[
          styles.achievementsCard,
          {
            backgroundColor: isDarkMode ? "#1e1e1e" : "white",
            borderRadius: 16,
            elevation: 3,
          },
        ]}
      >
        <Card.Content>
          <View style={styles.sectionTitleContainer}>
            <Ionicons
              name="trophy"
              size={24}
              color="#FFD700" // Gold color for trophies
            />
            <Text
              style={[
                styles.sectionTitle,
                { color: isDarkMode ? "#ffffff" : "#000000" },
              ]}
            >
              Achievements
            </Text>
          </View>

          <View style={{ marginTop: 8 }}>
            {userData.achievements.map((achievement) => (
              <View
                key={achievement.id}
                style={[
                  styles.achievementItem,
                  {
                    backgroundColor: isDarkMode
                      ? "rgba(255,215,0,0.1)"
                      : "rgba(255,215,0,0.05)",
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 10,
                  },
                ]}
              >
                <Avatar.Icon
                  size={45}
                  icon={achievement.icon}
                  style={styles.achievementIcon}
                  color="#FFD700"
                  backgroundColor={
                    isDarkMode ? "rgba(255,215,0,0.2)" : "rgba(255,215,0,0.1)"
                  }
                />
                <View style={styles.achievementInfo}>
                  <Text
                    style={[
                      styles.achievementName,
                      {
                        color: isDarkMode ? "#ffffff" : "#000000",
                        fontWeight: "bold",
                      },
                    ]}
                  >
                    {achievement.name}
                  </Text>
                  <Text
                    style={[
                      styles.achievementDate,
                      {
                        color: isDarkMode ? "#e0e0e0" : "#555555",
                        marginTop: 4,
                      },
                    ]}
                  >
                    Earned on {achievement.date}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Training Summary */}
      <Card
        style={[
          styles.trainingCard,
          {
            backgroundColor: isDarkMode ? "#1e1e1e" : "white",
            borderRadius: 16,
            elevation: 3,
          },
        ]}
      >
        <Card.Content>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="fitness" size={24} color={theme.colors.success} />
            <Text
              style={[
                styles.sectionTitle,
                { color: isDarkMode ? "#ffffff" : "#000000" },
              ]}
            >
              Training Summary
            </Text>
          </View>

          <View
            style={[
              styles.trainingStats,
              {
                backgroundColor: isDarkMode
                  ? "rgba(0,0,0,0.2)"
                  : "rgba(0,0,0,0.03)",
                borderRadius: 16,
                padding: 16,
                marginTop: 8,
              },
            ]}
          >
            <View style={styles.trainingStatItem}>
              <Text
                style={[
                  styles.trainingStatValue,
                  {
                    color: theme.colors.success,
                    backgroundColor: isDarkMode
                      ? "rgba(76, 175, 80, 0.2)"
                      : "rgba(76, 175, 80, 0.1)",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 12,
                    textAlign: "center",
                  },
                ]}
              >
                120
              </Text>
              <Text
                style={[
                  styles.trainingStatLabel,
                  {
                    color: isDarkMode ? "#e0e0e0" : "#555555",
                    marginTop: 8,
                    fontWeight: "500",
                  },
                ]}
              >
                Miles This Month
              </Text>
            </View>
            <View style={styles.trainingStatItem}>
              <Text
                style={[
                  styles.trainingStatValue,
                  {
                    color: theme.colors.success,
                    backgroundColor: isDarkMode
                      ? "rgba(76, 175, 80, 0.2)"
                      : "rgba(76, 175, 80, 0.1)",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 12,
                    textAlign: "center",
                  },
                ]}
              >
                24
              </Text>
              <Text
                style={[
                  styles.trainingStatLabel,
                  {
                    color: isDarkMode ? "#e0e0e0" : "#555555",
                    marginTop: 8,
                    fontWeight: "500",
                  },
                ]}
              >
                Hours
              </Text>
            </View>
            <View style={styles.trainingStatItem}>
              <Text
                style={[
                  styles.trainingStatValue,
                  {
                    color: theme.colors.success,
                    backgroundColor: isDarkMode
                      ? "rgba(76, 175, 80, 0.2)"
                      : "rgba(76, 175, 80, 0.1)",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 12,
                    textAlign: "center",
                  },
                ]}
              >
                15,000
              </Text>
              <Text
                style={[
                  styles.trainingStatLabel,
                  {
                    color: isDarkMode ? "#e0e0e0" : "#555555",
                    marginTop: 8,
                    fontWeight: "500",
                  },
                ]}
              >
                Elevation (ft)
              </Text>
            </View>
          </View>

          <Button
            mode="contained"
            icon="clipboard-list"
            style={[
              styles.trainingButton,
              {
                marginTop: 16,
                borderRadius: 12,
                backgroundColor: theme.colors.success,
              },
            ]}
            color="#ffffff"
            onPress={() => {
              /* Navigate to training log */
            }}
          >
            View Training Log
          </Button>
        </Card.Content>
      </Card>

      {/* Account Settings Link */}
      <Card
        style={[
          styles.settingsCard,
          {
            backgroundColor: isDarkMode ? "#1e1e1e" : "white",
            borderRadius: 16,
            elevation: 3,
            marginBottom: 24, // Add extra margin at the bottom
          },
        ]}
      >
        <Card.Content>
          <TouchableOpacity
            style={[
              styles.settingsLink,
              {
                backgroundColor: isDarkMode
                  ? "rgba(0,0,0,0.2)"
                  : "rgba(0,0,0,0.03)",
                borderRadius: 12,
                padding: 16,
              },
            ]}
            onPress={() => navigation.navigate("Settings")}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  backgroundColor: isDarkMode
                    ? "rgba(66, 133, 244, 0.2)"
                    : "rgba(66, 133, 244, 0.1)",
                  borderRadius: 20,
                  padding: 8,
                }}
              >
                <Ionicons
                  name="settings-outline"
                  size={24}
                  color={theme.colors.primary}
                />
              </View>
              <Text
                style={[
                  styles.settingsText,
                  {
                    color: isDarkMode ? "#ffffff" : "#000000",
                    marginLeft: 12,
                    fontSize: 16,
                    fontWeight: "500",
                  },
                ]}
              >
                Account Settings
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 0,
  },
  profileHeader: {
    flexDirection: "column",
    paddingTop: 70,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    margin: 0,
    marginBottom: 16,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  profileHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  profileImage: {
    borderRadius: 55, // Half of the size for perfect circle
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  profileLocation: {
    fontSize: 15,
    marginLeft: 4,
  },
  statsQuickView: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  quickStatItem: {
    alignItems: "center",
    flex: 1,
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  quickStatLabel: {
    fontSize: 12,
    color: "#e0e0e0",
    marginTop: 2,
  },
  quickStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  editButtonContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  editButton: {
    borderRadius: 25,
    paddingHorizontal: 20,
  },
  bioCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 8,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
  },
  statsCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 8,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statItemContainer: {
    width: "30%",
    marginBottom: 16,
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: 12,
    padding: 8,
  },
  statItem: {
    alignItems: "center",
    padding: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    // color handled dynamically
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
    // color handled dynamically
  },
  completionContainer: {
    marginTop: 8,
  },
  completionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  completionLabel: {
    fontSize: 14,
    // color handled dynamically
  },
  completionValue: {
    fontSize: 14,
    fontWeight: "bold",
    // color handled dynamically
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  upcomingCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 8,
  },
  upcomingRaceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  upcomingRaceInfo: {
    flex: 1,
  },
  upcomingRaceName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  upcomingRaceDetails: {
    fontSize: 14,
    // color handled dynamically
  },
  achievementsCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 8,
  },
  achievementItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  achievementIcon: {
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  achievementDate: {
    fontSize: 12,
    // color handled dynamically
  },
  trainingCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 8,
  },
  trainingStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  trainingStatItem: {
    alignItems: "center",
    width: "30%",
  },
  trainingStatValue: {
    fontSize: 20,
    fontWeight: "bold",
    // color handled dynamically
  },
  trainingStatLabel: {
    fontSize: 12,
    textAlign: "center",
    // color handled dynamically
  },
  trainingButton: {
    borderRadius: 20,
  },
  settingsCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 8,
  },
  settingsLink: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  settingsText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
});

export default ProfileScreen;
