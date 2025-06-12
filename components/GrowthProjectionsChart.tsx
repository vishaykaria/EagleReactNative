import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, PanResponder, Animated, Dimensions } from 'react-native';
import { TrendingUp, TrendingDown, Target, Info } from 'lucide-react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';

interface ProjectionDataPoint {
  year: number;
  age: number;
  pessimistic: number;
  average: number;
  outperform: number;
  contributions: number;
}

interface GrowthProjectionsChartProps {
  accountType: 'isa' | 'sipp';
  balanceVisible: boolean;
  currentValue: number;
  monthlyContribution: number;
  currentAge: number;
  targetAge: number;
  annualAllowance?: number; // For ISA
  employerContribution?: number; // For SIPP
}

export function GrowthProjectionsChart({
  accountType,
  balanceVisible,
  currentValue,
  monthlyContribution,
  currentAge,
  targetAge,
  annualAllowance = 20000, // Default ISA allowance
  employerContribution = 0
}: GrowthProjectionsChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<'pessimistic' | 'average' | 'outperform' | null>(null);
  const [touchPosition, setTouchPosition] = useState<{ x: number; y: number } | null>(null);
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const { convertToUSD } = useCurrencyConverter();

  // Chart dimensions
  const GRAPH_WIDTH = Math.min(screenData.width - 80, 340);
  const GRAPH_HEIGHT = 200;
  const GRAPH_PADDING = 20;

  // Projection scenarios
  const scenarios = {
    pessimistic: { rate: 0.05, color: '#EF4444', label: 'Pessimistic (5%)' },
    average: { rate: 0.08, color: '#059669', label: 'Average (8%)' },
    outperform: { rate: 0.10, color: '#7C3AED', label: 'Outperform (10%)' }
  };

  // Generate projection data
  const generateProjectionData = (): ProjectionDataPoint[] => {
    const data: ProjectionDataPoint[] = [];
    const yearsToProject = targetAge - currentAge;
    const totalMonthlyContrib = monthlyContribution + (employerContribution || 0);
    
    for (let year = 0; year <= yearsToProject; year++) {
      const currentYear = new Date().getFullYear() + year;
      const age = currentAge + year;
      
      // Calculate contributions up to this point
      let totalContributions = currentValue;
      if (accountType === 'isa') {
        // Respect ISA allowance limits
        const yearlyContrib = Math.min(monthlyContribution * 12, annualAllowance);
        totalContributions += yearlyContrib * year;
      } else {
        // SIPP - no annual limits
        totalContributions += totalMonthlyContrib * 12 * year;
      }

      // Calculate projections for each scenario
      const projections = {
        pessimistic: calculateCompoundGrowth(currentValue, totalMonthlyContrib, year, scenarios.pessimistic.rate, accountType, annualAllowance),
        average: calculateCompoundGrowth(currentValue, totalMonthlyContrib, year, scenarios.average.rate, accountType, annualAllowance),
        outperform: calculateCompoundGrowth(currentValue, totalMonthlyContrib, year, scenarios.outperform.rate, accountType, annualAllowance)
      };

      data.push({
        year: currentYear,
        age,
        pessimistic: projections.pessimistic,
        average: projections.average,
        outperform: projections.outperform,
        contributions: totalContributions
      });
    }

    return data;
  };

  // Calculate compound growth with monthly contributions
  const calculateCompoundGrowth = (
    initialValue: number,
    monthlyContrib: number,
    years: number,
    annualRate: number,
    accountType: 'isa' | 'sipp',
    isaAllowance: number
  ): number => {
    let balance = initialValue;
    const monthlyRate = annualRate / 12;
    
    for (let year = 0; year < years; year++) {
      let yearlyContribution = monthlyContrib * 12;
      
      // Apply ISA allowance limits
      if (accountType === 'isa') {
        yearlyContribution = Math.min(yearlyContribution, isaAllowance);
      }
      
      const monthlyContribForYear = yearlyContribution / 12;
      
      // Compound monthly
      for (let month = 0; month < 12; month++) {
        balance = balance * (1 + monthlyRate) + monthlyContribForYear;
      }
    }
    
    return balance;
  };

  const projectionData = generateProjectionData();

  // Calculate chart scaling
  const allValues = projectionData.flatMap(d => [d.pessimistic, d.average, d.outperform]);
  const minValue = Math.min(...allValues, currentValue);
  const maxValue = Math.max(...allValues);
  const valueRange = maxValue - minValue;
  const padding = valueRange * 0.1; // 10% padding

  const chartMinValue = Math.max(0, minValue - padding);
  const chartMaxValue = maxValue + padding;
  const chartRange = chartMaxValue - chartMinValue;

  // Generate line data points
  const generateLineData = () => {
    return projectionData.map((point, index) => {
      const x = GRAPH_PADDING + (index / (projectionData.length - 1)) * (GRAPH_WIDTH - 2 * GRAPH_PADDING);
      
      const pessimisticY = GRAPH_HEIGHT - ((point.pessimistic - chartMinValue) / chartRange) * GRAPH_HEIGHT;
      const averageY = GRAPH_HEIGHT - ((point.average - chartMinValue) / chartRange) * GRAPH_HEIGHT;
      const outperformY = GRAPH_HEIGHT - ((point.outperform - chartMinValue) / chartRange) * GRAPH_HEIGHT;

      return {
        x,
        pessimisticY,
        averageY,
        outperformY,
        year: point.year,
        age: point.age,
        pessimisticValue: point.pessimistic,
        averageValue: point.average,
        outperformValue: point.outperform,
        contributions: point.contributions
      };
    });
  };

  const lineData = generateLineData();

  // Generate smooth SVG path
  const generateSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const current = points[i];
      const previous = points[i - 1];
      
      const tension = 0.2;
      
      if (i === 1) {
        const next = points[i + 1] || current;
        const cp1x = previous.x + (current.x - previous.x) * tension;
        const cp1y = previous.y + (current.y - previous.y) * tension;
        const cp2x = current.x - (next.x - previous.x) * tension;
        const cp2y = current.y - (next.y - previous.y) * tension;
        
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${current.x} ${current.y}`;
      } else if (i === points.length - 1) {
        const beforePrevious = points[i - 2];
        const cp1x = previous.x + (current.x - beforePrevious.x) * tension;
        const cp1y = previous.y + (current.y - beforePrevious.y) * tension;
        const cp2x = current.x - (current.x - previous.x) * tension;
        const cp2y = current.y - (current.y - previous.y) * tension;
        
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${current.x} ${current.y}`;
      } else {
        const next = points[i + 1];
        const beforePrevious = points[i - 2];
        
        const cp1x = previous.x + (current.x - beforePrevious.x) * tension;
        const cp1y = previous.y + (current.y - beforePrevious.y) * tension;
        const cp2x = current.x - (next.x - previous.x) * tension;
        const cp2y = current.y - (next.y - previous.y) * tension;
        
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${current.x} ${current.y}`;
      }
    }
    
    return path;
  };

  // Generate paths for each scenario
  const pessimisticPath = generateSmoothPath(lineData.map(d => ({ x: d.x, y: d.pessimisticY })));
  const averagePath = generateSmoothPath(lineData.map(d => ({ x: d.x, y: d.averageY })));
  const outperformPath = generateSmoothPath(lineData.map(d => ({ x: d.x, y: d.outperformY })));

  // Generate Y-axis grid lines
  const generateGridLines = () => {
    const gridCount = 5;
    const gridLines = [];
    
    for (let i = 0; i <= gridCount; i++) {
      const value = chartMinValue + (chartRange * i / gridCount);
      const y = GRAPH_HEIGHT - (i / gridCount) * GRAPH_HEIGHT;
      
      gridLines.push({
        y,
        value: value / 1000, // Convert to thousands for display
        label: `£${(value / 1000).toFixed(0)}k`
      });
    }
    
    return gridLines;
  };

  const gridLines = generateGridLines();

  // Touch handling
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => {
      const { locationX, locationY } = event.nativeEvent;
      handleTouch(locationX, locationY);
    },
    onPanResponderMove: (event) => {
      const { locationX, locationY } = event.nativeEvent;
      handleTouch(locationX, locationY);
    },
    onPanResponderRelease: () => {
      setHoveredPoint(null);
      setSelectedScenario(null);
      setTouchPosition(null);
    },
  });

  const handleTouch = (x: number, y: number) => {
    // Find closest data point
    let closestIndex = 0;
    let closestDistance = Math.abs(lineData[0].x - x);
    
    lineData.forEach((point, index) => {
      const distance = Math.abs(point.x - x);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    if (closestDistance < 30) {
      setHoveredPoint(closestIndex);
      setTouchPosition({ x, y });
      
      // Determine which line is closest to touch point
      const point = lineData[closestIndex];
      const distances = {
        pessimistic: Math.abs(point.pessimisticY - y),
        average: Math.abs(point.averageY - y),
        outperform: Math.abs(point.outperformY - y)
      };
      
      const closestScenario = Object.entries(distances).reduce((a, b) => 
        distances[a[0] as keyof typeof distances] < distances[b[0] as keyof typeof distances] ? a : b
      )[0] as keyof typeof distances;
      
      if (distances[closestScenario] < 40) {
        setSelectedScenario(closestScenario);
      }
    }
  };

  // Calculate key metrics
  const finalProjections = projectionData[projectionData.length - 1];
  const totalContributions = finalProjections.contributions;
  
  const gains = {
    pessimistic: finalProjections.pessimistic - totalContributions,
    average: finalProjections.average - totalContributions,
    outperform: finalProjections.outperform - totalContributions
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Growth Projections</Text>
        <View style={styles.headerInfo}>
          <Info size={16} color="#64748B" />
          <Text style={styles.headerSubtext}>Tap lines to explore scenarios</Text>
        </View>
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Current Value</Text>
          <Text style={styles.metricValue}>
            {balanceVisible ? `£${currentValue.toLocaleString('en-GB')}` : '••••••'}
          </Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Target Age</Text>
          <Text style={styles.metricValue}>{targetAge}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Years to Go</Text>
          <Text style={styles.metricValue}>{targetAge - currentAge}</Text>
        </View>
      </View>

      {/* Chart */}
      {balanceVisible ? (
        <View style={styles.chartSection}>
          <View style={styles.chartContainer}>
            {/* Y-axis labels */}
            <View style={styles.yAxisContainer}>
              {gridLines.map((line, index) => (
                <Text key={index} style={[styles.yAxisLabel, { top: line.y - 8 }]}>
                  {line.label}
                </Text>
              ))}
            </View>

            {/* Chart area */}
            <View style={[styles.chartArea, { width: GRAPH_WIDTH, height: GRAPH_HEIGHT }]}>
              <View 
                style={styles.touchArea}
                {...panResponder.panHandlers}
              >
                <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT}>
                  <Defs>
                    <LinearGradient id="pessimisticGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <Stop offset="0%" stopColor={scenarios.pessimistic.color} stopOpacity="0.1" />
                      <Stop offset="100%" stopColor={scenarios.pessimistic.color} stopOpacity="0.02" />
                    </LinearGradient>
                    <LinearGradient id="averageGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <Stop offset="0%" stopColor={scenarios.average.color} stopOpacity="0.1" />
                      <Stop offset="100%" stopColor={scenarios.average.color} stopOpacity="0.02" />
                    </LinearGradient>
                    <LinearGradient id="outperformGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <Stop offset="0%" stopColor={scenarios.outperform.color} stopOpacity="0.1" />
                      <Stop offset="100%" stopColor={scenarios.outperform.color} stopOpacity="0.02" />
                    </LinearGradient>
                  </Defs>

                  {/* Grid lines */}
                  {gridLines.map((line, index) => (
                    <Line
                      key={index}
                      x1={GRAPH_PADDING}
                      y1={line.y}
                      x2={GRAPH_WIDTH - GRAPH_PADDING}
                      y2={line.y}
                      stroke="#F1F5F9"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Projection lines */}
                  <Path
                    d={pessimisticPath}
                    stroke={scenarios.pessimistic.color}
                    strokeWidth={selectedScenario === 'pessimistic' ? 3 : 2}
                    fill="none"
                    strokeLinecap="round"
                    opacity={selectedScenario && selectedScenario !== 'pessimistic' ? 0.3 : 1}
                  />
                  
                  <Path
                    d={averagePath}
                    stroke={scenarios.average.color}
                    strokeWidth={selectedScenario === 'average' ? 3 : 2}
                    fill="none"
                    strokeLinecap="round"
                    opacity={selectedScenario && selectedScenario !== 'average' ? 0.3 : 1}
                  />
                  
                  <Path
                    d={outperformPath}
                    stroke={scenarios.outperform.color}
                    strokeWidth={selectedScenario === 'outperform' ? 3 : 2}
                    fill="none"
                    strokeLinecap="round"
                    opacity={selectedScenario && selectedScenario !== 'outperform' ? 0.3 : 1}
                  />

                  {/* Data points */}
                  {hoveredPoint !== null && (
                    <>
                      <Circle
                        cx={lineData[hoveredPoint].x}
                        cy={lineData[hoveredPoint].pessimisticY}
                        r={4}
                        fill={scenarios.pessimistic.color}
                        stroke="#FFFFFF"
                        strokeWidth="2"
                      />
                      <Circle
                        cx={lineData[hoveredPoint].x}
                        cy={lineData[hoveredPoint].averageY}
                        r={4}
                        fill={scenarios.average.color}
                        stroke="#FFFFFF"
                        strokeWidth="2"
                      />
                      <Circle
                        cx={lineData[hoveredPoint].x}
                        cy={lineData[hoveredPoint].outperformY}
                        r={4}
                        fill={scenarios.outperform.color}
                        stroke="#FFFFFF"
                        strokeWidth="2"
                      />
                    </>
                  )}
                </Svg>
              </View>

              {/* X-axis labels */}
              <View style={styles.xAxisLabels}>
                {lineData.filter((_, index) => index % Math.ceil(lineData.length / 6) === 0).map((point, index) => (
                  <Text 
                    key={index}
                    style={[styles.xAxisLabel, { left: point.x - 20 }]}
                  >
                    {point.year}
                  </Text>
                ))}
              </View>
            </View>
          </View>

          {/* Tooltip */}
          {hoveredPoint !== null && (
            <View style={styles.tooltip}>
              <Text style={styles.tooltipYear}>
                {lineData[hoveredPoint].year} (Age {lineData[hoveredPoint].age})
              </Text>
              <View style={styles.tooltipScenarios}>
                <View style={styles.tooltipRow}>
                  <View style={[styles.tooltipDot, { backgroundColor: scenarios.pessimistic.color }]} />
                  <Text style={styles.tooltipLabel}>Pessimistic:</Text>
                  <Text style={styles.tooltipValue}>
                    £{lineData[hoveredPoint].pessimisticValue.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
                  </Text>
                </View>
                <View style={styles.tooltipRow}>
                  <View style={[styles.tooltipDot, { backgroundColor: scenarios.average.color }]} />
                  <Text style={styles.tooltipLabel}>Average:</Text>
                  <Text style={styles.tooltipValue}>
                    £{lineData[hoveredPoint].averageValue.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
                  </Text>
                </View>
                <View style={styles.tooltipRow}>
                  <View style={[styles.tooltipDot, { backgroundColor: scenarios.outperform.color }]} />
                  <Text style={styles.tooltipLabel}>Outperform:</Text>
                  <Text style={styles.tooltipValue}>
                    £{lineData[hoveredPoint].outperformValue.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Legend */}
          <View style={styles.legend}>
            {Object.entries(scenarios).map(([key, scenario]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.legendItem,
                  selectedScenario === key && styles.selectedLegendItem
                ]}
                onPress={() => setSelectedScenario(selectedScenario === key ? null : key as any)}
              >
                <View style={[styles.legendLine, { backgroundColor: scenario.color }]} />
                <Text style={[
                  styles.legendText,
                  selectedScenario === key && styles.selectedLegendText
                ]}>
                  {scenario.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Final Projections Summary */}
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Projected Value at Age {targetAge}</Text>
            <View style={styles.summaryGrid}>
              {Object.entries(scenarios).map(([key, scenario]) => (
                <View key={key} style={styles.summaryCard}>
                  <View style={[styles.summaryDot, { backgroundColor: scenario.color }]} />
                  <Text style={styles.summaryLabel}>{scenario.label}</Text>
                  <Text style={[styles.summaryValue, { color: scenario.color }]}>
                    {balanceVisible 
                      ? `£${finalProjections[key as keyof typeof finalProjections].toLocaleString('en-GB', { maximumFractionDigits: 0 })}`
                      : '••••••'
                    }
                  </Text>
                  <Text style={styles.summaryGains}>
                    {balanceVisible 
                      ? `+£${gains[key as keyof typeof gains].toLocaleString('en-GB', { maximumFractionDigits: 0 })} gains`
                      : '••••••'
                    }
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.hiddenChart}>
          <Text style={styles.hiddenText}>Projection data hidden</Text>
        </View>
      )}
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
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  metricsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  metricLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  metricValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#0F172A',
  },
  chartSection: {
    padding: 20,
  },
  chartContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  yAxisContainer: {
    width: 50,
    height: 200,
    position: 'relative',
    marginRight: 10,
  },
  yAxisLabel: {
    position: 'absolute',
    right: 0,
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: '#64748B',
    textAlign: 'right',
  },
  chartArea: {
    backgroundColor: '#FAFBFC',
    borderRadius: 12,
    position: 'relative',
  },
  touchArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  xAxisLabels: {
    position: 'absolute',
    top: 205,
    left: 0,
    right: 0,
    height: 20,
  },
  xAxisLabel: {
    position: 'absolute',
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: '#64748B',
    width: 40,
    textAlign: 'center',
  },
  tooltip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tooltipYear: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 12,
  },
  tooltipScenarios: {
    gap: 8,
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tooltipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tooltipLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  tooltipValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#0F172A',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  selectedLegendItem: {
    backgroundColor: '#F1F5F9',
  },
  legendLine: {
    width: 16,
    height: 3,
    borderRadius: 2,
  },
  legendText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#64748B',
  },
  selectedLegendText: {
    fontFamily: 'Inter-SemiBold',
    color: '#0F172A',
  },
  summaryContainer: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
  },
  summaryTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 16,
  },
  summaryGrid: {
    gap: 12,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  summaryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  summaryLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  summaryValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
  },
  summaryGains: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: '#64748B',
  },
  hiddenChart: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    margin: 20,
    borderRadius: 12,
  },
  hiddenText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#94A3B8',
  },
});