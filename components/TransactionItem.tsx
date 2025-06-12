import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowUpRight, ArrowDownLeft, TrendingUp, ShoppingCart, Coffee, Car, Chrome as Home, Gamepad2 } from 'lucide-react-native';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'credit' | 'debit' | 'investment';
  category: string;
}

interface TransactionItemProps {
  transaction: Transaction;
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const getIcon = () => {
    switch (transaction.category.toLowerCase()) {
      case 'income':
        return <ArrowDownLeft size={20} color="#10B981" />;
      case 'investment':
        return <TrendingUp size={20} color="#7C3AED" />;
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

  const getAmountColor = () => {
    return transaction.amount > 0 ? '#10B981' : '#EF4444';
  };

  return (
    <TouchableOpacity style={styles.container}>
      <View style={styles.iconContainer}>
        {getIcon()}
      </View>
      <View style={styles.details}>
        <Text style={styles.description}>{transaction.description}</Text>
        <Text style={styles.category}>{transaction.category}</Text>
        <Text style={styles.date}>{transaction.date}</Text>
      </View>
      <Text style={[styles.amount, { color: getAmountColor() }]}>
        {transaction.amount > 0 ? '+' : ''}£{Math.abs(transaction.amount).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  description: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 2,
  },
  category: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  date: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#94A3B8',
  },
  amount: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
});