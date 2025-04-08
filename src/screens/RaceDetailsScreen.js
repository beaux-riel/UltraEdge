import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  Text,
  Card,
  Button,
  Chip,
  List,
  Divider,
  FAB,
  useTheme as usePaperTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRaces } from "../context/RaceContext";
import { useAppTheme } from "../context/ThemeContext";

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
      <Card
        style={[
          styles.infoCard,
          { backgroundColor: isDarkMode ? "#1e1e1e" : "white" },
        ]}
      >
        <Card.Content>
          <View style={styles.infoRow}>
            <Text
              style={[
                styles.infoLabel,
                { color: isDarkMode ? "#9e9e9e" : "#000000" },
              ]}
            >
              Distance:
            </Text>
            <Text
              style={[
                styles.infoValue,
                { color: isDarkMode ? "#ffffff" : "#000000" },
              ]}
            >
              {raceData.distance} {raceData.distanceUnit || "miles"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text
              style={[
                styles.infoLabel,
                { color: isDarkMode ? "#9e9e9e" : "#000000" },
              ]}
            >
              Elevation Gain:
            </Text>
            <Text
              style={[
                styles.infoValue,
                { color: isDarkMode ? "#ffffff" : "#000000" },
              ]}
            >
              {raceData.elevation} {raceData.elevationUnit || "ft"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text
              style={[
                styles.infoLabel,
                { color: isDarkMode ? "#9e9e9e" : "#000000" },
              ]}
            >
              Race Date:
            </Text>
            <Text
              style={[
                styles.infoValue,
                { color: isDarkMode ? "#ffffff" : "#000000" },
              ]}
            >
              {raceData.date}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text
              style={[
                styles.infoLabel,
                { color: isDarkMode ? "#9e9e9e" : "#000000" },
              ]}
            >
              Aid Stations:
            </Text>
            <Text
              style={[
                styles.infoValue,
                { color: isDarkMode ? "#ffffff" : "#000000" },
              ]}
            >
              {raceData.numAidStations}
            </Text>
          </View>
          <View style={styles.chipContainer}>
            {raceData.dropBagsAllowed && (
              <Chip
                style={[
                  styles.chip,
                  { backgroundColor: isDarkMode ? "#333333" : "#EEEEEE" },
                ]}
                icon="bag-personal"
                textStyle={{ color: isDarkMode ? "#ffffff" : "#333333" }}
              >
                Drop Bags
              </Chip>
            )}
            {raceData.crewAllowed && (
              <Chip
                style={[
                  styles.chip,
                  { backgroundColor: isDarkMode ? "#333333" : "#EEEEEE" },
                ]}
                icon="account-group"
                textStyle={{ color: isDarkMode ? "#ffffff" : undefined }}
              >
                Crew Allowed
              </Chip>
            )}
          </View>
        </Card.Content>
      </Card>

      {raceData.mandatoryEquipment &&
        raceData.mandatoryEquipment.length > 0 && (
          <Card
            style={[
              styles.equipmentCard,
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
                Mandatory Equipment
              </Text>
              <View style={styles.equipmentList}>
                {raceData.mandatoryEquipment.map((item, index) => (
                  <Chip
                    key={index}
                    style={[
                      styles.equipmentChip,
                      { backgroundColor: isDarkMode ? "#333333" : undefined },
                    ]}
                    icon="check"
                    textStyle={{ color: isDarkMode ? "#ffffff" : undefined }}
                  >
                    {item}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

      <Card
        style={[
          styles.notesCard,
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
            Race Notes
          </Text>
          <Text style={{ color: isDarkMode ? "#e0e0e0" : "#000000" }}>
            Tap to add notes about race strategy, gear requirements, or other
            important details.
          </Text>
        </Card.Content>
        <Card.Actions>
          <Button color={theme.colors.primary}>Add Notes</Button>
        </Card.Actions>
      </Card>
    </View>
  );

  const renderAidStationsTab = () => (
    <View style={styles.tabContent}>
      {raceData.aidStations?.map((station) => (
        <Card
          key={station.id}
          style={[
            styles.stationCard,
            { backgroundColor: isDarkMode ? "#1e1e1e" : "white" },
          ]}
        >
          <Card.Content>
            <View style={styles.stationHeader}>
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
            <Divider
              style={[
                styles.divider,
                { backgroundColor: isDarkMode ? "#333333" : "#e0e0e0" },
              ]}
            />
            <View style={styles.stationDetails}>
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
                {station.cutoffTime}
              </Text>
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
                        { backgroundColor: isDarkMode ? "#333333" : undefined },
                      ]}
                      small
                      textStyle={{ color: isDarkMode ? "#ffffff" : undefined }}
                    >
                      {key.replace("_", " ")}
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
                            backgroundColor: isDarkMode ? "#333333" : undefined,
                          },
                        ]}
                        small
                        icon="check"
                        textStyle={{
                          color: isDarkMode ? "#ffffff" : undefined,
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
                <Chip
                  icon="bag-personal"
                  style={[
                    styles.accessChip,
                    { backgroundColor: isDarkMode ? "#333333" : undefined },
                  ]}
                  small
                  textStyle={{ color: isDarkMode ? "#ffffff" : undefined }}
                >
                  Drop Bag
                </Chip>
              )}
              {station.crewAllowed && (
                <Chip
                  icon="account-group"
                  style={[
                    styles.accessChip,
                    { backgroundColor: isDarkMode ? "#333333" : undefined },
                  ]}
                  small
                  textStyle={{ color: isDarkMode ? "#ffffff" : undefined }}
                >
                  Crew
                </Chip>
              )}
            </View>
          </Card.Content>
        </Card>
      ))}
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
            title="Add Crew Member"
            titleStyle={{ color: isDarkMode ? "#ffffff" : "#000000" }}
            left={(props) => (
              <List.Icon
                {...props}
                icon="plus-circle"
                color={theme.colors.primary}
              />
            )}
            onPress={() => {}}
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
          <Button color={theme.colors.primary}>Add Instructions</Button>
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
              color: isDarkMode ? "#ffffff" : undefined,
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
              color: isDarkMode ? "#ffffff" : undefined,
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
              color: isDarkMode ? "#ffffff" : undefined,
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
          style={[styles.fab, styles.fabDelete]}
          icon="delete"
          onPress={handleDeleteRace}
          small
          color="#ffffff"
        />
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
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  stationCard: {
    marginBottom: 12,
    borderRadius: 8,
  },
  stationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    flexDirection: "row",
    marginBottom: 8,
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
    marginRight: 4,
    marginBottom: 4,
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
    marginRight: 4,
    marginBottom: 4,
  },
  accessContainer: {
    flexDirection: "row",
    marginTop: 4,
  },
  accessChip: {
    marginRight: 8,
  },
  crewCard: {
    marginBottom: 16,
    borderRadius: 8,
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
});

export default RaceDetailsScreen;
