import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Search, X, Filter, Calendar, ArrowUpRight, ArrowDownLeft, TrendingUp, ShoppingCart, Coffee, Car, Chrome as Home, Gamepad2, DollarSign } from 'lucide-react-native';

interface Transaction {
  id: string;
  description: string;
  company: string;
  amount: number;
  date: string;
  type: 'credit' | 'debit' | 'investment' | 'pension' | 'dividend';
  category: string;
  account: string;
}

interface SearchableTransactionsProps {
  transactions: Transaction[];
  title?: string;
  showFilters?: boolean;
  showAccountFilter?: boolean;
  maxResults?: number;
  onTransactionPress?: (transaction: Transaction) => void;
  availableFilters?: string[];
}

export function SearchableTransactions({ 
  transactions, 
  title = "Recent Transactions",
  showFilters = true,
  showAccountFilter = true,
  maxResults,
  onTransactionPress,
  availableFilters = ['all', 'credit', 'debit', 'investment', 'pension', 'dividend']
}: SearchableTransactionsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedAccount, setSelectedAccount] = useState('all');
  
  const searchAnim = useRef(new Animated.Value(0)).current;
  const filterAnim = useRef(new Animated.Value(0)).current;

  const allFilters = [
    { id: 'all', label: 'All', color: '#64748B' },
    { id: 'credit', label: 'Income', color: '#10B981' },
    { id: 'debit', label: 'Spending', color: '#EF4444' },
    { id: 'investment', label: 'Investments', color: '#7C3AED' },
    { id: 'pension', label: 'Pension', color: '#7C3AED' },
    { id: 'dividend', label: 'Dividends', color: '#10B981' },
  ];

  // Filter the available filters based on the availableFilters prop
  const filters = allFilters.filter(filter => availableFilters.includes(filter.id));

  const accounts = useMemo(() => {
    if (!showAccountFilter) return [];
    
    const uniqueAccounts = [...new Set(transactions.map(t => t.account))];
    return [
      { id: 'all', label: 'All Accounts' },
      ...uniqueAccounts.map(account => ({ id: account, label: account }))
    ];
  }, [transactions, showAccountFilter]);

  // Filter and search transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Apply type filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(t => t.type === selectedFilter);
    }

    // Apply account filter (only if showAccountFilter is true)
    if (showAccountFilter && selectedAccount !== 'all') {
      filtered = filtered.filter(t => t.account === selectedAccount);
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

    // Apply max results limit
    if (maxResults) {
      filtered = filtered.slice(0, maxResults);
    }

    return filtered;
  }, [transactions, selectedFilter, selectedAccount, searchQuery, maxResults, showAccountFilter]);

  const toggleSearch = () => {
    const isOpening = !searchVisible;
    setSearchVisible(isOpening);
    
    Animated.timing(searchAnim, {
      toValue: isOpening ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();

    if (!isOpening) {
      setSearchQuery('');
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const resetFilters = () => {
    setSelectedFilter('all');
    if (showAccountFilter) {
      setSelectedAccount('all');
    }
    setSearchQuery('');
  };

  const getTransactionIcon = (transaction: Transaction) => {
    switch (transaction.category.toLowerCase()) {
      case 'income':
        return <ArrowDownLeft size={20} color="#10B981" />;
      case 'investment':
        return <TrendingUp size={20} color="#7C3AED" />;
      case 'pension':
        return <TrendingUp size={20} color="#7C3AED" />;
      case 'dividend':
        return <DollarSign size={20} color="#10B981" />;
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

  const TransactionItem = ({ transaction }: { transaction: Transaction }) => (
    <TouchableOpacity 
      style={styles.transactionItem}
      onPress={() => onTransactionPress?.(transaction)}
      activeOpacity={0.7}
    >
      <View style={styles.transactionIcon}>
        {getTransactionIcon(transaction)}
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionDescription}>{transaction.description}</Text>
        <Text style={styles.transactionCompany}>{transaction.company}</Text>
        <View style={styles.transactionMeta}>
          <Text style={styles.transactionDate}>{transaction.date}</Text>
          {showAccountFilter && (
            <Text style={styles.transactionAccount}>{transaction.account}</Text>
          )}
        </View>
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
  );

  const searchHeight = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 60],
  });

  const filterHeight = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, showFilters ? (showAccountFilter ? 120 : 60) : 0],
  });

  const hasActiveFilters = selectedFilter !== 'all' || (showAccountFilter && selectedAccount !== 'all') || searchQuery.trim();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.headerButton, searchVisible && styles.headerButtonActive]}
            onPress={toggleSearch}
            activeOpacity={0.7}
          >
            <Search size={20} color={searchVisible ? "#1E40AF" : "#64748B"} />
          </TouchableOpacity>
          {hasActiveFilters && (
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={resetFilters}
              activeOpacity={0.7}
            >
              <X size={16} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Bar */}
      <Animated.View style={[styles.searchContainer, { height: searchHeight }]}>
        {searchVisible && (
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#64748B" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search transactions..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </Animated.View>

      {/* Filters */}
      {showFilters && (
        <Animated.View style={[styles.filtersContainer, { height: filterHeight }]}>
          {searchVisible && (
            <View style={styles.filtersContent}>
              {/* Type Filters */}
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroll}
                contentContainerStyle={styles.filterRow}
              >
                {filters.map((filter) => (
                  <TouchableOpacity
                    key={filter.id}
                    style={[
                      styles.filterChip,
                      selectedFilter === filter.id && styles.activeFilterChip
                    ]}
                    onPress={() => setSelectedFilter(filter.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.filterChipText,
                      selectedFilter === filter.id && styles.activeFilterChipText
                    ]}>
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Account Filters - Only show if showAccountFilter is true */}
              {showAccountFilter && (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.filterScroll}
                  contentContainerStyle={styles.filterRow}
                >
                  {accounts.map((account) => (
                    <TouchableOpacity
                      key={account.id}
                      style={[
                        styles.filterChip,
                        selectedAccount === account.id && styles.activeFilterChip
                      ]}
                      onPress={() => setSelectedAccount(account.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.filterChipText,
                        selectedAccount === account.id && styles.activeFilterChipText
                      ]}>
                        {account.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}
        </Animated.View>
      )}

      {/* Search Results Info */}
      {(searchQuery.trim() || hasActiveFilters) && (
        <View style={styles.searchResultsInfo}>
          <Text style={styles.searchResultsText}>
            {filteredTransactions.length} result{filteredTransactions.length !== 1 ? 's' : ''}
            {searchQuery.trim() && ` for "${searchQuery}"`}
          </Text>
        </View>
      )}

      {/* Transactions List */}
      <ScrollView 
        style={styles.transactionsList}
        showsVerticalScrollIndicator={false}
      >
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((transaction) => (
            <TransactionItem key={transaction.id} transaction={transaction} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Search size={48} color="#94A3B8" />
            <Text style={styles.emptyStateTitle}>No transactions found</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery.trim() 
                ? `No transactions match "${searchQuery}"`
                : 'No transactions match the selected filters'
              }
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: '#0F172A',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerButtonActive: {
    backgroundColor: '#EBF4FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  resetButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
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
  filtersContainer: {
    overflow: 'hidden',
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterRow: {
    gap: 8,
    paddingRight: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeFilterChip: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  filterChipText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#64748B',
  },
  activeFilterChipText: {
    color: '#FFFFFF',
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
  transactionsList: {
    flex: 1,
    paddingHorizontal: 20,
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
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#94A3B8',
  },
  transactionAccount: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#1E40AF',
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