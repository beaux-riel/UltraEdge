import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import {
  Text,
  Title,
  Paragraph,
  Surface,
  Button,
  Divider,
  List,
  FAB,
  Portal,
  Dialog,
  TextInput,
  Chip,
  Switch,
  Menu,
  useTheme as usePaperTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../context/ThemeContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const RacePrepScreen = ({ navigation }) => {
  const paperTheme = usePaperTheme();
  const { isDarkMode, theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  // State for drop bags
  const [dropBags, setDropBags] = useState([]);
  const [showDropBagDialog, setShowDropBagDialog] = useState(false);
  const [dropBagName, setDropBagName] = useState("");
  const [dropBagItems, setDropBagItems] = useState([]);
  const [newItemName, setNewItemName] = useState("");
  const [editingBagIndex, setEditingBagIndex] = useState(null);
  const [isTemplate, setIsTemplate] = useState(false);

  // State for nutrition plans
  const [nutritionPlans, setNutritionPlans] = useState([]);
  const [showNutritionDialog, setShowNutritionDialog] = useState(false);
  const [nutritionName, setNutritionName] = useState("");
  const [nutritionTiming, setNutritionTiming] = useState("");
  const [nutritionCalories, setNutritionCalories] = useState("");
  const [nutritionType, setNutritionType] = useState("");
  const [editingNutritionIndex, setEditingNutritionIndex] = useState(null);

  // State for hydration plans
  const [hydrationPlans, setHydrationPlans] = useState([]);
  const [showHydrationDialog, setShowHydrationDialog] = useState(false);
  const [hydrationName, setHydrationName] = useState("");
  const [hydrationTiming, setHydrationTiming] = useState("");
  const [hydrationQuantity, setHydrationQuantity] = useState("");
  const [hydrationType, setHydrationType] = useState("");
  const [editingHydrationIndex, setEditingHydrationIndex] = useState(null);

  // State for gear list
  const [gearItems, setGearItems] = useState([]);
  const [showGearDialog, setShowGearDialog] = useState(false);
  const [gearName, setGearName] = useState("");
  const [gearBrand, setGearBrand] = useState("");
  const [gearWeight, setGearWeight] = useState("");
  const [gearWeightUnit, setGearWeightUnit] = useState("g"); // Default unit is grams
  const [showWeightUnitMenu, setShowWeightUnitMenu] = useState(false);
  const [isNutrition, setIsNutrition] = useState(false);
  const [isHydration, setIsHydration] = useState(false);
  const [editingGearIndex, setEditingGearIndex] = useState(null);

  // State for FAB
  const [fabOpen, setFabOpen] = useState(false);

  // Handle drop bag creation/editing
  const handleAddDropBag = () => {
    if (dropBagName.trim() === "") return;

    const newBag = {
      name: dropBagName,
      items: [...dropBagItems],
      isTemplate: isTemplate,
    };

    if (editingBagIndex !== null) {
      // Edit existing bag
      const updatedBags = [...dropBags];
      updatedBags[editingBagIndex] = newBag;
      setDropBags(updatedBags);
    } else {
      // Add new bag
      setDropBags([...dropBags, newBag]);
    }

    // Reset form
    setDropBagName("");
    setDropBagItems([]);
    setEditingBagIndex(null);
    setIsTemplate(false);
    setShowDropBagDialog(false);
  };

  // Handle adding item to drop bag
  const handleAddItem = () => {
    if (newItemName.trim() === "") return;
    setDropBagItems([...dropBagItems, newItemName]);
    setNewItemName("");
  };

  // Handle removing item from drop bag
  const handleRemoveItem = (index) => {
    const updatedItems = [...dropBagItems];
    updatedItems.splice(index, 1);
    setDropBagItems(updatedItems);
  };

  // Handle editing a drop bag
  const handleEditDropBag = (index) => {
    const bag = dropBags[index];
    setDropBagName(bag.name);
    setDropBagItems([...bag.items]);
    setIsTemplate(bag.isTemplate);
    setEditingBagIndex(index);
    setShowDropBagDialog(true);
  };

  // Handle deleting a drop bag
  const handleDeleteDropBag = (index) => {
    const updatedBags = [...dropBags];
    updatedBags.splice(index, 1);
    setDropBags(updatedBags);
  };

  // Handle nutrition plan creation/editing
  const handleAddNutritionPlan = () => {
    if (nutritionName.trim() === "" || nutritionTiming.trim() === "") return;

    const newPlan = {
      name: nutritionName,
      timing: nutritionTiming,
      calories: nutritionCalories,
      type: nutritionType,
    };

    if (editingNutritionIndex !== null) {
      // Edit existing plan
      const updatedPlans = [...nutritionPlans];
      updatedPlans[editingNutritionIndex] = newPlan;
      setNutritionPlans(updatedPlans);
    } else {
      // Add new plan
      setNutritionPlans([...nutritionPlans, newPlan]);
    }

    // Reset form
    setNutritionName("");
    setNutritionTiming("");
    setNutritionCalories("");
    setNutritionType("");
    setEditingNutritionIndex(null);
    setShowNutritionDialog(false);
  };

  // Handle editing a nutrition plan
  const handleEditNutritionPlan = (index) => {
    const plan = nutritionPlans[index];
    setNutritionName(plan.name);
    setNutritionTiming(plan.timing);
    setNutritionCalories(plan.calories);
    setNutritionType(plan.type);
    setEditingNutritionIndex(index);
    setShowNutritionDialog(true);
  };

  // Handle deleting a nutrition plan
  const handleDeleteNutritionPlan = (index) => {
    const updatedPlans = [...nutritionPlans];
    updatedPlans.splice(index, 1);
    setNutritionPlans(updatedPlans);
  };

  // Handle hydration plan creation/editing
  const handleAddHydrationPlan = () => {
    if (hydrationName.trim() === "" || hydrationTiming.trim() === "") return;

    const newPlan = {
      name: hydrationName,
      timing: hydrationTiming,
      quantity: hydrationQuantity,
      type: hydrationType,
    };

    if (editingHydrationIndex !== null) {
      // Edit existing plan
      const updatedPlans = [...hydrationPlans];
      updatedPlans[editingHydrationIndex] = newPlan;
      setHydrationPlans(updatedPlans);
    } else {
      // Add new plan
      setHydrationPlans([...hydrationPlans, newPlan]);
    }

    // Reset form
    setHydrationName("");
    setHydrationTiming("");
    setHydrationQuantity("");
    setHydrationType("");
    setEditingHydrationIndex(null);
    setShowHydrationDialog(false);
  };

  // Handle editing a hydration plan
  const handleEditHydrationPlan = (index) => {
    const plan = hydrationPlans[index];
    setHydrationName(plan.name);
    setHydrationTiming(plan.timing);
    setHydrationQuantity(plan.quantity);
    setHydrationType(plan.type);
    setEditingHydrationIndex(index);
    setShowHydrationDialog(true);
  };

  // Handle deleting a hydration plan
  const handleDeleteHydrationPlan = (index) => {
    const updatedPlans = [...hydrationPlans];
    updatedPlans.splice(index, 1);
    setHydrationPlans(updatedPlans);
  };

  // Handle gear item creation/editing
  const handleAddGearItem = () => {
    if (gearName.trim() === "") return;

    const newGearItem = {
      name: gearName,
      brand: gearBrand,
      weight: gearWeight,
      weightUnit: gearWeightUnit,
      isNutrition: isNutrition,
      isHydration: isHydration,
    };

    if (editingGearIndex !== null) {
      // Edit existing gear item
      const updatedGearItems = [...gearItems];
      updatedGearItems[editingGearIndex] = newGearItem;
      setGearItems(updatedGearItems);
    } else {
      // Add new gear item
      setGearItems([...gearItems, newGearItem]);
    }

    // Reset form
    setGearName("");
    setGearBrand("");
    setGearWeight("");
    setGearWeightUnit("g"); // Reset to default unit
    setIsNutrition(false);
    setIsHydration(false);
    setEditingGearIndex(null);
    setShowGearDialog(false);
  };

  // Handle editing a gear item
  const handleEditGearItem = (index) => {
    const item = gearItems[index];
    setGearName(item.name);
    setGearBrand(item.brand);
    setGearWeight(item.weight);
    setGearWeightUnit(item.weightUnit || "g"); // Default to "g" if not set
    setIsNutrition(item.isNutrition);
    setIsHydration(item.isHydration);
    setEditingGearIndex(index);
    setShowGearDialog(true);
  };

  // Handle deleting a gear item
  const handleDeleteGearItem = (index) => {
    const updatedGearItems = [...gearItems];
    updatedGearItems.splice(index, 1);
    setGearItems(updatedGearItems);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? theme.colors.background : "#f8f9fa",
          paddingTop: insets.top
        },
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <Title style={[styles.screenTitle, { color: theme.colors.text }]}>
          Race Preparation
        </Title>
        <Paragraph style={[styles.screenDescription, { color: theme.colors.textSecondary }]}>
          Prepare your race strategy with drop bags, nutrition, and hydration plans.
        </Paragraph>

        {/* Drop Bags Section */}
        <Surface
          style={[
            styles.sectionContainer,
            { backgroundColor: isDarkMode ? theme.colors.surface : "#ffffff" },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialCommunityIcons
                name="bag-personal"
                size={24}
                color={theme.colors.primary}
                style={styles.sectionIcon}
              />
              <Title style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Drop Bags
              </Title>
            </View>
          </View>
          <Paragraph style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            Create and manage your drop bags for aid stations.
          </Paragraph>

          {dropBags.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="bag-personal-outline"
                size={48}
                color={theme.colors.disabled}
              />
              <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                No drop bags created yet
              </Text>
              <Button
                mode="outlined"
                onPress={() => {
                  setEditingBagIndex(null);
                  setDropBagName("");
                  setDropBagItems([]);
                  setIsTemplate(false);
                  setShowDropBagDialog(true);
                }}
                style={styles.emptyStateButton}
                color={theme.colors.primary}
              >
                Create Drop Bag
              </Button>
            </View>
          ) : (
            dropBags.map((bag, index) => (
              <Surface
                key={index}
                style={[
                  styles.itemCard,
                  {
                    backgroundColor: isDarkMode
                      ? theme.colors.surfaceVariant
                      : theme.colors.surfaceVariant,
                  },
                ]}
              >
                <View style={styles.itemCardHeader}>
                  <View style={styles.itemCardTitleContainer}>
                    <Text style={[styles.itemCardTitle, { color: theme.colors.text }]}>
                      {bag.name}
                    </Text>
                    {bag.isTemplate && (
                      <Chip
                        style={[styles.templateChip, { backgroundColor: theme.colors.primary + '20' }]}
                        textStyle={{ color: theme.colors.primary }}
                      >
                        Template
                      </Chip>
                    )}
                  </View>
                  <View style={styles.itemCardActions}>
                    <TouchableOpacity
                      onPress={() => handleEditDropBag(index)}
                      style={styles.itemCardAction}
                    >
                      <MaterialCommunityIcons
                        name="pencil"
                        size={20}
                        color={theme.colors.primary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteDropBag(index)}
                      style={styles.itemCardAction}
                    >
                      <MaterialCommunityIcons
                        name="delete"
                        size={20}
                        color={theme.colors.error}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <Divider style={styles.itemCardDivider} />
                <View style={styles.itemCardContent}>
                  <Text style={[styles.itemCardSubtitle, { color: theme.colors.textSecondary }]}>
                    Contents:
                  </Text>
                  {bag.items.length > 0 ? (
                    <View style={styles.itemsList}>
                      {bag.items.map((item, itemIndex) => (
                        <Chip
                          key={itemIndex}
                          style={styles.itemChip}
                          textStyle={{ color: theme.colors.text }}
                        >
                          {item}
                        </Chip>
                      ))}
                    </View>
                  ) : (
                    <Text style={[styles.emptyItemsText, { color: theme.colors.disabled }]}>
                      No items added
                    </Text>
                  )}
                </View>
              </Surface>
            ))
          )}
        </Surface>

        {/* Nutrition Plans Section */}
        <Surface
          style={[
            styles.sectionContainer,
            { backgroundColor: isDarkMode ? theme.colors.surface : "#ffffff" },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialCommunityIcons
                name="food-apple"
                size={24}
                color={theme.colors.success}
                style={styles.sectionIcon}
              />
              <Title style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Nutrition Plans
              </Title>
            </View>
          </View>
          <Paragraph style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            Plan your race nutrition strategy.
          </Paragraph>

          {nutritionPlans.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="food-apple-outline"
                size={48}
                color={theme.colors.disabled}
              />
              <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                No nutrition plans created yet
              </Text>
              <Button
                mode="outlined"
                onPress={() => {
                  setEditingNutritionIndex(null);
                  setNutritionName("");
                  setNutritionTiming("");
                  setNutritionCalories("");
                  setNutritionType("");
                  setShowNutritionDialog(true);
                }}
                style={styles.emptyStateButton}
                color={theme.colors.primary}
              >
                Create Nutrition Plan
              </Button>
            </View>
          ) : (
            nutritionPlans.map((plan, index) => (
              <Surface
                key={index}
                style={[
                  styles.itemCard,
                  {
                    backgroundColor: isDarkMode
                      ? theme.colors.surfaceVariant
                      : theme.colors.surfaceVariant,
                  },
                ]}
              >
                <View style={styles.itemCardHeader}>
                  <Text style={[styles.itemCardTitle, { color: theme.colors.text }]}>
                    {plan.name}
                  </Text>
                  <View style={styles.itemCardActions}>
                    <TouchableOpacity
                      onPress={() => handleEditNutritionPlan(index)}
                      style={styles.itemCardAction}
                    >
                      <MaterialCommunityIcons
                        name="pencil"
                        size={20}
                        color={theme.colors.primary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteNutritionPlan(index)}
                      style={styles.itemCardAction}
                    >
                      <MaterialCommunityIcons
                        name="delete"
                        size={20}
                        color={theme.colors.error}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <Divider style={styles.itemCardDivider} />
                <View style={styles.itemCardContent}>
                  <View style={styles.planDetailRow}>
                    <Text style={[styles.planDetailLabel, { color: theme.colors.textSecondary }]}>
                      Timing:
                    </Text>
                    <Text style={[styles.planDetailValue, { color: theme.colors.text }]}>
                      Every {plan.timing} minutes
                    </Text>
                  </View>
                  <View style={styles.planDetailRow}>
                    <Text style={[styles.planDetailLabel, { color: theme.colors.textSecondary }]}>
                      Calories:
                    </Text>
                    <Text style={[styles.planDetailValue, { color: theme.colors.text }]}>
                      {plan.calories || "Not specified"}
                    </Text>
                  </View>
                  <View style={styles.planDetailRow}>
                    <Text style={[styles.planDetailLabel, { color: theme.colors.textSecondary }]}>
                      Type:
                    </Text>
                    <Text style={[styles.planDetailValue, { color: theme.colors.text }]}>
                      {plan.type || "Not specified"}
                    </Text>
                  </View>
                </View>
              </Surface>
            ))
          )}
        </Surface>

        {/* Hydration Plans Section */}
        <Surface
          style={[
            styles.sectionContainer,
            { backgroundColor: isDarkMode ? theme.colors.surface : "#ffffff" },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialCommunityIcons
                name="water"
                size={24}
                color={theme.colors.tertiary}
                style={styles.sectionIcon}
              />
              <Title style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Hydration Plans
              </Title>
            </View>
          </View>
          <Paragraph style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            Plan your race hydration strategy.
          </Paragraph>

          {hydrationPlans.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="water-outline"
                size={48}
                color={theme.colors.disabled}
              />
              <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                No hydration plans created yet
              </Text>
              <Button
                mode="outlined"
                onPress={() => {
                  setEditingHydrationIndex(null);
                  setHydrationName("");
                  setHydrationTiming("");
                  setHydrationQuantity("");
                  setHydrationType("");
                  setShowHydrationDialog(true);
                }}
                style={styles.emptyStateButton}
                color={theme.colors.primary}
              >
                Create Hydration Plan
              </Button>
            </View>
          ) : (
            hydrationPlans.map((plan, index) => (
              <Surface
                key={index}
                style={[
                  styles.itemCard,
                  {
                    backgroundColor: isDarkMode
                      ? theme.colors.surfaceVariant
                      : theme.colors.surfaceVariant,
                  },
                ]}
              >
                <View style={styles.itemCardHeader}>
                  <Text style={[styles.itemCardTitle, { color: theme.colors.text }]}>
                    {plan.name}
                  </Text>
                  <View style={styles.itemCardActions}>
                    <TouchableOpacity
                      onPress={() => handleEditHydrationPlan(index)}
                      style={styles.itemCardAction}
                    >
                      <MaterialCommunityIcons
                        name="pencil"
                        size={20}
                        color={theme.colors.primary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteHydrationPlan(index)}
                      style={styles.itemCardAction}
                    >
                      <MaterialCommunityIcons
                        name="delete"
                        size={20}
                        color={theme.colors.error}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <Divider style={styles.itemCardDivider} />
                <View style={styles.itemCardContent}>
                  <View style={styles.planDetailRow}>
                    <Text style={[styles.planDetailLabel, { color: theme.colors.textSecondary }]}>
                      Timing:
                    </Text>
                    <Text style={[styles.planDetailValue, { color: theme.colors.text }]}>
                      Every {plan.timing} minutes
                    </Text>
                  </View>
                  <View style={styles.planDetailRow}>
                    <Text style={[styles.planDetailLabel, { color: theme.colors.textSecondary }]}>
                      Quantity:
                    </Text>
                    <Text style={[styles.planDetailValue, { color: theme.colors.text }]}>
                      {plan.quantity || "Not specified"}
                    </Text>
                  </View>
                  <View style={styles.planDetailRow}>
                    <Text style={[styles.planDetailLabel, { color: theme.colors.textSecondary }]}>
                      Type:
                    </Text>
                    <Text style={[styles.planDetailValue, { color: theme.colors.text }]}>
                      {plan.type || "Not specified"}
                    </Text>
                  </View>
                </View>
              </Surface>
            ))
          )}
        </Surface>

        {/* Gear List Section */}
        <Surface
          style={[
            styles.sectionContainer,
            { backgroundColor: isDarkMode ? theme.colors.surface : "#ffffff" },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialCommunityIcons
                name="hiking"
                size={24}
                color={theme.colors.tertiary}
                style={styles.sectionIcon}
              />
              <Title style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Gear List
              </Title>
            </View>
          </View>
          <Paragraph style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            Manage your ultra marathon gear inventory.
          </Paragraph>

          {gearItems.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="hiking"
                size={48}
                color={theme.colors.disabled}
              />
              <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                No gear items added yet
              </Text>
              <Button
                mode="outlined"
                onPress={() => {
                  setEditingGearIndex(null);
                  setGearName("");
                  setGearBrand("");
                  setGearWeight("");
                  setGearWeightUnit("g"); // Reset to default unit
                  setIsNutrition(false);
                  setIsHydration(false);
                  setShowGearDialog(true);
                }}
                style={styles.emptyStateButton}
                color={theme.colors.primary}
              >
                Add Gear Item
              </Button>
            </View>
          ) : (
            gearItems.map((item, index) => (
              <Surface
                key={index}
                style={[
                  styles.itemCard,
                  {
                    backgroundColor: isDarkMode
                      ? theme.colors.surfaceVariant
                      : theme.colors.surfaceVariant,
                  },
                ]}
              >
                <View style={styles.itemCardHeader}>
                  <Text style={[styles.itemCardTitle, { color: theme.colors.text }]}>
                    {item.name}
                  </Text>
                  <View style={styles.itemCardActions}>
                    <TouchableOpacity
                      onPress={() => handleEditGearItem(index)}
                      style={styles.itemCardAction}
                    >
                      <MaterialCommunityIcons
                        name="pencil"
                        size={20}
                        color={theme.colors.primary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteGearItem(index)}
                      style={styles.itemCardAction}
                    >
                      <MaterialCommunityIcons
                        name="delete"
                        size={20}
                        color={theme.colors.error}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <Divider style={styles.itemCardDivider} />
                <View style={styles.itemCardContent}>
                  <View style={styles.planDetailRow}>
                    <Text style={[styles.planDetailLabel, { color: theme.colors.textSecondary }]}>
                      Brand:
                    </Text>
                    <Text style={[styles.planDetailValue, { color: theme.colors.text }]}>
                      {item.brand || "Not specified"}
                    </Text>
                  </View>
                  <View style={styles.planDetailRow}>
                    <Text style={[styles.planDetailLabel, { color: theme.colors.textSecondary }]}>
                      Weight:
                    </Text>
                    <Text style={[styles.planDetailValue, { color: theme.colors.text }]}>
                      {item.weight ? `${item.weight} ${item.weightUnit || 'g'}` : "Not specified"}
                    </Text>
                  </View>
                  <View style={styles.itemTags}>
                    {item.isNutrition && (
                      <Chip
                        style={[styles.tagChip, { backgroundColor: theme.colors.success + '20' }]}
                        textStyle={{ color: theme.colors.success }}
                      >
                        Nutrition
                      </Chip>
                    )}
                    {item.isHydration && (
                      <Chip
                        style={[styles.tagChip, { backgroundColor: theme.colors.info + '20' }]}
                        textStyle={{ color: theme.colors.info }}
                      >
                        Hydration
                      </Chip>
                    )}
                  </View>
                </View>
              </Surface>
            ))
          )}
        </Surface>
      </ScrollView>

      {/* FAB for quick actions */}
      <FAB.Group
        open={fabOpen}
        icon={fabOpen ? "close" : "plus"}
        actions={[
          {
            icon: "hiking",
            label: "Add Gear Item",
            onPress: () => {
              setEditingGearIndex(null);
              setGearName("");
              setGearBrand("");
              setGearWeight("");
              setGearWeightUnit("g"); // Reset to default unit
              setIsNutrition(false);
              setIsHydration(false);
              setShowGearDialog(true);
              setFabOpen(false);
            },
            color: theme.colors.tertiary,
          },
          {
            icon: "bag-personal",
            label: "Add Drop Bag",
            onPress: () => {
              setEditingBagIndex(null);
              setDropBagName("");
              setDropBagItems([]);
              setIsTemplate(false);
              setShowDropBagDialog(true);
              setFabOpen(false);
            },
            color: theme.colors.primary,
          },
          {
            icon: "food-apple",
            label: "Add Nutrition Plan",
            onPress: () => {
              setEditingNutritionIndex(null);
              setNutritionName("");
              setNutritionTiming("");
              setNutritionCalories("");
              setNutritionType("");
              setShowNutritionDialog(true);
              setFabOpen(false);
            },
            color: theme.colors.success,
          },
          {
            icon: "water",
            label: "Add Hydration Plan",
            onPress: () => {
              setEditingHydrationIndex(null);
              setHydrationName("");
              setHydrationTiming("");
              setHydrationQuantity("");
              setHydrationType("");
              setShowHydrationDialog(true);
              setFabOpen(false);
            },
            color: theme.colors.tertiary,
          },
        ]}
        onStateChange={({ open }) => setFabOpen(open)}
        color="white"
        fabStyle={{ backgroundColor: theme.colors.primary }}
      />

      {/* Drop Bag Dialog */}
      <Portal>
        <Dialog
          visible={showDropBagDialog}
          onDismiss={() => setShowDropBagDialog(false)}
          style={{
            backgroundColor: isDarkMode ? theme.colors.surface : "#ffffff",
          }}
        >
          <Dialog.Title style={{ color: theme.colors.text }}>
            {editingBagIndex !== null ? "Edit Drop Bag" : "Create Drop Bag"}
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Bag Name"
              value={dropBagName}
              onChangeText={setDropBagName}
              style={styles.dialogInput}
              mode="outlined"
              theme={{ colors: { primary: theme.colors.primary } }}
            />
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setIsTemplate(!isTemplate)}
              >
                <MaterialCommunityIcons
                  name={isTemplate ? "checkbox-marked" : "checkbox-blank-outline"}
                  size={24}
                  color={theme.colors.primary}
                />
                <Text style={[styles.checkboxLabel, { color: theme.colors.text }]}>
                  Save as template
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.dialogSectionTitle, { color: theme.colors.text }]}>
              Add Items
            </Text>
            <View style={styles.addItemContainer}>
              <TextInput
                label="Item Name"
                value={newItemName}
                onChangeText={setNewItemName}
                style={styles.itemInput}
                mode="outlined"
                theme={{ colors: { primary: theme.colors.primary } }}
              />
              <Button
                mode="contained"
                onPress={handleAddItem}
                style={styles.addItemButton}
                color={theme.colors.primary}
              >
                Add
              </Button>
            </View>
            {dropBagItems.length > 0 && (
              <View style={styles.itemsContainer}>
                <Text style={[styles.itemsTitle, { color: theme.colors.textSecondary }]}>
                  Items:
                </Text>
                <View style={styles.itemsList}>
                  {dropBagItems.map((item, index) => (
                    <Chip
                      key={index}
                      style={styles.itemChip}
                      onClose={() => handleRemoveItem(index)}
                      textStyle={{ color: theme.colors.text }}
                    >
                      {item}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDropBagDialog(false)} color={theme.colors.textSecondary}>
              Cancel
            </Button>
            <Button onPress={handleAddDropBag} color={theme.colors.primary}>
              {editingBagIndex !== null ? "Update" : "Create"}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Nutrition Plan Dialog */}
      <Portal>
        <Dialog
          visible={showNutritionDialog}
          onDismiss={() => setShowNutritionDialog(false)}
          style={{
            backgroundColor: isDarkMode ? theme.colors.surface : "#ffffff",
          }}
        >
          <Dialog.Title style={{ color: theme.colors.text }}>
            {editingNutritionIndex !== null ? "Edit Nutrition Plan" : "Create Nutrition Plan"}
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Plan Name"
              value={nutritionName}
              onChangeText={setNutritionName}
              style={styles.dialogInput}
              mode="outlined"
              theme={{ colors: { primary: theme.colors.primary } }}
            />
            <TextInput
              label="Timing (minutes)"
              value={nutritionTiming}
              onChangeText={setNutritionTiming}
              style={styles.dialogInput}
              mode="outlined"
              keyboardType="numeric"
              theme={{ colors: { primary: theme.colors.primary } }}
            />
            <TextInput
              label="Calories"
              value={nutritionCalories}
              onChangeText={setNutritionCalories}
              style={styles.dialogInput}
              mode="outlined"
              keyboardType="numeric"
              theme={{ colors: { primary: theme.colors.primary } }}
            />
            <TextInput
              label="Type (e.g., Fruit, Cliff Bar)"
              value={nutritionType}
              onChangeText={setNutritionType}
              style={styles.dialogInput}
              mode="outlined"
              theme={{ colors: { primary: theme.colors.primary } }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setShowNutritionDialog(false)}
              color={theme.colors.textSecondary}
            >
              Cancel
            </Button>
            <Button onPress={handleAddNutritionPlan} color={theme.colors.primary}>
              {editingNutritionIndex !== null ? "Update" : "Create"}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Hydration Plan Dialog */}
      <Portal>
        <Dialog
          visible={showHydrationDialog}
          onDismiss={() => setShowHydrationDialog(false)}
          style={{
            backgroundColor: isDarkMode ? theme.colors.surface : "#ffffff",
          }}
        >
          <Dialog.Title style={{ color: theme.colors.text }}>
            {editingHydrationIndex !== null ? "Edit Hydration Plan" : "Create Hydration Plan"}
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Plan Name"
              value={hydrationName}
              onChangeText={setHydrationName}
              style={styles.dialogInput}
              mode="outlined"
              theme={{ colors: { primary: theme.colors.primary } }}
            />
            <TextInput
              label="Timing (minutes)"
              value={hydrationTiming}
              onChangeText={setHydrationTiming}
              style={styles.dialogInput}
              mode="outlined"
              keyboardType="numeric"
              theme={{ colors: { primary: theme.colors.primary } }}
            />
            <TextInput
              label="Quantity (ml)"
              value={hydrationQuantity}
              onChangeText={setHydrationQuantity}
              style={styles.dialogInput}
              mode="outlined"
              keyboardType="numeric"
              theme={{ colors: { primary: theme.colors.primary } }}
            />
            <TextInput
              label="Type (e.g., Water, Electrolytes)"
              value={hydrationType}
              onChangeText={setHydrationType}
              style={styles.dialogInput}
              mode="outlined"
              theme={{ colors: { primary: theme.colors.primary } }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setShowHydrationDialog(false)}
              color={theme.colors.textSecondary}
            >
              Cancel
            </Button>
            <Button onPress={handleAddHydrationPlan} color={theme.colors.primary}>
              {editingHydrationIndex !== null ? "Update" : "Create"}
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Gear Item Dialog */}
        <Dialog
          visible={showGearDialog}
          onDismiss={() => setShowGearDialog(false)}
          style={{ backgroundColor: isDarkMode ? theme.colors.surface : "#ffffff" }}
        >
          <Dialog.Title style={{ color: theme.colors.text }}>
            {editingGearIndex !== null ? "Edit Gear Item" : "Add Gear Item"}
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Item Name"
              value={gearName}
              onChangeText={setGearName}
              style={styles.dialogInput}
              mode="outlined"
              theme={{ colors: { primary: theme.colors.primary } }}
            />
            <TextInput
              label="Brand"
              value={gearBrand}
              onChangeText={setGearBrand}
              style={styles.dialogInput}
              mode="outlined"
              theme={{ colors: { primary: theme.colors.primary } }}
            />
            <View style={styles.weightInputContainer}>
              <TextInput
                label="Weight"
                value={gearWeight}
                onChangeText={setGearWeight}
                style={styles.weightInput}
                mode="outlined"
                keyboardType="numeric"
                theme={{ colors: { primary: theme.colors.primary } }}
              />
              <Menu
                visible={showWeightUnitMenu}
                onDismiss={() => setShowWeightUnitMenu(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setShowWeightUnitMenu(true)}
                    style={styles.weightUnitButton}
                    color={theme.colors.primary}
                  >
                    {gearWeightUnit}
                  </Button>
                }
              >
                <Menu.Item onPress={() => { setGearWeightUnit("g"); setShowWeightUnitMenu(false); }} title="g" />
                <Menu.Item onPress={() => { setGearWeightUnit("kg"); setShowWeightUnitMenu(false); }} title="kg" />
                <Menu.Item onPress={() => { setGearWeightUnit("oz"); setShowWeightUnitMenu(false); }} title="oz" />
                <Menu.Item onPress={() => { setGearWeightUnit("lb"); setShowWeightUnitMenu(false); }} title="lb" />
              </Menu>
            </View>
            <View style={styles.switchContainer}>
              <Text style={[styles.switchLabel, { color: theme.colors.text }]}>
                Nutrition Related
              </Text>
              <Switch
                value={isNutrition}
                onValueChange={setIsNutrition}
                color={theme.colors.success}
              />
            </View>
            <View style={styles.switchContainer}>
              <Text style={[styles.switchLabel, { color: theme.colors.text }]}>
                Hydration Related
              </Text>
              <Switch
                value={isHydration}
                onValueChange={setIsHydration}
                color={theme.colors.info}
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setShowGearDialog(false)}
              color={theme.colors.textSecondary}
            >
              Cancel
            </Button>
            <Button onPress={handleAddGearItem} color={theme.colors.primary}>
              {editingGearIndex !== null ? "Update" : "Create"}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 10, // Extra padding for FAB
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
  },
  itemTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tagChip: {
    marginRight: 8,
    marginTop: 4,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  screenDescription: {
    fontSize: 16,
    marginBottom: 24,
  },
  sectionContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  emptyStateButton: {
    marginTop: 8,
  },
  itemCard: {
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
  },
  itemCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },
  itemCardTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  itemCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  templateChip: {
    marginLeft: 8,
    height: 24,
  },
  itemCardActions: {
    flexDirection: "row",
  },
  itemCardAction: {
    marginLeft: 16,
  },
  itemCardDivider: {
    height: 1,
  },
  itemCardContent: {
    padding: 12,
  },
  itemCardSubtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  itemsList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  itemChip: {
    margin: 4,
  },
  emptyItemsText: {
    fontStyle: "italic",
  },
  planDetailRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  planDetailLabel: {
    fontSize: 14,
    width: 80,
  },
  planDetailValue: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  dialogInput: {
    marginBottom: 12,
  },
  weightInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  weightInput: {
    flex: 1,
    marginRight: 8,
  },
  weightUnitButton: {
    height: 56,
    justifyContent: 'center',
    minWidth: 60,
  },
  checkboxContainer: {
    marginVertical: 12,
  },
  checkbox: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
  },
  dialogSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  addItemContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemInput: {
    flex: 1,
    marginRight: 8,
  },
  addItemButton: {
    height: 40,
    justifyContent: "center",
  },
  itemsContainer: {
    marginTop: 16,
  },
  itemsTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
});

export default RacePrepScreen;