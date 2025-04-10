import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  ImageBackground,
} from "react-native";
import {
  Text,
  Card,
  Button,
  Chip,
  List,
  Divider,
  FAB,
  IconButton,
  useTheme as usePaperTheme,
  Surface,
  Avatar,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRaces } from "../context/RaceContext";
import { useAppTheme } from "../context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { useSettings } from "../context/SettingsContext";

// Define feature colors for aid station chips
// const featureColors = {
//   dropBags: {
//     lightBg: "#e8f5e9",
//     lightText: "#2e7d32",
//     darkBg: "#2e7d32",
//     darkText: "#ffffff"
//   },
//   crew: {
//     lightBg: "#e3f2fd",
//     lightText: "#1565c0",
//     darkBg: "#1565c0",
//     darkText: "#ffffff"
//   }
// };

// Function to format date from MM/DD/YYYY to "Apr 7, 2025"
const formatDate = (dateString) => {
  if (!dateString) return "";

  // Parse MM/DD/YYYY format
  const [month, day, year] = dateString.split("/");

  // Create a Date object (months are 0-based in JavaScript)
  const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

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

// Feature color schemes
const featureColors = {
  dropBags: {
    lightBg: "#c8e6c9", // light green
    darkBg: "#1b5e20", // dark green
    lightText: "#1b5e20",
    darkText: "#ffffff",
  },
  crew: {
    lightBg: "#c5cae9", // light indigo
    darkBg: "#1a237e", // dark indigo
    lightText: "#1a237e",
    darkText: "#ffffff",
  },
  poles: {
    lightBg: "#d1c4e9", // light purple
    darkBg: "#4a148c", // dark purple
    lightText: "#4a148c",
    darkText: "#ffffff",
  },
  pacer: {
    lightBg: "#ffccbc", // light orange/amber
    darkBg: "#e65100", // dark orange
    lightText: "#e65100",
    darkText: "#ffffff",
  },
};

const RaceDetailsScreen = ({ route, navigation }) => {
  // All hooks must be declared at the top.
  const { id } = route.params;
  const paperTheme = usePaperTheme();
  const { isDarkMode, theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { getRaceById, deleteRace, loading } = useRaces();
  const didMountRef = useRef(false);

  useEffect(() => {
    // Skip on the first render
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    if (!loading && !raceData.id) {
      Alert.alert(
        "Race Deleted",
        "This race has been removed from your list.",
        [{ text: "OK", onPress: () => navigation.navigate("Main") }]
      );
    }
  }, [loading, raceData, navigation]);

  // Local state for managing the active tab.
  const [activeTab, setActiveTab] = useState("overview");

  // Retrieve race data.
  const raceData = getRaceById(id) || {};

  // Format the race date
  const formattedDate = formatDate(raceData.date);

  // Conditional returns after hooks are declared.
  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: isDarkMode ? "#121212" : "#f5f5f5" },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text
          style={[
            styles.loadingText,
            { color: isDarkMode ? "#ffffff" : "#000000" },
          ]}
        >
          Loading race details...
        </Text>
      </View>
    );
  }

  if (!raceData.id) {
    return null; // The useEffect handles navigation away.
  }

  const handleDeleteRace = () => {
    Alert.alert(
      "Delete Race",
      `Are you sure you want to delete "${raceData.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteRace(id);
            navigation.navigate("Main");
          },
        },
      ]
    );
  };

  // Render functions for each tab.
  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Race Stats Card */}
      <Card
        style={[
          styles.infoCard,
          { backgroundColor: isDarkMode ? "#1e1e1e" : "white" },
        ]}
      >
        <Card.Title
          title="Race Statistics"
          titleStyle={{
            color: isDarkMode ? "#ffffff" : "#000000",
            fontWeight: "bold",
          }}
          left={(props) => (
            <Avatar.Icon
              {...props}
              icon="chart-bar"
              color="#ffffff"
              style={{ backgroundColor: theme.colors.primary }}
            />
          )}
        />
        <Card.Content>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Avatar.Icon
                size={40}
                icon="map-marker-distance"
                style={{ backgroundColor: isDarkMode ? "#333333" : "#e0e0e0" }}
                color={isDarkMode ? "#ffffff" : theme.colors.primary}
              />
              <Text style={styles.statLabel}>Distance</Text>
              <Text
                style={[
                  styles.statValue,
                  { color: isDarkMode ? "#ffffff" : "#000000" },
                ]}
              >
                {raceData.distance} {raceData.distanceUnit || "miles"}
              </Text>
            </View>

            <View style={styles.statItem}>
              <Avatar.Icon
                size={40}
                icon="terrain"
                style={{ backgroundColor: isDarkMode ? "#333333" : "#e0e0e0" }}
                color={isDarkMode ? "#ffffff" : theme.colors.primary}
              />
              <Text style={styles.statLabel}>Elevation</Text>
              <Text
                style={[
                  styles.statValue,
                  { color: isDarkMode ? "#ffffff" : "#000000" },
                ]}
              >
                {raceData.elevation} {raceData.elevationUnit || "ft"}
              </Text>
            </View>

            <View style={styles.statItem}>
              <Avatar.Icon
                size={40}
                icon="calendar"
                style={{ backgroundColor: isDarkMode ? "#333333" : "#e0e0e0" }}
                color={isDarkMode ? "#ffffff" : theme.colors.primary}
              />
              <Text style={styles.statLabel}>Date</Text>
              <Text
                style={[
                  styles.statValue,
                  { color: isDarkMode ? "#ffffff" : "#000000" },
                ]}
              >
                {formattedDate}
              </Text>
            </View>

            <View style={styles.statItem}>
              <Avatar.Icon
                size={40}
                icon="water"
                style={{ backgroundColor: isDarkMode ? "#333333" : "#e0e0e0" }}
                color={isDarkMode ? "#ffffff" : theme.colors.primary}
              />
              <Text style={styles.statLabel}>Aid Stations</Text>
              <Text
                style={[
                  styles.statValue,
                  { color: isDarkMode ? "#ffffff" : "#000000" },
                ]}
              >
                {raceData.numAidStations}
              </Text>
            </View>
          </View>

          <Divider style={[styles.divider, { marginVertical: 16 }]} />

          <Text
            style={[
              styles.sectionSubtitle,
              { color: isDarkMode ? "#ffffff" : "#000000" },
            ]}
          >
            Race Features
          </Text>
          <View style={styles.featuresContainer}>
            <Chip
              style={[
                styles.featureChip,
                {
                  backgroundColor: raceData.dropBagsAllowed
                    ? isDarkMode
                      ? featureColors.dropBags.darkBg
                      : featureColors.dropBags.lightBg
                    : isDarkMode
                    ? "#333333"
                    : "#EEEEEE",
                  opacity: raceData.dropBagsAllowed ? 1 : 0.5,
                },
              ]}
              icon="bag-personal"
              textStyle={{
                color: raceData.dropBagsAllowed
                  ? isDarkMode
                    ? featureColors.dropBags.darkText
                    : featureColors.dropBags.lightText
                  : isDarkMode
                  ? "#9e9e9e"
                  : "#757575",
              }}
            >
              Drop Bags {raceData.dropBagsAllowed}
            </Chip>

            <Chip
              style={[
                styles.featureChip,
                {
                  backgroundColor: raceData.crewAllowed
                    ? isDarkMode
                      ? featureColors.crew.darkBg
                      : featureColors.crew.lightBg
                    : isDarkMode
                    ? "#333333"
                    : "#EEEEEE",
                  opacity: raceData.crewAllowed ? 1 : 0.5,
                },
              ]}
              icon="account-group"
              textStyle={{
                color: raceData.crewAllowed
                  ? isDarkMode
                    ? featureColors.crew.darkText
                    : featureColors.crew.lightText
                  : isDarkMode
                  ? "#9e9e9e"
                  : "#757575",
              }}
            >
              Crew Access {raceData.crewAllowed}
            </Chip>

            <Chip
              style={[
                styles.featureChip,
                {
                  backgroundColor: raceData.hikingPolesAllowed
                    ? isDarkMode
                      ? featureColors.poles.darkBg
                      : featureColors.poles.lightBg
                    : isDarkMode
                    ? "#333333"
                    : "#EEEEEE",
                  opacity: raceData.hikingPolesAllowed ? 1 : 0.5,
                },
              ]}
              icon="ski-cross-country"
              textStyle={{
                color: raceData.hikingPolesAllowed
                  ? isDarkMode
                    ? featureColors.poles.darkText
                    : featureColors.poles.lightText
                  : isDarkMode
                  ? "#9e9e9e"
                  : "#757575",
              }}
            >
              Poles Allowed {raceData.hikingPolesAllowed}
            </Chip>

            <Chip
              style={[
                styles.featureChip,
                {
                  backgroundColor: raceData.pacerAllowed
                    ? isDarkMode
                      ? featureColors.pacer.darkBg
                      : featureColors.pacer.lightBg
                    : isDarkMode
                    ? "#333333"
                    : "#EEEEEE",
                  opacity: raceData.pacerAllowed ? 1 : 0.5,
                },
              ]}
              icon="run-fast"
              textStyle={{
                color: raceData.pacerAllowed
                  ? isDarkMode
                    ? featureColors.pacer.darkText
                    : featureColors.pacer.lightText
                  : isDarkMode
                  ? "#9e9e9e"
                  : "#757575",
              }}
            >
              Pacer Allowed {raceData.pacerAllowed}
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* Race Description Card */}
      <Card
        style={[
          styles.descriptionCard,
          { backgroundColor: isDarkMode ? "#1e1e1e" : "white" },
        ]}
      >
        <Card.Title
          title="Race Description"
          titleStyle={{
            color: isDarkMode ? "#ffffff" : "#000000",
            fontWeight: "bold",
          }}
          left={(props) => (
            <Avatar.Icon
              {...props}
              icon="information-outline"
              color="#ffffff"
              style={{ backgroundColor: theme.colors.primary }}
            />
          )}
        />
        <Card.Content>
          <Text
            style={{
              color: isDarkMode ? "#e0e0e0" : "#000000",
              lineHeight: 22,
            }}
          >
            {raceData.description ||
              `${raceData.name} is a ${raceData.distance} ${
                raceData.distanceUnit || "mile"
              } race with approximately ${raceData.elevation} ${
                raceData.elevationUnit || "ft"
              } of elevation gain. The race features ${
                raceData.numAidStations
              } aid stations along the course.`}
          </Text>

          <Divider style={[styles.divider, { marginVertical: 16 }]} />

          <Text
            style={[
              styles.sectionSubtitle,
              { color: isDarkMode ? "#ffffff" : "#000000" },
            ]}
          >
            Course Terrain
          </Text>
          <View style={styles.terrainContainer}>
            {raceData.terrain ? (
              raceData.terrain.map((item, index) => (
                <Chip
                  key={index}
                  style={[
                    styles.terrainChip,
                    { backgroundColor: isDarkMode ? "#333333" : "#f0f0f0" },
                  ]}
                  icon="terrain"
                  textStyle={{ color: isDarkMode ? "#ffffff" : "#000000" }}
                >
                  {item}
                </Chip>
              ))
            ) : (
              <>
                <Chip
                  style={[
                    styles.terrainChip,
                    { backgroundColor: isDarkMode ? "#333333" : "#f0f0f0" },
                  ]}
                  icon="terrain"
                  textStyle={{ color: isDarkMode ? "#ffffff" : "#000000" }}
                >
                  Trail
                </Chip>
                <Chip
                  style={[
                    styles.terrainChip,
                    { backgroundColor: isDarkMode ? "#333333" : "#f0f0f0" },
                  ]}
                  icon="tree"
                  textStyle={{ color: isDarkMode ? "#ffffff" : "#000000" }}
                >
                  Forest
                </Chip>
              </>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Mandatory Equipment Card */}
      <Card
        style={[
          styles.equipmentCard,
          { backgroundColor: isDarkMode ? "#1e1e1e" : "white" },
        ]}
      >
        <Card.Title
          title="Mandatory Equipment"
          titleStyle={{
            color: isDarkMode ? "#ffffff" : "#000000",
            fontWeight: "bold",
          }}
          left={(props) => (
            <Avatar.Icon
              {...props}
              icon="toolbox"
              color="#ffffff"
              style={{ backgroundColor: theme.colors.primary }}
            />
          )}
        />
        <Card.Content>
          {raceData.mandatoryEquipment &&
          raceData.mandatoryEquipment.length > 0 ? (
            <View style={styles.equipmentList}>
              {raceData.mandatoryEquipment.map((item, index) => (
                <Chip
                  key={index}
                  style={[
                    styles.equipmentChip,
                    { backgroundColor: isDarkMode ? "#333333" : "#f0f0f0" },
                  ]}
                  icon="check-circle"
                  textStyle={{ color: isDarkMode ? "#ffffff" : "#000000" }}
                >
                  {item}
                </Chip>
              ))}
            </View>
          ) : (
            <Text
              style={{
                color: isDarkMode ? "#e0e0e0" : "#000000",
                fontStyle: "italic",
              }}
            >
              No mandatory equipment specified for this race. Check the race
              website for the most up-to-date requirements.
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* Race Notes Card */}
      <Card
        style={[
          styles.notesCard,
          { backgroundColor: isDarkMode ? "#1e1e1e" : "white" },
        ]}
      >
        <Card.Title
          title="Race Notes"
          titleStyle={{
            color: isDarkMode ? "#ffffff" : "#000000",
            fontWeight: "bold",
          }}
          left={(props) => (
            <Avatar.Icon
              {...props}
              icon="note-text"
              color="#ffffff"
              style={{ backgroundColor: theme.colors.primary }}
            />
          )}
        />
        <Card.Content>
          <Text
            style={{
              color: isDarkMode ? "#e0e0e0" : "#000000",
              marginBottom: 10,
            }}
          >
            {raceData.notes ||
              "Tap to add notes about race strategy, gear requirements, or other important details."}
          </Text>
        </Card.Content>
        <Card.Actions>
          <Button
            mode="contained"
            icon="pencil"
            color={theme.colors.primary}
            style={{ borderRadius: 20 }}
          >
            {raceData.notes ? "Edit Notes" : "Add Notes"}
          </Button>
        </Card.Actions>
      </Card>

      {/* Weather Forecast Card */}
      <Card
        style={[
          styles.weatherCard,
          { backgroundColor: isDarkMode ? "#1e1e1e" : "white" },
        ]}
      >
        <Card.Title
          title="Weather Forecast"
          titleStyle={{
            color: isDarkMode ? "#ffffff" : "#000000",
            fontWeight: "bold",
          }}
          left={(props) => (
            <Avatar.Icon
              {...props}
              icon="weather-partly-cloudy"
              color="#ffffff"
              style={{ backgroundColor: theme.colors.primary }}
            />
          )}
        />
        <Card.Content>
          <Text
            style={{
              color: isDarkMode ? "#e0e0e0" : "#000000",
              fontStyle: "italic",
            }}
          >
            Weather data will be available closer to race day.
          </Text>
        </Card.Content>
        <Card.Actions>
          <Button
            mode="outlined"
            icon="refresh"
            color={theme.colors.primary}
            style={{ borderRadius: 20 }}
          >
            Check Forecast
          </Button>
        </Card.Actions>
      </Card>
    </View>
  );

  const renderAidStationsTab = () => (
    <View style={styles.tabContent}>
      <Button
        mode="contained"
        icon="plus"
        onPress={() => navigation.navigate("AidStationSetup", { raceData })}
        style={[styles.addButton, { backgroundColor: theme.colors.secondary }]}
      >
        Manage Aid Stations
      </Button>

      {raceData.aidStations?.length > 0 ? (
        raceData.aidStations.map((station, index) => (
          <Card
            key={station.id}
            style={[
              styles.stationCard,
              {
                backgroundColor: isDarkMode ? "#1e1e1e" : "white",
                borderLeftWidth: 4,
                borderLeftColor: theme.colors.primary,
                elevation: 4,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDarkMode ? 0.3 : 0.1,
                shadowRadius: 4,
              },
            ]}
          >
            <Card.Content>
              <View style={styles.cardActions}>
                <IconButton
                  icon="dots-vertical"
                  color={theme.colors.primary}
                  size={20}
                  onPress={() =>
                    navigation.navigate("EditAidStation", {
                      raceId: id,
                      stationIndex: index,
                    })
                  }
                />
              </View>
              <View style={styles.stationHeader}>
                <View style={styles.stationNumberContainer}>
                  <Text
                    style={[
                      styles.stationNumber,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  >
                    {station.number || index + 1}
                  </Text>
                </View>
                <View style={styles.stationNameContainer}>
                  <Text
                    style={[
                      styles.stationName,
                      { color: isDarkMode ? "#ffffff" : "#000000" },
                    ]}
                  >
                    {station.name}
                  </Text>
                  <Text
                    style={[
                      styles.stationDistance,
                      { color: isDarkMode ? "#9e9e9e" : "#000000" },
                    ]}
                  >
                    {raceData.distanceUnit === "km" ? "KM" : "Mile"}{" "}
                    {station.distance}
                  </Text>
                </View>
              </View>
              <Divider
                style={[
                  styles.divider,
                  { backgroundColor: isDarkMode ? "#333333" : "#e0e0e0" },
                ]}
              />
              <View style={styles.stationDetails}>
                <View style={styles.cutoffTimeContainer}>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: isDarkMode ? "#9e9e9e" : "#000000" },
                    ]}
                  >
                    Cut-off Time:
                  </Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: isDarkMode ? "#ffffff" : "#000000" },
                    ]}
                  >
                    {station.cutoffTime && station.cutoffTimeSpecific
                      ? `${station.cutoffTime} (${station.cutoffTimeSpecific})`
                      : station.cutoffTime ||
                        station.cutoffTimeSpecific ||
                        "None"}
                  </Text>
                </View>
              </View>
              <Text
                style={[
                  styles.suppliesTitle,
                  { color: isDarkMode ? "#ffffff" : "#000000" },
                ]}
              >
                Available:
              </Text>
              <View style={styles.suppliesContainer}>
                {Object.entries(station.supplies).map(
                  ([key, value]) =>
                    value && (
                      <Chip
                        key={key}
                        style={[
                          styles.supplyChip,
                          {
                            backgroundColor: isDarkMode ? "#333333" : "#f0f0f0",
                            borderRadius: 16,
                          },
                        ]}
                        small
                        textStyle={{
                          color: isDarkMode ? "#ffffff" : "#000000",
                        }}
                      >
                        {key.replace(/_/g, " ")}
                      </Chip>
                    )
                )}
              </View>
              {station.requiredEquipment &&
                station.requiredEquipment.length > 0 && (
                  <View style={styles.equipmentCheckContainer}>
                    <Text
                      style={[
                        styles.equipmentCheckTitle,
                        { color: isDarkMode ? "#ffffff" : "#000000" },
                      ]}
                    >
                      Equipment Check:
                    </Text>
                    <View style={styles.equipmentCheckList}>
                      {station.requiredEquipment.map((item, idx) => (
                        <Chip
                          key={idx}
                          style={[
                            styles.equipmentCheckChip,
                            {
                              backgroundColor: isDarkMode
                                ? "#333333"
                                : "#f0f0f0",
                              borderRadius: 16,
                            },
                          ]}
                          small
                          icon="check"
                          textStyle={{
                            color: isDarkMode ? "#ffffff" : "#000000",
                          }}
                        >
                          {item}
                        </Chip>
                      ))}
                    </View>
                  </View>
                )}
              <View style={styles.accessContainer}>
                {station.dropBagAllowed && (
                  <>
                    <Chip
                      icon="bag-personal"
                      style={[
                        styles.accessChip,
                        {
                          backgroundColor: isDarkMode
                            ? featureColors.dropBags.darkBg
                            : featureColors.dropBags.lightBg,
                        },
                      ]}
                      small
                      textStyle={{
                        color: isDarkMode
                          ? featureColors.dropBags.darkText
                          : featureColors.dropBags.lightText,
                      }}
                    >
                      Drop Bag
                    </Chip>
                    {station.assignedDropBag && (
                      <Text
                        style={[
                          styles.assignedDropBagText,
                          { color: isDarkMode ? theme.colors.text : "#666666" },
                        ]}
                      >
                        {station.assignedDropBag.name}
                      </Text>
                    )}
                  </>
                )}
                {station.crewAllowed && (
                  <Chip
                    icon="account-group"
                    style={[
                      styles.accessChip,
                      {
                        backgroundColor: isDarkMode
                          ? featureColors.crew.darkBg
                          : featureColors.crew.lightBg,
                      },
                    ]}
                    small
                    textStyle={{
                      color: isDarkMode
                        ? featureColors.crew.darkText
                        : featureColors.crew.lightText,
                    }}
                  >
                    Crew
                  </Chip>
                )}
                {station.washroomAvailable && (
                  <Chip
                    icon="toilet"
                    style={[
                      styles.accessChip,
                      {
                        backgroundColor: isDarkMode ? "#1a237e" : "#c5cae9",
                      },
                    ]}
                    small
                    textStyle={{
                      color: isDarkMode ? "#ffffff" : "#1a237e",
                    }}
                  >
                    Washroom
                  </Chip>
                )}
              </View>
            </Card.Content>
          </Card>
        ))
      ) : (
        <Card
          style={[
            styles.stationCard,
            { backgroundColor: isDarkMode ? "#1e1e1e" : "white" },
          ]}
        >
          <Card.Content>
            <Text
              style={[
                styles.emptyStateText,
                { color: isDarkMode ? "#ffffff" : "#000000" },
              ]}
            >
              No aid stations have been added yet. Click the button above to set
              up aid stations for your race.
            </Text>
          </Card.Content>
        </Card>
      )}
    </View>
  );

  const renderCrewTab = () => (
    <View style={styles.tabContent}>
      <Card
        style={[
          styles.crewCard,
          { backgroundColor: isDarkMode ? "#1e1e1e" : "white" },
        ]}
      >
        <Card.Content>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDarkMode ? "#ffffff" : "#000000" },
            ]}
          >
            Crew Members
          </Text>
          <List.Item
            title="Manage Crew"
            titleStyle={{ color: isDarkMode ? "#ffffff" : "#000000" }}
            left={(props) => (
              <List.Icon
                {...props}
                icon="account-group"
                color={theme.colors.primary}
              />
            )}
            onPress={() =>
              navigation.navigate("CrewManagement", { raceId: id })
            }
          />
          <Divider
            style={{ backgroundColor: isDarkMode ? "#333333" : "#e0e0e0" }}
          />
          <Text
            style={[
              styles.emptyState,
              { color: isDarkMode ? "#9e9e9e" : "#000000" },
            ]}
          >
            No crew members added yet. Add crew members to assign them to aid
            stations.
          </Text>
        </Card.Content>
      </Card>
      <Card
        style={[
          styles.crewCard,
          { backgroundColor: isDarkMode ? "#1e1e1e" : "white" },
        ]}
      >
        <Card.Content>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDarkMode ? "#ffffff" : "#000000" },
            ]}
          >
            Crew Instructions
          </Text>
          <Text style={{ color: isDarkMode ? "#e0e0e0" : "#000000" }}>
            Tap to add specific instructions for your crew, including meeting
            points, driving directions, and what to bring.
          </Text>
        </Card.Content>
        <Card.Actions>
          <Button
            color={theme.colors.primary}
            onPress={() =>
              navigation.navigate("CrewManagement", { raceId: id })
            }
          >
            {raceData.crewInstructions
              ? "Edit Instructions"
              : "Add Instructions"}
          </Button>
        </Card.Actions>
      </Card>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? "#121212" : "#f5f5f5",
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {/* Race Header with Name */}
      <Surface style={styles.headerContainer}>
        <LinearGradient
          colors={isDarkMode ? ["#1a237e", "#283593"] : ["#3949ab", "#5c6bc0"]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <Avatar.Icon
              size={50}
              icon="run-fast"
              style={styles.headerIcon}
              color="#ffffff"
            />
            <View style={styles.headerTextContainer}>
              <Text style={styles.raceName}>{raceData.name}</Text>
              <Text style={styles.raceDate}>{formattedDate}</Text>
            </View>
          </View>
        </LinearGradient>
      </Surface>

      {/* Tab Navigation */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: isDarkMode ? "#121212" : "#f5f5f5",
            borderBottomColor: isDarkMode ? "#333333" : "#e0e0e0",
          },
        ]}
      >
        <Button
          mode={activeTab === "overview" ? "contained" : "text"}
          onPress={() => setActiveTab("overview")}
          style={styles.tabButton}
          labelStyle={[
            styles.tabLabel,
            activeTab !== "overview" && {
              color: isDarkMode ? "#ffffff" : "#FFC5D3",
            },
          ]}
          color={theme.colors.primary}
        >
          Overview
        </Button>
        <Button
          mode={activeTab === "aidStations" ? "contained" : "text"}
          onPress={() => setActiveTab("aidStations")}
          style={styles.tabButton}
          labelStyle={[
            styles.tabLabel,
            activeTab !== "aidStations" && {
              color: isDarkMode ? "#ffffff" : "#FFC5D3",
            },
          ]}
          color={theme.colors.primary}
        >
          Aid Stations
        </Button>
        <Button
          mode={activeTab === "crew" ? "contained" : "text"}
          onPress={() => setActiveTab("crew")}
          style={styles.tabButton}
          labelStyle={[
            styles.tabLabel,
            activeTab !== "crew" && {
              color: isDarkMode ? "#ffffff" : "#FFC5D3",
            },
          ]}
          color={theme.colors.primary}
        >
          Crew
        </Button>
      </View>
      <ScrollView
        style={{ backgroundColor: isDarkMode ? "#121212" : "#f5f5f5" }}
      >
        {activeTab === "overview" && renderOverviewTab()}
        {activeTab === "aidStations" && renderAidStationsTab()}
        {activeTab === "crew" && renderCrewTab()}
      </ScrollView>
      <View style={[styles.fabContainer, { bottom: insets.bottom }]}>
        <FAB
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          icon="pencil"
          onPress={() =>
            navigation.navigate("CreateRace", { editMode: true, raceData })
          }
          color="#ffffff"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addButton: {
    marginBottom: 16,
  },
  emptyStateText: {
    textAlign: "center",
    fontSize: 16,
    opacity: 0.7,
    padding: 16,
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
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    borderRadius: 20,
  },
  tabLabel: {
    fontSize: 12,
  },
  tabContent: {
    padding: 16,
  },
  infoCard: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoLabel: {
    fontWeight: "bold",
    opacity: 0.7,
  },
  infoValue: {
    fontWeight: "bold",
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  chip: {
    marginRight: 8,
    marginTop: 8,
  },
  equipmentCard: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 4,
  },
  equipmentList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  equipmentChip: {
    margin: 4,
  },
  notesCard: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  stationCard: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 4,
  },
  cardActions: {
    position: "absolute",
    top: 0,
    right: 0,
    zIndex: 1,
  },
  stationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  stationNumberContainer: {
    marginRight: 12,
  },
  stationNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    textAlign: "center",
    textAlignVertical: "center",
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
    lineHeight: 36,
  },
  stationNameContainer: {
    flex: 1,
  },
  stationName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  stationDistance: {
    fontWeight: "bold",
    opacity: 0.7,
  },
  divider: {
    marginVertical: 8,
    height: 1,
  },
  stationDetails: {
    marginVertical: 8,
  },
  cutoffTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailLabel: {
    fontWeight: "bold",
    marginRight: 8,
    opacity: 0.7,
  },
  detailValue: {
    fontWeight: "bold",
  },
  suppliesTitle: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  suppliesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  supplyChip: {
    margin: 4,
    borderRadius: 16,
  },
  equipmentCheckContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  equipmentCheckTitle: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  equipmentCheckList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  equipmentCheckChip: {
    margin: 4,
    borderRadius: 16,
  },
  accessContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  accessChip: {
    margin: 4,
    borderRadius: 16,
  },
  assignedDropBagText: {
    fontSize: 12,
    fontStyle: "italic",
    marginLeft: 8,
    marginTop: 2,
  },
  crewCard: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 4,
  },
  emptyState: {
    textAlign: "center",
    marginVertical: 16,
    opacity: 0.7,
  },
  fabContainer: {
    position: "absolute",
    right: 16,
  },
  fab: {
    marginTop: 8,
  },
  fabDelete: {
    backgroundColor: "#f44336",
  },
  // New styles for the enhanced UI
  headerContainer: {
    elevation: 4,
    marginBottom: 8,
  },
  headerGradient: {
    borderRadius: 0,
    padding: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  raceName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  raceDate: {
    fontSize: 16,
    color: "#ffffff",
    opacity: 0.9,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 8,
  },
  statItem: {
    width: "48%",
    alignItems: "center",
    marginBottom: 16,
    padding: 8,
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 14,
    marginTop: 8,
    opacity: 0.7,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 4,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  featuresContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  featureChip: {
    marginRight: 8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  descriptionCard: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 4,
  },
  terrainContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  terrainChip: {
    margin: 4,
  },
  weatherCard: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 4,
  },
});

export default RaceDetailsScreen;
