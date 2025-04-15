import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Button, useTheme, TextInput as PaperTextInput } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useRaces } from "../context/RaceContext";
import { useAppTheme } from "../context/ThemeContext";
import { useNotes, NOTE_TYPES } from "../context/NotesContext";

const NoteEditor = ({ route }) => {
  const { entityType = NOTE_TYPES.RACE, entityId, entityName, initialContent = "", noteId = null } = route.params;
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState(initialContent);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigation = useNavigation();
  const paperTheme = useTheme();
  const { isDarkMode } = useAppTheme();
  const { updateRaceNotes } = useRaces();
  const { addNote, updateNote, getNotesForEntity } = useNotes();

  // For backward compatibility with the old notes system
  const handleLegacyRaceNotes = async () => {
    if (entityType === NOTE_TYPES.RACE && route.params.raceData) {
      setIsLoading(true);
      try {
        await updateRaceNotes(route.params.raceData.id, content);
        Alert.alert("Success", "Notes updated successfully");
        navigation.goBack();
      } catch (error) {
        Alert.alert("Error", "Failed to save notes");
        console.error("Error saving note:", error);
      } finally {
        setIsLoading(false);
      }
      return true;
    }
    return false;
  };

  // Load existing note if editing
  useEffect(() => {
    if (noteId) {
      const notes = getNotesForEntity(entityType, entityId);
      const existingNote = notes.find(note => note.id === noteId);
      if (existingNote) {
        setTitle(existingNote.title || "");
        setContent(existingNote.content || "");
      }
    }
    
    // Set title based on entity name if provided
    if (route.params.entityName) {
      setTitle(`${route.params.entityName} Notes`);
    }
  }, [noteId, entityType, entityId]);

  const getEntityTypeLabel = () => {
    switch (entityType) {
      case NOTE_TYPES.RACE: return "Race";
      case NOTE_TYPES.GEAR: return "Gear";
      case NOTE_TYPES.NUTRITION: return "Nutrition";
      case NOTE_TYPES.HYDRATION: return "Hydration";
      case NOTE_TYPES.DROP_BAG: return "Drop Bag";
      case NOTE_TYPES.CREW: return "Crew";
      case NOTE_TYPES.AID_STATION: return "Aid Station";
      case NOTE_TYPES.COURSE: return "Course";
      default: return "General";
    }
  };

  const handleSubmit = async () => {
    // First try legacy race notes system
    const usedLegacySystem = await handleLegacyRaceNotes();
    if (usedLegacySystem) return;
    
    // Otherwise use the new notes system
    setIsLoading(true);
    try {
      if (noteId) {
        // Update existing note
        await updateNote(noteId, { title, content });
      } else {
        // Create new note
        await addNote(content, entityType, entityId, title);
      }
      
      Alert.alert("Success", "Notes saved successfully");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to save notes");
      console.error("Error saving note:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPlaceholderText = () => {
    switch (entityType) {
      case NOTE_TYPES.RACE:
        return "Start writing your race notes here...";
      case NOTE_TYPES.GEAR:
        return "Add notes about your gear items...";
      case NOTE_TYPES.NUTRITION:
        return "Add notes about your nutrition plan...";
      case NOTE_TYPES.HYDRATION:
        return "Add notes about your hydration strategy...";
      case NOTE_TYPES.DROP_BAG:
        return "Add notes about your drop bag contents...";
      case NOTE_TYPES.CREW:
        return "Add notes for your crew members...";
      case NOTE_TYPES.AID_STATION:
        return "Add notes about this aid station...";
      case NOTE_TYPES.COURSE:
        return "Add notes about the course conditions...";
      default:
        return "Start writing your notes here...";
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? "#121212" : "#f5f5f5" },
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidView}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            <Text
              style={[styles.title, { color: isDarkMode ? "#ffffff" : "#333333" }]}
            >
              {route.params.entityName 
                ? `${route.params.entityName} - Notes` 
                : `${getEntityTypeLabel()} Notes`}
            </Text>

            {!route.params.raceData && (
              <PaperTextInput
                label="Title (optional)"
                value={title}
                onChangeText={setTitle}
                style={styles.titleInput}
                mode="outlined"
                theme={{ colors: { primary: paperTheme.colors.primary } }}
              />
            )}

            <TextInput
              placeholder={getPlaceholderText()}
              placeholderTextColor={isDarkMode ? "#9e9e9e" : "#757575"}
              multiline
              numberOfLines={12}
              value={content}
              onChangeText={(text) => setContent(text)}
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  titleInput: {
    marginBottom: 16,
  },
  textArea: {
    width: "100%",
    height: 300,
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
    marginBottom: 32,
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
