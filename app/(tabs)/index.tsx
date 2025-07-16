import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions, Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, TrendingUp, Wallet, ChartLine as LineChart, PiggyBank, FileText, ArrowRight, ChevronDown } from 'lucide-react-native';
import { SearchableTransactions } from '@/components/SearchableTransactions';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { PageTransition } from '@/components/PageTransition';
import { router, useFocusEffect } from 'expo-router';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';

const { width } = Dimensions.get('window');

import { DocumentExportService } from '@/utils/documentExport';

export default function HomeScreen() {
  const [accountVisibility, setAccountVisibility] = useState<{ [key: string]: boolean }>({
    '1': true,
    '2': true,
    '3': true,
  });
  const [isVisible, setIsVisible] = useState(false);
  const [expandedIrsForm, setExpandedIrsForm] = useState<string | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const { convertToUSD, loading: currencyLoading } = useCurrencyConverter();

  // Animation refs for each account's IRS forms - using consistent native driver settings
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

  const accounts = [
    {
      id: '1',
      name: 'Current Account',
      accountNumber: '****1234',
      balance: 2847.63,
      type: 'current',
      gradient: ['#1E40AF', '#3B82F6'],
      icon: <Wallet size={24} color="#FFFFFF" />,
      details: {
        monthlyIncome: 3500,
        monthlySpending: 2123.45,
      }
    },
    {
      id: '2',
      name: 'Stocks & Shares ISA',
      accountNumber: '****5678',
      balance: 18549.28,
      type: 'isa',
      gradient: ['#059669', '#10B981'],
      icon: <LineChart size={24} color="#FFFFFF" />,
      details: {
        totalInvested: 15000,
        totalGains: 3549.28,
        gainsPercentage: 23.66,
      }
    },
    {
      id: '3',
      name: 'SIPP',
      accountNumber: '****9012',
      balance: 45672.91,
      type: 'sipp',
      gradient: ['#7C3AED', '#A855F7'],
      icon: <PiggyBank size={24} color="#FFFFFF" />,
      details: {
        totalContributions: 47500, // Aggregated: 35000 (personal) + 12500 (employer)
        totalGains: 10672.91,
        gainsPercentage: 30.49,
      }
    },
  ];

  // Comprehensive transaction data across all accounts
  const allTransactions = [
    {
      id: '1',
      description: 'Salary Payment',
      company: 'TechCorp Ltd',
      amount: 3500.00,
      date: 'Today, 09:00',
      type: 'credit' as const,
      category: 'Income',
      account: 'Current Account',
    },
    {
      id: '2',
      description: 'ISA Monthly Investment',
      company: 'Vanguard S&P 500',
      amount: -500.00,
      date: 'Today, 08:30',
      type: 'investment' as const,
      category: 'Investment',
      account: 'Stocks & Shares ISA',
    },
    {
      id: '3',
      description: 'Grocery Shopping',
      company: 'Tesco Express',
      amount: -127.45,
      date: 'Yesterday, 18:45',
      type: 'debit' as const,
      category: 'Shopping',
      account: 'Current Account',
    },
    {
      id: '4',
      description: 'Coffee Purchase',
      company: 'Starbucks',
      amount: -4.85,
      date: 'Yesterday, 14:20',
      type: 'debit' as const,
      category: 'Food & Drink',
      account: 'Current Account',
    },
    {
      id: '5',
      description: 'Fuel Purchase',
      company: 'Shell Station',
      amount: -67.23,
      date: 'Yesterday, 12:15',
      type: 'debit' as const,
      category: 'Transport',
      account: 'Current Account',
    },
    {
      id: '6',
      description: 'Netflix Subscription',
      company: 'Netflix',
      amount: -12.99,
      date: '2 days ago, 10:00',
      type: 'debit' as const,
      category: 'Entertainment',
      account: 'Current Account',
    },
    {
      id: '7',
      description: 'Rent Payment',
      company: 'Property Management Co',
      amount: -1250.00,
      date: '3 days ago, 09:00',
      type: 'debit' as const,
      category: 'Housing',
      account: 'Current Account',
    },
    {
      id: '8',
      description: 'Pension Contribution',
      company: 'Employer Contribution',
      amount: 290.00,
      date: '5 days ago, 09:00',
      type: 'pension' as const,
      category: 'Pension',
      account: 'SIPP',
    },
    {
      id: '9',
      description: 'Personal Pension Contribution',
      company: 'Personal',
      amount: 290.00,
      date: '5 days ago, 09:00',
      type: 'pension' as const,
      category: 'Pension',
      account: 'SIPP',
    },
    {
      id: '10',
      description: 'Dividend Payment',
      company: 'iShares FTSE 100 ETF',
      amount: 12.50,
      date: '1 week ago, 10:30',
      type: 'dividend' as const,
      category: 'Dividend',
      account: 'Stocks & Shares ISA',
    },
    {
      id: '11',
      description: 'Amazon Purchase',
      company: 'Amazon UK',
      amount: -89.99,
      date: '1 week ago, 15:20',
      type: 'debit' as const,
      category: 'Shopping',
      account: 'Current Account',
    },
    {
      id: '12',
      description: 'Spotify Premium',
      company: 'Spotify',
      amount: -9.99,
      date: '1 week ago, 12:00',
      type: 'debit' as const,
      category: 'Entertainment',
      account: 'Current Account',
    },
    {
      id: '13',
      description: 'Uber Ride',
      company: 'Uber',
      amount: -15.50,
      date: '1 week ago, 20:30',
      type: 'debit' as const,
      category: 'Transport',
      account: 'Current Account',
    },
    {
      id: '14',
      description: 'Freelance Payment',
      company: 'Design Agency Ltd',
      amount: 750.00,
      date: '2 weeks ago, 14:00',
      type: 'credit' as const,
      category: 'Income',
      account: 'Current Account',
    },
    {
      id: '15',
      description: 'ISA Investment',
      company: 'Vanguard FTSE Developed World',
      amount: -250.00,
      date: '2 weeks ago, 09:00',
      type: 'investment' as const,
      category: 'Investment',
      account: 'Stocks & Shares ISA',
    },
    {
      id: '16',
      description: 'Gym Membership',
      company: 'PureGym',
      amount: -29.99,
      date: '2 weeks ago, 08:00',
      type: 'debit' as const,
      category: 'Health & Fitness',
      account: 'Current Account',
    },
  ];

  const handleAccountPress = (accountType: string) => {
    // Navigate directly to accounts tab with the selected account
    router.push({
      pathname: '/(tabs)/accounts',
      params: { selectedAccount: accountType }
    });
  };

  const toggleAccountVisibility = (accountId: string) => {
    setAccountVisibility(prev => ({
      ...prev,
      [accountId]: !prev[accountId]
    }));
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
          useNativeDriver: false, // Height animations cannot use native driver
        }),
        Animated.timing(prevAnimations.opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false, // Keep consistent with height animation
        }),
        Animated.timing(prevAnimations.chevronRotation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false, // Keep consistent with other animations
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
          useNativeDriver: false, // Height animations cannot use native driver
        }),
        Animated.timing(animations.opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false, // Keep consistent with height animation
        }),
        Animated.timing(animations.chevronRotation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false, // Keep consistent with other animations
        }),
      ]).start();
    } else {
      setExpandedIrsForm(null);
      // Collapse IRS forms accordion
      Animated.parallel([
        Animated.timing(animations.height, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false, // Height animations cannot use native driver
        }),
        Animated.timing(animations.opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false, // Keep consistent with height animation
        }),
        Animated.timing(animations.chevronRotation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false, // Keep consistent with other animations
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

    // Add platform detection and better error handling
    console.log('Export form requested:', formType, 'for account:', accountName);
    console.log('Platform:', Platform.OS);
    
    // Check if running in Expo Go
    const isExpoGo = __DEV__ && Platform.OS !== 'web';
    
    if (isExpoGo) {
      Alert.alert(
        'Feature Limited in Expo Go',
        `IRS form export is not available in Expo Go due to file system limitations.\n\nTo test this feature:\n• Use Expo Dev Client\n• Build a development build\n• Test on web platform`,
        [
          {
            text: 'Learn More',
            onPress: () => {
              // Open documentation about Expo Go limitations
              Alert.alert('Development Info', 'This feature requires native file system access not available in Expo Go. Consider using Expo Dev Client for full functionality testing.');
            }
          },
          { text: 'OK' }
        ]
      );
      return;
    }
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
          onPress: () => {
            try {
              // Use the document export service
              DocumentExportService.exportIRSForm({
                formType,
                accountName,
                userData: {
                  // Add relevant user data here
                  accountBalance: account.balance,
                  accountType: account.type,
                  // ... other relevant data
                }
              });
            } catch (error) {
              console.error('Export error:', error);
              Alert.alert('Export Failed', 'There was an error exporting the form. Please try again.');
            }
          }
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

  const handleSeeAllTransactions = () => {
    router.push('/(tabs)/activity');
  };

  // Parallax effect for header
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  const AccountDetailCard = ({ account, index }: { account: typeof accounts[0], index: number }) => {
    const animations = initializeAnimations(account.id);
    const isExpanded = expandedIrsForm === account.id;
    const balanceVisible = accountVisibility[account.id];

    const chevronRotate = animations.chevronRotation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '180deg'],
    });

    return (
      <PageTransition 
        isVisible={isVisible} 
        delay={index * 100}
        style={styles.accountCardWrapper}
        disableNativeOpacity={true}
      >
        <TouchableOpacity 
          style={styles.accountCard}
          onPress={() => handleAccountPress(account.type)}
          activeOpacity={0.95}
        >
          <LinearGradient
            colors={account.gradient}
            style={styles.accountHeader}
          >
            <TouchableOpacity 
              style={styles.visibilityButton}
              onPress={() => toggleAccountVisibility(account.id)}
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
                {account.icon}
              </View>
              <View>
                <Text style={styles.accountName}>{account.name}</Text>
                <Text style={styles.accountNumber}>{account.accountNumber}</Text>
              </View>
            </View>
            
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceAmount}>
                {balanceVisible ? `£${account.balance.toLocaleString('en-GB', { minimumFractionDigits: 2 })}` : '••••••'}
              </Text>
              <Text style={styles.balanceUSD}>
                {balanceVisible && !currencyLoading
                  ? `$${convertToUSD(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                  : '••••••'
                }
              </Text>
            </View>
            
            <View style={styles.irsFormsContainer}>
              <TouchableOpacity 
                style={styles.exportButton}
                onPress={() => toggleIrsFormsAccordion(account.id)}
                activeOpacity={0.8}
              >
                <FileText size={20} color="#FFFFFF" />
                <Text style={styles.exportButtonText}>Export IRS Forms</Text>
                <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
                  <ChevronDown size={20} color="#FFFFFF" />
                </Animated.View>
              </TouchableOpacity>

              <Animated.View style={[
                styles.irsFormsAccordion,
                {
                  height: animations.height,
                  opacity: animations.opacity,
                }
              ]}>
                <View style={styles.irsFormsContent}>
                  {account.type === 'current' ? (
                    <>
                      <TouchableOpacity 
                        style={styles.irsFormOption}
                        onPress={() => handleExportSpecificForm('form1099', account.name)}
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
                        onPress={() => handleExportSpecificForm('form2555', account.name)}
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
                  ) : account.type === 'isa' ? (
                    <>
                      <TouchableOpacity 
                        style={styles.irsFormOption}
                        onPress={() => handleExportSpecificForm('form8949', account.name)}
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
                        onPress={() => handleExportSpecificForm('form1099', account.name)}
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
                        onPress={() => handleExportSpecificForm('form5498', account.name)}
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
                        onPress={() => handleExportSpecificForm('form1041', account.name)}
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

          <View style={styles.accountDetails}>
            {account.type === 'current' && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Monthly Income</Text>
                  <View style={styles.positiveValueContainer}>
                    <Text style={[styles.detailValue, styles.positiveValue]}>
                      {balanceVisible 
                        ? `£${account.details.monthlyIncome.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`
                        : '••••••'
                      }
                    </Text>
                    <Text style={[styles.detailValueUSD, styles.positiveValue]}>
                      {balanceVisible && !currencyLoading
                        ? `$${convertToUSD(account.details.monthlyIncome).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
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
                        ? `£${account.details.monthlySpending.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`
                        : '••••••'
                      }
                    </Text>
                    <Text style={[styles.detailValueUSD, styles.negativeValue]}>
                      {balanceVisible && !currencyLoading
                        ? `$${convertToUSD(account.details.monthlySpending).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                        : '••••••'
                      }
                    </Text>
                  </View>
                </View>
              </>
            )}

            {account.type === 'isa' && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Invested</Text>
                  <CurrencyDisplay 
                    gbpAmount={account.details.totalInvested} 
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
                          ? `+£${account.details.totalGains.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`
                          : '+••••••'
                        }
                      </Text>
                      <Text style={[styles.detailValueUSD, styles.positiveValue]}>
                        {balanceVisible && !currencyLoading
                          ? `+$${convertToUSD(account.details.totalGains).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
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
                      ? `+${account.details.gainsPercentage}%`
                      : '+••••'
                    }
                  </Text>
                </View>
              </>
            )}

            {account.type === 'sipp' && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Contributions</Text>
                  <CurrencyDisplay 
                    gbpAmount={account.details.totalContributions} 
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
                          ? `+£${account.details.totalGains.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`
                          : '+••••••'
                        }
                      </Text>
                      <Text style={[styles.detailValueUSD, styles.positiveValue]}>
                        {balanceVisible && !currencyLoading
                          ? `+$${convertToUSD(account.details.totalGains).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
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
                      ? `+${account.details.gainsPercentage}%`
                      : '+••••'
                    }
                  </Text>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </PageTransition>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView 
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <Animated.View 
          style={[
            styles.header,
            {
              transform: [{ translateY: headerTranslateY }],
              opacity: headerOpacity,
            }
          ]}
        >
          <PageTransition isVisible={isVisible} delay={0}>
            <View>
              <Text style={styles.greeting}>Good morning</Text>
              <Text style={styles.name}>Sarah Johnson</Text>
            </View>
          </PageTransition>
        </Animated.View>

        <View style={styles.section}>
          <PageTransition isVisible={isVisible} delay={200}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Your Accounts</Text>
            </View>
          </PageTransition>
          {accounts.map((account, index) => (
            <AccountDetailCard key={account.id} account={account} index={index} />
          ))}
        </View>

        <View style={styles.section}>
          <PageTransition isVisible={isVisible} delay={600}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity onPress={handleSeeAllTransactions}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
          </PageTransition>
          <PageTransition isVisible={isVisible} delay={650}>
            <View style={styles.transactionsContainer}>
              <SearchableTransactions
                transactions={allTransactions}
                title=""
                showFilters={false}
                showAccountFilter={false}
                maxResults={6}
                onTransactionPress={handleTransactionPress}
              />
            </View>
          </PageTransition>
        </View>
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
  },
  greeting: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#64748B',
  },
  name: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: '#0F172A',
    marginTop: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitleContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: '#0F172A',
  },
  seeAll: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#1E40AF',
  },
  transactionsContainer: {
    flex: 1,
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
});