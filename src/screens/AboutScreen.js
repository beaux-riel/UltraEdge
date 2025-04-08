import React from "react";
import { View, StyleSheet, ScrollView, Image, Linking } from "react-native";
import {
  Text,
  Card,
  Button,
  Divider,
  useTheme as usePaperTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

const AboutScreen = ({ navigation }) => {
  const paperTheme = usePaperTheme();
  const { isDarkMode } = useAppTheme();
  const insets = useSafeAreaInsets();

  const openLink = (url) => {
    Linking.openURL(url).catch((err) =>
      console.error("An error occurred", err)
    );
  };

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: paperTheme.colors.background },
        { paddingTop: insets.top },
      ]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.headerContainer}>
        <Image
          source={require("../../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.appName, { color: paperTheme.colors.primary }]}>
          UltraEdge
        </Text>
        <Text
          style={[
            styles.tagline,
            { color: isDarkMode ? "#e0e0e0" : "#757575" },
          ]}
        >
          Go the distance. Plan with confidence.
        </Text>
      </View>

      <Card
        style={[
          styles.card,
          { backgroundColor: isDarkMode ? "#2c2c2c" : "#ffffff" },
        ]}
      >
        <Card.Content>
          <Text
            style={[styles.sectionTitle, { color: paperTheme.colors.primary }]}
          >
            The Story Behind the App
          </Text>
          <Text
            style={[
              styles.paragraph,
              { color: isDarkMode ? "#ffffff" : "#000000" },
            ]}
          >
            UltraEdge was born from the trails and mountains that challenge
            ultra runners every day. As an ultra marathon runner myself, I've
            experienced firsthand how crucial meticulous planning is to success
            in these grueling events.
          </Text>
          <Text
            style={[
              styles.paragraph,
              { color: isDarkMode ? "#ffffff" : "#000000" },
            ]}
          >
            With my background working at Kintec, a Canadian footwear specialty
            company, and later as a Tech Rep for Western Canada at On, the Swiss
            running shoe brand, I've gained deep insights into what runners need
            to perform at their best.
          </Text>
          <Text
            style={[
              styles.paragraph,
              { color: isDarkMode ? "#ffffff" : "#000000" },
            ]}
          >
            This app combines my passion for ultra running with my technical
            expertise to create a tool that helps runners plan their events down
            to the smallest detail - from aid station strategies to crew
            coordination.
          </Text>
        </Card.Content>
      </Card>

      <Card
        style={[
          styles.card,
          { backgroundColor: isDarkMode ? "#2c2c2c" : "#ffffff" },
        ]}
      >
        <Card.Content>
          <Text
            style={[styles.sectionTitle, { color: paperTheme.colors.primary }]}
          >
            What Makes Us Different
          </Text>
          <View style={styles.featureRow}>
            <Ionicons
              name="trail-sign-outline"
              size={24}
              color={paperTheme.colors.primary}
            />
            <Text
              style={[
                styles.featureText,
                { color: isDarkMode ? "#ffffff" : "#000000" },
              ]}
            >
              Created by ultra runners, for ultra runners
            </Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons
              name="people-outline"
              size={24}
              color={paperTheme.colors.primary}
            />
            <Text
              style={[
                styles.featureText,
                { color: isDarkMode ? "#ffffff" : "#000000" },
              ]}
            >
              Comprehensive crew management tools
            </Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons
              name="analytics-outline"
              size={24}
              color={paperTheme.colors.primary}
            />
            <Text
              style={[
                styles.featureText,
                { color: isDarkMode ? "#ffffff" : "#000000" },
              ]}
            >
              Detailed aid station planning and analytics
            </Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons
              name="time-outline"
              size={24}
              color={paperTheme.colors.primary}
            />
            <Text
              style={[
                styles.featureText,
                { color: isDarkMode ? "#ffffff" : "#000000" },
              ]}
            >
              Real-time race day execution tools
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Card
        style={[
          styles.card,
          { backgroundColor: isDarkMode ? "#2c2c2c" : "#ffffff" },
        ]}
      >
        <Card.Content>
          <Text
            style={[styles.sectionTitle, { color: paperTheme.colors.primary }]}
          >
            Meet the Creator
          </Text>
          <Text
            style={[
              styles.paragraph,
              { color: isDarkMode ? "#ffffff" : "#000000" },
            ]}
          >
            Hi, I'm Beaux! When I'm not coding, you'll find me on mountain
            trails pushing my limits in ultra marathons. My experiences in both
            the tech and running worlds have shaped this app into what I believe
            is the ultimate planning tool for endurance athletes.
          </Text>
          <Text
            style={[
              styles.paragraph,
              { color: isDarkMode ? "#ffffff" : "#000000" },
            ]}
          >
            I believe that with the right planning and support, anyone can
            achieve their ultra running goals. This app is my contribution to
            the ultra running community - a tool to help you focus on what
            matters: the journey and the finish line.
          </Text>
        </Card.Content>
      </Card>

      <View style={styles.versionContainer}>
        <Text
          style={[
            styles.version,
            { color: isDarkMode ? "#e0e0e0" : "#757575" },
          ]}
        >
          Version 1.0.0
        </Text>
        <Text
          style={[
            styles.copyright,
            { color: isDarkMode ? "#e0e0e0" : "#757575" },
          ]}
        >
          © 2025 UltraEdge
        </Text>
      </View>

      <View style={styles.socialContainer}>
        <Button
          mode="text"
          icon="instagram"
          onPress={() =>
            openLink("https://instagram.com/ultraenduranceplanner")
          }
          style={styles.socialButton}
          labelStyle={{ color: paperTheme.colors.primary }}
        >
          Follow Us
        </Button>
        <Button
          mode="text"
          icon="email-outline"
          onPress={() => openLink("mailto:contact@ultraenduranceplanner.com")}
          style={styles.socialButton}
          labelStyle={{ color: paperTheme.colors.primary }}
        >
          Contact
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 8,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  versionContainer: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  version: {
    fontSize: 14,
  },
  copyright: {
    fontSize: 14,
    marginTop: 4,
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  socialButton: {
    marginHorizontal: 8,
  },
});

export default AboutScreen;
