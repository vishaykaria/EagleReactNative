import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';

interface CurrencyDisplayProps {
  gbpAmount: number;
  balanceVisible: boolean;
  style?: 'primary' | 'secondary' | 'detail';
}

export function CurrencyDisplay({ gbpAmount, balanceVisible, style = 'primary' }: CurrencyDisplayProps) {
  const { convertToUSD, loading, error } = useCurrencyConverter();

  const usdAmount = convertToUSD(gbpAmount);

  const getStyles = () => {
    switch (style) {
      case 'primary':
        return {
          gbp: styles.primaryGBP,
          usd: styles.primaryUSD,
          container: styles.primaryContainer,
        };
      case 'secondary':
        return {
          gbp: styles.secondaryGBP,
          usd: styles.secondaryUSD,
          container: styles.secondaryContainer,
        };
      case 'detail':
        return {
          gbp: styles.detailGBP,
          usd: styles.detailUSD,
          container: styles.detailContainer,
        };
      default:
        return {
          gbp: styles.primaryGBP,
          usd: styles.primaryUSD,
          container: styles.primaryContainer,
        };
    }
  };

  const styleSet = getStyles();

  if (loading) {
    return (
      <View style={styleSet.container}>
        <Text style={styleSet.gbp}>
          {balanceVisible ? `£${gbpAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}` : '••••••'}
        </Text>
        <Text style={styleSet.usd}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styleSet.container}>
        <Text style={styleSet.gbp}>
          {balanceVisible ? `£${gbpAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}` : '••••••'}
        </Text>
        <Text style={[styleSet.usd, styles.errorText]}>Unavailable</Text>
      </View>
    );
  }

  return (
    <View style={styleSet.container}>
      <Text style={styleSet.gbp}>
        {balanceVisible ? `£${gbpAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}` : '••••••'}
      </Text>
      <Text style={styleSet.usd}>
        {balanceVisible ? `$${usdAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '••••••'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Primary styles (for main balance display)
  primaryContainer: {
    alignItems: 'flex-start',
  },
  primaryGBP: {
    fontFamily: 'Inter-Bold',
    fontSize: 36,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  primaryUSD: {
    fontFamily: 'Inter-Medium',
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // Secondary styles (for account cards)
  secondaryContainer: {
    alignItems: 'flex-start',
  },
  secondaryGBP: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  secondaryUSD: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // Detail styles (for account details)
  detailContainer: {
    alignItems: 'flex-end',
  },
  detailGBP: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 2,
  },
  detailUSD: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#64748B',
  },

  errorText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
  },
});