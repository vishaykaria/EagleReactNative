import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, TrendingUp, Wallet, ChartLine as LineChart, PiggyBank, FileText, ArrowRight, ChevronDown, ArrowUpRight, ArrowDownLeft, ShoppingCart, Coffee, Car, Chrome as Home, Gamepad2, Shield, Users } from 'lucide-react-native';
import { InvestmentsSection } from '@/components/InvestmentsSection';
import { PerformanceGraph } from '@/components/PerformanceGraph';
import { IsaProjectionsSection } from '@/components/IsaProjectionsSection';
import { RetirementSection } from '@/components/RetirementSection';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { PageTransition } from '@/components/PageTransition';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';

const { width } = Dimensions.get('window');

type AccountType = 'current' | 'isa' | 'sipp';

const accountTypes = [
  { 
    id: 'current' as AccountType, 
    name: 'Current Account', 
    shortName: 'Current',
    balance: 2847.63,
    description: 'Everyday banking and spending',
    details: {
      availableBalance: 2847.63,
      overdraftLimit: 1000,
      monthlyIncome: 3500,
      monthlySpending: 2123.45,
    }
  },
  { 
    id: 'isa' as AccountType, 
    name: 'Stocks & Shares ISA', 
    shortName: 'ISA',
    balance: 18549.28,
    description: 'Tax-free investment account',
    details: {
      totalInvested: 15000,
      totalGains: 3549.28,
      gainsPercentage: 23.66,
      annualAllowance: 20000,
      usedAllowance: 8500,
    }
  },
  { 
    id: 'sipp' as AccountType, 
    name: 'SIPP', 
    shortName: 'SIPP',
    balance: 45672.91,
    description: 'Self-invested personal pension',
    details: {
      totalContributions: 35000,
      employerContributions: 12500,
      totalGains: 10672.91,
      gainsPercentage: 30.49,
      monthlyPersonalContribution: 290,
      monthlyEmployerContribution: 290,
    }
  },
];

// Recent transactions data for Current Account
const currentAccountTransactions = [
  {
    id: '1',
    description: 'Salary Payment',
    company: 'TechCorp Ltd',
    amount: 3500.00,
    date: 'Today, 09:00',
    type: 'credit' as const,
    category: 'Income',
  },
  {
    id: '3',
    description: 'Tesco Grocery Shopping',
    company: 'Tesco Express',
    amount: -127.45,
    date: 'Yesterday, 18:45',
    type: 'debit' as const,
    category: 'Shopping',
  },
  {
    id: '4',
    description: 'Starbucks Coffee',
    company: 'Starbucks Store #1234',
    amount: -4.85,
    date: 'Yesterday, 14:20',
    type: 'debit' as const,
    category: 'Food & Drink',
  },
  {
    id: '5',
    description: 'Fuel Purchase',
    company: 'Shell Station',
    amount: -67.23,
    date: 'Yesterday, 12:15',
    type: 'debit' as const,
    category: 'Transport',
  },
  {
    id: '6',
    description: 'Netflix Subscription',
    company: 'Netflix',
    amount: -12.99,
    date: '2 days ago, 10:00',
    type: 'debit' as const,
    category: 'Entertainment',
  },
  {
    id: '7',
    description: 'Rent Payment',
    company: 'Property Management Co',
    amount: -1250.00,
    date: '3 days ago, 09:00',
    type: 'debit' as const,
    category: 'Housing',
  },
];

export default function AccountsScreen() {
  const params = useLocalSearchParams();
  const initialAccount = (params.selectedAccount as AccountType) || 'current';
  
  const [selectedAccount, setSelectedAccount] = useState<AccountType>(initialAccount);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [expandedIrsForm, setExpandedIrsForm] = useState<string | null>(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const dropdownAnimation = useRef(new Animated.Value(0)).current;
  const { convertToUSD, loading: currencyLoading } = useCurrencyConverter();

  // Animation refs for each account's IRS forms
  const irsFormsAnimations = useRef<{ [key: string]: { height: Animated.Value; opacity: Animated.Value; chevronRotation: Animated.Value } }>({});

  // Initialize animations for each account
  const initializeAnimations = (accountId: string) => {
    if (!irsFormsAnimations.current[accountId]) {
      irsFormsAnimations.current[accountId] = {
        height: new Animated.Value(0),
        opacity: new Animated.Value(0),
        chevronRotation: new Animated.Value(0),
      };
    }
    return irsFormsAnimations.current[accountId];
  };

  // Trigger entrance animation when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setIsVisible(true);
      return () => setIsVisible(false);
    }, [])
  );

  // Update selected account when params change
  useEffect(() => {
    if (params.selectedAccount) {
      setSelectedAccount(params.selectedAccount as AccountType);
    }
  }, [params.selectedAccount]);

  const toggleDropdown = () => {
    const isOpening = !dropdownVisible;
    setDropdownVisible(isOpening);
    
    Animated.timing(dropdownAnimation, {
      toValue: isOpening ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const selectAccount = (accountType: AccountType) => {
    setSelectedAccount(accountType);
    toggleDropdown();
  };

  const toggleIrsFormsAccordion = (accountId: string) => {
    const animations = initializeAnimations(accountId);
    const isExpanding = expandedIrsForm !== accountId;
    
    // Close any currently expanded form
    if (expandedIrsForm && expandedIrsForm !== accountId) {
      const prevAnimations = initializeAnimations(expandedIrsForm);
      Animated.parallel([
        Animated.timing(prevAnimations.height, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(prevAnimations.opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(prevAnimations.chevronRotation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }

    if (isExpanding) {
      setExpandedIrsForm(accountId);
      // Expand IRS forms accordion
      Animated.parallel([
        Animated.timing(animations.height, {
          toValue: 140,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(animations.opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(animations.chevronRotation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      setExpandedIrsForm(null);
      // Collapse IRS forms accordion
      Animated.parallel([
        Animated.timing(animations.height, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(animations.opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(animations.chevronRotation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handleExportSpecificForm = (formType: 'form8949' | 'form1099' | 'form2555' | 'form5498' | 'form1041', accountName: string) => {
    const formNames = {
      form8949: 'IRS Form 8949 (Sales and Other Dispositions of Capital Assets)',
      form1099: 'IRS Form 1099 (Miscellaneous Income)',
      form2555: 'IRS Form 2555 (Foreign Earned Income)',
      form5498: 'IRS Form 5498 (IRA Contribution Information)',
      form1041: 'IRS Form 1041 (U.S. Income Tax Return for Estates and Trusts)'
    };

    Alert.alert(
      `Export ${formNames[formType]}`,
      `Export ${formNames[formType]} for ${accountName}?\n\nThis will generate and download your ${formType.toUpperCase()} tax document for the current tax year.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Export',
          onPress: () => Alert.alert('Success', `${formNames[formType]} for ${accountName} has been exported and will be available for download shortly.`)
        }
      ]
    );
  };

  const handleTransactionPress = (transaction: any) => {
    Alert.alert(
      'Transaction Details',
      `${transaction.description}\n${transaction.company}\n${transaction.date}\nAmount: £${Math.abs(transaction.amount).toFixed(2)}`,
      [{ text: 'OK' }]
    );
  };

  const handleViewAllTransactions = () => {
    router.push('/(tabs)/activity');
  };

  const getTransactionIcon = (transaction: any) => {
    switch (transaction.category.toLowerCase()) {
      case 'income':
        return <ArrowDownLeft size={20} color="#10B981" />;
      case 'shopping':
        return <ShoppingCart size={20} color="#EF4444" />;
      case 'food & drink':
        return <Coffee size={20} color="#EF4444" />;
      case 'transport':
        return <Car size={20} color="#EF4444" />;
      case 'housing':
        return <Home size={20} color="#EF4444" />;
      case 'entertainment':
        return <Gamepad2 size={20} color="#EF4444" />;
      default:
        return <ArrowUpRight size={20} color="#EF4444" />;
    }
  };

  // Parallax effect for header
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -30],
    extrapolate: 'clamp',
  });

  // Generate sample performance data
  const generatePerformanceData = (accountType: AccountType) => {
    const baseData = [
      { year: '2020', benchmark: 5.2 },
      { year: '2021', benchmark: 18.5 },
      { year: '2022', benchmark: -18.1 },
      { year: '2023', benchmark: 21.2 },
      { year: '2024', benchmark: 12.8 },
      { year: '2025', benchmark: 8.5 },
    ];

    return baseData.map(item => ({
      ...item,
      portfolio: accountType === 'isa' 
        ? item.benchmark + (Math.random() * 4 - 2) // ISA: ±2% variance
        : item.benchmark + (Math.random() * 6 - 3) // SIPP: ±3% variance
    }));
  };

  const getCurrentAccount = () => {
    return accountTypes.find(account => account.id === selectedAccount) || accountTypes[0];
  };

  const currentAccount = getCurrentAccount();

  const getAccountGradient = () => {
    switch (currentAccount.id) {
      case 'current':
        return ['#1E40AF', '#3B82F6'];
      case 'isa':
        return ['#059669', '#10B981'];
      case 'sipp':
        return ['#7C3AED', '#A855F7'];
      default:
        return ['#1E40AF', '#3B82F6'];
    }
  };

  const getAccountIcon = () => {
    switch (currentAccount.id) {
      case 'current':
        return <Wallet size={24} color="#FFFFFF" />;
      case 'isa':
        return <LineChart size={24} color="#FFFFFF" />;
      case 'sipp':
        return <PiggyBank size={24} color="#FFFFFF" />;
      default:
        return <Wallet size={24} color="#FFFFFF" />;
    }
  };

  // Calculate exact dropdown height based on content
  const calculateDropdownHeight = () => {
    const itemHeight = 90; // Height per dropdown item
    const borderWidth = 2; // Top and bottom border
    return (accountTypes.length * itemHeight) + borderWidth;
  };

  const dropdownHeight = dropdownAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, calculateDropdownHeight()],
  });

  const dropdownOpacity = dropdownAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const chevronRotation = dropdownAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const animations = initializeAnimations(currentAccount.id);
  const isIrsExpanded = expandedIrsForm === currentAccount.id;

  const irsChevronRotate = animations.chevronRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // Recent Transactions Component for Current Account
  const RecentTransactionsSection = () => (
    <PageTransition isVisible={isVisible} delay={400}>
      <View style={styles.recentTransactionsContainer}>
        <View style={styles.recentTransactionsHeader}>
          <Text style={styles.recentTransactionsTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={handleViewAllTransactions}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.transactionsList}>
          {currentAccountTransactions.slice(0, 5).map((transaction, index) => (
            <PageTransition key={transaction.id} isVisible={isVisible} delay={450 + (index * 50)}>
              <TouchableOpacity 
                style={styles.transactionItem}
                onPress={() => handleTransactionPress(transaction)}
                activeOpacity={0.7}
              >
                <View style={styles.transactionIcon}>
                  {getTransactionIcon(transaction)}
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionDescription}>{transaction.description}</Text>
                  <Text style={styles.transactionCompany}>{transaction.company}</Text>
                  <Text style={styles.transactionDate}>{transaction.date}</Text>
                </View>
                <View style={styles.transactionAmountContainer}>
                  <Text style={[
                    styles.transactionAmount,
                    transaction.amount > 0 ? styles.positiveAmount : styles.negativeAmount
                  ]}>
                    {transaction.amount > 0 ? '+' : ''}£{Math.abs(transaction.amount).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                  </Text>
                  <Text style={styles.transactionCategory}>{transaction.category}</Text>
                </View>
              </TouchableOpacity>
            </PageTransition>
          ))}
        </View>
      </View>
    </PageTransition>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Parallax Effect */}
      <Animated.View 
        style={[
          styles.header,
          { transform: [{ translateY: headerTranslateY }] }
        ]}
      >
        <PageTransition isVisible={isVisible} delay={0}>
          <Text style={styles.title}>Accounts</Text>
        </PageTransition>
      </Animated.View>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Account Dropdown Selector */}
        <PageTransition isVisible={isVisible} delay={100}>
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={[styles.dropdownButton, dropdownVisible && styles.dropdownButtonActive]}
              onPress={toggleDropdown}
              activeOpacity={0.8}
            >
              <View style={styles.dropdownButtonContent}>
                <View style={styles.accountPreview}>
                  <View style={[styles.accountPreviewIcon, { backgroundColor: getAccountGradient()[0] }]}>
                    {getAccountIcon()}
                  </View>
                  <View style={styles.accountPreviewInfo}>
                    <Text style={styles.dropdownButtonText}>{currentAccount.name}</Text>
                    <Text style={styles.dropdownButtonBalance}>
                      {balanceVisible ? `£${currentAccount.balance.toLocaleString('en-GB')}` : '••••••'}
                    </Text>
                  </View>
                </View>
                <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
                  <ChevronDown size={20} color="#64748B" />
                </Animated.View>
              </View>
            </TouchableOpacity>

            {/* Dropdown Menu - Fixed height calculation */}
            <Animated.View 
              style={[
                styles.dropdownMenu,
                {
                  height: dropdownHeight,
                  opacity: dropdownOpacity,
                }
              ]}
            >
              {accountTypes.map((account, index) => (
                <TouchableOpacity
                  key={account.id}
                  style={[
                    styles.dropdownItem,
                    selectedAccount === account.id && styles.dropdownItemActive,
                    // Remove border from last item to eliminate excess space
                    index === accountTypes.length - 1 && styles.dropdownItemLast
                  ]}
                  onPress={() => selectAccount(account.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.dropdownItemContent}>
                    <View style={[
                      styles.dropdownItemIcon, 
                      { backgroundColor: account.id === 'current' ? '#1E40AF' : account.id === 'isa' ? '#059669' : '#7C3AED' }
                    ]}>
                      {account.id === 'current' ? <Wallet size={16} color="#FFFFFF" /> :
                       account.id === 'isa' ? <LineChart size={16} color="#FFFFFF" /> :
                       <PiggyBank size={16} color="#FFFFFF" />}
                    </View>
                    <View style={styles.dropdownItemInfo}>
                      <Text style={[
                        styles.dropdownItemText,
                        selectedAccount === account.id && styles.dropdownItemTextActive
                      ]}>
                        {account.name}
                      </Text>
                      <Text style={[
                        styles.dropdownItemBalance,
                        selectedAccount === account.id && styles.dropdownItemBalanceActive
                      ]}>
                        {balanceVisible ? `£${account.balance.toLocaleString('en-GB')}` : '••••••'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </Animated.View>
          </View>
        </PageTransition>

        {/* Selected Account Card */}
        <PageTransition isVisible={isVisible} delay={200}>
          <View style={styles.accountCardWrapper}>
            <View style={styles.accountCard}>
              <LinearGradient
                colors={getAccountGradient()}
                style={styles.accountHeader}
              >
                {/* Visibility Button - Top Right */}
                <TouchableOpacity 
                  style={styles.visibilityButton}
                  onPress={() => setBalanceVisible(!balanceVisible)}
                  activeOpacity={0.7}
                >
                  {balanceVisible ? (
                    <Eye size={20} color="#FFFFFF" />
                  ) : (
                    <EyeOff size={20} color="#FFFFFF" />
                  )}
                </TouchableOpacity>

                <View style={styles.accountInfo}>
                  <View style={styles.accountIconContainer}>
                    {getAccountIcon()}
                  </View>
                  <View>
                    <Text style={styles.accountName}>{currentAccount.name}</Text>
                    <Text style={styles.accountNumber}>****{currentAccount.id === 'current' ? '1234' : currentAccount.id === 'isa' ? '5678' : '9012'}</Text>
                  </View>
                </View>
                
                <View style={styles.balanceContainer}>
                  <Text style={styles.balanceAmount}>
                    {balanceVisible ? `£${currentAccount.balance.toLocaleString('en-GB', { minimumFractionDigits: 2 })}` : '••••••'}
                  </Text>
                  {/* USD display for account balance */}
                  <Text style={styles.balanceUSD}>
                    {balanceVisible && !currencyLoading
                      ? `$${convertToUSD(currentAccount.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                      : '••••••'
                    }
                  </Text>
                </View>
                
                {/* Export IRS Forms Button */}
                <View style={styles.irsFormsContainer}>
                  <TouchableOpacity 
                    style={styles.exportButton}
                    onPress={() => toggleIrsFormsAccordion(currentAccount.id)}
                    activeOpacity={0.8}
                  >
                    <FileText size={20} color="#FFFFFF" />
                    <Text style={styles.exportButtonText}>Export IRS Forms</Text>
                    <Animated.View style={{ transform: [{ rotate: irsChevronRotate }] }}>
                      <ChevronDown size={20} color="#FFFFFF" />
                    </Animated.View>
                  </TouchableOpacity>

                  {/* IRS Forms Accordion */}
                  <Animated.View style={[
                    styles.irsFormsAccordion,
                    {
                      height: animations.height,
                      opacity: animations.opacity,
                    }
                  ]}>
                    <View style={styles.irsFormsContent}>
                      {currentAccount.id === 'current' ? (
                        <>
                          <TouchableOpacity 
                            style={styles.irsFormOption}
                            onPress={() => handleExportSpecificForm('form1099', currentAccount.name)}
                            activeOpacity={0.8}
                          >
                            <View style={styles.irsFormIconContainer}>
                              <FileText size={16} color="#1E40AF" />
                            </View>
                            <View style={styles.irsFormInfo}>
                              <Text style={styles.irsFormTitle}>IRS Form 1099</Text>
                              <Text style={styles.irsFormDescription}>Interest Income</Text>
                            </View>
                            <ArrowRight size={14} color="rgba(255, 255, 255, 0.8)" />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.irsFormOption}
                            onPress={() => handleExportSpecificForm('form2555', currentAccount.name)}
                            activeOpacity={0.8}
                          >
                            <View style={styles.irsFormIconContainer}>
                              <FileText size={16} color="#1E40AF" />
                            </View>
                            <View style={styles.irsFormInfo}>
                              <Text style={styles.irsFormTitle}>IRS Form 2555</Text>
                              <Text style={styles.irsFormDescription}>Foreign Earned Income</Text>
                            </View>
                            <ArrowRight size={14} color="rgba(255, 255, 255, 0.8)" />
                          </TouchableOpacity>
                        </>
                      ) : currentAccount.id === 'isa' ? (
                        <>
                          <TouchableOpacity 
                            style={styles.irsFormOption}
                            onPress={() => handleExportSpecificForm('form8949', currentAccount.name)}
                            activeOpacity={0.8}
                          >
                            <View style={styles.irsFormIconContainer}>
                              <FileText size={16} color="#059669" />
                            </View>
                            <View style={styles.irsFormInfo}>
                              <Text style={styles.irsFormTitle}>IRS Form 8949</Text>
                              <Text style={styles.irsFormDescription}>Capital Asset Sales</Text>
                            </View>
                            <ArrowRight size={14} color="rgba(255, 255, 255, 0.8)" />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.irsFormOption}
                            onPress={() => handleExportSpecificForm('form1099', currentAccount.name)}
                            activeOpacity={0.8}
                          >
                            <View style={styles.irsFormIconContainer}>
                              <FileText size={16} color="#059669" />
                            </View>
                            <View style={styles.irsFormInfo}>
                              <Text style={styles.irsFormTitle}>IRS Form 1099</Text>
                              <Text style={styles.irsFormDescription}>Miscellaneous Income</Text>
                            </View>
                            <ArrowRight size={14} color="rgba(255, 255, 255, 0.8)" />
                          </TouchableOpacity>
                        </>
                      ) : (
                        <>
                          <TouchableOpacity 
                            style={styles.irsFormOption}
                            onPress={() => handleExportSpecificForm('form5498', currentAccount.name)}
                            activeOpacity={0.8}
                          >
                            <View style={styles.irsFormIconContainer}>
                              <FileText size={16} color="#7C3AED" />
                            </View>
                            <View style={styles.irsFormInfo}>
                              <Text style={styles.irsFormTitle}>IRS Form 5498</Text>
                              <Text style={styles.irsFormDescription}>IRA Contribution Info</Text>
                            </View>
                            <ArrowRight size={14} color="rgba(255, 255, 255, 0.8)" />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.irsFormOption}
                            onPress={() => handleExportSpecificForm('form1041', currentAccount.name)}
                            activeOpacity={0.8}
                          >
                            <View style={styles.irsFormIconContainer}>
                              <FileText size={16} color="#7C3AED" />
                            </View>
                            <View style={styles.irsFormInfo}>
                              <Text style={styles.irsFormTitle}>IRS Form 1041</Text>
                              <Text style={styles.irsFormDescription}>Estate Tax Return</Text>
                            </View>
                            <ArrowRight size={14} color="rgba(255, 255, 255, 0.8)" />
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </Animated.View>
                </View>
              </LinearGradient>

              {/* Account Details Section */}
              <View style={styles.accountDetails}>
                {currentAccount.id === 'current' && (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Available Balance</Text>
                      <CurrencyDisplay 
                        gbpAmount={currentAccount.details.availableBalance} 
                        balanceVisible={balanceVisible} 
                        style="detail"
                      />
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Overdraft Limit</Text>
                      <Text style={styles.detailValue}>
                        £{currentAccount.details.overdraftLimit.toLocaleString('en-GB')}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Monthly Income</Text>
                      <View style={styles.positiveValueContainer}>
                        <Text style={[styles.detailValue, styles.positiveValue]}>
                          {balanceVisible 
                            ? `£${currentAccount.details.monthlyIncome.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`
                            : '••••••'
                          }
                        </Text>
                        {/* USD display for monthly income */}
                        <Text style={[styles.detailValueUSD, styles.positiveValue]}>
                          {balanceVisible && !currencyLoading
                            ? `$${convertToUSD(currentAccount.details.monthlyIncome).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                            : '••••••'
                          }
                        </Text>
                      </View>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Monthly Spending</Text>
                      <View style={styles.negativeValueContainer}>
                        <Text style={[styles.detailValue, styles.negativeValue]}>
                          {balanceVisible 
                            ? `£${currentAccount.details.monthlySpending.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`
                            : '••••••'
                          }
                        </Text>
                        {/* USD display for monthly spending */}
                        <Text style={[styles.detailValueUSD, styles.negativeValue]}>
                          {balanceVisible && !currencyLoading
                            ? `$${convertToUSD(currentAccount.details.monthlySpending).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                            : '••••••'
                          }
                        </Text>
                      </View>
                    </View>
                  </>
                )}

                {currentAccount.id === 'isa' && (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Total Invested</Text>
                      <CurrencyDisplay 
                        gbpAmount={currentAccount.details.totalInvested} 
                        balanceVisible={balanceVisible} 
                        style="detail"
                      />
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Total Gains</Text>
                      <View style={styles.gainsContainer}>
                        <TrendingUp size={16} color="#10B981" />
                        <View style={styles.positiveValueContainer}>
                          <Text style={[styles.detailValue, styles.positiveValue]}>
                            {balanceVisible 
                              ? `+£${currentAccount.details.totalGains.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`
                              : '+••••••'
                            }
                          </Text>
                          {/* USD display for gains */}
                          <Text style={[styles.detailValueUSD, styles.positiveValue]}>
                            {balanceVisible && !currencyLoading
                              ? `+$${convertToUSD(currentAccount.details.totalGains).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                              : '+••••••'
                            }
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>ROI %</Text>
                      <Text style={[styles.detailValue, styles.positiveValue]}>
                        {balanceVisible 
                          ? `+${currentAccount.details.gainsPercentage}%`
                          : '+••••'
                        }
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>ISA Allowance Used</Text>
                      <Text style={styles.detailValue}>
                        £{currentAccount.details.usedAllowance.toLocaleString('en-GB')} / £{currentAccount.details.annualAllowance.toLocaleString('en-GB')}
                      </Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${(currentAccount.details.usedAllowance / currentAccount.details.annualAllowance) * 100}%` }]} />
                    </View>
                    
                    {/* PFIC Prevention Tag - Centered below progress bar */}
                    <View style={styles.pficTagContainer}>
                      <View style={styles.pficTag}>
                        <Shield size={14} color="#059669" />
                        <Text style={styles.pficTagText}>PFIC Prevention</Text>
                      </View>
                    </View>
                  </>
                )}

                {currentAccount.id === 'sipp' && (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Your Contributions</Text>
                      <CurrencyDisplay 
                        gbpAmount={currentAccount.details.totalContributions} 
                        balanceVisible={balanceVisible} 
                        style="detail"
                      />
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Employer Contributions</Text>
                      <CurrencyDisplay 
                        gbpAmount={currentAccount.details.employerContributions} 
                        balanceVisible={balanceVisible} 
                        style="detail"
                      />
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Total Gains</Text>
                      <View style={styles.gainsContainer}>
                        <TrendingUp size={16} color="#10B981" />
                        <View style={styles.positiveValueContainer}>
                          <Text style={[styles.detailValue, styles.positiveValue]}>
                            {balanceVisible 
                              ? `+£${currentAccount.details.totalGains.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`
                              : '+••••••'
                            }
                          </Text>
                          {/* USD display for gains */}
                          <Text style={[styles.detailValueUSD, styles.positiveValue]}>
                            {balanceVisible && !currencyLoading
                              ? `+$${convertToUSD(currentAccount.details.totalGains).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                              : '+••••••'
                            }
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>ROI %</Text>
                      <Text style={[styles.detailValue, styles.positiveValue]}>
                        {balanceVisible 
                          ? `+${currentAccount.details.gainsPercentage}%`
                          : '+••••'
                        }
                      </Text>
                    </View>

                    {/* Monthly Contributions Section - Moved from Retirement Planning */}
                    <View style={styles.contributionSection}>
                      <Text style={styles.contributionSectionTitle}>Monthly Contributions</Text>
                      <View style={styles.contributionBreakdown}>
                        <View style={styles.contributionItem}>
                          <View style={[styles.contributionDot, { backgroundColor: '#7C3AED' }]} />
                          <Text style={styles.contributionLabel}>Your Contribution</Text>
                          <Text style={styles.contributionAmount}>
                            £{currentAccount.details.monthlyPersonalContribution.toLocaleString('en-GB')}
                          </Text>
                        </View>
                        <View style={styles.contributionItem}>
                          <View style={[styles.contributionDot, { backgroundColor: '#059669' }]} />
                          <Text style={styles.contributionLabel}>Employer Match</Text>
                          <Text style={styles.contributionAmount}>
                            £{currentAccount.details.monthlyEmployerContribution.toLocaleString('en-GB')}
                          </Text>
                        </View>
                        <View style={styles.contributionTotal}>
                          <Text style={styles.contributionTotalLabel}>Total Monthly</Text>
                          <Text style={styles.contributionTotalAmount}>
                            £{(currentAccount.details.monthlyPersonalContribution + currentAccount.details.monthlyEmployerContribution).toLocaleString('en-GB')}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>
        </PageTransition>

        {/* Recent Transactions Section - Only for Current Account */}
        {selectedAccount === 'current' && <RecentTransactionsSection />}

        {/* Account-Specific Content - Moved Investments to Bottom */}
        {selectedAccount === 'isa' && (
          <>
            <PerformanceGraph 
              data={generatePerformanceData('isa')}
              accountType="isa"
              balanceVisible={balanceVisible}
            />
            <IsaProjectionsSection
              balanceVisible={balanceVisible}
              currentValue={18549.28}
              monthlyContribution={500}
              annualAllowance={20000}
              usedAllowance={8500}
              totalInvested={15000}
              totalGains={3549.28}
            />
            <InvestmentsSection 
              accountType="isa" 
              balanceVisible={balanceVisible}
              totalValue={18549.28}
            />
          </>
        )}

        {selectedAccount === 'sipp' && (
          <>
            <PerformanceGraph 
              data={generatePerformanceData('sipp')}
              accountType="sipp"
              balanceVisible={balanceVisible}
            />
            <RetirementSection
              balanceVisible={balanceVisible}
              currentValue={45672.91}
              monthlyContribution={290}
              employerContribution={290}
              yearsToRetirement={32}
              projectedRetirementAge={67}
              projectedValue={850000}
            />
            <InvestmentsSection 
              accountType="sipp" 
              balanceVisible={balanceVisible}
              totalValue={45672.91}
            />
          </>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#F8FAFC',
    zIndex: 1,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    color: '#0F172A',
  },
  dropdownContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
    position: 'relative',
    zIndex: 10,
  },
  dropdownButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dropdownButtonActive: {
    borderColor: '#1E40AF',
    shadowOpacity: 0.15,
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accountPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accountPreviewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountPreviewInfo: {
    flex: 1,
  },
  dropdownButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 2,
  },
  dropdownButtonBalance: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#64748B',
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 25, // Increased from 20 to 25 (25% increase in padding for additional 25% height increase)
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemLast: {
    borderBottomWidth: 0, // Remove border from last item to eliminate excess space
  },
  dropdownItemActive: {
    backgroundColor: '#EBF4FF',
  },
  dropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dropdownItemInfo: {
    flex: 1,
  },
  dropdownItemText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 2,
  },
  dropdownItemTextActive: {
    color: '#1E40AF',
  },
  dropdownItemBalance: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#64748B',
  },
  dropdownItemBalanceActive: {
    color: '#1E40AF',
  },
  accountCardWrapper: {
    marginBottom: 24,
  },
  accountCard: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  accountHeader: {
    padding: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'relative',
  },
  visibilityButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  accountIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  accountName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  accountNumber: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  balanceContainer: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  balanceAmount: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  balanceUSD: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  irsFormsContainer: {
    marginTop: 16,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    width: '100%', // Full width to cover entire screen width
  },
  exportButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  irsFormsAccordion: {
    overflow: 'hidden',
    marginTop: 8,
  },
  irsFormsContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 8,
    gap: 8,
  },
  irsFormOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 12,
    minHeight: 48,
  },
  irsFormIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  irsFormInfo: {
    flex: 1,
  },
  irsFormTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  irsFormDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 16,
  },
  // Account Details Section
  accountDetails: {
    padding: 24,
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#64748B',
  },
  detailValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#0F172A',
  },
  detailValueUSD: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  positiveValue: {
    color: '#10B981',
  },
  negativeValue: {
    color: '#EF4444',
  },
  positiveValueContainer: {
    alignItems: 'flex-end',
  },
  negativeValueContainer: {
    alignItems: 'flex-end',
  },
  gainsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  
  // PFIC Prevention Tag Styles
  pficTagContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  pficTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 6,
  },
  pficTagText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#059669',
  },

  // Monthly Contributions Section Styles (moved from Retirement Planning)
  contributionSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  contributionSectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 12,
  },
  contributionBreakdown: {
    gap: 12,
  },
  contributionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  contributionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  contributionLabel: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#64748B',
  },
  contributionAmount: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#0F172A',
  },
  contributionTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  contributionTotalLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#0F172A',
  },
  contributionTotalAmount: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#7C3AED',
  },

  // Recent Transactions Section Styles
  recentTransactionsContainer: {
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
  recentTransactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  recentTransactionsTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#0F172A',
  },
  viewAllText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#1E40AF',
  },
  transactionsList: {
    paddingBottom: 8,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 2,
  },
  transactionCompany: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  transactionDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#94A3B8',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    marginBottom: 2,
  },
  transactionCategory: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#94A3B8',
  },
  positiveAmount: {
    color: '#10B981',
  },
  negativeAmount: {
    color: '#EF4444',
  },
});