import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Calculator, TrendingUp, TrendingDown, Target, Calendar, DollarSign, PiggyBank, Users, Clock, ChartLine as LineChart } from 'lucide-react-native';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { GrowthProjectionsChart } from './GrowthProjectionsChart';

interface IsaProjectionsSectionProps {
  balanceVisible: boolean;
  currentValue: number;
  monthlyContribution: number;
  annualAllowance: number;
  usedAllowance: number;
  totalInvested: number;
  totalGains: number;
}

export function IsaProjectionsSection({ 
  balanceVisible, 
  currentValue, 
  monthlyContribution,
  annualAllowance,
  usedAllowance,
  totalInvested,
  totalGains
}: IsaProjectionsSectionProps) {
  const [selectedView, setSelectedView] = useState<'projections' | 'calculator'>('projections');
  const { convertToUSD } = useCurrencyConverter();
  
  // Calculator state
  const [calculatorInputs, setCalculatorInputs] = useState({
    currentAge: 35,
    targetAge: 60,
    currentBalance: currentValue,
    monthlyContribution: monthlyContribution,
    annualReturn: 7,
    inflationRate: 2.5,
    targetAmount: 100000
  });

  // Generate projection data for ISA growth
  const generateProjectionData = () => {
    const data = [];
    let balance = currentValue;
    const monthlyReturn = 0.07 / 12; // 7% annual return
    const yearsToProject = 25; // Project 25 years into the future

    for (let year = 0; year <= yearsToProject; year++) {
      data.push({
        year: new Date().getFullYear() + year,
        age: 35 + year, // Assuming current age is 35
        balance: balance,
        contributions: monthlyContribution * 12 * year,
        growth: balance - currentValue - (monthlyContribution * 12 * year)
      });

      // Calculate next year's balance (respecting ISA allowance)
      const annualContribution = Math.min(monthlyContribution * 12, annualAllowance);
      for (let month = 0; month < 12; month++) {
        balance = balance * (1 + monthlyReturn) + (annualContribution / 12);
      }
    }

    return data;
  };

  const projectionData = generateProjectionData();

  // Calculate ISA calculator results
  const calculateIsaProjections = () => {
    const yearsToTarget = calculatorInputs.targetAge - calculatorInputs.currentAge;
    const monthsToTarget = yearsToTarget * 12;
    const monthlyReturn = calculatorInputs.annualReturn / 100 / 12;
    
    let futureValue = calculatorInputs.currentBalance;
    let totalContributions = calculatorInputs.currentBalance;
    
    // Calculate compound growth with monthly contributions (respecting ISA allowance)
    for (let month = 0; month < monthsToTarget; month++) {
      const yearlyContributions = calculatorInputs.monthlyContribution * 12;
      const allowedContribution = Math.min(yearlyContributions, annualAllowance);
      const monthlyContrib = allowedContribution / 12;
      
      futureValue = futureValue * (1 + monthlyReturn) + monthlyContrib;
      totalContributions += monthlyContrib;
    }
    
    // Calculate purchasing power adjusted for inflation
    const inflationAdjustedValue = futureValue / Math.pow(1 + calculatorInputs.inflationRate / 100, yearsToTarget);
    
    // Calculate investment growth
    const investmentGrowth = futureValue - totalContributions;
    
    // Calculate years to reach target
    let yearsToReachTarget = 0;
    let tempBalance = calculatorInputs.currentBalance;
    while (tempBalance < calculatorInputs.targetAmount && yearsToReachTarget < 50) {
      for (let month = 0; month < 12; month++) {
        tempBalance = tempBalance * (1 + monthlyReturn) + (calculatorInputs.monthlyContribution);
      }
      yearsToReachTarget++;
    }
    
    return {
      futureValue,
      inflationAdjustedValue,
      totalContributions,
      investmentGrowth,
      yearsToReachTarget: yearsToReachTarget > 50 ? null : yearsToReachTarget
    };
  };

  const calculatorResults = calculateIsaProjections();

  // Helper function to update calculator inputs
  const updateCalculatorInput = (field: keyof typeof calculatorInputs, value: string) => {
    const numericValue = field === 'currentAge' || field === 'targetAge' 
      ? parseInt(value) || 0 
      : parseFloat(value) || 0;
    
    setCalculatorInputs(prev => ({ 
      ...prev, 
      [field]: numericValue 
    }));
  };

  // Calculate ROI percentage
  const roiPercentage = totalInvested > 0 ? (totalGains / totalInvested) * 100 : 0;

  // Projections View Component
  const ProjectionsView = () => (
    <View style={styles.projectionsContainer}>
      {/* Interactive Growth Chart */}
      <GrowthProjectionsChart
        accountType="isa"
        balanceVisible={balanceVisible}
        currentValue={currentValue}
        monthlyContribution={monthlyContribution}
        currentAge={calculatorInputs.currentAge}
        targetAge={calculatorInputs.targetAge}
        annualAllowance={annualAllowance}
      />

      {/* Key Metrics */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <View style={styles.metricIcon}>
            <Target size={20} color="#059669" />
          </View>
          <Text style={styles.metricLabel}>ISA Allowance</Text>
          <Text style={styles.metricValue}>£{annualAllowance.toLocaleString('en-GB')}</Text>
        </View>
        <View style={styles.metricCard}>
          <View style={styles.metricIcon}>
            <DollarSign size={20} color="#DC2626" />
          </View>
          <Text style={styles.metricLabel}>Used This Year</Text>
          <Text style={styles.metricValue}>£{usedAllowance.toLocaleString('en-GB')}</Text>
        </View>
        <View style={styles.metricCard}>
          <View style={styles.metricIcon}>
            <PiggyBank size={20} color="#7C3AED" />
          </View>
          <Text style={styles.metricLabel}>Remaining</Text>
          <Text style={styles.metricValue}>£{(annualAllowance - usedAllowance).toLocaleString('en-GB')}</Text>
        </View>
        <View style={styles.metricCard}>
          <View style={styles.metricIcon}>
            <TrendingUp size={20} color="#059669" />
          </View>
          <Text style={styles.metricLabel}>Total Gains</Text>
          <Text style={styles.metricValue}>
            {balanceVisible ? `£${totalGains.toLocaleString('en-GB')}` : '••••••'}
          </Text>
        </View>
      </View>

      {/* ISA Milestones */}
      <View style={styles.milestonesSection}>
        <Text style={styles.sectionTitle}>ISA Milestones</Text>
        {[
          { age: 40, amount: 25000, description: "Early ISA milestone" },
          { age: 45, amount: 50000, description: "Mid-term ISA goal" },
          { age: 50, amount: 100000, description: "Six-figure ISA" },
          { age: 60, amount: 200000, description: "Pre-retirement ISA target" }
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

      {/* Tax Benefits - Updated for US Citizens */}
      <View style={styles.taxBenefitsSection}>
        <Text style={styles.sectionTitle}>Tax Implications for US Citizens</Text>
        <View style={styles.benefitCard}>
          <View style={styles.benefitHeader}>
            <Text style={styles.benefitTitle}>UK Tax-Free Growth</Text>
            <View style={styles.benefitAmountContainer}>
              <Text style={styles.benefitAmount}>
                {balanceVisible ? `£${totalGains.toLocaleString('en-GB')}` : '••••••'}
              </Text>
              <Text style={styles.benefitAmountUSD}>
                {balanceVisible ? `$${convertToUSD(totalGains).toLocaleString('en-US')}` : '••••••'}
              </Text>
            </View>
          </View>
          <Text style={styles.benefitDescription}>
            All gains and dividends in your ISA are tax-free in the UK
          </Text>
        </View>
        <View style={[styles.benefitCard, styles.warningCard]}>
          <View style={styles.benefitHeader}>
            <Text style={[styles.benefitTitle, styles.warningTitle]}>US Federal Tax Obligation</Text>
            <View style={styles.benefitAmountContainer}>
              <Text style={[styles.benefitAmount, styles.warningAmount]}>Tax Owed</Text>
              <Text style={[styles.benefitAmountUSD, styles.warningAmount]}>To IRS</Text>
            </View>
          </View>
          <Text style={styles.benefitDescription}>
            As a US citizen, federal capital gains tax is owed to the IRS on all investment gains, regardless of UK ISA tax benefits
          </Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Important Note</Text>
          <Text style={styles.infoDescription}>
            Consult with a qualified tax advisor familiar with US-UK tax treaties to understand your specific tax obligations and potential foreign tax credit benefits.
          </Text>
        </View>
      </View>
    </View>
  );

  // Calculator View Component
  const CalculatorView = () => (
    <View style={styles.calculatorContainer}>
      {/* Input Section */}
      <View style={styles.inputSection}>
        <Text style={styles.sectionTitle}>ISA Calculator</Text>
        
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
            <Text style={styles.inputLabel}>Target Age</Text>
            <TextInput
              style={styles.input}
              value={calculatorInputs.targetAge.toString()}
              onChangeText={(text) => updateCalculatorInput('targetAge', text)}
              keyboardType="numeric"
              placeholder="60"
              returnKeyType="next"
              blurOnSubmit={false}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Current ISA Value (£)</Text>
            <TextInput
              style={styles.input}
              value={calculatorInputs.currentBalance.toString()}
              onChangeText={(text) => updateCalculatorInput('currentBalance', text)}
              keyboardType="numeric"
              placeholder="18549"
              returnKeyType="next"
              blurOnSubmit={false}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Monthly Contribution (£)</Text>
            <TextInput
              style={styles.input}
              value={calculatorInputs.monthlyContribution.toString()}
              onChangeText={(text) => updateCalculatorInput('monthlyContribution', text)}
              keyboardType="numeric"
              placeholder="500"
              returnKeyType="next"
              blurOnSubmit={false}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Target Amount (£)</Text>
            <TextInput
              style={styles.input}
              value={calculatorInputs.targetAmount.toString()}
              onChangeText={(text) => updateCalculatorInput('targetAmount', text)}
              keyboardType="numeric"
              placeholder="100000"
              returnKeyType="next"
              blurOnSubmit={false}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Expected Annual Return (%)</Text>
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
            <PiggyBank size={24} color="#059669" />
            <Text style={styles.resultTitle}>ISA Value at Target Age</Text>
          </View>
          <Text style={styles.resultValue}>
            £{calculatorResults.futureValue.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
          </Text>
          <Text style={styles.resultSubtext}>
            In today's purchasing power: £{calculatorResults.inflationAdjustedValue.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
          </Text>
        </View>

        {calculatorResults.yearsToReachTarget && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Target size={24} color="#7C3AED" />
              <Text style={styles.resultTitle}>Time to Reach Target</Text>
            </View>
            <Text style={styles.resultValue}>
              {calculatorResults.yearsToReachTarget} years
            </Text>
            <Text style={styles.resultSubtext}>
              You'll reach £{calculatorInputs.targetAmount.toLocaleString('en-GB')} at age {calculatorInputs.currentAge + calculatorResults.yearsToReachTarget}
            </Text>
          </View>
        )}

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
                $${convertToUSD(calculatorResults.investmentGrowth).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => Alert.alert('Increase Contributions', 'Feature coming soon - adjust your monthly ISA contributions')}
          >
            <TrendingUp size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Increase Contributions</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => Alert.alert('Investment Review', 'Feature coming soon - schedule an ISA review')}
          >
            <Calendar size={20} color="#059669" />
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Schedule Review</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ISA Projections</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.viewButton, selectedView === 'projections' && styles.activeViewButton]}
            onPress={() => setSelectedView('projections')}
          >
            <LineChart size={20} color={selectedView === 'projections' ? '#FFFFFF' : '#64748B'} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.viewButton, selectedView === 'calculator' && styles.activeViewButton]}
            onPress={() => setSelectedView('calculator')}
          >
            <Calculator size={20} color={selectedView === 'calculator' ? '#FFFFFF' : '#64748B'} />
          </TouchableOpacity>
        </View>
      </View>

      {selectedView === 'projections' ? <ProjectionsView /> : <CalculatorView />}
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
    backgroundColor: '#059669',
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
    backgroundColor: '#059669',
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
  taxBenefitsSection: {
    marginBottom: 24,
  },
  benefitCard: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  warningCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  benefitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#0F172A',
  },
  warningTitle: {
    color: '#DC2626',
  },
  benefitAmountContainer: {
    alignItems: 'flex-end',
  },
  benefitAmount: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#059669',
  },
  warningAmount: {
    color: '#DC2626',
  },
  benefitAmountUSD: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#059669',
    marginTop: 2,
  },
  benefitDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#64748B',
  },
  infoCard: {
    backgroundColor: '#EBF8FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#1E40AF',
    marginBottom: 8,
  },
  infoDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
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
    color: '#059669',
    marginBottom: 4,
  },
  resultSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#64748B',
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
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#059669',
  },
  actionButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#059669',
  },
});