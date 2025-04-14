import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, IconButton, Surface, Chip } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppTheme } from "../context/ThemeContext";

const RaceCard = ({ race, onPress, date, time }) => {
  const { isDarkMode, theme } = useAppTheme();
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    progressPercent: 0,
    isPast: false,
  });

  // Format date to "Apr 7, 2025" style
  const formatDate = (dateString) => {
    if (!dateString) return "";

    let dateObj;

    // Check if date is in YYYY-MM-DD format
    if (dateString.includes("-")) {
      // Parse YYYY-MM-DD format
      const [year, month, day] = dateString.split("-");
      dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else {
      // Parse MM/DD/YYYY format (for backward compatibility)
      const [month, day, year] = dateString.split("/");
      dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    // Format the date as "Apr 7, 2025"
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    return `${
      monthNames[dateObj.getMonth()]
    } ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
  };

  useEffect(() => {
    if (!date || !time) return;

    let year, month, day;

    // Check if date is in YYYY-MM-DD format
    if (date.includes("-")) {
      // Parse YYYY-MM-DD format
      [year, month, day] = date.split("-");
    } else {
      // Parse MM/DD/YYYY format (for backward compatibility)
      [month, day, year] = date.split("/");
    }

    // Parse time in HH:MM format
    const [hours, minutes] = time.split(":");

    // Create a Date object from the parsed components
    const eventDate = new Date(year, month - 1, day, hours, minutes);

    // Calculate the total duration from now until the event (in milliseconds)
    const now = new Date();
    const totalDuration = eventDate - now;

    // Set up the interval to update the countdown every second
    const intervalId = setInterval(() => {
      const currentTime = new Date();
      const difference = eventDate - currentTime;

      // If the event has passed, clear the interval
      if (difference < 0) {
        clearInterval(intervalId);
        setCountdown({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          progressPercent: 100,
          isPast: true, // Flag to indicate the race has started/passed
        });
        return;
      }

      // Calculate time remaining
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      // Calculate progress percentage (time elapsed / total duration)
      const elapsed = totalDuration - difference;
      const progressPercent = Math.min(
        100,
        Math.max(0, Math.floor((elapsed / totalDuration) * 100))
      );

      setCountdown({
        days,
        hours,
        minutes,
        seconds,
        progressPercent,
        isPast: false,
      });
    }, 1000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [date, time]);

  // Format the displayed date
  const formattedDate = formatDate(race.date);

  // Format time to 12-hour format with AM/PM
  const formatTime = (timeString) => {
    if (!timeString) return "";

    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;

    return `${hour12}:${minutes} ${ampm}`;
  };

  // Get formatted time
  const formattedTime = formatTime(race.time || time);

  // Get race status
  const getRaceStatus = () => {
    if (!race.status) {
      // If no status is provided, determine based on time
      if (countdown.isPast) {
        return "In Progress";
      } else {
        return "Upcoming";
      }
    }
    return race.status;
  };

  // Get status color based on race status
  const getStatusColor = () => {
    const status = getRaceStatus().toLowerCase();

    if (status === "completed" || status === "finished") {
      return theme.colors.tertiary || "#4caf50"; // Green
    } else if (status === "in progress" || status === "active") {
      return theme.colors.secondary || "#ff9800"; // Orange/Amber
    } else if (status === "cancelled") {
      return theme.colors.error || "#f44336"; // Red
    } else {
      return theme.colors.primary || "#2196f3"; // Blue for upcoming
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <Surface style={styles.container}>
        <LinearGradient
          colors={
            isDarkMode
              ? [theme.colors.surface, theme.colors.surfaceVariant]
              : ["#ffffff", "#f8f9fa"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <View style={styles.titleRow}>
                  <Text
                    style={[
                      styles.title,
                      { color: isDarkMode ? "#ffffff" : "#333333" },
                    ]}
                    numberOfLines={2}
                  >
                    {race.name}
                  </Text>
                  <Chip
                    style={[
                      styles.statusChip,
                      { backgroundColor: `${getStatusColor()}20` },
                    ]}
                    textStyle={{ color: getStatusColor(), fontWeight: "500" }}
                  >
                    {getRaceStatus()}
                  </Chip>
                </View>

                <View style={styles.detailsRow}>
                  <MaterialCommunityIcons
                    name="map-marker"
                    size={16}
                    color={theme.colors.primary}
                    style={styles.icon}
                  />
                  <Text
                    style={[
                      styles.details,
                      { color: isDarkMode ? "#e0e0e0" : "#666666" },
                    ]}
                  >
                    {race.distance} {race.distanceUnit} • {formattedDate}
                  </Text>
                </View>

                <View style={styles.detailsRow}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={16}
                    color={theme.colors.primary}
                    style={styles.icon}
                  />
                  <Text
                    style={[
                      styles.details,
                      { color: isDarkMode ? "#e0e0e0" : "#666666" },
                    ]}
                  >
                    Start time: {formattedTime}
                  </Text>
                </View>
              </View>

              <IconButton
                icon="chevron-right"
                iconColor={theme.colors.primary}
                size={24}
                onPress={onPress}
                style={styles.chevron}
              />
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${countdown.progressPercent}%`,
                      backgroundColor: theme.colors.primary,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Countdown Timer Section or In Progress status */}
            <View style={styles.countdownContainer}>
              {countdown.isPast ? (
                <View style={styles.inProgressContainer}>
                  <MaterialCommunityIcons
                    name="run-fast"
                    size={24}
                    color={getStatusColor()}
                  />
                  <Text
                    style={[styles.inProgressText, { color: getStatusColor() }]}
                  >
                    In Progress
                  </Text>
                </View>
              ) : (
                <View style={styles.countdownRow}>
                  <View style={styles.countdownItem}>
                    <Text
                      style={[
                        styles.countdownValue,
                        { color: theme.colors.primary },
                      ]}
                    >
                      {countdown.days}
                    </Text>
                    <Text
                      style={[
                        styles.countdownLabel,
                        { color: isDarkMode ? "#9e9e9e" : "#757575" },
                      ]}
                    >
                      days
                    </Text>
                  </View>
                  <View style={styles.countdownItem}>
                    <Text
                      style={[
                        styles.countdownValue,
                        { color: theme.colors.primary },
                      ]}
                    >
                      {countdown.hours}
                    </Text>
                    <Text
                      style={[
                        styles.countdownLabel,
                        { color: isDarkMode ? "#9e9e9e" : "#757575" },
                      ]}
                    >
                      hours
                    </Text>
                  </View>
                  <View style={styles.countdownItem}>
                    <Text
                      style={[
                        styles.countdownValue,
                        { color: theme.colors.primary },
                      ]}
                    >
                      {countdown.minutes}
                    </Text>
                    <Text
                      style={[
                        styles.countdownLabel,
                        { color: isDarkMode ? "#9e9e9e" : "#757575" },
                      ]}
                    >
                      min
                    </Text>
                  </View>
                  <View style={styles.countdownItem}>
                    <Text
                      style={[
                        styles.countdownValue,
                        { color: theme.colors.primary },
                      ]}
                    >
                      {countdown.seconds}
                    </Text>
                    <Text
                      style={[
                        styles.countdownLabel,
                        { color: isDarkMode ? "#9e9e9e" : "#757575" },
                      ]}
                    >
                      sec
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </Surface>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
  },
  gradient: {
    borderRadius: 16,
    overflow: "hidden",
  },
  content: {
    padding: 18,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleContainer: {
    flex: 1,
    paddingRight: 16,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 0.25,
    flex: 1,
    marginRight: 8,
  },
  statusChip: {
    borderRadius: 12,
    height: 30,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  icon: {
    marginRight: 6,
  },
  details: {
    fontSize: 14,
    lineHeight: 20,
  },
  chevron: {
    marginTop: -8,
    marginRight: -8,
  },
  countdownContainer: {
    marginTop: 16,
    marginBottom: 4,
    flexDirection: "row",
    justifyContent: "center",
  },
  countdownTitle: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 8,
  },
  countdownRow: {
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    justifyContent: "space-around",
    width: "100%",
  },
  countdownItem: {
    alignItems: "center",
    minWidth: 60,
  },
  countdownValue: {
    fontSize: 22,
    fontWeight: "bold",
  },
  countdownLabel: {
    fontSize: 12,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  progressContainer: {
    marginTop: 20,
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    marginTop: 6,
    textAlign: "right",
  },
  inProgressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: "100%",
  },
  inProgressText: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
});

export default RaceCard;
