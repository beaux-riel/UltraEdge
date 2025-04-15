import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
} from "react-native";
import {
  Text,
  Searchbar,
  Chip,
  Button,
  Divider,
  useTheme as usePaperTheme,
  SegmentedButtons,
  IconButton,
  Menu,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRaces } from "../context/RaceContext";
import { useAppTheme } from "../context/ThemeContext";
import RaceCard from "../components/RaceCard";
import EmptyState from "../components/EmptyState";

const AllRacesScreen = ({ navigation }) => {
  const paperTheme = usePaperTheme();
  const { isDarkMode, theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { getRacesArray, loading, deleteRace } = useRaces();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [menuVisible, setMenuVisible] = useState({});
  
  // Get all races
  const allRaces = getRacesArray();
  
  // Filter races based on search query and filter
  const getFilteredRaces = () => {
    let filtered = allRaces;
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(race => 
        race.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (race.location && race.location.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Apply status filter
    if (filter !== "all") {
      const now = new Date();
      
      if (filter === "upcoming") {
        filtered = filtered.filter(race => {
          const raceDate = new Date(race.date);
          return raceDate > now;
        });
      } else if (filter === "past") {
        filtered = filtered.filter(race => {
          const raceDate = new Date(race.date);
          return raceDate < now;
        });
      } else if (filter === "today") {
        filtered = filtered.filter(race => {
          const raceDate = new Date(race.date);
          return raceDate.toDateString() === now.toDateString();
        });
      }
    }
    
    // Sort races by date (newest first for past, soonest first for upcoming)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      if (filter === "past") {
        return dateB - dateA; // Newest first for past races
      } else {
        return dateA - dateB; // Soonest first for upcoming races
      }
    });
  };
  
  const filteredRaces = getFilteredRaces();
  
  const handleDeleteRace = (raceId) => {
    deleteRace(raceId);
    setMenuVisible({});
  };
  
  const renderRaceItem = ({ item }) => (
    <View style={styles.raceItemContainer}>
      <TouchableOpacity
        style={{ flex: 1 }}
        onPress={() => navigation.navigate("RaceDetails", { id: item.id })}
      >
        <RaceCard race={item} />
      </TouchableOpacity>
      <Menu
        visible={menuVisible[item.id] || false}
        onDismiss={() => setMenuVisible(prev => ({ ...prev, [item.id]: false }))}
        anchor={
          <IconButton
            icon="dots-vertical"
            size={24}
            onPress={() => setMenuVisible(prev => ({ ...prev, [item.id]: true }))}
            style={styles.menuButton}
          />
        }
      >
        <Menu.Item
          onPress={() => {
            setMenuVisible({});
            navigation.navigate("RaceDetails", { id: item.id });
          }}
          title="View Details"
          leadingIcon="eye"
        />
        <Menu.Item
          onPress={() => {
            setMenuVisible({});
            navigation.navigate("CreateRace", { raceData: item, isEditing: true });
          }}
          title="Edit Race"
          leadingIcon="pencil"
        />
        <Divider />
        <Menu.Item
          onPress={() => handleDeleteRace(item.id)}
          title="Delete Race"
          leadingIcon="delete"
          titleStyle={{ color: theme.colors.error }}
        />
      </Menu>
    </View>
  );
  
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDarkMode ? "#121212" : "#f5f5f5" }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? "#121212" : "#f5f5f5" }]}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search races..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[
            styles.searchBar,
            { backgroundColor: isDarkMode ? "#333333" : "#ffffff" }
          ]}
          iconColor={theme.colors.primary}
          inputStyle={{ color: isDarkMode ? "#ffffff" : "#000000" }}
          placeholderTextColor={isDarkMode ? "#aaaaaa" : "#666666"}
        />
        
        <SegmentedButtons
          value={filter}
          onValueChange={setFilter}
          buttons={[
            { value: 'all', label: 'All' },
            { value: 'upcoming', label: 'Upcoming' },
            { value: 'today', label: 'Today' },
            { value: 'past', label: 'Past' },
          ]}
          style={styles.filterButtons}
        />
      </View>
      
      {filteredRaces.length > 0 ? (
        <FlatList
          data={filteredRaces}
          renderItem={renderRaceItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.racesList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <EmptyState
          icon="run"
          title="No races found"
          description={`No ${filter !== 'all' ? filter : ''} races match your search criteria.`}
          actionLabel="Create New Race"
          onAction={() => navigation.navigate("CreateRace")}
        />
      )}
      
      <Button
        mode="contained"
        icon="plus"
        onPress={() => navigation.navigate("CreateRace")}
        style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        labelStyle={{ color: "#ffffff" }}
      >
        Add New Race
      </Button>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 16,
  },
  searchBar: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 8,
  },
  filterButtons: {
    marginBottom: 16,
  },
  racesList: {
    paddingBottom: 80, // Space for the add button
  },
  raceItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  menuButton: {
    marginLeft: 8,
  },
  addButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    borderRadius: 28,
    paddingVertical: 8,
    paddingHorizontal: 16,
    elevation: 4,
  },
});

export default AllRacesScreen;