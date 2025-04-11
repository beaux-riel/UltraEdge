import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  SegmentedButtons, 
  Divider,
  Portal,
  Modal,
  ActivityIndicator
} from 'react-native-paper';
import { useAppTheme } from '../../context/ThemeContext';
import RacePlanAssignment from '../../components/race/RacePlanAssignment';
import AidStationIntegration from '../../components/race/AidStationIntegration';
import SharingSystem from '../../components/sharing/SharingSystem';
import ExportOptions from '../../components/export/ExportOptions';
import NotificationSystem from '../../components/notifications/NotificationSystem';

/**
 * Screen for race integration, sharing, and export functionality
 * @param {Object} props - Component props
 * @param {Object} props.navigation - React Navigation object
 * @param {Object} props.route - React Navigation route object
 */
const RaceIntegrationScreen = ({ navigation, route }) => {
  const { theme, isDarkMode } = useAppTheme();
  const [activeTab, setActiveTab] = useState('assignment');
  const [loading, setLoading] = useState(false);
  const [races, setRaces] = useState([]);
  const [nutritionPlans, setNutritionPlans] = useState([]);
  const [hydrationPlans, setHydrationPlans] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [aidStations, setAidStations] = useState([]);
  const [sharedLinks, setSharedLinks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // Load data
  useEffect(() => {
    loadData();
  }, []);
  
  // Load data from API
  const loadData = async () => {
    setLoading(true);
    
    try {
      // In a real app, these would be API calls
      // For now, we'll use mock data
      
      // Load races
      setRaces([
        { id: '1', name: 'Mountain Trail 50K', date: '2023-06-15', duration: 8 },
        { id: '2', name: 'Desert Ultra 100K', date: '2023-08-20', duration: 16 },
        { id: '3', name: 'Coastal Marathon', date: '2023-09-10', duration: 5 }
      ]);
      
      // Load nutrition plans
      setNutritionPlans([
        { id: '1', name: 'High Carb Plan', description: 'Focused on carbohydrates', entries: [] },
        { id: '2', name: 'Balanced Nutrition', description: 'Mix of carbs, protein, and fat', entries: [] },
        { id: '3', name: 'Real Food Plan', description: 'Minimally processed foods', entries: [] }
      ]);
      
      // Load hydration plans
      setHydrationPlans([
        { id: '1', name: 'Electrolyte Focus', description: 'High sodium and potassium', entries: [] },
        { id: '2', name: 'Standard Hydration', description: 'Balanced water and electrolytes', entries: [] }
      ]);
      
      // Load assignments
      setAssignments([
        { id: '1', raceId: '1', planId: '1', planType: 'nutrition', sequence: 'all' },
        { id: '2', raceId: '1', planId: '1', planType: 'hydration', sequence: 'all' }
      ]);
      
      // Load aid stations
      setAidStations([
        { id: '1', raceId: '1', name: 'Start/Finish', distance: 0 },
        { id: '2', raceId: '1', name: 'Aid Station 1', distance: 5.2 },
        { id: '3', raceId: '1', name: 'Aid Station 2', distance: 12.8 },
        { id: '4', raceId: '1', name: 'Aid Station 3', distance: 18.5 },
        { id: '5', raceId: '1', name: 'Aid Station 4', distance: 25.6 }
      ]);
      
      // Load shared links
      setSharedLinks([
        { 
          id: '1', 
          raceId: '1', 
          planIds: [{ id: '1', type: 'nutrition' }], 
          url: 'https://ultraedge.app/share/abc123',
          isPublic: true,
          createdAt: '2023-05-10T12:00:00Z'
        }
      ]);
      
      // Load notifications
      setNotifications([
        {
          id: '1',
          raceId: '1',
          type: 'pre_race',
          title: 'Race Day Reminder',
          message: 'Don\'t forget your nutrition plan!',
          date: '2023-06-14T18:00:00Z',
          enabled: true,
          recurring: false
        }
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle assign plan
  const handleAssignPlan = (assignmentData) => {
    // In a real app, this would be an API call
    const newAssignment = {
      id: Date.now().toString(),
      ...assignmentData
    };
    
    setAssignments([...assignments, newAssignment]);
  };
  
  // Handle unassign plan
  const handleUnassignPlan = (assignmentId) => {
    // In a real app, this would be an API call
    setAssignments(assignments.filter(a => a.id !== assignmentId));
  };
  
  // Handle update assignment
  const handleUpdateAssignment = (assignmentId, updateData) => {
    // In a real app, this would be an API call
    setAssignments(assignments.map(a => 
      a.id === assignmentId ? { ...a, ...updateData } : a
    ));
  };
  
  // Handle update aid station
  const handleUpdateAidStation = (aidStationId, updateData) => {
    // In a real app, this would be an API call
    setAidStations(aidStations.map(a => 
      a.id === aidStationId ? { ...a, ...updateData } : a
    ));
  };
  
  // Handle update checklist
  const handleUpdateChecklist = (aidStationId, checklist) => {
    // In a real app, this would be an API call
    setAidStations(aidStations.map(a => 
      a.id === aidStationId ? { ...a, checklist } : a
    ));
  };
  
  // Handle create share link
  const handleCreateShareLink = (shareData) => {
    // In a real app, this would be an API call
    const newShareLink = {
      id: Date.now().toString(),
      ...shareData,
      url: `https://ultraedge.app/share/${Math.random().toString(36).substring(2, 8)}`,
      createdAt: new Date().toISOString()
    };
    
    setSharedLinks([...sharedLinks, newShareLink]);
    return { success: true, shareLink: newShareLink };
  };
  
  // Handle update share link
  const handleUpdateShareLink = (shareLinkId, updateData) => {
    // In a real app, this would be an API call
    setSharedLinks(sharedLinks.map(s => 
      s.id === shareLinkId ? { ...s, ...updateData } : s
    ));
    return { success: true };
  };
  
  // Handle delete share link
  const handleDeleteShareLink = (shareLinkId) => {
    // In a real app, this would be an API call
    setSharedLinks(sharedLinks.filter(s => s.id !== shareLinkId));
    return { success: true };
  };
  
  // Handle export PDF
  const handleExportPDF = (exportData) => {
    // In a real app, this would generate a PDF file
    console.log('Exporting PDF:', exportData);
    return { 
      success: true, 
      filePath: '/tmp/export.pdf' 
    };
  };
  
  // Handle export CSV
  const handleExportCSV = (planIds, options) => {
    // In a real app, this would generate a CSV file
    console.log('Exporting CSV:', planIds, options);
    return { 
      success: true, 
      filePath: '/tmp/export.csv' 
    };
  };
  
  // Handle export JSON
  const handleExportJSON = (planIds, options) => {
    // In a real app, this would generate a JSON file
    console.log('Exporting JSON:', planIds, options);
    return { 
      success: true, 
      filePath: '/tmp/export.json' 
    };
  };
  
  // Handle export calendar
  const handleExportCalendar = (planIds) => {
    // In a real app, this would generate an ICS file
    console.log('Exporting Calendar:', planIds);
    return { 
      success: true, 
      filePath: '/tmp/export.ics' 
    };
  };
  
  // Handle import data
  const handleImportData = (data, format) => {
    // In a real app, this would import data from a file
    console.log('Importing data:', format, data);
    return { success: true };
  };
  
  // Handle create notification
  const handleCreateNotification = (notificationData) => {
    // In a real app, this would be an API call
    const newNotification = {
      id: Date.now().toString(),
      ...notificationData
    };
    
    setNotifications([...notifications, newNotification]);
    return { success: true, notification: newNotification };
  };
  
  // Handle update notification
  const handleUpdateNotification = (notificationId, updateData) => {
    // In a real app, this would be an API call
    setNotifications(notifications.map(n => 
      n.id === notificationId ? { ...n, ...updateData } : n
    ));
    return { success: true };
  };
  
  // Handle delete notification
  const handleDeleteNotification = (notificationId) => {
    // In a real app, this would be an API call
    setNotifications(notifications.filter(n => n.id !== notificationId));
    return { success: true };
  };
  
  // Handle generate shopping list
  const handleGenerateShoppingList = (raceId, items) => {
    // In a real app, this would save the shopping list
    console.log('Generating shopping list:', raceId, items);
    return { success: true };
  };
  
  // Render tab selector
  const renderTabSelector = () => {
    return (
      <SegmentedButtons
        value={activeTab}
        onValueChange={setActiveTab}
        buttons={[
          { value: 'assignment', label: 'Assign' },
          { value: 'aid_stations', label: 'Aid Stations' },
          { value: 'sharing', label: 'Share' },
          { value: 'export', label: 'Export' },
          { value: 'notifications', label: 'Notify' }
        ]}
        style={styles.tabSelector}
      />
    );
  };
  
  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'assignment':
        return (
          <RacePlanAssignment
            races={races}
            nutritionPlans={nutritionPlans}
            hydrationPlans={hydrationPlans}
            assignments={assignments}
            onAssignPlan={handleAssignPlan}
            onUnassignPlan={handleUnassignPlan}
            onUpdateAssignment={handleUpdateAssignment}
          />
        );
      case 'aid_stations':
        return (
          <AidStationIntegration
            race={races[0]} // For demo purposes, using the first race
            aidStations={aidStations}
            nutritionPlans={nutritionPlans.filter(p => 
              assignments.some(a => a.planId === p.id && a.planType === 'nutrition' && a.raceId === races[0]?.id)
            )}
            hydrationPlans={hydrationPlans.filter(p => 
              assignments.some(a => a.planId === p.id && a.planType === 'hydration' && a.raceId === races[0]?.id)
            )}
            onUpdateAidStation={handleUpdateAidStation}
            onUpdateChecklist={handleUpdateChecklist}
          />
        );
      case 'sharing':
        return (
          <SharingSystem
            race={races[0]} // For demo purposes, using the first race
            nutritionPlans={nutritionPlans.filter(p => 
              assignments.some(a => a.planId === p.id && a.planType === 'nutrition' && a.raceId === races[0]?.id)
            )}
            hydrationPlans={hydrationPlans.filter(p => 
              assignments.some(a => a.planId === p.id && a.planType === 'hydration' && a.raceId === races[0]?.id)
            )}
            aidStations={aidStations.filter(a => a.raceId === races[0]?.id)}
            sharedLinks={sharedLinks.filter(s => s.raceId === races[0]?.id)}
            onCreateShareLink={handleCreateShareLink}
            onUpdateShareLink={handleUpdateShareLink}
            onDeleteShareLink={handleDeleteShareLink}
            onExportPDF={handleExportPDF}
          />
        );
      case 'export':
        return (
          <ExportOptions
            nutritionPlans={nutritionPlans}
            hydrationPlans={hydrationPlans}
            onExportCSV={handleExportCSV}
            onExportJSON={handleExportJSON}
            onExportCalendar={handleExportCalendar}
            onImportData={handleImportData}
          />
        );
      case 'notifications':
        return (
          <NotificationSystem
            races={races}
            nutritionPlans={nutritionPlans}
            hydrationPlans={hydrationPlans}
            notifications={notifications}
            onCreateNotification={handleCreateNotification}
            onUpdateNotification={handleUpdateNotification}
            onDeleteNotification={handleDeleteNotification}
            onGenerateShoppingList={handleGenerateShoppingList}
          />
        );
      default:
        return null;
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading data...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {renderTabSelector()}
      
      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  tabSelector: {
    marginBottom: 8,
  },
  contentContainer: {
    flex: 1,
  },
});

export default RaceIntegrationScreen;