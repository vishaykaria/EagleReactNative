import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Calculator, TrendingUp, TrendingDown, Target, Calendar, DollarSign, PiggyBank, Users, Clock } from 'lucide-react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { GrowthProjectionsChart } from './GrowthProjectionsChart';

interface RetirementSectionProps {
  balanceVisible: boolean;
  currentValue: number;
  monthlyContribution: number;
  employerContribution: number;
  yearsToRetirement: number;
  projectedRetirementAge: number;
  projectedValue: number;
}

export function RetirementSection({ 
  balanceVisible, 
  currentValue, 
  monthlyContribution,
  employerContribution,
  yearsToRetirement,
  projectedRetirementAge,
  projectedValue
}: RetirementSectionProps) {
  const [selectedView, setSelectedView] = useState<'projections' | 'calculator'>('projections');
  const { convertToUSD } = useCurrencyConverter();
  
  // Calculator state
  const [calculatorInputs, setCalculatorInputs] = useState({
    currentAge: 35,
    retirementAge: 67,
    currentBalance: currentValue,
    monthlyPersonal: monthlyContribution,
    monthlyEmployer: employerContribution,
    annualReturn: 7,
    inflationRate: 2.5
  });

  // Generate projection data for the next 30+ years
  const generateProjectionData = () => {
    const data = [];
    let balance = currentValue;
    const totalMonthlyContribution = monthlyContribution + employerContribution;
    const monthlyReturn = 0.07 / 12; // 7% annual return

    for (let year = 0; year <= yearsToRetirement; year++) {
      data.push({
        year: new Date().getFullYear() + year,
        age: 35 + year, // Assuming current age is 35
        balance: balance,
        contributions: totalMonthlyContribution * 12 * year,
        growth: balance - currentValue - (totalMonthlyContribution * 12 * year)
      });

      // Calculate next year's balance
      for (let month = 0; month < 12; month++) {
        balance = balance * (1 + monthlyReturn) + totalMonthlyContribution;
      }
    }

    return data;
  };

  const projectionData = generateProjectionData();

  // Calculate retirement calculator results
  const calculateRetirement = () => {
    const yearsToRetire = calculatorInputs.retirementAge - calculatorInputs.currentAge;
    const monthsToRetire = yearsToRetire * 12;
    const monthlyReturn = calculatorInputs.annualReturn / 100 / 12;
    const totalMonthlyContrib = calculatorInputs.monthlyPersonal + calculatorInputs.monthlyEmployer;
    
    let futureValue = calculatorInputs.currentBalance;
    
    // Calculate compound growth with monthly contributions
    for (let month = 0; month < monthsToRetire; month++) {
      futureValue = futureValue * (1 + monthlyReturn) + totalMonthlyContrib;
    }
    
    // Calculate purchasing power adjusted for inflation
    const inflationAdjustedValue = futureValue / Math.pow(1 + calculatorInputs.inflationRate / 100, yearsToRetire);
    
    // Calculate annual income at 4% withdrawal rate
    const annualIncome = futureValue * 0.04;
    const monthlyIncome = annualIncome / 12;
    
    // Calculate inflation-adjusted monthly income
    const inflationAdjustedMonthlyIncome = monthlyIncome / Math.pow(1 + calculatorInputs.inflationRate / 100, yearsToRetire);
    
    return {
      futureValue,
      inflationAdjustedValue,
      annualIncome,
      monthlyIncome,
      inflationAdjustedMonthlyIncome,
      totalContributions: calculatorInputs.currentBalance + (totalMonthlyContrib * monthsToRetire),
      investmentGrowth: futureValue - calculatorInputs.currentBalance - (totalMonthlyContrib * monthsToRetire)
    };
  };

  const calculatorResults = calculateRetirement();

  // Helper function to update calculator inputs
  const updateCalculatorInput = (field: keyof typeof calculatorInputs, value: string) => {
    const numericValue = field === 'currentAge' || field === 'retirementAge' 
      ? parseInt(value) || 0 
      : parseFloat(value) || 0;
    
    setCalculatorInputs(prev => ({ 
      ...prev, 
      [field]: numericValue 
    }));
  };

  // Projections View Component
  const ProjectionsView = () => (
    <View style={styles.projectionsContainer}>
      {/* Interactive Growth Chart */}
      <GrowthProjectionsChart
        accountType="sipp"
        balanceVisible={balanceVisible}
        currentValue={currentValue}
        monthlyContribution={monthlyContribution}
        currentAge={calculatorInputs.currentAge}
        targetAge={calculatorInputs.retirementAge}
        employerContribution={employerContribution}
      />

      {/* Key Metrics */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <View style={styles.metricIcon}>
            <Target size={20} color="#7C3AED" />
          </View>
          <Text style={styles.metricLabel}>Retirement Age</Text>
          <Text style={styles.metricValue}>{projectedRetirementAge}</Text>
        </View>
        <View style={styles.metricCard}>
          <View style={styles.metricIcon}>
            <PiggyBank size={20} color="#DC2626" />
          </View>
          <Text style={styles.metricLabel}>Projected Value</Text>
          <Text style={styles.metricValue}>
            {balanceVisible ? `£${projectedValue.toLocaleString('en-GB')}` : '••••••'}
          </Text>
        </View>
        <View style={styles.metricCard}>
          <View style={styles.metricIcon}>
            <DollarSign size={20} color="#D97706" />
          </View>
          <Text style={styles.metricLabel}>Monthly Income</Text>
          <Text style={styles.metricValue}>
            {balanceVisible ? `£${(projectedValue * 0.04 / 12).toLocaleString('en-GB')}` : '••••••'}
          </Text>
        </View>
      </View>

      {/* Milestones */}
      <View style={styles.milestonesSection}>
        <Text style={styles.sectionTitle}>Key Milestones</Text>
        {[
          { age: 40, amount: 150000, description: "Early career milestone" },
          { age: 50, amount: 350000, description: "Mid-career target" },
          { age: 60, amount: 600000, description: "Pre-retirement goal" },
          { age: projectedRetirementAge, amount: projectedValue, description: "Retirement target" }
        ].map((milestone, index) => (
          <View key={index} style={styles.milestoneItem}>
            <View style={styles.milestoneAge}>
              <Text style={styles.milestoneAgeText}>{milestone.age}</Text>
            </View>
            <View style={styles.milestoneInfo}>
              <Text style={styles.milestoneAmount}>
                {balanceVisible ? `£${milestone.amount.toLocaleString('en-GB')}` : '••••••'}
              </Text>
              <Text style={styles.milestoneDescription}>{milestone.description}</Text>
            </View>
            <View style={styles.milestoneStatus}>
              {milestone.age <= 35 ? (
                <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
              ) : (
                <View style={[styles.statusDot, { backgroundColor: '#E2E8F0' }]} />
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  // Calculator View Component
  const CalculatorView = () => (
    <View style={styles.calculatorContainer}>
      {/* Input Section */}
      <View style={styles.inputSection}>
        <Text style={styles.sectionTitle}>Retirement Calculator</Text>
        
        <View style={styles.inputGrid}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Current Age</Text>
            <TextInput
              style={styles.input}
              value={calculatorInputs.currentAge.toString()}
              onChangeText={(text) => updateCalculatorInput('currentAge', text)}
              keyboardType="numeric"
              placeholder="35"
              returnKeyType="next"
              blurOnSubmit={false}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Retirement Age</Text>
            <TextInput
              style={styles.input}
              value={calculatorInputs.retirementAge.toString()}
              onChangeText={(text) => updateCalculatorInput('retirementAge', text)}
              keyboardType="numeric"
              placeholder="67"
              returnKeyType="next"
              blurOnSubmit={false}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Current Balance (£)</Text>
            <TextInput
              style={styles.input}
              value={calculatorInputs.currentBalance.toString()}
              onChangeText={(text) => updateCalculatorInput('currentBalance', text)}
              keyboardType="numeric"
              placeholder="45000"
              returnKeyType="next"
              blurOnSubmit={false}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Monthly Personal (£)</Text>
            <TextInput
              style={styles.input}
              value={calculatorInputs.monthlyPersonal.toString()}
              onChangeText={(text) => updateCalculatorInput('monthlyPersonal', text)}
              keyboardType="numeric"
              placeholder="290"
              returnKeyType="next"
              blurOnSubmit={false}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Monthly Employer (£)</Text>
            <TextInput
              style={styles.input}
              value={calculatorInputs.monthlyEmployer.toString()}
              onChangeText={(text) => updateCalculatorInput('monthlyEmployer', text)}
              keyboardType="numeric"
              placeholder="290"
              returnKeyType="next"
              blurOnSubmit={false}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Annual Return (%)</Text>
            <TextInput
              style={styles.input}
              value={calculatorInputs.annualReturn.toString()}
              onChangeText={(text) => updateCalculatorInput('annualReturn', text)}
              keyboardType="numeric"
              placeholder="7"
              returnKeyType="done"
              blurOnSubmit={true}
            />
          </View>
        </View>
      </View>

      {/* Results Section */}
      <View style={styles.resultsSection}>
        <Text style={styles.sectionTitle}>Projected Results</Text>
        
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <PiggyBank size={24} color="#7C3AED" />
            <Text style={styles.resultTitle}>Retirement Value</Text>
          </View>
          <Text style={styles.resultValue}>
            £{calculatorResults.futureValue.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
          </Text>
          <Text style={styles.resultSubtext}>
            In today's purchasing power: £{calculatorResults.inflationAdjustedValue.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
          </Text>
        </View>

        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <DollarSign size={24} color="#059669" />
            <Text style={styles.resultTitle}>Monthly Retirement Income</Text>
          </View>
          <Text style={styles.resultValue}>
            £{calculatorResults.monthlyIncome.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
          </Text>
          <Text style={styles.resultSubtext}>
            In today's purchasing power: £{calculatorResults.inflationAdjustedMonthlyIncome.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
          </Text>
          <Text style={styles.resultSubtext}>
            4% annual withdrawal rate
          </Text>
        </View>

        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>Breakdown</Text>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Total Contributions</Text>
            <Text style={styles.breakdownValue}>
              £{calculatorResults.totalContributions.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
            </Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Total Gains</Text>
            <View style={styles.breakdownGainsContainer}>
              <Text style={[styles.breakdownValue, { color: '#10B981' }]}>
                £{calculatorResults.investmentGrowth.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
              </Text>
              <Text style={[styles.breakdownValueUSD, { color: '#10B981' }]}>
                $${convertToUSD(calculatorResults.investmentGrowth).toLocaleString('en-US', { maximumFractionDigits: 0 })} USD
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => Alert.alert('Increase Contributions', 'Feature coming soon - adjust your monthly contributions')}
          >
            <TrendingUp size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Increase Contributions</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => Alert.alert('Schedule Review', 'Feature coming soon - schedule a pension review')}
          >
            <Calendar size={20} color="#7C3AED" />
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Schedule Review</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Retirement Planning</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.viewButton, selectedView === 'projections' && styles.activeViewButton]}
            onPress={() => setSelectedView('projections')}
          >
            <TrendingUp size={20} color={selectedView === 'projections' ? '#FFFFFF' : '#64748B'} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.viewButton, selectedView === 'calculator' && styles.activeViewButton]}
            onPress={() => setSelectedView('calculator')}
          >
            <Calculator size={20} color={selectedView === 'calculator' ? '#FFFFFF' : '#64748B'} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.contentContainer}>
        {selectedView === 'projections' ? <ProjectionsView /> : <CalculatorView />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#0F172A',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeViewButton: {
    backgroundColor: '#7C3AED',
  },
  contentContainer: {
    minHeight: 400,
  },
  
  // Projections View Styles
  projectionsContainer: {
    padding: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 4,
  },
  metricValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#0F172A',
    textAlign: 'center',
  },
  chartSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 16,
  },
  chartContainer: {
    height: 200,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPlaceholder: {
    alignItems: 'center',
    padding: 20,
  },
  chartText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  chartSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  hiddenChart: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  hiddenText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#94A3B8',
  },
  milestonesSection: {
    marginBottom: 24,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  milestoneAge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  milestoneAgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneAmount: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 2,
  },
  milestoneDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#64748B',
  },
  milestoneStatus: {
    marginLeft: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  // Calculator View Styles
  calculatorContainer: {
    padding: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputGrid: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    height: 44,
  },
  resultsSection: {
    gap: 16,
  },
  resultCard: {
    backgroundColor: '#F8FAFC',
    padding: 20,
    borderRadius: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  resultTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#0F172A',
  },
  resultValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#7C3AED',
    marginBottom: 4,
  },
  resultSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  breakdownCard: {
    backgroundColor: '#F8FAFC',
    padding: 20,
    borderRadius: 12,
  },
  breakdownTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  breakdownLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#64748B',
  },
  breakdownValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#0F172A',
  },
  breakdownGainsContainer: {
    alignItems: 'flex-end',
  },
  breakdownValueUSD: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginTop: 2,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  actionButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#7C3AED',
  },
});