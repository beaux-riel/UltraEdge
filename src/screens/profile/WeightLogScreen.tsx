/**
 * UltraEdge Weight Log Screen
 * Log new weight entries and view complete weight history
 */

import React, { useState, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../theme';
import {
  Text,
  H1,
  H2,
  H3,
  Body,
  BodySmall,
  Caption,
  Label,
  Button,
  Card,
  CardContent,
} from '../../components/ui';
import { useMover, WeightEntry } from '../../context/MoverContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// WEIGHT INPUT COMPONENT
// ============================================================================

interface WeightInputProps {
  value: string;
  onChange: (value: string) => void;
  unit: string;
  colors: any;
  typography: any;
  radius: any;
}

function WeightInput({ value, onChange, unit, colors, typography, radius }: WeightInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <View
      style={[
        styles.weightInputContainer,
        {
          backgroundColor: colors.surface,
          borderColor: isFocused ? colors.forest : colors.border,
          borderRadius: radius.md,
        },
      ]}
    >
      <TextInput
        style={[
          styles.weightInput,
          {
            color: colors.bark,
            fontFamily: typography.display.fontFamily,
            fontSize: 48,
          },
        ]}
        value={value}
        onChangeText={(text) => {
          // Only allow numbers and one decimal point
          const filtered = text.replace(/[^0-9.]/g, '');
          const parts = filtered.split('.');
          if (parts.length > 2) return;
          if (parts[1] && parts[1].length > 1) return;
          onChange(filtered);
        }}
        placeholder="0.0"
        placeholderTextColor={colors.mist}
        keyboardType="decimal-pad"
        maxLength={6}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        textAlign="center"
      />
      <Text
        style={[
          styles.weightInputUnit,
          {
            color: colors.stone,
            fontFamily: typography.h2.fontFamily,
          },
        ]}
      >
        {unit}
      </Text>
    </View>
  );
}

// ============================================================================
// HISTORY ITEM COMPONENT
// ============================================================================

interface HistoryItemProps {
  entry: WeightEntry;
  previousWeight: number | null;
  onDelete: () => void;
  colors: any;
  isFirst: boolean;
}

function HistoryItem({ entry, previousWeight, onDelete, colors, isFirst }: HistoryItemProps) {
  // Calculate change from previous entry
  const change = previousWeight ? entry.weight - previousWeight : null;
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    
    if (diffDays === 0) return `Today at ${timeStr}`;
    if (diffDays === 1) return `Yesterday at ${timeStr}`;
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }) + ` at ${timeStr}`;
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Entry',
      `Are you sure you want to delete this weight entry (${entry.weight} ${entry.weight_unit})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  return (
    <View style={styles.historyItem}>
      <View style={styles.historyMain}>
        <View style={styles.historyWeight}>
          <H3>{entry.weight.toFixed(1)}</H3>
          <BodySmall color="secondary" style={{ marginLeft: 4 }}>
            {entry.weight_unit}
          </BodySmall>
          
          {/* Change indicator */}
          {change !== null && Math.abs(change) >= 0.1 && (
            <View
              style={[
                styles.changeBadge,
                { backgroundColor: change > 0 ? `${colors.sunset}15` : `${colors.meadow}15` },
              ]}
            >
              <Ionicons
                name={change > 0 ? 'arrow-up' : 'arrow-down'}
                size={10}
                color={change > 0 ? colors.sunset : colors.meadow}
              />
              <Text
                style={[
                  styles.changeText,
                  { color: change > 0 ? colors.sunset : colors.meadow },
                ]}
              >
                {Math.abs(change).toFixed(1)}
              </Text>
            </View>
          )}
        </View>
        
        <BodySmall color="tertiary">{formatDate(entry.recorded_at)}</BodySmall>
        
        {entry.notes && (
          <BodySmall color="secondary" style={{ marginTop: 4 }}>
            "{entry.notes}"
          </BodySmall>
        )}
      </View>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDelete}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="trash-outline" size={18} color={colors.clay} />
      </TouchableOpacity>
    </View>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function WeightLogScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { colors, spacing, radius, typography } = theme;
  const insets = useSafeAreaInsets();
  
  const { profile, weightHistory, logWeight, deleteWeightEntry } = useMover();
  
  // Form state
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [isLogging, setIsLogging] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  
  // Animation for success
  const successAnim = useRef(new Animated.Value(0)).current;

  // Handle log weight
  const handleLogWeight = async () => {
    const weightNum = parseFloat(weight);
    
    if (isNaN(weightNum) || weightNum <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight greater than 0.');
      return;
    }
    
    if (weightNum > 1000) {
      Alert.alert('Invalid Weight', 'Please enter a weight less than 1000.');
      return;
    }
    
    setIsLogging(true);
    try {
      await logWeight(weightNum, notes.trim() || undefined);
      
      // Success animation
      Animated.sequence([
        Animated.timing(successAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
        Animated.timing(successAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Reset form
      setWeight('');
      setNotes('');
    } catch (error) {
      console.error('Error logging weight:', error);
      Alert.alert('Error', 'Failed to log weight. Please try again.');
    } finally {
      setIsLogging(false);
    }
  };

  // Group history by date
  const groupedHistory = weightHistory.reduce((groups, entry) => {
    const date = new Date(entry.recorded_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(entry);
    return groups;
  }, {} as Record<string, WeightEntry[]>);

  const sortedDates = Object.keys(groupedHistory);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { backgroundColor: colors.parchment }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + spacing.sm,
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.forest} />
            <Text style={{ color: colors.forest, marginLeft: 4 }}>Profile</Text>
          </TouchableOpacity>
          
          <H2>Weight Log</H2>
          
          <View style={styles.headerButton} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Log Weight Section */}
          <View style={styles.logSection}>
            <Card variant="elevated">
              <CardContent>
                <View style={styles.logHeader}>
                  <View style={[styles.logIcon, { backgroundColor: `${colors.forest}15` }]}>
                    <Ionicons name="scale" size={24} color={colors.forest} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <H3>Log Your Weight</H3>
                    <BodySmall color="secondary">Track your progress</BodySmall>
                  </View>
                </View>
                
                {/* Weight Input */}
                <WeightInput
                  value={weight}
                  onChange={setWeight}
                  unit={profile.weight_unit}
                  colors={colors}
                  typography={typography}
                  radius={radius}
                />
                
                {/* Notes Input */}
                <View style={{ marginTop: spacing.md }}>
                  <Label style={{ marginBottom: 8 }}>NOTES (OPTIONAL)</Label>
                  <TextInput
                    style={[
                      styles.notesInput,
                      {
                        backgroundColor: colors.birch,
                        borderRadius: radius.sm,
                        color: colors.bark,
                        fontFamily: typography.body.fontFamily,
                        fontSize: typography.body.fontSize,
                      },
                    ]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Morning weigh-in, post-run, etc."
                    placeholderTextColor={colors.mist}
                    multiline
                    numberOfLines={2}
                    maxLength={100}
                  />
                </View>
                
                {/* Log Button */}
                <Button
                  onPress={handleLogWeight}
                  loading={isLogging}
                  disabled={!weight || isLogging}
                  fullWidth
                  style={{ marginTop: spacing.md }}
                >
                  Log Weight
                </Button>
                
                {/* Success Indicator */}
                <Animated.View
                  style={[
                    styles.successIndicator,
                    {
                      backgroundColor: colors.meadow,
                      opacity: successAnim,
                      transform: [
                        {
                          scale: successAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                  pointerEvents="none"
                >
                  <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                  <Text style={styles.successText}>Logged!</Text>
                </Animated.View>
              </CardContent>
            </Card>
          </View>

          {/* Quick Stats */}
          {weightHistory.length > 0 && (
            <View style={styles.statsSection}>
              <View style={styles.statsRow}>
                <Card style={styles.statCard}>
                  <CardContent>
                    <Caption>HIGHEST</Caption>
                    <H3>
                      {Math.max(...weightHistory.map(e => e.weight)).toFixed(1)}
                    </H3>
                    <BodySmall color="secondary">{profile.weight_unit}</BodySmall>
                  </CardContent>
                </Card>
                
                <Card style={styles.statCard}>
                  <CardContent>
                    <Caption>LOWEST</Caption>
                    <H3>
                      {Math.min(...weightHistory.map(e => e.weight)).toFixed(1)}
                    </H3>
                    <BodySmall color="secondary">{profile.weight_unit}</BodySmall>
                  </CardContent>
                </Card>
                
                <Card style={styles.statCard}>
                  <CardContent>
                    <Caption>ENTRIES</Caption>
                    <H3>{weightHistory.length}</H3>
                    <BodySmall color="secondary">total</BodySmall>
                  </CardContent>
                </Card>
              </View>
            </View>
          )}

          {/* History Section */}
          <View style={styles.historySection}>
            <TouchableOpacity
              style={styles.historyHeader}
              onPress={() => setShowHistory(!showHistory)}
            >
              <H2>Weight History</H2>
              <Ionicons
                name={showHistory ? 'chevron-up' : 'chevron-down'}
                size={24}
                color={colors.stone}
              />
            </TouchableOpacity>
            
            {showHistory && (
              <>
                {weightHistory.length === 0 ? (
                  <Card>
                    <CardContent>
                      <View style={styles.emptyHistory}>
                        <Ionicons name="analytics-outline" size={48} color={colors.mist} />
                        <Body color="secondary" align="center" style={{ marginTop: spacing.sm }}>
                          No weight entries yet.{'\n'}Log your first weigh-in above!
                        </Body>
                      </View>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent>
                      {sortedDates.map((date, dateIndex) => (
                        <View key={date}>
                          {dateIndex > 0 && (
                            <View
                              style={[
                                styles.dateDivider,
                                { backgroundColor: colors.border },
                              ]}
                            />
                          )}
                          <Caption style={{ marginBottom: spacing.sm, marginTop: dateIndex > 0 ? spacing.md : 0 }}>
                            {date.toUpperCase()}
                          </Caption>
                          
                          {groupedHistory[date].map((entry, entryIndex) => {
                            // Find previous entry (next in array since newest first)
                            const allIndex = weightHistory.findIndex(e => e.id === entry.id);
                            const previousWeight = allIndex < weightHistory.length - 1 
                              ? weightHistory[allIndex + 1].weight 
                              : null;
                            
                            return (
                              <View key={entry.id}>
                                {entryIndex > 0 && (
                                  <View
                                    style={[
                                      styles.entryDivider,
                                      { backgroundColor: colors.borderLight },
                                    ]}
                                  />
                                )}
                                <HistoryItem
                                  entry={entry}
                                  previousWeight={previousWeight}
                                  onDelete={() => deleteWeightEntry(entry.id)}
                                  colors={colors}
                                  isFirst={allIndex === 0}
                                />
                              </View>
                            );
                          })}
                        </View>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  logSection: {
    marginBottom: 24,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  weightInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderWidth: 2,
  },
  weightInput: {
    minWidth: 120,
    textAlign: 'center',
    fontWeight: '700',
  },
  weightInputUnit: {
    fontSize: 24,
    marginLeft: 8,
    fontWeight: '600',
  },
  notesInput: {
    padding: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  successIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -60,
    marginTop: -24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  successText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  statsSection: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  historySection: {
    marginBottom: 24,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  dateDivider: {
    height: 1,
    marginVertical: 8,
  },
  entryDivider: {
    height: 1,
    marginVertical: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  historyMain: {
    flex: 1,
  },
  historyWeight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  changeText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 2,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
});
