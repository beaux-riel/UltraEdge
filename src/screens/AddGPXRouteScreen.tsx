import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  Text,
  Button,
  IconButton,
  useTheme as usePaperTheme,
  ActivityIndicator,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useRaces } from "../context/RaceContext";
import { useAppTheme } from "../context/ThemeContext";
import GPXViewer from "../components/visualization/GPXViewer";

const AddGPXRouteScreen = ({ route, navigation }) => {
  const { raceData } = route.params;
  const { updateRace } = useRaces();
  const { isDarkMode, theme } = useAppTheme();
  const paperTheme = usePaperTheme();
  const insets = useSafeAreaInsets();
  
  const [gpxFile, setGpxFile] = useState(raceData.gpxFile || null);
  const [gpxFileName, setGpxFileName] = useState(
    raceData.gpxFile ? raceData.gpxFile.split('/').pop() || 'race-route.gpx' : ""
  );
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(!!raceData.gpxFile);

  const pickGpxFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/gpx+xml",
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        console.log('Document picker was canceled');
        return;
      }
      
      const fileUri = result.assets[0].uri;
      const fileName = result.assets[0].name;
      
      // Check if it's a GPX file
      if (!fileName.toLowerCase().endsWith('.gpx')) {
        Alert.alert('Invalid File', 'Please select a GPX file (.gpx extension)');
        return;
      }
      
      // Save the file URI and name
      setGpxFile(fileUri);
      setGpxFileName(fileName);
      setPreviewMode(true);
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick GPX file');
    }
  };

  const clearGpxFile = () => {
    setGpxFile(null);
    setGpxFileName("");
    setPreviewMode(false);
  };

  const handleSaveGpxRoute = async () => {
    if (!gpxFile) {
      Alert.alert('No GPX File', 'Please select a GPX file first');
      return;
    }

    try {
      setLoading(true);

      // Create a unique filename to avoid conflicts
      const timestamp = new Date().getTime();
      const newFileName = `race_${raceData.id}_${timestamp}.gpx`;
      
      // Ensure the directory exists
      const destinationUri = `${FileSystem.documentDirectory}gpx/${newFileName}`;
      
      try {
        // Create the gpx directory if it doesn't exist
        await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}gpx/`, {
          intermediates: true
        });
      } catch (e) {
        // Directory might already exist, continue
      }
      
      // Copy the file to a persistent location
      await FileSystem.copyAsync({
        from: gpxFile,
        to: destinationUri
      });
      
      // Update the race with the GPX file
      const updatedRace = {
        ...raceData,
        gpxFile: destinationUri
      };
      
      await updateRace(updatedRace);
      
      setLoading(false);
      Alert.alert(
        'Success', 
        'GPX route added successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      setLoading(false);
      console.error('Error saving GPX route:', error);
      Alert.alert('Error', 'Failed to save GPX route');
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? "#121212" : "#f5f5f5",
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          color={paperTheme.colors.primary}
        />
        <Text
          style={[
            styles.headerTitle,
            { color: isDarkMode ? "#ffffff" : "#000000" },
          ]}
        >
          Add GPX Route
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Text
          style={[
            styles.sectionTitle,
            { color: isDarkMode ? "#ffffff" : "#000000" },
          ]}
        >
          {raceData.name}
        </Text>
        
        <Text
          style={[
            styles.description,
            { color: isDarkMode ? "#aaaaaa" : "#666666" },
          ]}
        >
          Add a GPX route file to visualize your race course. This will help you better understand the terrain and plan your race strategy.
        </Text>

        {previewMode && gpxFile ? (
          <View style={styles.previewContainer}>
            <Text
              style={[
                styles.previewTitle,
                { color: isDarkMode ? "#ffffff" : "#000000" },
              ]}
            >
              Route Preview
            </Text>
            <GPXViewer 
              gpxFile={gpxFile}
              height={300}
              backgroundColor={isDarkMode ? "#1e1e1e" : "#ffffff"}
            />
            <View style={styles.previewActions}>
              <Button
                mode="outlined"
                onPress={clearGpxFile}
                style={styles.actionButton}
              >
                Change File
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveGpxRoute}
                style={styles.actionButton}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  "Save Route"
                )}
              </Button>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.gpxUploadButton,
              { backgroundColor: isDarkMode ? "#333333" : "#f0f0f0" }
            ]}
            onPress={pickGpxFile}
          >
            <IconButton
              icon="map-marker-path"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={{ color: isDarkMode ? "#ffffff" : "#000000" }}>
              Select GPX File
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    height: 56,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  gpxUploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    height: 120,
  },
  previewContainer: {
    marginVertical: 16,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  previewActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default AddGPXRouteScreen;