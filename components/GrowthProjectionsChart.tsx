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

  // Use exact same dimensions calculation as PerformanceGraph
  const calculateGraphDimensions = () => {
    const { width: screenWidth } = screenData;
    
    // Reduced Y-axis width and increased left margin for better centering
    const yAxisWidth = 15; // Reduced from 20
    const containerHorizontalPadding = 40;
    const leftMargin = 30; // Increased left margin to shift graph right
    const rightMargin = 20; // Slightly increased right margin
    
    // Calculate maximum available width for the graph
    const maxAvailableWidth = screenWidth - containerHorizontalPadding - yAxisWidth - leftMargin - rightMargin;
    
    // Set responsive dimensions
    let graphWidth, graphHeight;
    
    if (screenWidth <= 375) {
      // Small phones (iPhone SE, etc.)
      graphWidth = Math.min(240, maxAvailableWidth);
      graphHeight = 140;
    } else if (screenWidth <= 393) {
      // iPhone 16, iPhone 14/15 Pro
      graphWidth = Math.min(275, maxAvailableWidth);
      graphHeight = 150;
    } else if (screenWidth <= 430) {
      // iPhone 16 Plus, iPhone 14/15 Pro Max
      graphWidth = Math.min(305, maxAvailableWidth);
      graphHeight = 160;
    } else {
      // Larger screens (tablets, etc.)
      graphWidth = Math.min(340, maxAvailableWidth);
      graphHeight = 170;
    }
    
    // Ensure minimum viable size
    graphWidth = Math.max(230, graphWidth);
    graphHeight = Math.max(130, graphHeight);
    
    return {
      width: graphWidth,
      height: graphHeight,
      yAxisWidth,
      containerPadding: 20,
      leftMargin,
      rightMargin,
      graphPadding: 4
    };
  };

  const { width: GRAPH_WIDTH, height: GRAPH_HEIGHT, yAxisWidth, containerPadding, leftMargin, rightMargin, graphPadding } = calculateGraphDimensions();

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

  // Calculate chart scaling - use same approach as PerformanceGraph
  const allValues = projectionData.flatMap(d => [d.pessimistic, d.average, d.outperform]);
  const minValue = Math.min(...allValues, currentValue);
  const maxValue = Math.max(...allValues);
  
  // Create simplified Y-axis with round numbers in increments
  const createSimplifiedYAxis = () => {
    const roundedMin = Math.floor(minValue / 10000) * 10000; // Round to nearest 10k
    const roundedMax = Math.ceil(maxValue / 10000) * 10000;
    
    const range = Math.max(roundedMax - roundedMin, 20000);
    const adjustedMin = roundedMin;
    const adjustedMax = adjustedMin + range;
    
    const gridValues = [];
    const increment = Math.max(10000, Math.ceil((adjustedMax - adjustedMin) / 5 / 10000) * 10000);
    
    for (let value = adjustedMin; value <= adjustedMax; value += increment) {
      gridValues.push(value);
    }
    
    return {
      min: adjustedMin,
      max: adjustedMax,
      range: adjustedMax - adjustedMin,
      gridValues
    };
  };

  const yAxisConfig = createSimplifiedYAxis();

  // Calculate average performance for header
  const finalProjections = projectionData[projectionData.length - 1];
  const avgGrowth = ((finalProjections.average - currentValue) / currentValue) * 100 / (targetAge - currentAge);

  // Generate line chart data points with optimized spacing - same as PerformanceGraph
  const generateLineData = () => {
    return projectionData.map((point, index) => {
      // Add padding to ensure all points are fully visible
      const effectiveWidth = GRAPH_WIDTH - (graphPadding * 4); // Increased padding
      const x = graphPadding * 2 + (index / (projectionData.length - 1)) * effectiveWidth;
      
      const pessimisticY = GRAPH_HEIGHT - ((point.pessimistic - yAxisConfig.min) / yAxisConfig.range) * GRAPH_HEIGHT;
      const averageY = GRAPH_HEIGHT - ((point.average - yAxisConfig.min) / yAxisConfig.range) * GRAPH_HEIGHT;
      const outperformY = GRAPH_HEIGHT - ((point.outperform - yAxisConfig.min) / yAxisConfig.range) * GRAPH_HEIGHT;

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

  // Generate smooth curved SVG path - same as PerformanceGraph
  const generateSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const current = points[i];
      const previous = points[i - 1];
      
      const tension = 0.15;
      
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

  // Generate grid lines - same format as PerformanceGraph
  const gridLines = yAxisConfig.gridValues.map(value => {
    const y = GRAPH_HEIGHT - ((value - yAxisConfig.min) / yAxisConfig.range) * GRAPH_HEIGHT;
    return { y, value: (value / 1000).toString(), label: `£${(value / 1000).toFixed(0)}k` };
  });

  const accountColor = accountType === 'isa' ? '#059669' : '#7C3AED';

  // Create pan responder for touch interactions - same as PerformanceGraph
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

    const touchTolerance = Math.max(25, GRAPH_WIDTH / 15);

    if (closestDistance < touchTolerance) {
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
    } else if (hoveredPoint !== null) {
      setHoveredPoint(null);
      setSelectedScenario(null);
      setTouchPosition(null);
    }
  };

  // Responsive sizing functions - same as PerformanceGraph
  const getDataPointSize = (isHovered: boolean) => {
    const baseSize = GRAPH_WIDTH < 250 ? 3.5 : 4.5;
    const hoveredSize = GRAPH_WIDTH < 250 ? 6 : 7;
    return isHovered ? hoveredSize : baseSize;
  };

  const getStrokeWidth = () => {
    return GRAPH_WIDTH < 250 ? 2 : 2.5;
  };

  // Font sizes optimized for single-line year display - same as PerformanceGraph
  const getFontSize = (type: 'label' | 'value' | 'axis' | 'year') => {
    const baseScale = GRAPH_WIDTH < 250 ? 0.8 : 0.9; // Reduced scale for smaller fonts
    switch (type) {
      case 'year': return Math.round(10 * baseScale); // Reduced from 13 to 10
      case 'axis': return Math.round(10 * baseScale);
      case 'label': return Math.round(8 * baseScale);
      case 'value': return Math.round(11 * baseScale);
      default: return Math.round(10 * baseScale);
    }
  };

  // Calculate key metrics
  const totalContributions = finalProjections.contributions;
  
  const gains = {
    pessimistic: finalProjections.pessimistic - totalContributions,
    average: finalProjections.average - totalContributions,
    outperform: finalProjections.outperform - totalContributions
  };

  return (
    <View style={styles.container}>
      {/* Header - same structure as PerformanceGraph */}
      <View style={[styles.header, { paddingHorizontal: containerPadding }]}>
        <Text style={styles.title}>Growth Projections</Text>
        <View style={styles.performanceIndicator}>
          <TrendingUp size={16} color="#10B981" />
          <Text style={[styles.outperformanceText, { color: '#10B981' }]}>
            {balanceVisible 
              ? `${avgGrowth.toFixed(1)}% avg annual`
              : '••••'
            }
          </Text>
        </View>
      </View>

      {/* Chart */}
      {balanceVisible ? (
        <View style={styles.graphSection}>
          <View style={[styles.interactionHintContainer, { paddingHorizontal: containerPadding }]}>
            <Text style={styles.interactionHint}>Tap and hold data points to see values</Text>
          </View>
          
          <View style={[styles.graphContainer, { paddingHorizontal: containerPadding }]}>
            {/* Y-axis labels - same as PerformanceGraph */}
            <View style={[styles.yAxisLabels, { width: yAxisWidth, height: GRAPH_HEIGHT, marginLeft: leftMargin }]}>
              {gridLines.map((line, index) => (
                <Text 
                  key={index} 
                  style={[
                    styles.yAxisLabel, 
                    { 
                      top: line.y - 6,
                      fontSize: getFontSize('axis'),
                      fontWeight: '500'
                    }
                  ]}
                >
                  {line.label}
                </Text>
              ))}
            </View>
            
            <View style={[styles.graphArea, { width: GRAPH_WIDTH, height: GRAPH_HEIGHT + 50, marginLeft: 8 }]}>
              <View 
                style={[styles.touchArea, { width: GRAPH_WIDTH, height: GRAPH_HEIGHT }]}
                {...panResponder.panHandlers}
              >
                <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT} style={styles.svg}>
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
                      key={`grid-${index}`}
                      x1={graphPadding * 2}
                      y1={line.y}
                      x2={GRAPH_WIDTH - graphPadding * 2}
                      y2={line.y}
                      stroke="#F1F5F9"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Projection lines */}
                  <Path
                    d={pessimisticPath}
                    stroke={scenarios.pessimistic.color}
                    strokeWidth={selectedScenario === 'pessimistic' ? getStrokeWidth() + 0.5 : getStrokeWidth()}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={selectedScenario && selectedScenario !== 'pessimistic' ? 0.3 : 1}
                  />
                  
                  <Path
                    d={averagePath}
                    stroke={scenarios.average.color}
                    strokeWidth={selectedScenario === 'average' ? getStrokeWidth() + 0.5 : getStrokeWidth()}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={selectedScenario && selectedScenario !== 'average' ? 0.3 : 1}
                  />
                  
                  <Path
                    d={outperformPath}
                    stroke={scenarios.outperform.color}
                    strokeWidth={selectedScenario === 'outperform' ? getStrokeWidth() + 0.5 : getStrokeWidth()}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={selectedScenario && selectedScenario !== 'outperform' ? 0.3 : 1}
                  />

                  {/* Data points */}
                  {hoveredPoint !== null && (
                    <>
                      <Circle
                        cx={lineData[hoveredPoint].x}
                        cy={lineData[hoveredPoint].pessimisticY}
                        r={getDataPointSize(true)}
                        fill={scenarios.pessimistic.color}
                        stroke="#FFFFFF"
                        strokeWidth="2"
                      />
                      <Circle
                        cx={lineData[hoveredPoint].x}
                        cy={lineData[hoveredPoint].averageY}
                        r={getDataPointSize(true)}
                        fill={scenarios.average.color}
                        stroke="#FFFFFF"
                        strokeWidth="2"
                      />
                      <Circle
                        cx={lineData[hoveredPoint].x}
                        cy={lineData[hoveredPoint].outperformY}
                        r={getDataPointSize(true)}
                        fill={scenarios.outperform.color}
                        stroke="#FFFFFF"
                        strokeWidth="2"
                      />
                    </>
                  )}

                  {/* Hover labels */}
                  {hoveredPoint !== null && (
                    <>
                      <SvgText
                        x={lineData[hoveredPoint].x}
                        y={lineData[hoveredPoint].pessimisticY - 15}
                        fontSize={getFontSize('value')}
                        fontFamily="Inter-SemiBold"
                        fill={scenarios.pessimistic.color}
                        textAnchor="middle"
                      >
                        £{(lineData[hoveredPoint].pessimisticValue / 1000).toFixed(0)}k
                      </SvgText>
                      
                      <SvgText
                        x={lineData[hoveredPoint].x}
                        y={lineData[hoveredPoint].averageY - 15}
                        fontSize={getFontSize('value')}
                        fontFamily="Inter-SemiBold"
                        fill={scenarios.average.color}
                        textAnchor="middle"
                      >
                        £{(lineData[hoveredPoint].averageValue / 1000).toFixed(0)}k
                      </SvgText>
                      
                      <SvgText
                        x={lineData[hoveredPoint].x}
                        y={lineData[hoveredPoint].outperformY - 15}
                        fontSize={getFontSize('value')}
                        fontFamily="Inter-SemiBold"
                        fill={scenarios.outperform.color}
                        textAnchor="middle"
                      >
                        £{(lineData[hoveredPoint].outperformValue / 1000).toFixed(0)}k
                      </SvgText>
                    </>
                  )}
                </Svg>
              </View>
              
              {/* Year labels - same as PerformanceGraph */}
              <View style={styles.xAxisLabels}>
                {lineData.filter((_, index) => index % Math.ceil(lineData.length / 6) === 0).map((point, index) => (
                  <Text 
                    key={`year-${index}`}
                    style={[
                      styles.yearLabel, 
                      { 
                        left: point.x - 20,
                        top: GRAPH_HEIGHT + 16,
                        fontSize: getFontSize('year'),
                        fontWeight: hoveredPoint === index ? '700' : '600',
                        color: hoveredPoint === index ? accountColor : '#374151',
                        width: 40,
                        textAlign: 'center',
                      }
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit={false}
                  >
                    {point.year}
                  </Text>
                ))}
              </View>
            </View>
          </View>

          {/* Hover tooltip - same structure as PerformanceGraph */}
          {hoveredPoint !== null && (
            <View style={[styles.tooltip, { marginHorizontal: containerPadding }]}>
              <Text style={styles.tooltipYear}>{lineData[hoveredPoint].year} (Age {lineData[hoveredPoint].age})</Text>
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

          {/* Integrated Legend with Values - Vertical Layout */}
          <View style={[styles.legend, { paddingHorizontal: containerPadding }]}>
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
                <View style={styles.legendContent}>
                  <Text style={[
                    styles.legendText,
                    selectedScenario === key && styles.selectedLegendText
                  ]}>
                    {scenario.label}
                  </Text>
                  <Text style={[
                    styles.legendValue,
                    { color: scenario.color },
                    selectedScenario === key && styles.selectedLegendValue
                  ]}>
                    {balanceVisible 
                      ? `£${(finalProjections[key as keyof typeof finalProjections] / 1000).toFixed(0)}k`
                      : '••••'
                    }
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <View style={[styles.hiddenGraph, { height: GRAPH_HEIGHT + 60, marginHorizontal: containerPadding }]}>
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
    paddingVertical: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#0F172A',
    flex: 1,
  },
  performanceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  outperformanceText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
  },
  graphSection: {
    marginBottom: 16,
  },
  interactionHintContainer: {
    marginBottom: 16,
  },
  interactionHint: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  graphContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  yAxisLabels: {
    position: 'relative',
    marginRight: 1,
  },
  yAxisLabel: {
    position: 'absolute',
    right: 0,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
    textAlign: 'right',
  },
  graphArea: {
    position: 'relative',
    backgroundColor: '#FAFBFC',
    borderRadius: 12,
    padding: 2,
  },
  touchArea: {
    position: 'absolute',
    top: 2,
    left: 2,
    zIndex: 10,
  },
  svg: {
    backgroundColor: 'transparent',
  },
  xAxisLabels: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  yearLabel: {
    position: 'absolute',
    fontFamily: 'Inter-Bold',
    height: 20,
    lineHeight: 20,
  },
  tooltip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignSelf: 'center',
    maxWidth: '90%',
  },
  tooltipYear: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
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
  // Updated legend styles for vertical layout with integrated values
  legend: {
    alignItems: 'center',
    gap: 12, // Vertical spacing between legend items
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 200, // Increased width to accommodate values
    justifyContent: 'flex-start',
  },
  selectedLegendItem: {
    backgroundColor: '#F1F5F9',
  },
  legendLine: {
    width: 16,
    height: 3,
    borderRadius: 2,
  },
  legendContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#64748B',
  },
  selectedLegendText: {
    fontFamily: 'Inter-SemiBold',
    color: '#0F172A',
  },
  legendValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
  },
  selectedLegendValue: {
    fontSize: 15,
  },
  hiddenGraph: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  hiddenText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#94A3B8',
  },
});