import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { useRaces } from "../context/RaceContext";
import { useGear } from "../context/GearContext";
import { useSupabase } from "../context/SupabaseContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const RacePrepScreen = ({ navigation, route }) => {
  const paperTheme = usePaperTheme();
  const { isDarkMode, theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { races, updateRace } = useRaces();
  const { user, isPremium } = useSupabase();
  const { 
    gearItems: globalGearItems, 
    saveGearItems: saveGlobalGearItems,
    backupGearItemsToSupabase 
  } = useGear();
  
  // Get raceId from route params
  const { raceId } = route.params || {};
  const [currentRace, setCurrentRace] = useState(null);

  // State for drop bags
  const [dropBags, setDropBags] = useState([]);
  const [showDropBagDialog, setShowDropBagDialog] = useState(false);
  const [dropBagName, setDropBagName] = useState("");
  const [dropBagItems, setDropBagItems] = useState([]);
  const [newItemName, setNewItemName] = useState("");
  const [editingBagIndex, setEditingBagIndex] = useState(null);
  const [isTemplate, setIsTemplate] = useState(false);
  const [selectedGearItems, setSelectedGearItems] = useState([]);

  // State for nutrition plans
  const [nutritionPlans, setNutritionPlans] = useState([]);
  const [showNutritionDialog, setShowNutritionDialog] = useState(false);
  const [nutritionName, setNutritionName] = useState("");
  const [nutritionTiming, setNutritionTiming] = useState("");
  const [nutritionCalories, setNutritionCalories] = useState("");
  const [nutritionType, setNutritionType] = useState("");
  const [editingNutritionIndex, setEditingNutritionIndex] = useState(null);
  const [selectedNutritionGearItems, setSelectedNutritionGearItems] = useState([]);

  // State for hydration plans
  const [hydrationPlans, setHydrationPlans] = useState([]);
  const [showHydrationDialog, setShowHydrationDialog] = useState(false);
  const [hydrationName, setHydrationName] = useState("");
  const [hydrationTiming, setHydrationTiming] = useState("");
  const [hydrationQuantity, setHydrationQuantity] = useState("");
  const [hydrationType, setHydrationType] = useState("");
  const [editingHydrationIndex, setEditingHydrationIndex] = useState(null);
  const [selectedHydrationGearItems, setSelectedHydrationGearItems] = useState([]);

  // State for gear list
  const [gearItems, setGearItems] = useState([]);
  const [showGearDialog, setShowGearDialog] = useState(false);
  const [showRetiredItems, setShowRetiredItems] = useState(false);
  const [gearName, setGearName] = useState("");
    const [gearCategory, setGearCategory] = useState("");
  const [gearBrand, setGearBrand] = useState("");
  const [gearDescription, setGearDescription] = useState("");
  const [gearWeight, setGearWeight] = useState("");
  const [gearWeightUnit, setGearWeightUnit] = useState("g"); // Default unit is grams
  const [showWeightUnitMenu, setShowWeightUnitMenu] = useState(false);
  const [isNutrition, setIsNutrition] = useState(false);
  const [isHydration, setIsHydration] = useState(false);
  const [gearQuantity, setGearQuantity] = useState("1");
  const [isRetired, setIsRetired] = useState(false);
  const [editingGearIndex, setEditingGearIndex] = useState(null);

  // State for FAB
  const [fabOpen, setFabOpen] = useState(false);

  // Load race data and preparation items
  useEffect(() => {
    if (raceId && races[raceId]) {
      setCurrentRace(races[raceId]);
      
      // Load race-specific preparation data
      if (races[raceId].preparation) {
        const prep = races[raceId].preparation;
        
        // Load drop bags
        if (prep.dropBags) {
          setDropBags(prep.dropBags);
        }
        
        // Load gear items - prioritize race-specific gear items, but fall back to global gear items
        if (prep.gearItems && prep.gearItems.length > 0) {
          setGearItems(prep.gearItems);
        } else if (globalGearItems && globalGearItems.length > 0) {
          // If no race-specific gear items, use global gear items
          setGearItems(globalGearItems);
          
          // Also update the race preparation with these global items
          const updatedRace = {
            ...races[raceId],
            preparation: {
              ...races[raceId].preparation,
              gearItems: globalGearItems,
            },
          };
          updateRace(raceId, updatedRace);
        }
        
        // Load nutrition plans
        if (prep.nutritionPlans) {
          setNutritionPlans(prep.nutritionPlans);
        }
        
        // Load hydration plans
        if (prep.hydrationPlans) {
          setHydrationPlans(prep.hydrationPlans);
        }
      }
    } else {
      // If no raceId provided, load from AsyncStorage (legacy behavior)
      const loadDropBags = async () => {
        try {
          const storedDropBags = await AsyncStorage.getItem('dropBags');
          if (storedDropBags) {
            setDropBags(JSON.parse(storedDropBags));
          }
        } catch (error) {
          console.error('Error loading drop bags:', error);
        }
      };
      
      loadDropBags();
    }
  }, [raceId, races, globalGearItems]);
  
  // Save preparation data to race object or AsyncStorage
  const savePreparationData = async () => {
    if (raceId && currentRace) {
      // Save to race object
      const updatedRace = {
        ...currentRace,
        preparation: {
          dropBags,
          gearItems,
          nutritionPlans,
          hydrationPlans
        }
      };
      
      // Update race in context
      updateRace(raceId, { preparation: updatedRace.preparation });
      
      // Backup to Supabase is handled by updateRace
      
      return true;
    } else {
      // Legacy behavior - save to AsyncStorage
      try {
        await AsyncStorage.setItem('dropBags', JSON.stringify(dropBags));
        return true;
      } catch (error) {
        console.error('Error saving drop bags:', error);
        return false;
      }
    }
  };
  
  // Save drop bags
  const saveDropBags = async (bags) => {
    setDropBags(bags);
    
    if (raceId && currentRace) {
      const preparation = {
        ...(currentRace.preparation || {}),
        dropBags: bags,
        gearItems,
        nutritionPlans,
        hydrationPlans
      };
      
      updateRace(raceId, { preparation });
      // Backup to Supabase is handled by updateRace
    } else {
      try {
        await AsyncStorage.setItem('dropBags', JSON.stringify(bags));
      } catch (error) {
        console.error('Error saving drop bags:', error);
      }
    }
  };

  // Handle drop bag creation/editing
  const handleAddDropBag = () => {
    if (dropBagName.trim() === "") return;

    const newBag = {
      name: dropBagName,
      items: [...dropBagItems],
      isTemplate: isTemplate,
      gearItems: selectedGearItems.map(index => gearItems[index]), // Add reference to selected gear items
    };

    let updatedBags;
    if (editingBagIndex !== null) {
      // Edit existing bag
      updatedBags = [...dropBags];
      updatedBags[editingBagIndex] = newBag;
    } else {
      // Add new bag
      updatedBags = [...dropBags, newBag];
    }
    
    // Save to race object or AsyncStorage
    saveDropBags(updatedBags);

    // Reset form
    setDropBagName("");
    setDropBagItems([]);
    setSelectedGearItems([]);
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
    
    // Find indices of the gear items in the gearItems array
    const gearIndices = bag.gearItems ? 
      bag.gearItems.map(bagItem => 
        gearItems.findIndex(item => 
          item.name === bagItem.name && 
          item.brand === bagItem.brand && 
          item.weight === bagItem.weight
        )
      ).filter(idx => idx !== -1) : [];
    
    setSelectedGearItems(gearIndices);
    setEditingBagIndex(index);
    setShowDropBagDialog(true);
  };

  // Handle deleting a drop bag
  const handleDeleteDropBag = (index) => {
    const updatedBags = [...dropBags];
    updatedBags.splice(index, 1);
    setDropBags(updatedBags);
    
    // Save to AsyncStorage
    saveDropBags(updatedBags);
  };

  // Handle nutrition plan creation/editing
  // Save nutrition plans
  const saveNutritionPlans = (plans) => {
    setNutritionPlans(plans);
    
    if (raceId && currentRace) {
      const preparation = {
        ...(currentRace.preparation || {}),
        dropBags,
        gearItems,
        nutritionPlans: plans,
        hydrationPlans
      };
      
      updateRace(raceId, { preparation });
      // Backup to Supabase is handled by updateRace
    }
  };

  const handleAddNutritionPlan = () => {
    if (nutritionName.trim() === "" || nutritionTiming.trim() === "") return;

    const newPlan = {
      name: nutritionName,
      timing: nutritionTiming,
      calories: nutritionCalories,
      type: nutritionType,
      gearItems: selectedNutritionGearItems.map(index => gearItems[index]), // Add reference to selected gear items
    };

    let updatedPlans;
    if (editingNutritionIndex !== null) {
      // Edit existing plan
      updatedPlans = [...nutritionPlans];
      updatedPlans[editingNutritionIndex] = newPlan;
    } else {
      // Add new plan
      updatedPlans = [...nutritionPlans, newPlan];
    }
    
    // Save to race object
    saveNutritionPlans(updatedPlans);

    // Reset form
    setNutritionName("");
    setNutritionTiming("");
    setNutritionCalories("");
    setNutritionType("");
    setSelectedNutritionGearItems([]);
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
    
    // Find indices of the gear items in the gearItems array
    const gearIndices = plan.gearItems ? 
      plan.gearItems.map(planItem => 
        gearItems.findIndex(item => 
          item.name === planItem.name && 
          item.category === planItem.category &&
          item.brand === planItem.brand && 
          item.weight === planItem.weight
        )
      ).filter(idx => idx !== -1) : [];
    
    setSelectedNutritionGearItems(gearIndices);
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
  // Save hydration plans
  const saveHydrationPlans = (plans) => {
    setHydrationPlans(plans);
    
    if (raceId && currentRace) {
      const preparation = {
        ...(currentRace.preparation || {}),
        dropBags,
        gearItems,
        nutritionPlans,
        hydrationPlans: plans
      };
      
      updateRace(raceId, { preparation });
      // Backup to Supabase is handled by updateRace
    }
  };

  const handleAddHydrationPlan = () => {
    if (hydrationName.trim() === "" || hydrationTiming.trim() === "") return;

    const newPlan = {
      name: hydrationName,
      timing: hydrationTiming,
      quantity: hydrationQuantity,
      type: hydrationType,
      gearItems: selectedHydrationGearItems.map(index => gearItems[index]), // Add reference to selected gear items
    };

    let updatedPlans;
    if (editingHydrationIndex !== null) {
      // Edit existing plan
      updatedPlans = [...hydrationPlans];
      updatedPlans[editingHydrationIndex] = newPlan;
    } else {
      // Add new plan
      updatedPlans = [...hydrationPlans, newPlan];
    }
    
    // Save to race object
    saveHydrationPlans(updatedPlans);

    // Reset form
    setHydrationName("");
    setHydrationTiming("");
    setHydrationQuantity("");
    setHydrationType("");
    setSelectedHydrationGearItems([]);
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
    
    // Find indices of the gear items in the gearItems array
    const gearIndices = plan.gearItems ? 
      plan.gearItems.map(planItem => 
        gearItems.findIndex(item => 
          item.name === planItem.name && 
          item.brand === planItem.brand && 
          item.weight === planItem.weight
        )
      ).filter(idx => idx !== -1) : [];
    
    setSelectedHydrationGearItems(gearIndices);
    setEditingHydrationIndex(index);
    setShowHydrationDialog(true);
  };

  // Handle deleting a hydration plan
  const handleDeleteHydrationPlan = (index) => {
    const updatedPlans = [...hydrationPlans];
    updatedPlans.splice(index, 1);
    setHydrationPlans(updatedPlans);
  };

  // Backup all gear items to Supabase
  const backupAllGearItems = async () => {
    if (user && isPremium) {
      try {
        await backupGearItemsToSupabase();
        Alert.alert('Success', 'All gear items backed up to Supabase successfully.');
      } catch (error) {
        console.error('Failed to backup gear items:', error);
        Alert.alert('Error', 'Failed to backup gear items to Supabase.');
      }
    } else {
      Alert.alert('Premium Required', 'You need a premium subscription to backup gear items to Supabase.');
    }
  };
  
  // Handle gear item creation/editing
  // Save gear items
  const saveGearItems = async (items) => {
    // Update local state
    setGearItems(items);
    
    // Save to race object
    if (raceId && currentRace) {
      const preparation = {
        ...(currentRace.preparation || {}),
        dropBags,
        gearItems: items,
        nutritionPlans,
        hydrationPlans
      };
      
      updateRace(raceId, { preparation });
      // Backup to Supabase is handled by updateRace
    }
    
    // Save to global gear context and backup to Supabase
    if (user && isPremium) {
      await saveGlobalGearItems(items);
    }
  };

  const handleAddGearItem = () => {
    if (gearName.trim() === "") return;

    const newGearItem = {
      name: gearName,
      category: gearCategory,
      brand: gearBrand,
      description: gearDescription,
      weight: gearWeight,
      weightUnit: gearWeightUnit,
      isNutrition: isNutrition,
      isHydration: isHydration,
      quantity: parseInt(gearQuantity) || 1,
      retired: isRetired,
    };

    let updatedGearItems;
    if (editingGearIndex !== null) {
      // Edit existing gear item
      updatedGearItems = [...gearItems];
      updatedGearItems[editingGearIndex] = newGearItem;
    } else {
      // Add new gear item
      updatedGearItems = [...gearItems, newGearItem];
    }
    
    // Save to race object
    saveGearItems(updatedGearItems);

    // Reset form
    setGearName("");
    setGearCategory("");
    setGearBrand("");
    setGearDescription("");
    setGearWeight("");
    setGearWeightUnit("g"); // Reset to default unit
    setIsNutrition(false);
    setIsHydration(false);
    setGearQuantity("1");
    setIsRetired(false);
    setEditingGearIndex(null);
    setShowGearDialog(false);
  };

  // Handle editing a gear item
  const handleEditGearItem = (index) => {
    const item = gearItems[index];
    setGearName(item.name);
    setGearCategory(item.category);
    setGearBrand(item.brand);
    setGearDescription(item.description || "");
    setGearWeight(item.weight);
    setGearWeightUnit(item.weightUnit || "g"); // Default to "g" if not set
    setIsNutrition(item.isNutrition);
    setIsHydration(item.isHydration);
    setGearQuantity(item.quantity ? item.quantity.toString() : "1");
    setIsRetired(item.retired || false);
    setEditingGearIndex(index);
    setShowGearDialog(true);
  };

  // Handle deleting a gear item
  const handleDeleteGearItem = (index) => {
    const updatedGearItems = [...gearItems];
    updatedGearItems.splice(index, 1);
    setGearItems(updatedGearItems);
  };
  
  // Render hydration plan card
  const renderHydrationPlanCard = (plan, index) => {
    return (
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
          
          {/* Display associated gear items */}
          {plan.gearItems && plan.gearItems.length > 0 && (
            <View style={styles.gearItemsSection}>
              <Text style={[styles.itemCardSubtitle, { color: theme.colors.textSecondary, marginTop: 8 }]}>
                Hydration Gear:
              </Text>
              <View style={styles.itemsList}>
                {plan.gearItems.map((item, itemIndex) => (
                  <Chip
                    key={itemIndex}
                    style={[styles.itemChip, { backgroundColor: theme.colors.tertiary + '20' }]}
                    textStyle={{ color: theme.colors.tertiary }}
                  >
                    {item.name} {item.weight && `(${item.weight} ${item.weightUnit || 'g'})`}
                  </Chip>
                ))}
              </View>
            </View>
          )}
        </View>
      </Surface>
    );
  };
  
  // Render nutrition plan card
  const renderNutritionPlanCard = (plan, index) => {
    return (
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
          
          {/* Display associated gear items */}
          {plan.gearItems && plan.gearItems.length > 0 && (
            <View style={styles.gearItemsSection}>
              <Text style={[styles.itemCardSubtitle, { color: theme.colors.textSecondary, marginTop: 8 }]}>
                Nutrition Gear:
              </Text>
              <View style={styles.itemsList}>
                {plan.gearItems.map((item, itemIndex) => (
                  <Chip
                    key={itemIndex}
                    style={[styles.itemChip, { backgroundColor: theme.colors.success + '20' }]}
                    textStyle={{ color: theme.colors.success }}
                  >
                    {item.name} {item.weight && `(${item.weight} ${item.weightUnit || 'g'})`}
                  </Chip>
                ))}
              </View>
            </View>
          )}
        </View>
      </Surface>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? theme.colors.background : "#f8f9fa",
        },
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <Title style={[styles.screenTitle, { color: theme.colors.text }]}>
          {currentRace ? `Prep for ${currentRace.name}` : "Race Preparation"}
        </Title>
        <Paragraph
          style={[
            styles.screenDescription,
            { color: theme.colors.textSecondary },
          ]}
        >
          {currentRace
            ? `Prepare your strategy for ${currentRace.name} with drop bags, nutrition, and hydration plans.`
            : "Prepare your race strategy with drop bags, nutrition, and hydration plans."}
        </Paragraph>

        {!currentRace && (
          <Surface
            style={[
              styles.infoCard,
              { backgroundColor: isDarkMode ? "#1e1e1e" : "#fff8e1" },
            ]}
          >
            <Text
              style={{ color: isDarkMode ? "#ffecb3" : "#bf360c", padding: 16 }}
            >
              For race-specific preparation, please access this screen from a
              race's details page.
            </Text>
          </Surface>
        )}

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
              <Title
                style={[styles.sectionTitle, { color: theme.colors.text }]}
              >
                Gear List
              </Title>
            </View>
          </View>
          <Paragraph
            style={[
              styles.sectionDescription,
              { color: theme.colors.textSecondary },
            ]}
          >
            Manage your ultra marathon gear inventory.{" "}
            {user && isPremium
              ? "Your gear is automatically backed up to the cloud."
              : ""}
          </Paragraph>

          <View style={styles.switchContainer}>
            <Text style={[styles.switchLabel, { color: theme.colors.text }]}>
              Show Retired Items
            </Text>
            <Switch
              value={showRetiredItems}
              onValueChange={setShowRetiredItems}
              color={theme.colors.primary}
            />
          </View>

          {gearItems.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="hiking"
                size={48}
                color={theme.colors.text}
              />
              <Text
                style={[
                  styles.emptyStateText,
                  { color: theme.colors.textSecondary },
                ]}
              >
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
                  setGearQuantity("1");
                  setIsRetired(false);
                  setShowGearDialog(true);
                }}
                style={styles.emptyStateButton}
                color={theme.colors.primary}
              >
                Add Gear Item
              </Button>
            </View>
          ) : (
            // Filter gear items based on showRetiredItems toggle
            gearItems
              .filter((item) => showRetiredItems || !item.retired)
              .map((item, index) => (
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
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Text
                        style={[
                          styles.itemCardTitle,
                          {
                            color: item.retired
                              ? theme.colors.disabled
                              : theme.colors.text,
                            textDecorationLine: item.retired
                              ? "line-through"
                              : "none",
                          },
                        ]}
                      >
                        {item.name}
                      </Text>
                      {item.retired && (
                        <Chip
                          style={[
                            styles.tagChip,
                            {
                              backgroundColor: theme.colors.error + "20",
                              marginLeft: 8,
                            },
                          ]}
                          textStyle={{ color: theme.colors.error }}
                        >
                          Retired
                        </Chip>
                      )}
                    </View>
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
                      <Text
                        style={[
                          styles.planDetailLabel,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Brand:
                      </Text>
                      <Text
                        style={[
                          styles.planDetailValue,
                          { color: theme.colors.text },
                        ]}
                      >
                        {item.brand || "Not specified"}
                      </Text>
                    </View>
                    <View style={styles.planDetailRow}>
                      <Text
                        style={[
                          styles.planDetailLabel,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Weight:
                      </Text>
                      <Text
                        style={[
                          styles.planDetailValue,
                          { color: theme.colors.text },
                        ]}
                      >
                        {item.weight
                          ? `${item.weight} ${item.weightUnit || "g"}`
                          : "Not specified"}
                      </Text>
                    </View>
                    <View style={styles.planDetailRow}>
                      <Text
                        style={[
                          styles.planDetailLabel,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Quantity:
                      </Text>
                      <Text
                        style={[
                          styles.planDetailValue,
                          { color: theme.colors.text },
                        ]}
                      >
                        {item.quantity || 1}
                      </Text>
                    </View>
                    <View style={styles.itemTags}>
                      {item.isNutrition && (
                        <Chip
                          style={[
                            styles.tagChip,
                            { backgroundColor: theme.colors.success + "20" },
                          ]}
                          textStyle={{ color: theme.colors.success }}
                        >
                          Nutrition
                        </Chip>
                      )}
                      {item.isHydration && (
                        <Chip
                          style={[
                            styles.tagChip,
                            { backgroundColor: theme.colors.tertiary + "20" },
                          ]}
                          textStyle={{ color: theme.colors.tertiary }}
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
              <Title
                style={[styles.sectionTitle, { color: theme.colors.text }]}
              >
                Drop Bags
              </Title>
            </View>
          </View>
          <Paragraph
            style={[
              styles.sectionDescription,
              { color: theme.colors.textSecondary },
            ]}
          >
            Create and manage your drop bags for aid stations.
          </Paragraph>

          {dropBags.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="bag-personal-outline"
                size={48}
                color={theme.colors.text}
              />
              <Text
                style={[
                  styles.emptyStateText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                No drop bags created yet
              </Text>
              <Button
                mode="outlined"
                onPress={() => {
                  setEditingBagIndex(null);
                  setDropBagName("");
                  setDropBagItems([]);
                  setSelectedGearItems([]);
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
                    <Text
                      style={[
                        styles.itemCardTitle,
                        { color: theme.colors.text },
                      ]}
                    >
                      {bag.name}
                    </Text>
                    {bag.isTemplate && (
                      <Chip
                        style={[
                          styles.templateChip,
                          { backgroundColor: theme.colors.primary + "20" },
                        ]}
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
                  <Text
                    style={[
                      styles.itemCardSubtitle,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
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
                    <Text
                      style={[
                        styles.emptyItemsText,
                        { color: theme.colors.disabled },
                      ]}
                    >
                      No items added
                    </Text>
                  )}

                  {/* Display associated gear items */}
                  {bag.gearItems && bag.gearItems.length > 0 && (
                    <View style={styles.gearItemsSection}>
                      <Text
                        style={[
                          styles.itemCardSubtitle,
                          { color: theme.colors.textSecondary, marginTop: 8 },
                        ]}
                      >
                        Gear:
                      </Text>
                      <View style={styles.itemsList}>
                        {bag.gearItems.map((item, itemIndex) => (
                          <Chip
                            key={itemIndex}
                            style={[
                              styles.itemChip,
                              { backgroundColor: theme.colors.tertiary + "20" },
                            ]}
                            textStyle={{ color: theme.colors.tertiary }}
                          >
                            {item.name}{" "}
                            {item.weight &&
                              `(${item.weight} ${item.weightUnit || "g"})`}
                          </Chip>
                        ))}
                      </View>
                    </View>
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
              <Title
                style={[styles.sectionTitle, { color: theme.colors.text }]}
              >
                Nutrition Plans
              </Title>
            </View>
          </View>
          <Paragraph
            style={[
              styles.sectionDescription,
              { color: theme.colors.textSecondary },
            ]}
          >
            Plan your race nutrition strategy.
          </Paragraph>

          {nutritionPlans.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="food-apple-outline"
                size={48}
                color={theme.colors.text}
              />
              <Text
                style={[
                  styles.emptyStateText,
                  { color: theme.colors.textSecondary },
                ]}
              >
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
                  setSelectedNutritionGearItems([]);
                  setShowNutritionDialog(true);
                }}
                style={styles.emptyStateButton}
                color={theme.colors.primary}
              >
                Create Nutrition Plan
              </Button>
            </View>
          ) : (
            nutritionPlans.map((plan, index) =>
              renderNutritionPlanCard(plan, index)
            )
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
              <Title
                style={[styles.sectionTitle, { color: theme.colors.text }]}
              >
                Hydration Plans
              </Title>
            </View>
          </View>
          <Paragraph
            style={[
              styles.sectionDescription,
              { color: theme.colors.textSecondary },
            ]}
          >
            Plan your race hydration strategy.
          </Paragraph>

          {hydrationPlans.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="water-outline"
                size={48}
                color={theme.colors.text}
              />
              <Text
                style={[
                  styles.emptyStateText,
                  { color: theme.colors.textSecondary },
                ]}
              >
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
                  setSelectedHydrationGearItems([]);
                  setShowHydrationDialog(true);
                }}
                style={styles.emptyStateButton}
                color={theme.colors.primary}
              >
                Create Hydration Plan
              </Button>
            </View>
          ) : (
            hydrationPlans.map((plan, index) =>
              renderHydrationPlanCard(plan, index)
            )
          )}
        </Surface>
      </ScrollView>

      {/* FAB for quick actions */}
      <FAB.Group
        open={fabOpen}
        icon={fabOpen ? "close" : "plus"}
        actions={[
          ...(currentRace
            ? [
                {
                  icon: "content-save",
                  label: "Save All Data",
                  onPress: () => {
                    // Save all preparation data to the race object
                    const updatedRace = {
                      ...currentRace,
                      preparation: {
                        ...(currentRace.preparation || {}),
                        dropBags,
                        gearItems,
                        nutritionPlans,
                        hydrationPlans,
                      },
                    };

                    updateRace(raceId, {
                      preparation: updatedRace.preparation,
                    });
                    // Backup to Supabase is handled by updateRace

                    // Show a snackbar or toast notification
                    Alert.alert(
                      "Saved",
                      "All preparation data has been saved to your race and backed up to Supabase."
                    );

                    setFabOpen(false);
                  },
                  color: theme.colors.success,
                },
              ]
            : []),
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
              setSelectedGearItems([]);
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
              setSelectedNutritionGearItems([]);
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
              setSelectedHydrationGearItems([]);
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
                  name={
                    isTemplate ? "checkbox-marked" : "checkbox-blank-outline"
                  }
                  size={24}
                  color={theme.colors.primary}
                />
                <Text
                  style={[styles.checkboxLabel, { color: theme.colors.text }]}
                >
                  Save as template
                </Text>
              </TouchableOpacity>
            </View>
            <Text
              style={[styles.dialogSectionTitle, { color: theme.colors.text }]}
            >
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
                <Text
                  style={[
                    styles.itemsTitle,
                    { color: theme.colors.textSecondary },
                  ]}
                >
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

            {/* Gear Items Selection */}
            {gearItems.length > 0 && (
              <View style={styles.gearSelectionContainer}>
                <Text
                  style={[
                    styles.dialogSectionTitle,
                    { color: theme.colors.text },
                  ]}
                >
                  Select Gear Items
                </Text>
                <View style={styles.gearItemsSelectionContainer}>
                  {gearItems.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.gearItemSelectionChip,
                        {
                          backgroundColor: selectedGearItems.includes(index)
                            ? theme.colors.primary + "20"
                            : theme.colors.surfaceVariant,
                        },
                      ]}
                      onPress={() => {
                        if (selectedGearItems.includes(index)) {
                          setSelectedGearItems(
                            selectedGearItems.filter((i) => i !== index)
                          );
                        } else {
                          setSelectedGearItems([...selectedGearItems, index]);
                        }
                      }}
                    >
                      <MaterialCommunityIcons
                        name={
                          selectedGearItems.includes(index)
                            ? "checkbox-marked"
                            : "checkbox-blank-outline"
                        }
                        size={20}
                        color={theme.colors.primary}
                        style={styles.gearItemSelectionIcon}
                      />
                      <Text
                        style={[
                          styles.gearItemSelectionText,
                          { color: theme.colors.text },
                        ]}
                      >
                        {item.name}{" "}
                        {item.weight &&
                          `(${item.weight} ${item.weightUnit || "g"})`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setShowDropBagDialog(false)}
              color={theme.colors.textSecondary}
            >
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
            {editingNutritionIndex !== null
              ? "Edit Nutrition Plan"
              : "Create Nutrition Plan"}
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

            {/* Nutrition-related Gear Items Selection */}
            {gearItems.filter((item) => item.isNutrition).length > 0 && (
              <View style={styles.gearSelectionContainer}>
                <Text
                  style={[
                    styles.dialogSectionTitle,
                    { color: theme.colors.text },
                  ]}
                >
                  Select Nutrition Gear Items
                </Text>
                <View style={styles.gearItemsSelectionContainer}>
                  {gearItems
                    .map((item, index) => ({ item, index }))
                    .filter(({ item }) => item.isNutrition)
                    .map(({ item, index }) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.gearItemSelectionChip,
                          {
                            backgroundColor:
                              selectedNutritionGearItems.includes(index)
                                ? theme.colors.success + "20"
                                : theme.colors.surfaceVariant,
                          },
                        ]}
                        onPress={() => {
                          if (selectedNutritionGearItems.includes(index)) {
                            setSelectedNutritionGearItems(
                              selectedNutritionGearItems.filter(
                                (i) => i !== index
                              )
                            );
                          } else {
                            setSelectedNutritionGearItems([
                              ...selectedNutritionGearItems,
                              index,
                            ]);
                          }
                        }}
                      >
                        <MaterialCommunityIcons
                          name={
                            selectedNutritionGearItems.includes(index)
                              ? "checkbox-marked"
                              : "checkbox-blank-outline"
                          }
                          size={20}
                          color={theme.colors.success}
                          style={styles.gearItemSelectionIcon}
                        />
                        <Text
                          style={[
                            styles.gearItemSelectionText,
                            { color: theme.colors.text },
                          ]}
                        >
                          {item.name}{" "}
                          {item.weight &&
                            `(${item.weight} ${item.weightUnit || "g"})`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setShowNutritionDialog(false)}
              color={theme.colors.textSecondary}
            >
              Cancel
            </Button>
            <Button
              onPress={handleAddNutritionPlan}
              color={theme.colors.primary}
            >
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
            {editingHydrationIndex !== null
              ? "Edit Hydration Plan"
              : "Create Hydration Plan"}
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

            {/* Hydration-related Gear Items Selection */}
            {gearItems.filter((item) => item.isHydration).length > 0 && (
              <View style={styles.gearSelectionContainer}>
                <Text
                  style={[
                    styles.dialogSectionTitle,
                    { color: theme.colors.text },
                  ]}
                >
                  Select Hydration Gear Items
                </Text>
                <View style={styles.gearItemsSelectionContainer}>
                  {gearItems
                    .map((item, index) => ({ item, index }))
                    .filter(({ item }) => item.isHydration)
                    .map(({ item, index }) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.gearItemSelectionChip,
                          {
                            backgroundColor:
                              selectedHydrationGearItems.includes(index)
                                ? theme.colors.tertiary + "20"
                                : theme.colors.surfaceVariant,
                          },
                        ]}
                        onPress={() => {
                          if (selectedHydrationGearItems.includes(index)) {
                            setSelectedHydrationGearItems(
                              selectedHydrationGearItems.filter(
                                (i) => i !== index
                              )
                            );
                          } else {
                            setSelectedHydrationGearItems([
                              ...selectedHydrationGearItems,
                              index,
                            ]);
                          }
                        }}
                      >
                        <MaterialCommunityIcons
                          name={
                            selectedHydrationGearItems.includes(index)
                              ? "checkbox-marked"
                              : "checkbox-blank-outline"
                          }
                          size={20}
                          color={theme.colors.tertiary}
                          style={styles.gearItemSelectionIcon}
                        />
                        <Text
                          style={[
                            styles.gearItemSelectionText,
                            { color: theme.colors.text },
                          ]}
                        >
                          {item.name}{" "}
                          {item.weight &&
                            `(${item.weight} ${item.weightUnit || "g"})`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setShowHydrationDialog(false)}
              color={theme.colors.textSecondary}
            >
              Cancel
            </Button>
            <Button
              onPress={handleAddHydrationPlan}
              color={theme.colors.primary}
            >
              {editingHydrationIndex !== null ? "Update" : "Create"}
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Gear Item Dialog */}
        <Dialog
          visible={showGearDialog}
          onDismiss={() => setShowGearDialog(false)}
          style={{
            backgroundColor: isDarkMode ? theme.colors.surface : "#ffffff",
          }}
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
              label="Category"
              value={gearCategory}
              onChangeText={setGearCategory}
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
            <TextInput
              label="Description"
              value={gearDescription}
              onChangeText={setGearDescription}
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
                <Menu.Item
                  onPress={() => {
                    setGearWeightUnit("g");
                    setShowWeightUnitMenu(false);
                  }}
                  title="g"
                />
                <Menu.Item
                  onPress={() => {
                    setGearWeightUnit("kg");
                    setShowWeightUnitMenu(false);
                  }}
                  title="kg"
                />
                <Menu.Item
                  onPress={() => {
                    setGearWeightUnit("oz");
                    setShowWeightUnitMenu(false);
                  }}
                  title="oz"
                />
                <Menu.Item
                  onPress={() => {
                    setGearWeightUnit("lb");
                    setShowWeightUnitMenu(false);
                  }}
                  title="lb"
                />
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
                color={theme.colors.tertiary}
              />
            </View>
            <TextInput
              label="Quantity"
              value={gearQuantity}
              onChangeText={setGearQuantity}
              style={styles.dialogInput}
              mode="outlined"
              keyboardType="numeric"
              theme={{ colors: { primary: theme.colors.primary } }}
            />
            <View style={styles.switchContainer}>
              <Text style={[styles.switchLabel, { color: theme.colors.text }]}>
                Retired Item
              </Text>
              <Switch
                value={isRetired}
                onValueChange={setIsRetired}
                color={theme.colors.error}
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
  infoCard: {
    marginVertical: 10,
    borderRadius: 8,
    elevation: 2,
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
  gearSelectionContainer: {
    marginTop: 16,
  },
  gearItemsSelectionContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  gearItemSelectionChip: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  gearItemSelectionIcon: {
    marginRight: 4,
  },
  gearItemSelectionText: {
    fontSize: 14,
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