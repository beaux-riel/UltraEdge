import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import {
  Text,
  Chip,
  TextInput,
  useTheme as usePaperTheme,
  Button,
} from "react-native-paper";
import { useAppTheme } from "../context/ThemeContext";

const commonRoles = [
  "Crew Manager",
  "Pacer",
  "Driver",
  "Nutrition Support",
  "Medical Support",
  "Gear Manager",
  "Photographer",
  "Emotional Support",
];

const commonResponsibilities = [
  "Medical Supplies",
  "Nutrition",
  "Hydration",
  "Gear Management",
  "Transportation",
  "Accommodation",
  "Navigation",
  "Pacing",
  "Photography",
  "Social Media",
  "Emergency Contact",
];

const CrewRoleSelector = ({
  selectedRole,
  onRoleChange,
  selectedResponsibilities,
  onResponsibilitiesChange,
  customRole,
  onCustomRoleChange,
}) => {
  const paperTheme = usePaperTheme();
  const { isDarkMode, theme } = useAppTheme();
  const [customResponsibility, setCustomResponsibility] = useState("");

  const handleRoleSelect = (role) => {
    if (role === selectedRole) {
      // Deselect if already selected
      onRoleChange("");
      onCustomRoleChange("");
    } else {
      onRoleChange(role);
      onCustomRoleChange("");
    }
  };

  const handleResponsibilitySelect = (responsibility) => {
    const updatedResponsibilities = [...selectedResponsibilities];
    const index = updatedResponsibilities.indexOf(responsibility);

    if (index === -1) {
      // Add responsibility
      updatedResponsibilities.push(responsibility);
    } else {
      // Remove responsibility
      updatedResponsibilities.splice(index, 1);
    }

    onResponsibilitiesChange(updatedResponsibilities);
  };

  const handleAddCustomResponsibility = () => {
    if (customResponsibility.trim() === "") return;

    if (!selectedResponsibilities.includes(customResponsibility)) {
      const updatedResponsibilities = [
        ...selectedResponsibilities,
        customResponsibility,
      ];
      onResponsibilitiesChange(updatedResponsibilities);
      setCustomResponsibility("");
    }
  };

  // Create dynamic styles based on theme
  const dynamicStyles = {
    sectionLabel: {
      fontSize: 16,
      fontWeight: "bold",
      marginTop: 16,
      marginBottom: 8,
      color: isDarkMode ? theme.colors.text : "#000000",
    },
    chipContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: 8,
    },
    chip: {
      margin: 4,
    },
    input: {
      marginBottom: 12,
      backgroundColor: isDarkMode ? theme.colors.surface : "#ffffff",
    },
    selectedInfo: {
      backgroundColor: isDarkMode
        ? "rgba(255, 255, 255, 0.05)"
        : "rgba(0, 0, 0, 0.05)",
      padding: 12,
      borderRadius: 8,
      marginTop: 16,
      marginBottom: 8,
    },
    selectionText: {
      color: isDarkMode ? theme.colors.text : "#000000",
      fontSize: 14,
      marginBottom: 4,
    },
  };

  // Determine what's currently selected
  const currentRole = customRole.trim() !== "" ? customRole : selectedRole;
  const hasSelectedResponsibilities =
    selectedResponsibilities && selectedResponsibilities.length > 0;

  return (
    <View>
      <Text style={dynamicStyles.sectionLabel}>Role</Text>
      <View style={dynamicStyles.chipContainer}>
        {commonRoles.map((role) => (
          <Chip
            key={role}
            selected={selectedRole === role}
            onPress={() => handleRoleSelect(role)}
            style={dynamicStyles.chip}
            selectedColor={theme.colors.primary}
            mode={selectedRole === role ? "flat" : "outlined"}
          >
            {role}
          </Chip>
        ))}
      </View>

      <TextInput
        label="Custom Role"
        value={customRole}
        onChangeText={onCustomRoleChange}
        style={dynamicStyles.input}
        mode="outlined"
        theme={paperTheme}
        placeholder="Enter a custom role if not listed above"
      />

      <Text style={dynamicStyles.sectionLabel}>Responsibilities</Text>
      <View style={dynamicStyles.chipContainer}>
        {commonResponsibilities.map((responsibility) => (
          <Chip
            key={responsibility}
            selected={selectedResponsibilities.includes(responsibility)}
            onPress={() => handleResponsibilitySelect(responsibility)}
            style={dynamicStyles.chip}
            selectedColor={theme.colors.primary}
            mode={
              selectedResponsibilities.includes(responsibility)
                ? "flat"
                : "outlined"
            }
          >
            {responsibility}
          </Chip>
        ))}
      </View>

      <TextInput
        label="Add Custom Responsibility"
        value={customResponsibility}
        onChangeText={setCustomResponsibility}
        style={dynamicStyles.input}
        mode="outlined"
        theme={paperTheme}
        placeholder="Enter a custom responsibility"
        onSubmitEditing={handleAddCustomResponsibility}
        right={
          <TextInput.Icon icon="plus" onPress={handleAddCustomResponsibility} />
        }
      />

      {/* Current Selection Summary */}
      {(currentRole || hasSelectedResponsibilities) && (
        <View style={dynamicStyles.selectedInfo}>
          {currentRole && (
            <Text style={dynamicStyles.selectionText}>
              <Text style={{ fontWeight: "bold" }}>Selected Role:</Text>{" "}
              {currentRole}
            </Text>
          )}

          {hasSelectedResponsibilities && (
            <Text style={dynamicStyles.selectionText}>
              <Text style={{ fontWeight: "bold" }}>
                Selected Responsibilities:
              </Text>{" "}
              {selectedResponsibilities.join(", ")}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

export default CrewRoleSelector;
