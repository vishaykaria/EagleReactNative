import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Filter, Search, ArrowUpRight, ArrowDownLeft, TrendingUp, ShoppingCart, Coffee, Car, Chrome as Home, Gamepad2, X } from 'lucide-react-native';
import { PageTransition } from '@/components/PageTransition';
import { useFocusEffect } from 'expo-router';

export default function ActivityScreen() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Trigger entrance animation when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setIsVisible(true);
      return () => setIsVisible(false);
    }, [])
  );

  const allTransactions = [
    {
      id: '1',
      description: 'Salary Payment',
      company: 'TechCorp Ltd',
      amount: 3500.00,
      date: 'Today, 09:00',
      type: 'credit',
      category: 'Income',
      icon: <ArrowDownLeft size={20} color="#10B981" />,
      account: 'Current Account',
    },
    {
      id: '2',
      description: 'ISA Monthly Investment',
      company: 'Vanguard S&P 500',
      amount: -500.00,
      date: 'Today, 08:30',
      type: 'investment',
      category: 'Investment',
      icon: <TrendingUp size={20} color="#7C3AED" />,
      account: 'Stocks & Shares ISA',
    },
    {
      id: '3',
      description: 'Tesco Grocery Shopping',
      company: 'Tesco Express',
      amount: -127.45,
      date: 'Yesterday, 18:45',
      type: 'debit',
      category: 'Shopping',
      icon: <ShoppingCart size={20} color="#EF4444" />,
      account: 'Current Account',
    },
    {
      id: '4',
      description: 'Starbucks Coffee',
      company: 'Starbucks Store #1234',
      amount: -4.85,
      date: 'Yesterday, 14:20',
      type: 'debit',
      category: 'Food & Drink',
      icon: <Coffee size={20} color="#EF4444" />,
      account: 'Current Account',
    },
    {
      id: '5',
      description: 'Fuel Purchase',
      company: 'Shell Station',
      amount: -67.23,
      date: 'Yesterday, 12:15',
      type: 'debit',
      category: 'Transport',
      icon: <Car size={20} color="#EF4444" />,
      account: 'Current Account',
    },
    {
      id: '6',
      description: 'Netflix Subscription',
      company: 'Netflix',
      amount: -12.99,
      date: '2 days ago, 10:00',
      type: 'debit',
      category: 'Entertainment',
      icon: <Gamepad2 size={20} color="#EF4444" />,
      account: 'Current Account',
    },
    {
      id: '7',
      description: 'Rent Payment',
      company: 'Property Management Co',
      amount: -1250.00,
      date: '3 days ago, 09:00',
      type: 'debit',
      category: 'Housing',
      icon: <Home size={20} color="#EF4444" />,
      account: 'Current Account',
    },
    {
      id: '8',
      description: 'Pension Contribution',
      company: 'Employer Contribution',
      amount: 290.00,
      date: '5 days ago, 09:00',
      type: 'pension',
      category: 'Pension',
      icon: <TrendingUp size={20} color="#7C3AED" />,
      account: 'Personal Pension',
    },
    {
      id: '9',
      description: 'Dividend Payment',
      company: 'iShares FTSE 100 ETF',
      amount: 12.50,
      date: '1 week ago, 10:30',
      type: 'dividend',
      category: 'Dividend',
      icon: <TrendingUp size={20} color="#10B981" />,
      account: 'Stocks & Shares ISA',
    },
    {
      id: '10',
      description: 'Amazon Purchase',
      company: 'Amazon UK',
      amount: -89.99,
      date: '1 week ago, 15:20',
      type: 'debit',
      category: 'Shopping',
      icon: <ShoppingCart size={20} color="#EF4444" />,
      account: 'Current Account',
    },
    {
      id: '11',
      description: 'Spotify Premium',
      company: 'Spotify',
      amount: -9.99,
      date: '1 week ago, 12:00',
      type: 'debit',
      category: 'Entertainment',
      icon: <Gamepad2 size={20} color="#EF4444" />,
      account: 'Current Account',
    },
    {
      id: '12',
      description: 'Uber Ride',
      company: 'Uber',
      amount: -15.50,
      date: '1 week ago, 20:30',
      type: 'debit',
      category: 'Transport',
      icon: <Car size={20} color="#EF4444" />,
      account: 'Current Account',
    },
    {
      id: '13',
      description: 'Freelance Payment',
      company: 'Design Agency Ltd',
      amount: 750.00,
      date: '2 weeks ago, 14:00',
      type: 'credit',
      category: 'Income',
      icon: <ArrowDownLeft size={20} color="#10B981" />,
      account: 'Current Account',
    },
    {
      id: '14',
      description: 'ISA Investment',
      company: 'Vanguard FTSE Developed World',
      amount: -250.00,
      date: '2 weeks ago, 09:00',
      type: 'investment',
      category: 'Investment',
      icon: <TrendingUp size={20} color="#7C3AED" />,
      account: 'Stocks & Shares ISA',
    },
    {
      id: '15',
      description: 'Gym Membership',
      company: 'PureGym',
      amount: -29.99,
      date: '2 weeks ago, 08:00',
      type: 'debit',
      category: 'Health & Fitness',
      icon: <TrendingUp size={20} color="#EF4444" />,
      account: 'Current Account',
    },
  ];

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'credit', label: 'Income' },
    { id: 'debit', label: 'Spending' },
    { id: 'investment', label: 'Investments' },
    { id: 'pension', label: 'Pension' },
    { id: 'dividend', label: 'Dividends' },
  ];

  // Filter and search transactions
  const filteredTransactions = useMemo(() => {
    let filtered = allTransactions;

    // Apply type filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(t => t.type === selectedFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(query) ||
        t.company.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        t.account.toLowerCase().includes(query) ||
        t.amount.toString().includes(query)
      );
    }

    return filtered;
  }, [selectedFilter, searchQuery]);

  const totalIncome = allTransactions
    .filter(t => t.type === 'credit' || t.type === 'dividend')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpending = allTransactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const toggleSearch = () => {
    setSearchVisible(!searchVisible);
    if (searchVisible) {
      setSearchQuery('');
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  // Parallax effect for header
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -20],
    extrapolate: 'clamp',
  });

  const TransactionItem = ({ transaction, index }: { transaction: typeof allTransactions[0], index: number }) => (
    <PageTransition isVisible={isVisible} delay={400 + (index * 30)}>
      <TouchableOpacity style={styles.transactionItem}>
        <View style={styles.transactionIcon}>
          {transaction.icon}
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
          <Text style={styles.transactionAccount}>{transaction.account}</Text>
        </View>
      </TouchableOpacity>
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
          <Text style={styles.title}>Activity</Text>
        </PageTransition>
        <PageTransition isVisible={isVisible} delay={100}>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={[styles.headerButton, searchVisible && styles.headerButtonActive]}
              onPress={toggleSearch}
            >
              <Search size={20} color={searchVisible ? "#1E40AF" : "#64748B"} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Calendar size={20} color="#64748B" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Filter size={20} color="#64748B" />
            </TouchableOpacity>
          </View>
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
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <PageTransition isVisible={isVisible} delay={150}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIconContainer}>
                <ArrowDownLeft size={20} color="#10B981" />
              </View>
              <Text style={styles.summaryLabel}>Income</Text>
              <Text style={[styles.summaryAmount, styles.positiveAmount]}>
                +£{totalIncome.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </PageTransition>
          <PageTransition isVisible={isVisible} delay={200}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIconContainer}>
                <ArrowUpRight size={20} color="#EF4444" />
              </View>
              <Text style={styles.summaryLabel}>Spending</Text>
              <Text style={[styles.summaryAmount, styles.negativeAmount]}>
                -£{totalSpending.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </PageTransition>
        </View>

        {/* Filter Tabs */}
        <PageTransition isVisible={isVisible} delay={250}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContainer}
          >
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterTab,
                  selectedFilter === filter.id && styles.activeFilterTab
                ]}
                onPress={() => setSelectedFilter(filter.id)}
              >
                <Text style={[
                  styles.filterTabText,
                  selectedFilter === filter.id && styles.activeFilterTabText
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </PageTransition>

        {/* Search Bar */}
        {searchVisible && (
          <PageTransition isVisible={searchVisible} duration={200}>
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Search size={20} color="#64748B" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search transactions..."
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus={true}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                    <X size={20} color="#64748B" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </PageTransition>
        )}

        {/* Search Results Info */}
        {searchQuery.trim() && (
          <PageTransition isVisible={!!searchQuery.trim()} delay={0}>
            <View style={styles.searchResultsInfo}>
              <Text style={styles.searchResultsText}>
                {filteredTransactions.length} result{filteredTransactions.length !== 1 ? 's' : ''} for "{searchQuery}"
              </Text>
            </View>
          </PageTransition>
        )}

        {/* Transactions List */}
        <View style={styles.transactionsList}>
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction, index) => (
              <TransactionItem key={transaction.id} transaction={transaction} index={index} />
            ))
          ) : (
            <PageTransition isVisible={isVisible} delay={400}>
              <View style={styles.emptyState}>
                <Search size={48} color="#94A3B8" />
                <Text style={styles.emptyStateTitle}>No transactions found</Text>
                <Text style={styles.emptyStateText}>
                  {searchQuery.trim() 
                    ? `No transactions match "${searchQuery}"`
                    : 'No transactions match the selected filter'
                  }
                </Text>
              </View>
            </PageTransition>
          )}
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
    backgroundColor: '#F8FAFC',
    zIndex: 1,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    color: '#0F172A',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerButtonActive: {
    backgroundColor: '#EBF4FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#0F172A',
  },
  clearButton: {
    padding: 4,
  },
  searchResultsInfo: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchResultsText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#64748B',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  summaryAmount: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
  },
  positiveAmount: {
    color: '#10B981',
  },
  negativeAmount: {
    color: '#EF4444',
  },
  filterScroll: {
    marginBottom: 24,
  },
  filterContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeFilterTab: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  filterTabText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#64748B',
  },
  activeFilterTabText: {
    color: '#FFFFFF',
  },
  transactionsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
  transactionAccount: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#94A3B8',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#64748B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
});