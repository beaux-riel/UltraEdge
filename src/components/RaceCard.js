import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, IconButton, Surface } from "react-native-paper";
import { useAppTheme } from "../context/ThemeContext";

const RaceCard = ({ race, onPress, date, time }) => {
  const { isDarkMode, theme } = useAppTheme();
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    progressPercent: 0,
  });

  // Format date to "Apr 7, 2025" style
  const formatDate = (dateString) => {
    if (!dateString) return "";

    let dateObj;
    
    // Check if date is in YYYY-MM-DD format
    if (dateString.includes('-')) {
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
    if (date.includes('-')) {
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

      setCountdown({ days, hours, minutes, seconds, progressPercent });
    }, 1000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [date, time]);

  // Format the displayed date
  const formattedDate = formatDate(race.date);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <Surface
        style={[
          styles.container,
          { backgroundColor: isDarkMode ? theme.colors.surface : "#ffffff" },
        ]}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <Text
                style={[
                  styles.title,
                  { color: isDarkMode ? "#ffffff" : "#333333" },
                ]}
              >
                {race.name}
              </Text>
              <Text
                style={[
                  styles.details,
                  { color: isDarkMode ? "#e0e0e0" : "#666666" },
                ]}
              >
                {race.distance} {race.distanceUnit} • {formattedDate}
              </Text>
            </View>
            <IconButton
              icon="chevron-right"
              color={theme.colors.primary}
              size={24}
              onPress={onPress}
            />
          </View>

          {/* Countdown Timer Section */}
          <View style={styles.countdownContainer}>
            <Text
              style={[
                styles.countdownTitle,
                { color: isDarkMode ? "#ffffff" : "#333333" },
              ]}
            >
              Race Starts In:
            </Text>
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  details: {
    fontSize: 14,
  },
  countdownContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  countdownTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  countdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  countdownItem: {
    alignItems: "center",
    minWidth: 50,
  },
  countdownValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  countdownLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  progressContainer: {
    marginTop: 16,
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
  },
});

export default RaceCard;
