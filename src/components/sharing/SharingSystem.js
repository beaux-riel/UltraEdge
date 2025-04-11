import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Share, Alert, Platform } from 'react-native';
import { 
  Card, 
  Text, 
  Button, 
  Divider, 
  List, 
  Chip, 
  TextInput,
  Switch,
  SegmentedButtons,
  Portal,
  Modal,
  RadioButton,
  IconButton
} from 'react-native-paper';
import { useAppTheme } from '../../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

/**
 * Component for sharing nutrition and hydration plans with crew and pacers
 * @param {Object} props - Component props
 * @param {Object} props.race - Race object
 * @param {Array} props.nutritionPlans - Array of nutrition plan objects assigned to the race
 * @param {Array} props.hydrationPlans - Array of hydration plan objects assigned to the race
 * @param {Array} props.aidStations - Array of aid station objects for the race
 * @param {Array} props.sharedLinks - Array of existing shared link objects
 * @param {function} props.onCreateShareLink - Function called when a new share link is created
 * @param {function} props.onUpdateShareLink - Function called when a share link is updated
 * @param {function} props.onDeleteShareLink - Function called when a share link is deleted
 * @param {function} props.onExportPDF - Function called when a PDF export is requested
 */
const SharingSystem = ({ 
  race = {}, 
  nutritionPlans = [], 
  hydrationPlans = [], 
  aidStations = [],
  sharedLinks = [],
  onCreateShareLink,
  onUpdateShareLink,
  onDeleteShareLink,
  onExportPDF
}) => {
  const { theme, isDarkMode } = useAppTheme();
  const [selectedPlans, setSelectedPlans] = useState([]);
  const [shareMode, setShareMode] = useState('link');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create', 'permissions', or 'export'
  const [shareEmail, setShareEmail] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [activeShareId, setActiveShareId] = useState(null);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportDetailLevel, setExportDetailLevel] = useState('full');
  const [exportContent, setExportContent] = useState(['nutrition', 'hydration', 'aid_stations']);
  
  // Handle plan selection toggle
  const togglePlanSelection = (plan, type) => {
    const planKey = `${type}-${plan.id}`;
    
    if (selectedPlans.some(p => p.key === planKey)) {
      setSelectedPlans(selectedPlans.filter(p => p.key !== planKey));
    } else {
      setSelectedPlans([...selectedPlans, { key: planKey, plan, type }]);
    }
  };
  
  // Show create share modal
  const showCreateShareModal = () => {
    if (selectedPlans.length === 0) {
      Alert.alert('Error', 'Please select at least one plan to share');
      return;
    }
    
    setModalType('create');
    setShareEmail('');
    setShareMessage(`Here's my nutrition and hydration plan for ${race.name}`);
    setIsPublic(false);
    setModalVisible(true);
  };
  
  // Show permissions modal
  const showPermissionsModal = (shareId) => {
    const shareLink = sharedLinks.find(link => link.id === shareId);
    if (!shareLink) return;
    
    setModalType('permissions');
    setActiveShareId(shareId);
    setIsPublic(shareLink.isPublic);
    setModalVisible(true);
  };
  
  // Show export modal
  const showExportModal = () => {
    if (selectedPlans.length === 0) {
      Alert.alert('Error', 'Please select at least one plan to export');
      return;
    }
    
    setModalType('export');
    setExportFormat('pdf');
    setExportDetailLevel('full');
    setExportContent(['nutrition', 'hydration', 'aid_stations']);
    setModalVisible(true);
  };
  
  // Handle create share link
  const handleCreateShareLink = () => {
    const planIds = selectedPlans.map(p => ({
      id: p.plan.id,
      type: p.type
    }));
    
    onCreateShareLink({
      planIds,
      email: shareEmail,
      message: shareMessage,
      isPublic,
      raceId: race.id
    });
    
    setModalVisible(false);
  };
  
  // Handle update permissions
  const handleUpdatePermissions = () => {
    onUpdateShareLink(activeShareId, { isPublic });
    setModalVisible(false);
  };
  
  // Handle export
  const handleExport = () => {
    const planIds = selectedPlans.map(p => ({
      id: p.plan.id,
      type: p.type
    }));
    
    onExportPDF({
      planIds,
      format: exportFormat,
      detailLevel: exportDetailLevel,
      content: exportContent,
      raceId: race.id
    });
    
    setModalVisible(false);
  };
  
  // Handle share via platform
  const handleShareViaPlatform = async (shareLink) => {
    try {
      const result = await Share.share({
        message: `${shareLink.message}\n\n${shareLink.url}`,
        url: shareLink.url // iOS only
      });
      
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
        } else {
          // shared
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };
  
  // Handle copy link
  const handleCopyLink = async (url) => {
    await Clipboard.setStringAsync(url);
    Alert.alert('Success', 'Link copied to clipboard');
  };
  
  // Handle delete share link
  const handleDeleteShareLink = (shareId) => {
    Alert.alert(
      'Delete Share Link',
      'Are you sure you want to delete this share link?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => onDeleteShareLink(shareId)
        }
      ]
    );
  };
  
  // Toggle export content selection
  const toggleExportContent = (content) => {
    if (exportContent.includes(content)) {
      setExportContent(exportContent.filter(c => c !== content));
    } else {
      setExportContent([...exportContent, content]);
    }
  };
  
  // Render plan selection
  const renderPlanSelection = () => {
    return (
      <Card style={styles.card}>
        <Card.Title title="Select Plans to Share" subtitle={race.name} />
        <Card.Content>
          <Text style={styles.sectionTitle}>Nutrition Plans</Text>
          <ScrollView style={styles.planList}>
            {nutritionPlans.length === 0 ? (
              <Text style={styles.emptyText}>No nutrition plans assigned to this race</Text>
            ) : (
              nutritionPlans.map(plan => {
                const isSelected = selectedPlans.some(p => p.key === `nutrition-${plan.id}`);
                
                return (
                  <List.Item
                    key={`nutrition-${plan.id}`}
                    title={plan.name}
                    description={plan.description}
                    left={props => (
                      <List.Icon
                        {...props}
                        icon={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                      />
                    )}
                    onPress={() => togglePlanSelection(plan, 'nutrition')}
                    style={[
                      styles.planItem,
                      isSelected && { backgroundColor: theme.colors.primaryContainer }
                    ]}
                  />
                );
              })
            )}
          </ScrollView>
          
          <Divider style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Hydration Plans</Text>
          <ScrollView style={styles.planList}>
            {hydrationPlans.length === 0 ? (
              <Text style={styles.emptyText}>No hydration plans assigned to this race</Text>
            ) : (
              hydrationPlans.map(plan => {
                const isSelected = selectedPlans.some(p => p.key === `hydration-${plan.id}`);
                
                return (
                  <List.Item
                    key={`hydration-${plan.id}`}
                    title={plan.name}
                    description={plan.description}
                    left={props => (
                      <List.Icon
                        {...props}
                        icon={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                      />
                    )}
                    onPress={() => togglePlanSelection(plan, 'hydration')}
                    style={[
                      styles.planItem,
                      isSelected && { backgroundColor: theme.colors.primaryContainer }
                    ]}
                  />
                );
              })
            )}
          </ScrollView>
        </Card.Content>
      </Card>
    );
  };
  
  // Render share options
  const renderShareOptions = () => {
    return (
      <Card style={styles.card}>
        <Card.Title title="Share Options" />
        <Card.Content>
          <SegmentedButtons
            value={shareMode}
            onValueChange={setShareMode}
            buttons={[
              { value: 'link', label: 'Share Link' },
              { value: 'export', label: 'Export' }
            ]}
            style={styles.shareToggle}
          />
          
          {shareMode === 'link' ? (
            <Button 
              mode="contained" 
              onPress={showCreateShareModal}
              style={styles.shareButton}
              icon="share"
              disabled={selectedPlans.length === 0}
            >
              Create Share Link
            </Button>
          ) : (
            <Button 
              mode="contained" 
              onPress={showExportModal}
              style={styles.shareButton}
              icon="file-export"
              disabled={selectedPlans.length === 0}
            >
              Export Plans
            </Button>
          )}
        </Card.Content>
      </Card>
    );
  };
  
  // Render shared links
  const renderSharedLinks = () => {
    if (shareMode !== 'link') return null;
    
    return (
      <Card style={styles.card}>
        <Card.Title title="Shared Links" />
        <Card.Content>
          {sharedLinks.length === 0 ? (
            <Text style={styles.emptyText}>No shared links yet</Text>
          ) : (
            <List.Section>
              {sharedLinks.map(link => (
                <List.Item
                  key={link.id}
                  title={link.email || 'Public Link'}
                  description={`Created: ${new Date(link.createdAt).toLocaleDateString()}`}
                  left={props => (
                    <List.Icon
                      {...props}
                      icon={link.isPublic ? 'earth' : 'lock'}
                    />
                  )}
                  right={props => (
                    <View style={styles.linkActions}>
                      <IconButton
                        {...props}
                        icon="content-copy"
                        onPress={() => handleCopyLink(link.url)}
                      />
                      <IconButton
                        {...props}
                        icon="share"
                        onPress={() => handleShareViaPlatform(link)}
                      />
                      <IconButton
                        {...props}
                        icon="dots-vertical"
                        onPress={() => showPermissionsModal(link.id)}
                      />
                    </View>
                  )}
                  style={styles.linkItem}
                />
              ))}
            </List.Section>
          )}
        </Card.Content>
      </Card>
    );
  };
  
  // Render create share modal
  const renderCreateShareModal = () => {
    return (
      <Card>
        <Card.Title title="Create Share Link" />
        <Card.Content>
          <TextInput
            label="Email (optional)"
            value={shareEmail}
            onChangeText={setShareEmail}
            placeholder="Enter recipient's email"
            mode="outlined"
            style={styles.input}
          />
          
          <TextInput
            label="Message"
            value={shareMessage}
            onChangeText={setShareMessage}
            placeholder="Add a message"
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />
          
          <View style={styles.switchRow}>
            <Text>Make link public</Text>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
            />
          </View>
          
          <Text style={styles.privacyNote}>
            {isPublic 
              ? 'Public links can be accessed by anyone with the link'
              : 'Private links require the recipient to sign in'}
          </Text>
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => setModalVisible(false)}>Cancel</Button>
          <Button 
            mode="contained"
            onPress={handleCreateShareLink}
          >
            Create Link
          </Button>
        </Card.Actions>
      </Card>
    );
  };
  
  // Render permissions modal
  const renderPermissionsModal = () => {
    return (
      <Card>
        <Card.Title title="Link Permissions" />
        <Card.Content>
          <View style={styles.switchRow}>
            <Text>Make link public</Text>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
            />
          </View>
          
          <Text style={styles.privacyNote}>
            {isPublic 
              ? 'Public links can be accessed by anyone with the link'
              : 'Private links require the recipient to sign in'}
          </Text>
          
          <Divider style={styles.divider} />
          
          <Button 
            mode="outlined" 
            onPress={() => handleDeleteShareLink(activeShareId)}
            style={styles.deleteButton}
            icon="delete"
            textColor={theme.colors.error}
          >
            Delete Link
          </Button>
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => setModalVisible(false)}>Cancel</Button>
          <Button 
            mode="contained"
            onPress={handleUpdatePermissions}
          >
            Save Changes
          </Button>
        </Card.Actions>
      </Card>
    );
  };
  
  // Render export modal
  const renderExportModal = () => {
    return (
      <Card>
        <Card.Title title="Export Plans" />
        <Card.Content>
          <Text style={styles.sectionTitle}>Export Format</Text>
          <RadioButton.Group
            value={exportFormat}
            onValueChange={setExportFormat}
          >
            <View style={styles.radioRow}>
              <RadioButton.Item
                label="PDF Document"
                value="pdf"
              />
            </View>
            <View style={styles.radioRow}>
              <RadioButton.Item
                label="Aid Station Cards (PDF)"
                value="cards"
              />
            </View>
          </RadioButton.Group>
          
          <Divider style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Detail Level</Text>
          <RadioButton.Group
            value={exportDetailLevel}
            onValueChange={setExportDetailLevel}
          >
            <View style={styles.radioRow}>
              <RadioButton.Item
                label="Full Details"
                value="full"
              />
            </View>
            <View style={styles.radioRow}>
              <RadioButton.Item
                label="Summary"
                value="summary"
              />
            </View>
            <View style={styles.radioRow}>
              <RadioButton.Item
                label="Crew View"
                value="crew"
              />
            </View>
          </RadioButton.Group>
          
          <Divider style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Include Content</Text>
          <View style={styles.contentOptions}>
            <Chip
              selected={exportContent.includes('nutrition')}
              onPress={() => toggleExportContent('nutrition')}
              style={styles.contentChip}
              icon="food-apple"
            >
              Nutrition
            </Chip>
            <Chip
              selected={exportContent.includes('hydration')}
              onPress={() => toggleExportContent('hydration')}
              style={styles.contentChip}
              icon="water"
            >
              Hydration
            </Chip>
            <Chip
              selected={exportContent.includes('aid_stations')}
              onPress={() => toggleExportContent('aid_stations')}
              style={styles.contentChip}
              icon="tent"
            >
              Aid Stations
            </Chip>
          </View>
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => setModalVisible(false)}>Cancel</Button>
          <Button 
            mode="contained"
            onPress={handleExport}
            disabled={exportContent.length === 0}
          >
            Export
          </Button>
        </Card.Actions>
      </Card>
    );
  };
  
  return (
    <View style={styles.container}>
      {renderPlanSelection()}
      {renderShareOptions()}
      {renderSharedLinks()}
      
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          {modalType === 'create' && renderCreateShareModal()}
          {modalType === 'permissions' && renderPermissionsModal()}
          {modalType === 'export' && renderExportModal()}
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
  },
  card: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  planList: {
    maxHeight: 150,
  },
  planItem: {
    marginBottom: 4,
    borderRadius: 8,
  },
  divider: {
    marginVertical: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 16,
  },
  shareToggle: {
    marginBottom: 16,
  },
  shareButton: {
    marginBottom: 8,
  },
  linkActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkItem: {
    marginBottom: 4,
  },
  modalContainer: {
    padding: 16,
    margin: 16,
  },
  input: {
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  privacyNote: {
    fontStyle: 'italic',
    opacity: 0.7,
    marginBottom: 16,
  },
  deleteButton: {
    marginTop: 8,
  },
  radioRow: {
    marginBottom: 4,
  },
  contentOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  contentChip: {
    marginRight: 8,
    marginBottom: 8,
  },
});

export default SharingSystem;