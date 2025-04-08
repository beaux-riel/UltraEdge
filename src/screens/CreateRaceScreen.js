import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  Divider,
  Switch,
  HelperText,
  useTheme as usePaperTheme,
  SegmentedButtons,
  IconButton,
  Portal,
  Modal,
  List,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRaces } from "../context/RaceContext";
import { useAppTheme } from "../context/ThemeContext";
import { useSettings } from "../context/SettingsContext";

const CreateRaceScreen = ({ route, navigation }) => {
  const paperTheme = usePaperTheme();
  const { isDarkMode, theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { addRace, getRaceById, updateRace } = useRaces();
  const { settings } = useSettings();

  // Check if we're in edit mode
  const { editMode, raceData: existingRaceData } = route.params || {};
  const existingRace = editMode && existingRaceData ? existingRaceData : null;

  const [raceName, setRaceName] = useState("");
  const [distance, setDistance] = useState("");
  const [distanceUnit, setDistanceUnit] = useState(settings.distanceUnit);
  const [elevation, setElevation] = useState("");
  const [elevationUnit, setElevationUnit] = useState(settings.elevationUnit);
  const [raceDate, setRaceDate] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [numAidStations, setNumAidStations] = useState("");
  const [dropBagsAllowed, setDropBagsAllowed] = useState(false);
  const [crewAllowed, setCrewAllowed] = useState(false);

  // Mandatory equipment state
  const [mandatoryEquipment, setMandatoryEquipment] = useState([]);
  const [equipmentModalVisible, setEquipmentModalVisible] = useState(false);
  const [newEquipmentItem, setNewEquipmentItem] = useState("");

  // If in edit mode, populate the form with existing data
  useEffect(() => {
    if (existingRace) {
      setRaceName(existingRace.name);
      setDistance(existingRace.distance.toString());
      setDistanceUnit(existingRace.distanceUnit || "miles");
      setElevation(
        existingRace.elevation ? existingRace.elevation.toString() : ""
      );
      setElevationUnit(existingRace.elevationUnit || "ft");
      setRaceDate(existingRace.date);

      // Parse date from string if it exists
      if (existingRace.date) {
        const parts = existingRace.date.split("/");
        if (parts.length === 3) {
          const newDate = new Date(parts[2], parts[0] - 1, parts[1]);
          setDate(newDate);
        }
      }

      setNumAidStations(existingRace.numAidStations.toString());
      setDropBagsAllowed(existingRace.dropBagsAllowed);
      setCrewAllowed(existingRace.crewAllowed);
      setMandatoryEquipment(existingRace.mandatoryEquipment || []);
    }
  }, [existingRace]);

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === "ios");
    setDate(currentDate);

    // Format date as MM/DD/YYYY
    const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
    const day = currentDate.getDate().toString().padStart(2, "0");
    const year = currentDate.getFullYear();
    setRaceDate(`${month}/${day}/${year}`);
  };

  const addEquipmentItem = () => {
    if (newEquipmentItem.trim()) {
      setMandatoryEquipment([...mandatoryEquipment, newEquipmentItem.trim()]);
      setNewEquipmentItem("");
    }
  };

  const removeEquipmentItem = (index) => {
    const updatedEquipment = [...mandatoryEquipment];
    updatedEquipment.splice(index, 1);
    setMandatoryEquipment(updatedEquipment);
  };

  const handleCreateRace = () => {
    const newRaceData = {
      id: existingRace ? existingRace.id : Date.now().toString(),
      name: raceName,
      distance: parseFloat(distance),
      distanceUnit,
      elevation: elevation ? parseFloat(elevation) : 0,
      elevationUnit,
      date: raceDate,
      numAidStations: parseInt(numAidStations),
      dropBagsAllowed,
      crewAllowed,
      mandatoryEquipment,
    };

    if (existingRace) {
      // Update existing race
      updateRace(existingRace.id, newRaceData);
      navigation.navigate("RaceDetails", { id: existingRace.id });
    } else {
      // Create new race
      addRace(newRaceData);
      navigation.navigate("AidStationSetup", { raceData: newRaceData });
    }
  };

  // Define a common input theme that includes colors for text, placeholder, etc.
  const inputTheme = {
    colors: {
      text: isDarkMode ? "#ffffff" : "#000000",
      placeholder: isDarkMode ? "#ffffff" : "#000000",
      primary: theme.colors.primary,
    },
  };

  // Define a common label style for TextInput labels
  const labelStyle = { color: isDarkMode ? "#ffffff" : "#000000" };

  return (
    <Portal.Host>
      <ScrollView
        style={[
          styles.container,
          { backgroundColor: isDarkMode ? "#121212" : "#f5f5f5", },
        ]}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 16,
        }}
      >
        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              { color: isDarkMode ? "#ffffff" : "#000000" },
            ]}
          >
            {existingRace ? "Edit Race Plan" : "Create New Race Plan"}
          </Text>

          <TextInput
            label="Race Name"
            value={raceName}
            onChangeText={setRaceName}
            style={[
              styles.input,
              { backgroundColor: isDarkMode ? "#1e1e1e" : "white" },
            ]}
            mode="outlined"
            theme={inputTheme}
            labelStyle={labelStyle}
            outlineColor={isDarkMode ? "#333333" : undefined}
            activeOutlineColor={theme.colors.primary}
          />

          <View style={styles.inputRow}>
            <TextInput
              label="Distance"
              value={distance}
              onChangeText={setDistance}
              style={[
                styles.input,
                styles.flexInput,
                { backgroundColor: isDarkMode ? "#1e1e1e" : "white" },
              ]}
              keyboardType="numeric"
              mode="outlined"
              theme={inputTheme}
              labelStyle={labelStyle}
              outlineColor={isDarkMode ? "#333333" : undefined}
              activeOutlineColor={theme.colors.primary}
            />
            <SegmentedButtons
              value={distanceUnit}
              onValueChange={setDistanceUnit}
              buttons={[
                { value: "miles", label: "mi" },
                { value: "km", label: "km" },
              ]}
              style={styles.segmentedButton}
            />
          </View>

          <View style={styles.inputRow}>
            <TextInput
              label="Elevation Gain"
              value={elevation}
              onChangeText={setElevation}
              style={[
                styles.input,
                styles.flexInput,
                { backgroundColor: isDarkMode ? "#1e1e1e" : "white" },
              ]}
              keyboardType="numeric"
              mode="outlined"
              theme={inputTheme}
              labelStyle={labelStyle}
              outlineColor={isDarkMode ? "#333333" : undefined}
              activeOutlineColor={theme.colors.primary}
            />
            <SegmentedButtons
              value={elevationUnit}
              onValueChange={setElevationUnit}
              buttons={[
                { value: "ft", label: "ft" },
                { value: "m", label: "m" },
              ]}
              style={styles.segmentedButton}
            />
          </View>

          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <View pointerEvents="none">
              <TextInput
                label="Race Date"
                value={raceDate}
                style={[
                  styles.input,
                  { backgroundColor: isDarkMode ? "#1e1e1e" : "white" },
                ]}
                mode="outlined"
                theme={inputTheme}
                labelStyle={labelStyle}
                outlineColor={isDarkMode ? "#333333" : undefined}
                activeOutlineColor={theme.colors.primary}
                right={
                  <TextInput.Icon
                    icon="calendar"
                    color={isDarkMode ? "#ffffff" : undefined}
                  />
                }
              />
            </View>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={onDateChange}
              themeVariant={isDarkMode ? "dark" : "light"}
            />
          )}

          <TextInput
            label="Number of Aid Stations"
            value={numAidStations}
            onChangeText={setNumAidStations}
            style={[
              styles.input,
              { backgroundColor: isDarkMode ? "#1e1e1e" : "white" },
            ]}
            keyboardType="numeric"
            mode="outlined"
            theme={inputTheme}
            labelStyle={labelStyle}
            outlineColor={isDarkMode ? "#333333" : undefined}
            activeOutlineColor={theme.colors.primary}
          />

          <Divider
            style={[
              styles.divider,
              { backgroundColor: isDarkMode ? "#333333" : "#e0e0e0" },
            ]}
          />

          <View style={styles.switchContainer}>
            <Text style={{ color: isDarkMode ? "#ffffff" : "#000000" }}>
              Drop Bags Allowed
            </Text>
            <Switch
              value={dropBagsAllowed}
              onValueChange={setDropBagsAllowed}
              color={theme.colors.primary}
            />
          </View>

          <View style={styles.switchContainer}>
            <Text style={{ color: isDarkMode ? "#ffffff" : "#000000" }}>
              Crew Access Allowed
            </Text>
            <Switch
              value={crewAllowed}
              onValueChange={setCrewAllowed}
              color={theme.colors.primary}
            />
          </View>

          <Divider
            style={[
              styles.divider,
              { backgroundColor: isDarkMode ? "#333333" : "#e0e0e0" },
            ]}
          />

          <View style={styles.equipmentSection}>
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDarkMode ? "#ffffff" : "#000000" },
                ]}
              >
                Mandatory Equipment
              </Text>
              <Button
                mode="contained"
                onPress={() => setEquipmentModalVisible(true)}
                style={styles.addButton}
                icon="plus"
                color={theme.colors.primary}
              >
                Add Item
              </Button>
            </View>

            {mandatoryEquipment.length === 0 ? (
              <Text
                style={[
                  styles.emptyText,
                  { color: isDarkMode ? "#9e9e9e" : undefined },
                ]}
              >
                No mandatory equipment added yet.
              </Text>
            ) : (
              <View
                style={[
                  styles.equipmentList,
                  { backgroundColor: isDarkMode ? "#1e1e1e" : "white" },
                ]}
              >
                {mandatoryEquipment.map((item, index) => (
                  <View
                    key={index}
                    style={[
                      styles.equipmentItem,
                      { borderBottomColor: isDarkMode ? "#333333" : "#f0f0f0" },
                    ]}
                  >
                    <Text style={{ color: isDarkMode ? "#ffffff" : "#000000" }}>
                      {item}
                    </Text>
                    <IconButton
                      icon="delete"
                      size={20}
                      onPress={() => removeEquipmentItem(index)}
                      color={isDarkMode ? "#e0e0e0" : undefined}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>

          <Button
            mode="contained"
            onPress={handleCreateRace}
            style={styles.button}
            disabled={!raceName || !distance || !numAidStations}
            color={theme.colors.primary}
          >
            {existingRace ? "Save Changes" : "Continue to Aid Station Setup"}
          </Button>

          {!existingRace && (
            <HelperText
              type="info"
              style={[
                styles.helperText,
                { color: isDarkMode ? "#9e9e9e" : undefined },
              ]}
            >
              You'll be able to set up aid station details in the next step.
            </HelperText>
          )}
        </View>
      </ScrollView>

      <Portal>
        <Modal
          visible={equipmentModalVisible}
          onDismiss={() => setEquipmentModalVisible(false)}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: isDarkMode ? "#1e1e1e" : "white" },
          ]}
        >
          <Text
            style={[
              styles.modalTitle,
              { color: isDarkMode ? "#ffffff" : "#000000" },
            ]}
          >
            Add Mandatory Equipment
          </Text>
          <TextInput
            label="Equipment Item"
            value={newEquipmentItem}
            onChangeText={setNewEquipmentItem}
            style={[
              styles.modalInput,
              { backgroundColor: isDarkMode ? "#333333" : "white" },
            ]}
            mode="outlined"
            theme={inputTheme}
            labelStyle={labelStyle}
            outlineColor={isDarkMode ? "#555555" : undefined}
            activeOutlineColor={theme.colors.primary}
          />
          <View style={styles.modalButtons}>
            <Button
              onPress={() => setEquipmentModalVisible(false)}
              color={isDarkMode ? "#e0e0e0" : undefined}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={() => {
                addEquipmentItem();
                if (!newEquipmentItem.trim()) {
                  setEquipmentModalVisible(false);
                }
              }}
              disabled={!newEquipmentItem.trim()}
              color={theme.colors.primary}
            >
              Add
            </Button>
          </View>
        </Modal>
      </Portal>
    </Portal.Host>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    width: "85%",
  },
  flexInput: {
    flex: 1,
    marginBottom: 0,
    marginRight: 8,
  },
  segmentedButton: {
    width: 100,
  },
  divider: {
    marginVertical: 16,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  equipmentSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  addButton: {
    borderRadius: 20,
  },
  emptyText: {
    fontStyle: "italic",
    opacity: 0.7,
    textAlign: "center",
    marginVertical: 16,
  },
  equipmentList: {
    borderRadius: 8,
    padding: 8,
  },
  equipmentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  button: {
    marginTop: 24,
    paddingVertical: 8,
  },
  helperText: {
    textAlign: "center",
    marginTop: 8,
  },
  modalContainer: {
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  modalInput: {
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
});

export default CreateRaceScreen;
