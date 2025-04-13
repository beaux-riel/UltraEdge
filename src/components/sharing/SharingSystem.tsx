import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Share, Alert, Platform } from 'react-native';
import { 
  Text, 
  Card, 
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
import { NutritionPlan, HydrationPlan } from '../../context/NutritionHydrationContext';

interface Race {
  id: string;
  name: string;
  date: string;
  distance: number;
  distanceUnit: string;
  aidStations?: Array<{
    id: string;
    name: string;
    distance: number;
    cutoff?: string;
    dropBags?: boolean;
    crew?: boolean;
  }>;
}

interface SharingSystemProps {
  race: Race | null;
  nutritionPlans: NutritionPlan[];
  hydrationPlans: HydrationPlan[];
}

interface ShareLink {
  id: string;
  url: string;
  type: 'nutrition' | 'hydration' | 'race';
  planId?: string;
  raceId?: string;
  expiresAt?: string;
  accessCount: number;
  maxAccess?: number;
  createdAt: string;
}

/**
 * Component for sharing nutrition and hydration plans with crew and pacers
 */
const SharingSystem: React.FC<SharingSystemProps> = ({ 
  race, 
  nutritionPlans, 
  hydrationPlans 
}) => {
  const { theme, isDarkMode } = useAppTheme();
  
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([
    {
      id: '1',
      url: 'https://ultraedge.app/share/abc123',
      type: 'nutrition',
      planId: nutritionPlans[0]?.id,
      accessCount: 5,
      maxAccess: 10,
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      url: 'https://ultraedge.app/share/def456',
      type: 'hydration',
      planId: hydrationPlans[0]?.id,
      accessCount: 2,
      createdAt: new Date().toISOString()
    }
  ]);
  
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareType, setShareType] = useState<'nutrition' | 'hydration' | 'race'>('nutrition');
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>(undefined);
  const [limitAccess, setLimitAccess] = useState(false);
  const [maxAccess, setMaxAccess] = useState('10');
  const [expiryDate, setExpiryDate] = useState('');
  
  // Handle creating a share link
  const handleCreateShareLink = () => {
    // Validate inputs
    if (shareType !== 'race' && !selectedPlanId) {
      Alert.alert('Error', 'Please select a plan to share');
      return;
    }
    
    if (shareType === 'race' && !race) {
      Alert.alert('Error', 'No race selected');
      return;
    }
    
    // Create new share link
    const newLink: ShareLink = {
      id: Date.now().toString(),
      url: `https://ultraedge.app/share/${Math.random().toString(36).substring(2, 8)}`,
      type: shareType,
      planId: shareType !== 'race' ? selectedPlanId : undefined,
      raceId: shareType === 'race' ? race?.id : undefined,
      accessCount: 0,
      maxAccess: limitAccess ? parseInt(maxAccess, 10) : undefined,
      expiresAt: expiryDate ? new Date(expiryDate).toISOString() : undefined,
      createdAt: new Date().toISOString()
    };
    
    setShareLinks([...shareLinks, newLink]);
    setShareModalVisible(false);
    
    // Reset form
    setShareType('nutrition');
    setSelectedPlanId(undefined);
    setLimitAccess(false);
    setMaxAccess('10');
    setExpiryDate('');
    
    Alert.alert('Success', 'Share link created successfully');
  };
  
  // Handle sharing a link
  const handleShareLink = async (url: string) => {
    try {
      await Share.share({
        message: `Check out my UltraEdge plan: ${url}`,
        url
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share link');
    }
  };
  
  // Handle copying a link
  const handleCopyLink = (url: string) => {
    Alert.alert('Success', 'Link copied to clipboard');
  };
  
  // Handle deleting a share link
  const handleDeleteShareLink = (shareId: string) => {
    Alert.alert(
      'Delete Share Link',
      'Are you sure you want to delete this share link?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setShareLinks(shareLinks.filter(link => link.id !== shareId));
          }
        }
      ]
    );
  };
  
  // Render share link creation modal
  const renderShareModal = () => (
    <Portal>
      <Modal
        visible={shareModalVisible}
        onDismiss={() => setShareModalVisible(false)}
        contentContainerStyle={[
          styles.modalContainer,
          { backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff' }
        ]}
      >
        <Text style={[styles.modalTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
          Create Share Link
        </Text>
        
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
          Share Type
        </Text>
        
        <SegmentedButtons
          value={shareType}
          onValueChange={(value) => setShareType(value as 'nutrition' | 'hydration' | 'race')}
          buttons={[
            { value: 'nutrition', label: 'Nutrition' },
            { value: 'hydration', label: 'Hydration' },
            { value: 'race', label: 'Race Plan' }
          ]}
          style={styles.segmentedButtons}
        />
        
        {shareType !== 'race' && (
          <>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
              Select Plan
            </Text>
            
            <RadioButton.Group
              onValueChange={setSelectedPlanId}
              value={selectedPlanId || ''}
            >
              {(shareType === 'nutrition' ? nutritionPlans : hydrationPlans).map((plan) => (
                <RadioButton.Item
                  key={plan.id}
                  label={plan.name}
                  value={plan.id}
                  style={styles.radioItem}
                  labelStyle={{ color: isDarkMode ? '#ffffff' : '#000000' }}
                />
              ))}
            </RadioButton.Group>
          </>
        )}
        
        <Divider style={styles.divider} />
        
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
          Access Limits
        </Text>
        
        <View style={styles.switchContainer}>
          <Text style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>
            Limit number of accesses
          </Text>
          <Switch
            value={limitAccess}
            onValueChange={setLimitAccess}
          />
        </View>
        
        {limitAccess && (
          <TextInput
            label="Maximum accesses"
            value={maxAccess}
            onChangeText={setMaxAccess}
            keyboardType="number-pad"
            style={styles.textInput}
          />
        )}
        
        <View style={styles.modalButtons}>
          <Button
            mode="outlined"
            onPress={() => setShareModalVisible(false)}
            style={styles.modalButton}
          >
            Cancel
          </Button>
          
          <Button
            mode="contained"
            onPress={handleCreateShareLink}
            style={styles.modalButton}
          >
            Create Link
          </Button>
        </View>
      </Modal>
    </Portal>
  );
  
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Share Plans" />
        <Card.Content>
          <Text style={[styles.description, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
            Create and manage share links for your nutrition and hydration plans. Share these links with your crew, pacers, or coaches.
          </Text>
          
          <Button
            mode="contained"
            onPress={() => setShareModalVisible(true)}
            style={styles.createButton}
            icon="link-plus"
          >
            Create Share Link
          </Button>
        </Card.Content>
      </Card>
      
      <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
        Active Share Links
      </Text>
      
      {shareLinks.length === 0 ? (
        <Text style={{ color: isDarkMode ? '#cccccc' : '#666666', padding: 16 }}>
          No share links created yet
        </Text>
      ) : (
        shareLinks.map(link => {
          // Get plan name if applicable
          let planName = '';
          if (link.type === 'nutrition' && link.planId) {
            const plan = nutritionPlans.find(p => p.id === link.planId);
            planName = plan?.name || '';
          } else if (link.type === 'hydration' && link.planId) {
            const plan = hydrationPlans.find(p => p.id === link.planId);
            planName = plan?.name || '';
          } else if (link.type === 'race' && race) {
            planName = race.name;
          }
          
          return (
            <Card key={link.id} style={styles.linkCard}>
              <Card.Content>
                <View style={styles.linkHeader}>
                  <Chip
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor: link.type === 'nutrition'
                          ? theme.colors.primary
                          : link.type === 'hydration'
                            ? theme.colors.blue
                            : theme.colors.secondary
                      }
                    ]}
                    textStyle={{ color: '#ffffff' }}
                  >
                    {link.type === 'nutrition' ? 'Nutrition' : link.type === 'hydration' ? 'Hydration' : 'Race Plan'}
                  </Chip>
                  
                  <IconButton
                    icon="delete"
                    size={20}
                    onPress={() => handleDeleteShareLink(link.id)}
                  />
                </View>
                
                <Text style={[styles.planName, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                  {planName}
                </Text>
                
                <Text style={[styles.linkUrl, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                  {link.url}
                </Text>
                
                <View style={styles.linkStats}>
                  <Text style={{ color: isDarkMode ? '#cccccc' : '#666666' }}>
                    Accessed: {link.accessCount} {link.maxAccess ? `/ ${link.maxAccess}` : 'times'}
                  </Text>
                  
                  {link.expiresAt && (
                    <Text style={{ color: isDarkMode ? '#cccccc' : '#666666' }}>
                      Expires: {new Date(link.expiresAt).toLocaleDateString()}
                    </Text>
                  )}
                </View>
                
                <View style={styles.linkActions}>
                  <Button
                    mode="outlined"
                    onPress={() => handleCopyLink(link.url)}
                    icon="content-copy"
                    style={styles.linkButton}
                  >
                    Copy
                  </Button>
                  
                  <Button
                    mode="contained"
                    onPress={() => handleShareLink(link.url)}
                    icon="share-variant"
                    style={styles.linkButton}
                  >
                    Share
                  </Button>
                </View>
              </Card.Content>
            </Card>
          );
        })
      )}
      
      {renderShareModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  description: {
    marginBottom: 16,
  },
  createButton: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
  },
  linkCard: {
    marginBottom: 16,
  },
  linkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeChip: {
    alignSelf: 'flex-start',
  },
  planName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  linkUrl: {
    marginBottom: 8,
  },
  linkStats: {
    marginBottom: 16,
  },
  linkActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  linkButton: {
    marginLeft: 8,
  },
  modalContainer: {
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  radioItem: {
    marginVertical: 4,
  },
  divider: {
    marginVertical: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  textInput: {
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalButton: {
    marginLeft: 8,
  },
});

export default SharingSystem;