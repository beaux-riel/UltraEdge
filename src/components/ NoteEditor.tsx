import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TextInput,
  Alert,
} from "react-native";
import { Button, useTheme } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useRaces } from "../context/RaceContext";
import { useAppTheme } from "../context/ThemeContext";

const NoteEditor = ({ route }) => {
  const { raceData } = route.params;
  const [notes, setNotes] = useState(raceData.notes || "");
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const paperTheme = useTheme();
  const { isDarkMode } = useAppTheme();
  const { updateRaceNotes } = useRaces();

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await updateRaceNotes(raceData.id, notes);
      Alert.alert("Success", "Notes updated successfully");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to save notes");
      console.error("Error saving note:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? "#121212" : "#f5f5f5" },
      ]}
    >
      <View style={styles.content}>
        <Text
          style={[styles.title, { color: isDarkMode ? "#ffffff" : "#333333" }]}
        >
          {raceData.name} - Notes
        </Text>

        <TextInput
          placeholder="Start writing your race notes here..."
          placeholderTextColor={isDarkMode ? "#9e9e9e" : "#757575"}
          multiline
          numberOfLines={12}
          value={notes}
          onChangeText={(text) => setNotes(text)}
          style={[
            styles.textArea,
            {
              backgroundColor: isDarkMode ? "#1e1e1e" : "#ffffff",
              borderColor: isDarkMode ? "#333333" : "#dddddd",
              color: isDarkMode ? "#ffffff" : "#000000",
            },
          ]}
        />

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={[styles.button, styles.cancelButton]}
            color={paperTheme.colors.primary}
            disabled={isLoading}
          >
            Cancel
          </Button>

          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.button}
            loading={isLoading}
            color={paperTheme.colors.primary}
            disabled={isLoading}
          >
            Save Notes
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  textArea: {
    width: "100%",
    height: "60%",
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    textAlignVertical: "top",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  cancelButton: {
    borderColor: "#dddddd",
  },
});

export default NoteEditor;
