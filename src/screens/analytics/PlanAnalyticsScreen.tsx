import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, Card, Button, SegmentedButtons, Divider } from 'react-native-paper';
import { useAppTheme } from '../../context/ThemeContext';
import { useNutritionHydration } from '../../context/NutritionHydrationContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NutritionHydrationStackParamList } from '../../navigation/NutritionHydrationNavigator';
import MacronutrientChart from '../../components/visualization/MacronutrientChart';
import CalorieChart from '../../components/visualization/CalorieChart';
import HydrationChart from '../../components/visualization/HydrationChart';
import ElectrolyteChart from '../../components/visualization/ElectrolyteChart';
import TimelineVisualization from '../../components/visualization/TimelineVisualization';

type PlanAnalyticsScreenProps = NativeStackScreenProps<
  NutritionHydrationStackParamList,
  'PlanAnalytics'
>;

/**
 * Screen for displaying analytics for nutrition and hydration plans
 */
const PlanAnalyticsScreen: React.FC<PlanAnalyticsScreenProps> = ({ route, navigation }) => {
  const { theme, isDarkMode } = useAppTheme();
  const { planId, planType } = route.params;
  const { nutritionPlans, hydrationPlans } = useNutritionHydration();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'details'>('overview');
  
  // Get the plan data
  const plan = planType === 'nutrition' 
    ? nutritionPlans[planId] 
    : hydrationPlans[planId];
  
  if (!plan) {
    return (
      <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#f5f5f5' }]}>
        <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>
          Plan not found
        </Text>
      </View>
    );
  }
  
  // Render overview tab
  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.card}>
        <Card.Title title="Plan Summary" />
        <Card.Content>
          <Text style={[styles.planName, { color: isDarkMode ? '#fff' : '#000' }]}>
            {plan.name}
          </Text>
          {plan.description && (
            <Text style={[styles.planDescription, { color: isDarkMode ? '#ccc' : '#666' }]}>
              {plan.description}
            </Text>
          )}
          
          <View style={styles.metaContainer}>
            {plan.raceType && (
              <View style={styles.metaItem}>
                <Text style={[styles.metaLabel, { color: isDarkMode ? '#ccc' : '#666' }]}>
                  Race Type:
                </Text>
                <Text style={[styles.metaValue, { color: isDarkMode ? '#fff' : '#000' }]}>
                  {plan.raceType}
                </Text>
              </View>
            )}
            
            {plan.raceDuration && (
              <View style={styles.metaItem}>
                <Text style={[styles.metaLabel, { color: isDarkMode ? '#ccc' : '#666' }]}>
                  Duration:
                </Text>
                <Text style={[styles.metaValue, { color: isDarkMode ? '#fff' : '#000' }]}>
                  {plan.raceDuration}
                </Text>
              </View>
            )}
            
            {plan.terrainType && (
              <View style={styles.metaItem}>
                <Text style={[styles.metaLabel, { color: isDarkMode ? '#ccc' : '#666' }]}>
                  Terrain:
                </Text>
                <Text style={[styles.metaValue, { color: isDarkMode ? '#fff' : '#000' }]}>
                  {plan.terrainType}
                </Text>
              </View>
            )}
            
            {plan.weatherCondition && (
              <View style={styles.metaItem}>
                <Text style={[styles.metaLabel, { color: isDarkMode ? '#ccc' : '#666' }]}>
                  Weather:
                </Text>
                <Text style={[styles.metaValue, { color: isDarkMode ? '#fff' : '#000' }]}>
                  {plan.weatherCondition}
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
      
      {planType === 'nutrition' && (
        <>
          <MacronutrientChart entries={plan.entries} />
          <Divider style={styles.divider} />
          <CalorieChart entries={plan.entries} />
        </>
      )}
      
      {planType === 'hydration' && (
        <>
          <HydrationChart entries={plan.entries} />
          <Divider style={styles.divider} />
        </>
      )}
      
      {planType === 'nutrition' && (
        <ElectrolyteChart 
          nutritionEntries={plan.entries} 
          hydrationEntries={[]} 
        />
      )}
    </View>
  );
  
  // Render timeline tab
  const renderTimelineTab = () => (
    <View style={styles.tabContent}>
      <TimelineVisualization 
        nutritionEntries={planType === 'nutrition' ? plan.entries : []}
        hydrationEntries={planType === 'hydration' ? plan.entries : []}
        raceInfo={{
          duration: 24 * 60, // 24 hours in minutes
          distance: 100,
          distanceUnit: 'miles',
          milestones: [
            { name: 'Start', time: 0, distance: 0 },
            { name: 'Aid 1', time: 120, distance: 15 },
            { name: 'Aid 2', time: 240, distance: 30 },
            { name: 'Aid 3', time: 480, distance: 50 },
            { name: 'Aid 4', time: 720, distance: 70 },
            { name: 'Finish', time: 1440, distance: 100 }
          ]
        }}
        mode="time"
      />
      
      <View style={styles.timelineModeContainer}>
        <Button 
          mode="outlined" 
          onPress={() => {}}
          style={styles.timelineModeButton}
        >
          Time View
        </Button>
        <Button 
          mode="outlined" 
          onPress={() => {}}
          style={styles.timelineModeButton}
        >
          Distance View
        </Button>
      </View>
    </View>
  );
  
  // Render details tab
  const renderDetailsTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.card}>
        <Card.Title title="Plan Details" />
        <Card.Content>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
            {planType === 'nutrition' ? 'Nutrition Entries' : 'Hydration Entries'}
          </Text>
          
          {plan.entries.length === 0 ? (
            <Text style={{ color: isDarkMode ? '#ccc' : '#666' }}>
              No entries found
            </Text>
          ) : (
            plan.entries.map((entry, index) => (
              <View key={entry.id || index} style={styles.entryItem}>
                <Text style={[styles.entryName, { color: isDarkMode ? '#fff' : '#000' }]}>
                  {planType === 'nutrition' 
                    ? (entry as any).foodType 
                    : (entry as any).liquidType
                  }
                </Text>
                
                {planType === 'nutrition' ? (
                  <View style={styles.entryDetails}>
                    <Text style={[styles.entryDetail, { color: isDarkMode ? '#ccc' : '#666' }]}>
                      {(entry as any).calories || 0} cal
                    </Text>
                    <Text style={[styles.entryDetail, { color: isDarkMode ? '#ccc' : '#666' }]}>
                      {(entry as any).carbs || 0}g carbs
                    </Text>
                    <Text style={[styles.entryDetail, { color: isDarkMode ? '#ccc' : '#666' }]}>
                      {(entry as any).protein || 0}g protein
                    </Text>
                    <Text style={[styles.entryDetail, { color: isDarkMode ? '#ccc' : '#666' }]}>
                      {(entry as any).fat || 0}g fat
                    </Text>
                  </View>
                ) : (
                  <View style={styles.entryDetails}>
                    <Text style={[styles.entryDetail, { color: isDarkMode ? '#ccc' : '#666' }]}>
                      {(entry as any).volume || 0} {(entry as any).volumeUnit || 'ml'}
                    </Text>
                    {(entry as any).electrolytes && (
                      <Text style={[styles.entryDetail, { color: isDarkMode ? '#ccc' : '#666' }]}>
                        {(entry as any).electrolytes.sodium || 0}mg sodium
                      </Text>
                    )}
                  </View>
                )}
                
                <Text style={[styles.entryTiming, { color: isDarkMode ? '#ccc' : '#666' }]}>
                  {entry.timing || 'N/A'} • {entry.frequency || 'N/A'}
                </Text>
                
                <Divider style={styles.entryDivider} />
              </View>
            ))
          )}
        </Card.Content>
      </Card>
      
      {plan.rules && plan.rules.length > 0 && (
        <Card style={styles.card}>
          <Card.Title title="Adaptive Rules" />
          <Card.Content>
            {plan.rules.map((rule, index) => (
              <View key={rule.id || index} style={styles.ruleItem}>
                <Text style={[styles.ruleName, { color: isDarkMode ? '#fff' : '#000' }]}>
                  Rule {index + 1}
                </Text>
                <Text style={[styles.ruleCondition, { color: isDarkMode ? '#ccc' : '#666' }]}>
                  When {rule.ruleType} {rule.condition} {rule.value} {rule.unit}
                </Text>
                <Text style={[styles.ruleAction, { color: isDarkMode ? '#ccc' : '#666' }]}>
                  {rule.action} {rule.target} by {rule.amount}
                </Text>
                <Divider style={styles.ruleDivider} />
              </View>
            ))}
          </Card.Content>
        </Card>
      )}
    </View>
  );
  
  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#f5f5f5' }]}>
      <SegmentedButtons
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'overview' | 'timeline' | 'details')}
        buttons={[
          { value: 'overview', label: 'Overview' },
          { value: 'timeline', label: 'Timeline' },
          { value: 'details', label: 'Details' }
        ]}
        style={styles.tabButtons}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'timeline' && renderTimelineTab()}
        {activeTab === 'details' && renderDetailsTab()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabButtons: {
    margin: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  tabContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  planDescription: {
    marginBottom: 16,
  },
  metaContainer: {
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  metaLabel: {
    width: 100,
    fontWeight: 'bold',
  },
  metaValue: {
    flex: 1,
  },
  divider: {
    marginVertical: 16,
  },
  timelineModeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  timelineModeButton: {
    marginHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  entryItem: {
    marginBottom: 16,
  },
  entryName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  entryDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  entryDetail: {
    marginRight: 12,
  },
  entryTiming: {
    fontStyle: 'italic',
    marginTop: 4,
  },
  entryDivider: {
    marginTop: 8,
  },
  ruleItem: {
    marginBottom: 16,
  },
  ruleName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ruleCondition: {
    marginBottom: 2,
  },
  ruleAction: {
    fontStyle: 'italic',
  },
  ruleDivider: {
    marginTop: 8,
  },
});

export default PlanAnalyticsScreen;