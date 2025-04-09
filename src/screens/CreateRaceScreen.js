import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
  KeyboardAvoidingView,
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
  Chip,
  Menu,
  RadioButton,
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
  
  // New fields for enhanced features
  const [startTime, setStartTime] = useState(new Date());
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [startTimeString, setStartTimeString] = useState("");
  
  const [cutoffTime, setCutoffTime] = useState("");
  const [cutoffTimeUnit, setCutoffTimeUnit] = useState("hours");
  
  const [goalTime, setGoalTime] = useState("");
  const [goalTimeUnit, setGoalTimeUnit] = useState("hours");
  
  const [hikingPolesAllowed, setHikingPolesAllowed] = useState(false);
  const [pacerAllowed, setPacerAllowed] = useState(false);
  
  const [autoStartTimer, setAutoStartTimer] = useState(true);
  
  const [raceStatus, setRaceStatus] = useState("planned");
  const [resultTime, setResultTime] = useState("");
  const [resultNotes, setResultNotes] = useState("");
  
  // Important dates/times
  const [importantDates, setImportantDates] = useState([]);
  const [importantDateModalVisible, setImportantDateModalVisible] = useState(false);
  const [newImportantDateType, setNewImportantDateType] = useState("gear_pickup");
  const [newImportantDateTime, setNewImportantDateTime] = useState(new Date());
  const [newImportantDateTimeString, setNewImportantDateTimeString] = useState("");
  const [showImportantDatePicker, setShowImportantDatePicker] = useState(false);
  const [importantDatePickerMode, setImportantDatePickerMode] = useState("date");
  const [customImportantDateName, setCustomImportantDateName] = useState("");
  
  // Mandatory equipment state
  const [mandatoryEquipment, setMandatoryEquipment] = useState([]);
  const [equipmentModalVisible, setEquipmentModalVisible] = useState(false);
  const [newEquipmentItem, setNewEquipmentItem] = useState("");
  
  // Pacer gear state
  const [pacerGear, setPacerGear] = useState([]);
  const [pacerGearModalVisible, setPacerGearModalVisible] = useState(false);
  const [newPacerGearItem, setNewPacerGearItem] = useState("");
  const [newPacerGearIsMandatory, setNewPacerGearIsMandatory] = useState(true);

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

      // Set start time if it exists
      if (existingRace.startTime) {
        const timeParts = existingRace.startTime.split(":");
        if (timeParts.length === 2) {
          const newStartTime = new Date();
          newStartTime.setHours(parseInt(timeParts[0], 10));
          newStartTime.setMinutes(parseInt(timeParts[1], 10));
          setStartTime(newStartTime);
          setStartTimeString(existingRace.startTime);
        }
      }

      // Set cutoff time if it exists
      if (existingRace.cutoffTime) {
        if (typeof existingRace.cutoffTime === 'object' && existingRace.cutoffTime.value) {
          setCutoffTime(existingRace.cutoffTime.value.toString());
          setCutoffTimeUnit(existingRace.cutoffTime.unit || "hours");
        } else {
          setCutoffTime(existingRace.cutoffTime.toString());
        }
      }

      // Set goal time if it exists
      if (existingRace.goalTime) {
        if (typeof existingRace.goalTime === 'object' && existingRace.goalTime.value) {
          setGoalTime(existingRace.goalTime.value.toString());
          setGoalTimeUnit(existingRace.goalTime.unit || "hours");
        } else {
          setGoalTime(existingRace.goalTime.toString());
        }
      }

      // Set hiking poles allowed
      setHikingPolesAllowed(
        existingRace.hikingPolesAllowed !== undefined 
          ? existingRace.hikingPolesAllowed 
          : true
      );

      // Set pacer allowed
      setPacerAllowed(existingRace.pacerAllowed || false);

      // Set auto start timer
      setAutoStartTimer(
        existingRace.autoStartTimer !== undefined 
          ? existingRace.autoStartTimer 
          : true
      );

      // Set race status and result
      setRaceStatus(existingRace.raceStatus || "planned");
      if (existingRace.resultTime) {
        setResultTime(existingRace.resultTime.toString());
      }
      setResultNotes(existingRace.resultNotes || "");

      // Set important dates
      setImportantDates(existingRace.importantDates || []);

      // Set basic race info
      setNumAidStations(existingRace.numAidStations.toString());
      setDropBagsAllowed(existingRace.dropBagsAllowed);
      setCrewAllowed(existingRace.crewAllowed);
      
      // Set equipment
      setMandatoryEquipment(existingRace.mandatoryEquipment || []);
      setPacerGear(existingRace.pacerGear || []);
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

  const onStartTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || startTime;
    setShowStartTimePicker(Platform.OS === "ios");
    setStartTime(currentTime);

    // Format time as HH:MM
    const hours = currentTime.getHours().toString().padStart(2, "0");
    const minutes = currentTime.getMinutes().toString().padStart(2, "0");
    setStartTimeString(`${hours}:${minutes}`);
  };

  const onImportantDateTimeChange = (event, selectedDateTime) => {
    const currentDateTime = selectedDateTime || newImportantDateTime;
    setShowImportantDatePicker(Platform.OS === "ios");
    setNewImportantDateTime(currentDateTime);

    // Format based on mode
    if (importantDatePickerMode === "date") {
      // Format date as MM/DD/YYYY
      const month = (currentDateTime.getMonth() + 1).toString().padStart(2, "0");
      const day = currentDateTime.getDate().toString().padStart(2, "0");
      const year = currentDateTime.getFullYear();
      setNewImportantDateTimeString(`${month}/${day}/${year}`);
      
      // Switch to time picker after date is selected
      if (Platform.OS !== "ios") {
        setTimeout(() => {
          setImportantDatePickerMode("time");
          setShowImportantDatePicker(true);
        }, 100);
      }
    } else {
      // Format time as HH:MM
      const hours = currentDateTime.getHours().toString().padStart(2, "0");
      const minutes = currentDateTime.getMinutes().toString().padStart(2, "0");
      
      // Combine with existing date
      const existingDate = newImportantDateTimeString.split(" ")[0];
      const ampm = currentDateTime.getHours() >= 12 ? "PM" : "AM";
      const hours12 = (currentDateTime.getHours() % 12 || 12).toString();
      
      setNewImportantDateTimeString(
        `${existingDate} ${hours12}:${minutes} ${ampm}`
      );
    }
  };

  const addImportantDate = () => {
    if (newImportantDateTimeString) {
      const newImportantDate = {
        id: Date.now().toString(),
        type: newImportantDateType,
        datetime: newImportantDateTimeString,
        name: newImportantDateType === "custom" ? customImportantDateName : "",
      };
      
      setImportantDates([...importantDates, newImportantDate]);
      setNewImportantDateTimeString("");
      setCustomImportantDateName("");
      setImportantDateModalVisible(false);
    }
  };

  const removeImportantDate = (id) => {
    const updatedImportantDates = importantDates.filter(date => date.id !== id);
    setImportantDates(updatedImportantDates);
  };

  const getImportantDateTypeName = (type) => {
    switch (type) {
      case "gear_pickup":
        return "Gear Pickup";
      case "mandatory_briefing":
        return "Mandatory Briefing";
      case "custom":
        return "Custom";
      default:
        return type;
    }
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
  
  const addPacerGearItem = () => {
    if (newPacerGearItem.trim()) {
      setPacerGear([
        ...pacerGear, 
        {
          id: Date.now().toString(),
          name: newPacerGearItem.trim(),
          isMandatory: newPacerGearIsMandatory
        }
      ]);
      setNewPacerGearItem("");
    }
  };
  
  const removePacerGearItem = (id) => {
    const updatedPacerGear = pacerGear.filter(item => item.id !== id);
    setPacerGear(updatedPacerGear);
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
      startTime: startTimeString,
      cutoffTime: cutoffTime ? { value: parseFloat(cutoffTime), unit: cutoffTimeUnit } : null,
      goalTime: goalTime ? { value: parseFloat(goalTime), unit: goalTimeUnit } : null,
      hikingPolesAllowed,
      pacerAllowed,
      pacerGear: pacerAllowed ? pacerGear : [],
      autoStartTimer,
      raceStatus,
      resultTime: resultTime || null,
      resultNotes: resultNotes || "",
      importantDates,
      numAidStations: parseInt(numAidStations),
      dropBagsAllowed,
      crewAllowed,
      mandatoryEquipment,
      // Keep any existing aid stations if we're editing, otherwise initialize with empty array
      aidStations: existingRace?.aidStations || [],
    };

    if (existingRace) {
      // Update existing race
      updateRace(existingRace.id, newRaceData);
      navigation.navigate("RaceDetails", { id: existingRace.id });
    } else {
      // Create new race and navigate directly to race details
      const newRaceId = newRaceData.id;
      addRace(newRaceData);
      navigation.navigate("RaceDetails", { id: newRaceId, isNew: true });
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
          
          <TouchableOpacity onPress={() => setShowStartTimePicker(true)}>
            <View pointerEvents="none">
              <TextInput
                label="Race Start Time"
                value={startTimeString}
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
                    icon="clock"
                    color={isDarkMode ? "#ffffff" : undefined}
                  />
                }
              />
            </View>
          </TouchableOpacity>

          {showStartTimePicker && (
            <DateTimePicker
              value={startTime}
              mode="time"
              display="default"
              onChange={onStartTimeChange}
              themeVariant={isDarkMode ? "dark" : "light"}
            />
          )}
          
          <View style={styles.inputRow}>
            <TextInput
              label="Cutoff Time"
              value={cutoffTime}
              onChangeText={setCutoffTime}
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
              value={cutoffTimeUnit}
              onValueChange={setCutoffTimeUnit}
              buttons={[
                { value: "hours", label: "hrs" },
                { value: "days", label: "days" },
              ]}
              style={styles.segmentedButton}
            />
          </View>
          
          <View style={styles.inputRow}>
            <TextInput
              label="Goal Time"
              value={goalTime}
              onChangeText={setGoalTime}
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
              value={goalTimeUnit}
              onValueChange={setGoalTimeUnit}
              buttons={[
                { value: "hours", label: "hrs" },
                { value: "days", label: "days" },
              ]}
              style={styles.segmentedButton}
            />
          </View>

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
          
          {/* Important Dates Section */}
          <View style={styles.sectionHeader}>
            <Text
              style={[
                styles.sectionTitle,
                { color: isDarkMode ? "#ffffff" : "#000000" },
              ]}
            >
              Important Dates & Times
            </Text>
            <Button
              mode="contained"
              onPress={() => setImportantDateModalVisible(true)}
              style={styles.addButton}
              icon="plus"
              color={theme.colors.primary}
            >
              Add
            </Button>
          </View>
          
          {importantDates.length === 0 ? (
            <Text
              style={[
                styles.emptyText,
                { color: isDarkMode ? "#9e9e9e" : undefined },
              ]}
            >
              No important dates added yet.
            </Text>
          ) : (
            <View
              style={[
                styles.equipmentList,
                { backgroundColor: isDarkMode ? "#1e1e1e" : "white" },
              ]}
            >
              {importantDates.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.equipmentItem,
                    { borderBottomColor: isDarkMode ? "#333333" : "#f0f0f0" },
                  ]}
                >
                  <View>
                    <Text style={{ color: isDarkMode ? "#ffffff" : "#000000", fontWeight: 'bold' }}>
                      {item.type === "custom" ? item.name : getImportantDateTypeName(item.type)}
                    </Text>
                    <Text style={{ color: isDarkMode ? "#cccccc" : "#666666" }}>
                      {item.datetime}
                    </Text>
                  </View>
                  <IconButton
                    icon="delete"
                    size={20}
                    onPress={() => removeImportantDate(item.id)}
                    color={isDarkMode ? "#e0e0e0" : undefined}
                  />
                </View>
              ))}
            </View>
          )}

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
          
          <View style={styles.switchContainer}>
            <Text style={{ color: isDarkMode ? "#ffffff" : "#000000" }}>
              Hiking Poles Allowed
            </Text>
            <Switch
              value={hikingPolesAllowed}
              onValueChange={setHikingPolesAllowed}
              color={theme.colors.primary}
            />
          </View>
          
          <View style={styles.switchContainer}>
            <Text style={{ color: isDarkMode ? "#ffffff" : "#000000" }}>
              Pacer Allowed
            </Text>
            <Switch
              value={pacerAllowed}
              onValueChange={setPacerAllowed}
              color={theme.colors.primary}
            />
          </View>
          
          <View style={styles.switchContainer}>
            <Text style={{ color: isDarkMode ? "#ffffff" : "#000000" }}>
              Auto Start Race Timer
            </Text>
            <Switch
              value={autoStartTimer}
              onValueChange={setAutoStartTimer}
              color={theme.colors.primary}
            />
          </View>
          
          {autoStartTimer && (
            <HelperText
              type="info"
              style={[
                styles.helperText,
                { color: isDarkMode ? "#9e9e9e" : undefined, marginTop: -8, marginBottom: 16 },
              ]}
            >
              Timer will start automatically at race start time
            </HelperText>
          )}

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
          
          {pacerAllowed && (
            <View style={styles.equipmentSection}>
              <View style={styles.sectionHeader}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: isDarkMode ? "#ffffff" : "#000000" },
                  ]}
                >
                  Pacer Gear
                </Text>
                <Button
                  mode="contained"
                  onPress={() => setPacerGearModalVisible(true)}
                  style={styles.addButton}
                  icon="plus"
                  color={theme.colors.primary}
                >
                  Add Item
                </Button>
              </View>

              {pacerGear.length === 0 ? (
                <Text
                  style={[
                    styles.emptyText,
                    { color: isDarkMode ? "#9e9e9e" : undefined },
                  ]}
                >
                  No pacer gear added yet.
                </Text>
              ) : (
                <View
                  style={[
                    styles.equipmentList,
                    { backgroundColor: isDarkMode ? "#1e1e1e" : "white" },
                  ]}
                >
                  {pacerGear.map((item) => (
                    <View
                      key={item.id}
                      style={[
                        styles.equipmentItem,
                        { borderBottomColor: isDarkMode ? "#333333" : "#f0f0f0" },
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ color: isDarkMode ? "#ffffff" : "#000000" }}>
                          {item.name}
                        </Text>
                        {item.isMandatory && (
                          <Chip 
                            style={{ marginLeft: 8, backgroundColor: theme.colors.primary + '40' }}
                            textStyle={{ fontSize: 10 }}
                          >
                            Required
                          </Chip>
                        )}
                      </View>
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => removePacerGearItem(item.id)}
                        color={isDarkMode ? "#e0e0e0" : undefined}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

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
        {/* Mandatory Equipment Modal */}
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
        
        {/* Pacer Gear Modal */}
        <Modal
          visible={pacerGearModalVisible}
          onDismiss={() => setPacerGearModalVisible(false)}
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
            Add Pacer Gear
          </Text>
          <TextInput
            label="Gear Item"
            value={newPacerGearItem}
            onChangeText={setNewPacerGearItem}
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
          
          <View style={styles.switchContainer}>
            <Text style={{ color: isDarkMode ? "#ffffff" : "#000000" }}>
              Mandatory Item
            </Text>
            <Switch
              value={newPacerGearIsMandatory}
              onValueChange={setNewPacerGearIsMandatory}
              color={theme.colors.primary}
            />
          </View>
          
          <View style={styles.modalButtons}>
            <Button
              onPress={() => setPacerGearModalVisible(false)}
              color={isDarkMode ? "#e0e0e0" : undefined}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={() => {
                addPacerGearItem();
                if (!newPacerGearItem.trim()) {
                  setPacerGearModalVisible(false);
                }
              }}
              disabled={!newPacerGearItem.trim()}
              color={theme.colors.primary}
            >
              Add
            </Button>
          </View>
        </Modal>
        
        {/* Important Dates Modal */}
        <Modal
          visible={importantDateModalVisible}
          onDismiss={() => setImportantDateModalVisible(false)}
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
            Add Important Date/Time
          </Text>
          
          <RadioButton.Group
            onValueChange={value => setNewImportantDateType(value)}
            value={newImportantDateType}
          >
            <View style={styles.radioItem}>
              <RadioButton
                value="gear_pickup"
                color={theme.colors.primary}
                uncheckedColor={isDarkMode ? "#777777" : undefined}
              />
              <Text style={{ color: isDarkMode ? "#ffffff" : "#000000" }}>
                Gear Pickup
              </Text>
            </View>
            
            <View style={styles.radioItem}>
              <RadioButton
                value="mandatory_briefing"
                color={theme.colors.primary}
                uncheckedColor={isDarkMode ? "#777777" : undefined}
              />
              <Text style={{ color: isDarkMode ? "#ffffff" : "#000000" }}>
                Mandatory Briefing
              </Text>
            </View>
            
            <View style={styles.radioItem}>
              <RadioButton
                value="custom"
                color={theme.colors.primary}
                uncheckedColor={isDarkMode ? "#777777" : undefined}
              />
              <Text style={{ color: isDarkMode ? "#ffffff" : "#000000" }}>
                Custom
              </Text>
            </View>
          </RadioButton.Group>
          
          {newImportantDateType === "custom" && (
            <TextInput
              label="Custom Event Name"
              value={customImportantDateName}
              onChangeText={setCustomImportantDateName}
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
          )}
          
          <TouchableOpacity 
            onPress={() => {
              setImportantDatePickerMode("date");
              setShowImportantDatePicker(true);
            }}
            style={{ marginVertical: 8 }}
          >
            <View pointerEvents="none">
              <TextInput
                label="Date & Time"
                value={newImportantDateTimeString}
                style={[
                  styles.modalInput,
                  { backgroundColor: isDarkMode ? "#333333" : "white" },
                ]}
                mode="outlined"
                theme={inputTheme}
                labelStyle={labelStyle}
                outlineColor={isDarkMode ? "#555555" : undefined}
                activeOutlineColor={theme.colors.primary}
                right={
                  <TextInput.Icon
                    icon="calendar-clock"
                    color={isDarkMode ? "#ffffff" : undefined}
                  />
                }
              />
            </View>
          </TouchableOpacity>
          
          {showImportantDatePicker && (
            <DateTimePicker
              value={newImportantDateTime}
              mode={importantDatePickerMode}
              display="default"
              onChange={onImportantDateTimeChange}
              themeVariant={isDarkMode ? "dark" : "light"}
            />
          )}
          
          <View style={styles.modalButtons}>
            <Button
              onPress={() => setImportantDateModalVisible(false)}
              color={isDarkMode ? "#e0e0e0" : undefined}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={addImportantDate}
              disabled={!newImportantDateTimeString || (newImportantDateType === "custom" && !customImportantDateName)}
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
  radioItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  dateTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  dateTimeInput: {
    flex: 1,
    marginRight: 8,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  chip: {
    margin: 4,
  },
});

export default CreateRaceScreen;
