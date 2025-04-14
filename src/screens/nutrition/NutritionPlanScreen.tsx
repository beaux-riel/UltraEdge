import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert } from "react-native";
import {
  Text,
  Button,
  ActivityIndicator,
  Card,
  Divider,
  IconButton,
  Portal,
  Modal,
} from "react-native-paper";
import { useAppTheme } from "../../context/ThemeContext";
import { useNutritionHydration } from "../../context/NutritionHydrationContext";
import NutritionPlanForm from "../../components/nutrition/NutritionPlanForm";
import NutritionEntryList from "../../components/nutrition/NutritionEntryList";

/**
 * Screen for creating a new nutrition plan
 * @param {Object} props - Component props
 * @param {Object} props.navigation - React Navigation object
 * @param {Object} props.route - React Navigation route object
 */
const NutritionPlanScreen = ({ navigation, route }) => {
  const { theme, isDarkMode } = useAppTheme();
  const {
    createNutritionPlan,
    getNutritionPlan,
    updateNutritionPlan,
    deleteNutritionEntry,
    nutritionPlans,
  } = useNutritionHydration();

  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [entriesModalVisible, setEntriesModalVisible] = useState(false);

  const { planId } = route.params || {};
  const isCreating = !planId;

  // Load plan data if editing
  useEffect(() => {
    if (planId) {
      const planData = getNutritionPlan
        ? getNutritionPlan(planId)
        : nutritionPlans[planId];
      if (planData) {
        setPlan(planData);
      } else {
        Alert.alert("Error", "Plan not found");
        navigation.goBack();
      }
    }
  }, [planId, getNutritionPlan, nutritionPlans]);

  // Set up navigation options
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <IconButton
          icon="content-save"
          onPress={handleSave}
          disabled={loading}
        />
      ),
    });
  }, [navigation, loading, plan, isEditing]);

  // Warn about unsaved changes
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (!hasUnsavedChanges) {
        return;
      }

      e.preventDefault();

      Alert.alert(
        "Discard changes?",
        "You have unsaved changes. Are you sure you want to discard them and leave?",
        [
          { text: "Don't leave", style: "cancel", onPress: () => {} },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, hasUnsavedChanges]);

  // Handle save
  const handleSave = async (planData) => {
    try {
      setLoading(true);

      if (isCreating || isEditing) {
        const result = isCreating
          ? await createNutritionPlan(planData)
          : await updateNutritionPlan(planId, planData);

        if (result.success) {
          setHasUnsavedChanges(false);

          if (isCreating) {
            navigation.replace("NutritionHydration", {
              screen: "NutritionPlan",
              params: { planId: result.planId },
            });
          } else {
            setPlan(getNutritionPlan(planId));
            setIsEditing(false);
          }
        } else {
          Alert.alert("Error", result.error || "Failed to save plan");
        }
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (isCreating) {
      navigation.goBack();
    } else {
      setIsEditing(false);
    }
  };

  // Handle edit
  const handleEdit = () => {
    setIsEditing(true);
    setHasUnsavedChanges(true);
  };

  // Handle delete entry
  const handleDeleteEntry = async (entryId) => {
    try {
      const result = await deleteNutritionEntry(planId, entryId);
      if (result.success) {
        setPlan(getNutritionPlan(planId));
      } else {
        Alert.alert("Error", result.error || "Failed to delete entry");
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  // Handle edit entry
  const handleEditEntry = (entryId) => {
    setEntriesModalVisible(false);
    navigation.navigate("EditNutritionEntry", { planId, entryId });
  };

  // Handle add entry
  const handleAddEntry = () => {
    setEntriesModalVisible(false);
    navigation.navigate("AddNutritionEntry", { planId });
  };

  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>
          {isCreating ? "Creating plan..." : "Updating plan..."}
        </Text>
      </View>
    );
  }

  // Render form if creating or editing
  if (isCreating || isEditing) {
    return (
      <NutritionPlanForm
        plan={plan}
        onSave={handleSave}
        onCancel={handleCancel}
        isEditing={!isCreating}
      />
    );
  }

  // Render plan details
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title={plan?.name || "Nutrition Plan"} />
        <Card.Content>
          {plan?.description && (
            <Text style={styles.description}>{plan?.description}</Text>
          )}

          <Divider style={styles.divider} />

          <View style={styles.detailsContainer}>
            {plan?.raceType && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Race Type:</Text>
                <Text style={styles.detailValue}>{plan?.raceType}</Text>
              </View>
            )}

            {plan?.raceDuration && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Race Duration:</Text>
                <Text style={styles.detailValue}>
                  {plan?.raceDuration} hours
                </Text>
              </View>
            )}

            {plan?.terrainType && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Terrain:</Text>
                <Text style={styles.detailValue}>{plan?.terrainType}</Text>
              </View>
            )}

            {plan?.weatherCondition && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Weather:</Text>
                <Text style={styles.detailValue}>{plan?.weatherCondition}</Text>
              </View>
            )}

            {plan?.intensityLevel && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Intensity:</Text>
                <Text style={styles.detailValue}>{plan?.intensityLevel}</Text>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={() =>
                navigation.navigate("PlanAnalytics", {
                  planId,
                  planType: "nutrition",
                })
              }
              style={styles.actionButton}
              icon="chart-bar"
            >
              Analytics
            </Button>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate("RaceIntegration")}
              style={styles.actionButton}
              icon="link"
            >
              Race Integration
            </Button>
            <Button
              mode="contained"
              onPress={handleEdit}
              style={styles.actionButton}
              icon="pencil"
            >
              Edit Plan
            </Button>
            <Button
              mode="contained-tonal"
              onPress={() => setEntriesModalVisible(true)}
              style={styles.actionButton}
              icon="food-apple"
            >
              Nutrition Entries ({(plan?.entries || []).length})
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Modal for displaying nutrition entries - avoids nesting FlatList in ScrollView */}
      <Portal>
        <Modal
          visible={entriesModalVisible}
          onDismiss={() => setEntriesModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.entriesContainer}>
            <NutritionEntryList
              entries={plan?.entries || []}
              onEdit={handleEditEntry}
              onDelete={handleDeleteEntry}
              onAdd={handleAddEntry}
            />
          </View>
          <Button
            mode="outlined"
            onPress={() => setEntriesModalVisible(false)}
            style={styles.closeButton}
          >
            Close
          </Button>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  card: {
    marginBottom: 16,
  },
  description: {
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  detailLabel: {
    fontWeight: "bold",
    marginRight: 8,
    width: 100,
  },
  detailValue: {
    flex: 1,
  },
  actions: {
    flexDirection: "column",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  actionButton: {
    margin: 8,
  },
  modalContainer: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 8,
    height: "80%",
    padding: 0,
  },
  entriesContainer: {
    flex: 1,
  },
  closeButton: {
    margin: 16,
  },
});

export default NutritionPlanScreen;
