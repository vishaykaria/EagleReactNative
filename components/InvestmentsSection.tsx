import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, PanResponder, Animated } from 'react-native';
import { TrendingUp, TrendingDown, MoveHorizontal as MoreHorizontal, ChartPie as PieChart, ChartBar as BarChart3, Globe } from 'lucide-react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';

interface Holding {
  id: string;
  symbol: string;
  name: string;
  type: 'equity' | 'fund';
  shares: number;
  currentPrice: number;
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  totalReturn: number;
  totalReturnPercent: number;
  allocation: number;
  region: 'US' | 'UK' | 'Europe' | 'Emerging' | 'Global';
}

interface RegionalAllocation {
  region: string;
  percentage: number;
  value: number;
  color: string;
}

interface InvestmentsSectionProps {
  accountType: 'isa' | 'sipp';
  balanceVisible: boolean;
  totalValue: number;
}

export function InvestmentsSection({ accountType, balanceVisible, totalValue }: InvestmentsSectionProps) {
  const [selectedView, setSelectedView] = useState<'holdings' | 'allocation'>('allocation');
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const { convertToUSD } = useCurrencyConverter();

  // Get account-specific colors
  const accountColor = accountType === 'isa' ? '#059669' : '#7C3AED';
  const accountColorLight = accountType === 'isa' ? '#F0FDF4' : '#F3F4F6';

  // ISA Holdings - Direct Equities Only
  const isaHoldings: Holding[] = [
    {
      id: '1',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      type: 'equity',
      shares: 25,
      currentPrice: 185.50,
      totalValue: 4637.50,
      dayChange: 92.75,
      dayChangePercent: 2.04,
      totalReturn: 637.50,
      totalReturnPercent: 15.94,
      allocation: 25.0,
      region: 'US'
    },
    {
      id: '2',
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      type: 'equity',
      shares: 15,
      currentPrice: 378.25,
      totalValue: 5673.75,
      dayChange: -56.74,
      dayChangePercent: -0.99,
      totalReturn: 1173.75,
      totalReturnPercent: 26.08,
      allocation: 30.6,
      region: 'US'
    },
    {
      id: '3',
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      type: 'equity',
      shares: 20,
      currentPrice: 142.80,
      totalValue: 2856.00,
      dayChange: 28.56,
      dayChangePercent: 1.01,
      totalReturn: 356.00,
      totalReturnPercent: 14.24,
      allocation: 15.4,
      region: 'US'
    },
    {
      id: '4',
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      type: 'equity',
      shares: 12,
      currentPrice: 248.50,
      totalValue: 2982.00,
      dayChange: -89.46,
      dayChangePercent: -2.91,
      totalReturn: -518.00,
      totalReturnPercent: -14.80,
      allocation: 16.1,
      region: 'US'
    },
    {
      id: '5',
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      type: 'equity',
      shares: 8,
      currentPrice: 305.75,
      totalValue: 2446.00,
      dayChange: 73.38,
      dayChangePercent: 3.09,
      totalReturn: 946.00,
      totalReturnPercent: 63.07,
      allocation: 13.2,
      region: 'US'
    }
  ];

  // SIPP Holdings - Mix of Equities and Funds
  const sippHoldings: Holding[] = [
    {
      id: '1',
      symbol: 'VWRL',
      name: 'Vanguard FTSE All-World UCITS ETF',
      type: 'fund',
      shares: 150,
      currentPrice: 98.45,
      totalValue: 14767.50,
      dayChange: 147.68,
      dayChangePercent: 1.01,
      totalReturn: 2267.50,
      totalReturnPercent: 18.14,
      allocation: 32.3,
      region: 'Global'
    },
    {
      id: '2',
      symbol: 'VUSA',
      name: 'Vanguard S&P 500 UCITS ETF',
      type: 'fund',
      shares: 80,
      currentPrice: 89.25,
      totalValue: 7140.00,
      dayChange: -71.40,
      dayChangePercent: -0.99,
      totalReturn: 1140.00,
      totalReturnPercent: 19.00,
      allocation: 15.6,
      region: 'US'
    },
    {
      id: '3',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      type: 'equity',
      shares: 35,
      currentPrice: 185.50,
      totalValue: 6492.50,
      dayChange: 129.85,
      dayChangePercent: 2.04,
      totalReturn: 992.50,
      totalReturnPercent: 18.05,
      allocation: 14.2,
      region: 'US'
    },
    {
      id: '4',
      symbol: 'VDEM',
      name: 'Vanguard FTSE Emerging Markets UCITS ETF',
      type: 'fund',
      shares: 120,
      currentPrice: 45.80,
      totalValue: 5496.00,
      dayChange: 54.96,
      dayChangePercent: 1.01,
      totalReturn: 496.00,
      totalReturnPercent: 9.92,
      allocation: 12.0,
      region: 'Emerging'
    },
    {
      id: '5',
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      type: 'equity',
      shares: 10,
      currentPrice: 378.25,
      totalValue: 3782.50,
      dayChange: -37.83,
      dayChangePercent: -0.99,
      totalReturn: 782.50,
      totalReturnPercent: 26.08,
      allocation: 8.3,
      region: 'US'
    },
    {
      id: '6',
      symbol: 'VEUR',
      name: 'Vanguard FTSE Developed Europe UCITS ETF',
      type: 'fund',
      shares: 90,
      currentPrice: 32.15,
      totalValue: 2893.50,
      dayChange: 28.94,
      dayChangePercent: 1.01,
      totalReturn: 393.50,
      totalReturnPercent: 15.74,
      allocation: 6.3,
      region: 'Europe'
    },
    {
      id: '7',
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      type: 'equity',
      shares: 15,
      currentPrice: 142.80,
      totalValue: 2142.00,
      dayChange: 21.42,
      dayChangePercent: 1.01,
      totalReturn: 267.00,
      totalReturnPercent: 14.24,
      allocation: 4.7,
      region: 'US'
    },
    {
      id: '8',
      symbol: 'VGOV',
      name: 'Vanguard U.K. Gilt UCITS ETF',
      type: 'fund',
      shares: 60,
      currentPrice: 48.90,
      totalValue: 2934.00,
      dayChange: -29.34,
      dayChangePercent: -0.99,
      totalReturn: -66.00,
      totalReturnPercent: -2.20,
      allocation: 6.4,
      region: 'UK'
    }
  ];

  const holdings = accountType === 'isa' ? isaHoldings : sippHoldings;

  // Calculate regional allocation
  const calculateRegionalAllocation = (): RegionalAllocation[] => {
    const regionMap = new Map<string, { percentage: number; value: number }>();
    
    holdings.forEach(holding => {
      const existing = regionMap.get(holding.region) || { percentage: 0, value: 0 };
      regionMap.set(holding.region, {
        percentage: existing.percentage + holding.allocation,
        value: existing.value + holding.totalValue
      });
    });

    const colors = {
      'US': '#1E40AF',
      'UK': '#DC2626', 
      'Europe': '#059669',
      'Emerging': '#D97706',
      'Global': '#7C3AED'
    };

    return Array.from(regionMap.entries()).map(([region, data]) => ({
      region,
      percentage: data.percentage,
      value: data.value,
      color: colors[region as keyof typeof colors] || '#64748B'
    })).sort((a, b) => b.percentage - a.percentage);
  };

  const regionalAllocation = calculateRegionalAllocation();

  const totalDayChange = holdings.reduce((sum, holding) => sum + holding.dayChange, 0);
  const totalDayChangePercent = (totalDayChange / totalValue) * 100;
  const totalReturn = holdings.reduce((sum, holding) => sum + holding.totalReturn, 0);
  const totalReturnPercent = (totalReturn / (totalValue - totalReturn)) * 100;

  // Show tooltip with animation
  const showTooltip = (segmentIndex: number, x: number, y: number) => {
    setSelectedSegment(segmentIndex);
    setTooltipPosition({ x, y });
    Animated.timing(tooltipOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  // Hide tooltip with animation
  const hideTooltip = () => {
    Animated.timing(tooltipOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSelectedSegment(null);
      setTooltipPosition(null);
    });
  };

  // Calculate angle for each segment to detect touch position
  const calculateSegmentAngles = (data: RegionalAllocation[]) => {
    let cumulativeAngle = 0;
    return data.map(item => {
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + (item.percentage / 100) * 360;
      cumulativeAngle = endAngle;
      return { startAngle, endAngle, ...item };
    });
  };

  // Detect which segment was touched
  const detectTouchedSegment = (x: number, y: number, centerX: number, centerY: number) => {
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Check if touch is within the pie chart radius - made smaller to prevent overflow
    const outerRadius = 55; // Reduced from 70 to 55
    const innerRadius = 25; // Reduced from 35 to 25
    if (distance < innerRadius || distance > outerRadius) {
      return -1;
    }

    // Calculate angle of touch point
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    angle = (angle + 90 + 360) % 360; // Normalize to 0-360 starting from top

    // Find which segment this angle belongs to
    const segmentAngles = calculateSegmentAngles(regionalAllocation);
    for (let i = 0; i < segmentAngles.length; i++) {
      if (angle >= segmentAngles[i].startAngle && angle <= segmentAngles[i].endAngle) {
        return i;
      }
    }
    return -1;
  };

  // Pie Chart Component with Touch Handling
  const PieChartComponent = ({ data }: { data: RegionalAllocation[] }) => {
    const size = 160; // Reduced container size from 200px to 160px
    const chartSize = 120; // Keep actual chart size at 120px
    const strokeWidth = 15; // Keep stroke width
    const radius = (chartSize - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const centerOffset = (size - chartSize) / 2; // Center the smaller chart in larger container
    
    let cumulativePercentage = 0;

    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        const { locationX, locationY } = event.nativeEvent;
        const centerX = size / 2;
        const centerY = size / 2;
        const segmentIndex = detectTouchedSegment(locationX, locationY, centerX, centerY);
        
        if (segmentIndex >= 0) {
          showTooltip(segmentIndex, locationX, locationY);
        }
      },
      onPanResponderMove: (event) => {
        const { locationX, locationY } = event.nativeEvent;
        const centerX = size / 2;
        const centerY = size / 2;
        const segmentIndex = detectTouchedSegment(locationX, locationY, centerX, centerY);
        
        if (segmentIndex >= 0 && segmentIndex !== selectedSegment) {
          showTooltip(segmentIndex, locationX, locationY);
        } else if (segmentIndex < 0 && selectedSegment !== null) {
          hideTooltip();
        }
      },
      onPanResponderRelease: () => {
        hideTooltip();
      },
    });

    return (
      <View style={styles.pieChartContainer}>
        <Text style={styles.pieChartHint}>Tap and hold segments to see values</Text>
        <View style={styles.pieChartWrapper} {...panResponder.panHandlers}>
          <Svg width={size} height={size} style={styles.pieChart}>
            {data.map((item, index) => {
              const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -cumulativePercentage * circumference / 100;
              const isSelected = selectedSegment === index;
              
              cumulativePercentage += item.percentage;
              
              return (
                <Circle
                  key={item.region}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={item.color}
                  strokeWidth={isSelected ? strokeWidth + 2 : strokeWidth}
                  fill="transparent"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                  opacity={isSelected ? 1 : (selectedSegment !== null ? 0.6 : 1)}
                />
              );
            })}
            
            {/* Center icon */}
            <SvgText
              x={size / 2}
              y={size / 2 + 6}
              textAnchor="middle"
              fontSize="20"
              fill="#64748B"
            >
              🌍
            </SvgText>
          </Svg>

          {/* Tooltip - positioned more carefully to avoid overflow */}
          {selectedSegment !== null && tooltipPosition && (
            <Animated.View
              style={[
                styles.tooltip,
                {
                  opacity: tooltipOpacity,
                  left: Math.min(Math.max(tooltipPosition.x - 70, 10), size - 130), // Adjusted for 160px container
                  top: Math.min(Math.max(tooltipPosition.y - 90, 10), size - 80), // Adjusted for 160px container
                }
              ]}
            >
              <Text style={styles.tooltipRegion}>{data[selectedSegment].region}</Text>
              <Text style={styles.tooltipPercentage}>{data[selectedSegment].percentage.toFixed(1)}%</Text>
              <Text style={styles.tooltipValue}>
                {balanceVisible 
                  ? `£${data[selectedSegment].value.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`
                  : '••••••'
                }
              </Text>
            </Animated.View>
          )}
        </View>
        
        {/* Compact Legend */}
        <View style={styles.compactLegend}>
          {data.map((item, index) => (
            <View key={item.region} style={styles.compactLegendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.compactLegendText}>{item.region}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const HoldingItem = ({ holding, index }: { holding: Holding, index: number }) => (
    <View style={styles.holdingItem}>
      <View style={styles.holdingRank}>
        <Text style={styles.rankNumber}>{index + 1}</Text>
      </View>
      <View style={styles.holdingInfo}>
        <View style={styles.holdingTitleRow}>
          <Text style={styles.holdingSymbol}>{holding.symbol}</Text>
          <View style={[
            styles.typeTag,
            { backgroundColor: holding.type === 'equity' ? '#EBF4FF' : '#F0FDF4' }
          ]}>
            <Text style={[
              styles.typeTagText,
              { color: holding.type === 'equity' ? '#1E40AF' : '#059669' }
            ]}>
              {holding.type === 'equity' ? 'Stock' : 'Fund'}
            </Text>
          </View>
          <View style={[
            styles.regionTag,
            { backgroundColor: regionalAllocation.find(r => r.region === holding.region)?.color + '20' || '#F1F5F9' }
          ]}>
            <Text style={[
              styles.regionTagText,
              { color: regionalAllocation.find(r => r.region === holding.region)?.color || '#64748B' }
            ]}>
              {holding.region}
            </Text>
          </View>
        </View>
        <Text style={styles.holdingName} numberOfLines={1}>{holding.name}</Text>
        <Text style={styles.holdingShares}>
          {holding.shares} shares @ £{holding.currentPrice.toFixed(2)}
        </Text>
      </View>
      <View style={styles.holdingAllocation}>
        <Text style={styles.holdingPercent}>{holding.allocation.toFixed(1)}%</Text>
        <Text style={styles.holdingValue}>
          {balanceVisible ? `£${holding.totalValue.toLocaleString('en-GB')}` : '••••••'}
        </Text>
      </View>
    </View>
  );

  const AllocationView = () => {
    const equityHoldings = holdings.filter(h => h.type === 'equity');
    const fundHoldings = holdings.filter(h => h.type === 'fund');
    
    const equityAllocation = equityHoldings.reduce((sum, h) => sum + h.allocation, 0);
    const fundAllocation = fundHoldings.reduce((sum, h) => sum + h.allocation, 0);

    return (
      <View style={styles.allocationContainer}>
        {/* Regional Allocation Pie Chart */}
        <View style={styles.regionalAllocationSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconContainer}>
              <Globe size={20} color="#64748B" />
            </View>
            <Text style={styles.allocationTitle}>Regional Allocation</Text>
          </View>
          <PieChartComponent data={regionalAllocation} />
        </View>

        {accountType === 'sipp' && (
          <View style={styles.assetTypeBreakdown}>
            <Text style={styles.allocationTitle}>Asset Type Allocation</Text>
            <View style={styles.assetTypeRow}>
              <View style={styles.assetTypeItem}>
                <View style={[styles.assetTypeDot, { backgroundColor: '#1E40AF' }]} />
                <Text style={styles.assetTypeLabel}>Equities</Text>
                <Text style={styles.assetTypePercent}>{equityAllocation.toFixed(1)}%</Text>
              </View>
              <View style={styles.assetTypeItem}>
                <View style={[styles.assetTypeDot, { backgroundColor: '#059669' }]} />
                <Text style={styles.assetTypeLabel}>Funds</Text>
                <Text style={styles.assetTypePercent}>{fundAllocation.toFixed(1)}%</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.topHoldingsSection}>
          <Text style={styles.allocationTitle}>Top Holdings</Text>
          {holdings.slice(0, 5).map((holding, index) => (
            <View key={holding.id} style={styles.topHoldingItem}>
              <View style={styles.topHoldingRank}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
              </View>
              <View style={styles.topHoldingInfo}>
                <Text style={styles.topHoldingSymbol}>{holding.symbol}</Text>
                <Text style={styles.topHoldingName} numberOfLines={1}>{holding.name}</Text>
              </View>
              <View style={styles.topHoldingAllocation}>
                <Text style={styles.topHoldingPercent}>{holding.allocation.toFixed(1)}%</Text>
                <Text style={styles.topHoldingValue}>
                  {balanceVisible ? `£${holding.totalValue.toLocaleString('en-GB')}` : '••••••'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const HoldingsView = () => (
    <View style={styles.holdingsList}>
      {holdings.map((holding, index) => (
        <HoldingItem key={holding.id} holding={holding} index={index} />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Investments</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[
              styles.viewButton, 
              selectedView === 'allocation' && [styles.activeViewButton, { backgroundColor: accountColor }]
            ]}
            onPress={() => setSelectedView('allocation')}
          >
            <PieChart size={20} color={selectedView === 'allocation' ? '#FFFFFF' : '#64748B'} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.viewButton, 
              selectedView === 'holdings' && [styles.activeViewButton, { backgroundColor: accountColor }]
            ]}
            onPress={() => setSelectedView('holdings')}
          >
            <BarChart3 size={20} color={selectedView === 'holdings' ? '#FFFFFF' : '#64748B'} />
          </TouchableOpacity>
        </View>
      </View>

      {selectedView === 'allocation' ? <AllocationView /> : <HoldingsView />}
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
    // backgroundColor will be set dynamically based on account type
  },
  holdingsList: {
    padding: 20,
  },
  holdingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  holdingRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: '#64748B',
  },
  holdingInfo: {
    flex: 1,
  },
  holdingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  holdingSymbol: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#0F172A',
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  typeTagText: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
  },
  regionTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  regionTagText: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
  },
  holdingName: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  holdingShares: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#94A3B8',
  },
  holdingAllocation: {
    alignItems: 'flex-end',
  },
  holdingPercent: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 2,
  },
  holdingValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#64748B',
  },
  allocationContainer: {
    padding: 20,
  },
  regionalAllocationSection: {
    marginBottom: 32,
    paddingVertical: 24, // Reduced from 30 to 24 for 160px container
    paddingHorizontal: 30, // Reduced from 37 to 30 for 160px container
    backgroundColor: '#FAFBFC',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 20,
    gap: 8,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  pieChartContainer: {
    alignItems: 'center',
  },
  pieChartHint: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  pieChartWrapper: {
    position: 'relative',
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieChart: {
    // No additional styles needed
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 140,
    maxWidth: 180,
    alignItems: 'center',
    zIndex: 1000,
  },
  tooltipRegion: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'center',
    width: '100%',
  },
  tooltipPercentage: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#1E40AF',
    marginBottom: 2,
    textAlign: 'center',
    width: '100%',
  },
  tooltipValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    width: '100%',
  },
  compactLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 20,
  },
  compactLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  compactLegendText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#64748B',
  },
  assetTypeBreakdown: {
    marginBottom: 24,
  },
  allocationTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 16,
  },
  assetTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  assetTypeItem: {
    alignItems: 'center',
    flex: 1,
  },
  assetTypeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  assetTypeLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  assetTypePercent: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#0F172A',
  },
  topHoldingsSection: {
    marginBottom: 24,
  },
  topHoldingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  topHoldingRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  topHoldingInfo: {
    flex: 1,
  },
  topHoldingSymbol: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 2,
  },
  topHoldingName: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#64748B',
  },
  topHoldingAllocation: {
    alignItems: 'flex-end',
  },
  topHoldingPercent: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 2,
  },
  topHoldingValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#64748B',
  },
});