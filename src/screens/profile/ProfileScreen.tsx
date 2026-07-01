/**
 * UltraEdge Profile Screen
 * View profile with name, current weight, weight history chart, and preferences
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
  Button,
  Card,
  CardContent,
} from '../../components/ui';
import { useMover, WeightEntry } from '../../context/MoverContext';
import { useAuth } from '../../context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_HEIGHT = 160;
const CHART_PADDING = 20;

// ============================================================================
// WEIGHT CHART COMPONENT
// ============================================================================

interface WeightChartProps {
  data: WeightEntry[];
  colors: any;
  unit: string;
}

function WeightChart({ data, colors, unit }: WeightChartProps) {
  const chartWidth = SCREEN_WIDTH - 40 - CHART_PADDING * 2;
  
  const chartData = useMemo(() => {
    if (data.length === 0) return null;
    
    const weights = data.map(d => d.weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const range = maxWeight - minWeight || 1;
    
    // Normalize points to chart coordinates
    const points = data.map((entry, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * chartWidth;
      const y = CHART_HEIGHT - ((entry.weight - minWeight) / range) * (CHART_HEIGHT - 40);
      return { x, y, weight: entry.weight, date: entry.recorded_at };
    });
    
    return { points, minWeight, maxWeight };
  }, [data, chartWidth]);

  if (!chartData || data.length === 0) {
    return (
      <View style={[styles.chartEmpty, { height: CHART_HEIGHT }]}>
        <Ionicons name="analytics-outline" size={48} color={colors.mist} />
        <BodySmall color="tertiary" align="center" style={{ marginTop: 8 }}>
          No weight data yet.{'\n'}Log your weight to see trends!
        </BodySmall>
      </View>
    );
  }

  return (
    <View style={[styles.chart, { height: CHART_HEIGHT }]}>
      {/* Y-axis labels */}
      <View style={styles.yAxis}>
        <Caption>{chartData.maxWeight.toFixed(1)}</Caption>
        <Caption>{chartData.minWeight.toFixed(1)}</Caption>
      </View>
      
      {/* Chart area */}
      <View style={[styles.chartArea, { width: chartWidth }]}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map(ratio => (
          <View 
            key={ratio}
            style={[
              styles.gridLine, 
              { 
                top: ratio * (CHART_HEIGHT - 40) + 10,
                backgroundColor: colors.border,
              }
            ]} 
          />
        ))}
        
        {/* Line chart (simplified - visual representation) */}
        <View style={styles.lineContainer}>
          {chartData.points.map((point, index) => {
            if (index === 0) return null;
            const prevPoint = chartData.points[index - 1];
            const dx = point.x - prevPoint.x;
            const dy = point.y - prevPoint.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            
            return (
              <View
                key={index}
                style={[
                  styles.lineSegment,
                  {
                    left: prevPoint.x,
                    top: prevPoint.y,
                    width: length,
                    backgroundColor: colors.forest,
                    transform: [{ rotate: `${angle}deg` }],
                  },
                ]}
              />
            );
          })}
          
          {/* Data points */}
          {chartData.points.map((point, index) => (
            <View
              key={index}
              style={[
                styles.dataPoint,
                {
                  left: point.x - 4,
                  top: point.y - 4,
                  backgroundColor: colors.forest,
                  borderColor: colors.surface,
                },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ProfileScreen({ navigation }: any) {
  const { theme, isDarkMode } = useTheme();
  const { colors, spacing, radius, typography } = theme;
  const insets = useSafeAreaInsets();
  
  const { profile, weightHistory, getWeightTrend, getWeightHistory30Days } = useMover();
  const { user, isAuthenticated, signOut, supabase, isLoading: authLoading } = useAuth();
  const [deletingAccount, setDeletingAccount] = useState(false);

  const trend = getWeightTrend();
  const chartData = getWeightHistory30Days();

  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
  };

  // Handle account deletion (App Store Guideline 5.1.1(v))
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account?',
      'This permanently deletes your account and all synced data (events, gear, crew, checkpoints, subscriptions). This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'All of your cloud data will be erased immediately.',
              [
                { text: 'Keep My Account', style: 'cancel' },
                {
                  text: 'Delete Everything',
                  style: 'destructive',
                  onPress: async () => {
                    if (!supabase) return;
                    setDeletingAccount(true);
                    try {
                      const { error } = await supabase.rpc('delete_my_account');
                      if (error) throw error;
                      await signOut();
                      Alert.alert('Account Deleted', 'Your account and all synced data have been removed.');
                    } catch (e) {
                      Alert.alert('Deletion Failed', 'Could not delete your account. Please try again or contact support@ultraedge.app.');
                    } finally {
                      setDeletingAccount(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };
  
  // Format date for last updated
  const formatLastUpdated = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get trend color and icon
  const getTrendInfo = () => {
    if (!trend) return { icon: 'remove-outline', color: colors.stone, label: 'No trend data' };
    
    switch (trend.direction) {
      case 'up':
        return { 
          icon: 'trending-up', 
          color: colors.sunset, 
          label: `+${trend.change.toFixed(1)} ${profile.weight_unit}` 
        };
      case 'down':
        return { 
          icon: 'trending-down', 
          color: colors.meadow, 
          label: `-${trend.change.toFixed(1)} ${profile.weight_unit}` 
        };
      default:
        return { 
          icon: 'remove-outline', 
          color: colors.stone, 
          label: 'Stable' 
        };
    }
  };
  
  const trendInfo = getTrendInfo();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.parchment }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient
        colors={isDarkMode 
          ? [colors.forest, colors.parchment] 
          : [colors.forest, '#4A8B5C', colors.parchment]
        }
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Caption style={{ color: 'rgba(255,255,255,0.7)' }}>PROFILE</Caption>
            <H1 style={{ color: '#FFFFFF' }}>{profile.display_name}</H1>
          </View>
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <View style={[styles.content, { marginTop: -spacing.xl }]}>
        
        {/* Current Weight Card */}
        <Card variant="elevated" style={styles.weightCard}>
          <CardContent>
            <View style={styles.weightHeader}>
              <View>
                <Caption>CURRENT WEIGHT</Caption>
                <View style={styles.weightDisplay}>
                  {profile.current_weight !== null ? (
                    <>
                      <Text 
                        style={[
                          styles.weightNumber,
                          { 
                            fontFamily: typography.display.fontFamily,
                            color: colors.bark,
                          }
                        ]}
                      >
                        {profile.current_weight.toFixed(1)}
                      </Text>
                      <Text style={[styles.weightUnit, { color: colors.stone }]}>
                        {profile.weight_unit}
                      </Text>
                    </>
                  ) : (
                    <Text style={[styles.weightNumber, { color: colors.mist }]}>
                      --.-
                    </Text>
                  )}
                </View>
                <BodySmall color="tertiary">
                  Updated {formatLastUpdated(profile.weight_updated_at)}
                </BodySmall>
              </View>
              
              {/* Trend Indicator */}
              <View style={[styles.trendBadge, { backgroundColor: `${trendInfo.color}15` }]}>
                <Ionicons name={trendInfo.icon as any} size={28} color={trendInfo.color} />
                <BodySmall style={{ color: trendInfo.color, marginTop: 4 }}>
                  {trendInfo.label}
                </BodySmall>
              </View>
            </View>
            
            <Button
              onPress={() => navigation.navigate('WeightLog')}
              fullWidth
              style={{ marginTop: spacing.md }}
            >
              Log Weight
            </Button>
          </CardContent>
        </Card>

        {/* Weight History Chart */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <H2>Weight Trend</H2>
            <Button
              variant="tertiary"
              size="sm"
              onPress={() => navigation.navigate('WeightLog')}
            >
              View History
            </Button>
          </View>
          
          <Card style={styles.chartCard}>
            <CardContent>
              <Caption style={{ marginBottom: spacing.sm }}>LAST 30 DAYS</Caption>
              <WeightChart data={chartData} colors={colors} unit={profile.weight_unit} />
            </CardContent>
          </Card>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <H2 style={{ marginBottom: spacing.md }}>Preferences</H2>
          
          <Card>
            <TouchableOpacity
              style={styles.preferenceRow}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <View style={[styles.preferenceIcon, { backgroundColor: `${colors.forest}15` }]}>
                <Ionicons name="scale-outline" size={20} color={colors.forest} />
              </View>
              <View style={{ flex: 1 }}>
                <Body>Weight Unit</Body>
                <BodySmall color="secondary">{profile.weight_unit}</BodySmall>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.mist} />
            </TouchableOpacity>
            
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            
            <TouchableOpacity
              style={styles.preferenceRow}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <View style={[styles.preferenceIcon, { backgroundColor: `${colors.trail}15` }]}>
                <Ionicons name="navigate-outline" size={20} color={colors.trail} />
              </View>
              <View style={{ flex: 1 }}>
                <Body>Distance Unit</Body>
                <BodySmall color="secondary">{profile.distance_unit}</BodySmall>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.mist} />
            </TouchableOpacity>
            
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            
            <TouchableOpacity
              style={styles.preferenceRow}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <View style={[styles.preferenceIcon, { backgroundColor: `${colors.sunrise}15` }]}>
                <Ionicons name="trending-up-outline" size={20} color={colors.sunrise} />
              </View>
              <View style={{ flex: 1 }}>
                <Body>Elevation Unit</Body>
                <BodySmall color="secondary">{profile.elevation_unit}</BodySmall>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.mist} />
            </TouchableOpacity>
          </Card>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <H2 style={{ marginBottom: spacing.md }}>Account</H2>
          
          <Card>
            {isAuthenticated && user ? (
              <>
                {/* Signed In State */}
                <View style={styles.preferenceRow}>
                  <View style={[styles.preferenceIcon, { backgroundColor: `${colors.meadow}15` }]}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.meadow} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Body>Signed In</Body>
                    <BodySmall color="secondary" numberOfLines={1}>
                      {user.email}
                    </BodySmall>
                  </View>
                </View>
                
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                
                <TouchableOpacity
                  style={styles.preferenceRow}
                  onPress={() => navigation.navigate('Subscription')}
                >
                  <View style={[styles.preferenceIcon, { backgroundColor: `${colors.forest}15` }]}>
                    <Ionicons name="star" size={20} color={colors.forest} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Body>Subscription</Body>
                    <BodySmall color="secondary">
                      Manage your premium features
                    </BodySmall>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.mist} />
                </TouchableOpacity>
                
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                
                <TouchableOpacity
                  style={styles.preferenceRow}
                  onPress={handleSignOut}
                  disabled={authLoading}
                >
                  <View style={[styles.preferenceIcon, { backgroundColor: `${colors.clay}15` }]}>
                    <Ionicons name="log-out-outline" size={20} color={colors.clay} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Body style={{ color: colors.clay }}>Sign Out</Body>
                    <BodySmall color="tertiary">
                      Your local data will remain on this device
                    </BodySmall>
                  </View>
                </TouchableOpacity>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <TouchableOpacity
                  style={styles.preferenceRow}
                  onPress={handleDeleteAccount}
                  disabled={deletingAccount || authLoading}
                >
                  <View style={[styles.preferenceIcon, { backgroundColor: `${colors.clay}15` }]}>
                    <Ionicons name="trash-outline" size={20} color={colors.clay} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Body style={{ color: colors.clay }}>
                      {deletingAccount ? 'Deleting Account…' : 'Delete Account'}
                    </Body>
                    <BodySmall color="tertiary">
                      Permanently remove your account and synced data
                    </BodySmall>
                  </View>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Signed Out State */}
                <View style={[styles.accountPromo, { padding: spacing.lg }]}>
                  <View style={[styles.accountPromoIcon, { backgroundColor: `${colors.forest}15` }]}>
                    <Ionicons name="cloud-outline" size={32} color={colors.forest} />
                  </View>
                  <H3 style={{ marginTop: spacing.md, textAlign: 'center' }}>
                    Sync Across Devices
                  </H3>
                  <BodySmall color="secondary" align="center" style={{ marginTop: spacing.xs }}>
                    Sign in to backup your race plans and access them anywhere
                  </BodySmall>
                  <Button
                    onPress={() => navigation.navigate('SignIn')}
                    fullWidth
                    style={{ marginTop: spacing.lg }}
                  >
                    Sign In
                  </Button>
                  <TouchableOpacity
                    style={{ marginTop: spacing.md, padding: spacing.xs }}
                    onPress={() => navigation.navigate('SignUp')}
                  >
                    <BodySmall color="secondary" align="center">
                      Don't have an account? <BodySmall style={{ color: colors.forest }}>Sign Up</BodySmall>
                    </BodySmall>
                  </TouchableOpacity>
                </View>
                
                <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: spacing.sm }]} />
                
                <TouchableOpacity
                  style={styles.preferenceRow}
                  onPress={() => navigation.navigate('Subscription')}
                >
                  <View style={[styles.preferenceIcon, { backgroundColor: `${colors.sunrise}15` }]}>
                    <Ionicons name="star" size={20} color={colors.sunrise} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Body>Go Premium</Body>
                    <BodySmall color="secondary">
                      Cloud sync, crew features & more
                    </BodySmall>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.mist} />
                </TouchableOpacity>
              </>
            )}
          </Card>
        </View>

        {/* Recent Weigh-ins */}
        {weightHistory.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <H2>Recent Weigh-ins</H2>
              <Caption>{weightHistory.length} total</Caption>
            </View>
            
            <Card>
              <CardContent>
                {weightHistory.slice(0, 5).map((entry, index) => (
                  <React.Fragment key={entry.id}>
                    {index > 0 && (
                      <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: spacing.sm }]} />
                    )}
                    <View style={styles.historyRow}>
                      <View>
                        <Body>
                          {entry.weight.toFixed(1)} {entry.weight_unit}
                        </Body>
                        <BodySmall color="tertiary">
                          {new Date(entry.recorded_at).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </BodySmall>
                      </View>
                      {entry.notes && (
                        <BodySmall color="secondary" style={{ flex: 1, textAlign: 'right' }}>
                          {entry.notes}
                        </BodySmall>
                      )}
                    </View>
                  </React.Fragment>
                ))}
              </CardContent>
            </Card>
          </View>
        )}
      </View>
    </ScrollView>
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
    paddingHorizontal: 20,
    paddingBottom: 48,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
  },
  weightCard: {
    marginBottom: 24,
  },
  weightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  weightDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 8,
  },
  weightNumber: {
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 52,
    letterSpacing: -1,
  },
  weightUnit: {
    fontSize: 20,
    marginLeft: 8,
    fontWeight: '500',
  },
  trendBadge: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 80,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartCard: {},
  chart: {
    flexDirection: 'row',
  },
  chartEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  yAxis: {
    width: 40,
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  chartArea: {
    flex: 1,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  lineContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
  lineSegment: {
    position: 'absolute',
    height: 3,
    borderRadius: 1.5,
    transformOrigin: 'left center',
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  preferenceIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountPromo: {
    alignItems: 'center',
  },
  accountPromoIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
