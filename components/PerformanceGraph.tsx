import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, PanResponder } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';

interface PerformanceDataPoint {
  year: string;
  portfolio: number;
  benchmark: number;
}

interface PerformanceGraphProps {
  data: PerformanceDataPoint[];
  accountType: 'isa' | 'sipp';
  balanceVisible: boolean;
}

export function PerformanceGraph({ data, accountType, balanceVisible }: PerformanceGraphProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [touchPosition, setTouchPosition] = useState<{ x: number; y: number } | null>(null);
  const [screenData, setScreenData] = useState(Dimensions.get('window'));

  // Listen for screen dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

  // Calculate responsive graph dimensions
  const calculateGraphDimensions = () => {
    const { width: screenWidth } = screenData;
    
    // Increased Y-axis width to accommodate percentage values properly
    const yAxisWidth = 35; // Increased from 15 to 35
    const containerHorizontalPadding = 40;
    const leftMargin = 10; // Reduced left margin since Y-axis is wider now
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

  // Calculate min and max values for scaling
  const allValues = data.flatMap(d => [d.portfolio, d.benchmark]);
  const minValue = Math.min(...allValues, 0);
  const maxValue = Math.max(...allValues, 0);
  
  // Create simplified Y-axis with round numbers in appropriate increments
  const createSimplifiedYAxis = () => {
    const roundedMin = Math.floor(minValue / 10) * 10;
    const roundedMax = Math.ceil(maxValue / 10) * 10;
    
    const range = Math.max(roundedMax - roundedMin, 20);
    const adjustedMin = roundedMin;
    const adjustedMax = adjustedMin + range;
    
    const gridValues = [];
    // Use fewer grid lines to prevent overcrowding
    const increment = Math.max(10, Math.ceil(range / 4 / 10) * 10);
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

  // Calculate average annual performance
  const avgPortfolioReturn = data.reduce((sum, d) => sum + d.portfolio, 0) / data.length;
  const avgBenchmarkReturn = data.reduce((sum, d) => sum + d.benchmark, 0) / data.length;
  const avgOutperformance = avgPortfolioReturn - avgBenchmarkReturn;

  // Generate line chart data points with optimized spacing
  const generateLineData = () => {
    return data.map((point, index) => {
      // Add padding to ensure all points are fully visible
      const effectiveWidth = GRAPH_WIDTH - (graphPadding * 4); // Increased padding
      const x = graphPadding * 2 + (index / (data.length - 1)) * effectiveWidth;
      
      const portfolioY = GRAPH_HEIGHT - ((point.portfolio - yAxisConfig.min) / yAxisConfig.range) * GRAPH_HEIGHT;
      const benchmarkY = GRAPH_HEIGHT - ((point.benchmark - yAxisConfig.min) / yAxisConfig.range) * GRAPH_HEIGHT;

      return {
        x,
        portfolioY,
        benchmarkY,
        year: point.year,
        portfolioValue: point.portfolio,
        benchmarkValue: point.benchmark
      };
    });
  };

  const lineData = generateLineData();

  // Generate smooth curved SVG path
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

  const portfolioPath = generateSmoothPath(lineData.map(d => ({ x: d.x, y: d.portfolioY })));
  const benchmarkPath = generateSmoothPath(lineData.map(d => ({ x: d.x, y: d.benchmarkY })));

  // Generate grid lines
  const gridLines = yAxisConfig.gridValues.map(value => {
    const y = GRAPH_HEIGHT - ((value - yAxisConfig.min) / yAxisConfig.range) * GRAPH_HEIGHT;
    return { y, value: value.toString() };
  });

  // Calculate zero line position
  const zeroY = GRAPH_HEIGHT - ((0 - yAxisConfig.min) / yAxisConfig.range) * GRAPH_HEIGHT;

  const accountColor = accountType === 'isa' ? '#059669' : '#7C3AED';

  // Get account-specific labels
  const getPortfolioLabel = () => {
    return accountType === 'isa' ? 'ISA' : 'Pension';
  };

  // Create pan responder for touch interactions
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => {
      const { locationX } = event.nativeEvent;
      let closestIndex = 0;
      let closestDistance = Math.abs(lineData[0].x - locationX);
      
      lineData.forEach((point, index) => {
        const distance = Math.abs(point.x - locationX);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });
      
      const touchTolerance = Math.max(25, GRAPH_WIDTH / 15);
      
      if (closestDistance < touchTolerance) {
        setHoveredPoint(closestIndex);
        setTouchPosition({ x: locationX, y: event.nativeEvent.locationY });
      }
    },
    onPanResponderMove: (event) => {
      const { locationX } = event.nativeEvent;
      let closestIndex = 0;
      let closestDistance = Math.abs(lineData[0].x - locationX);
      
      lineData.forEach((point, index) => {
        const distance = Math.abs(point.x - locationX);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });
      
      const touchTolerance = Math.max(25, GRAPH_WIDTH / 15);
      
      if (closestDistance < touchTolerance) {
        setHoveredPoint(closestIndex);
        setTouchPosition({ x: locationX, y: event.nativeEvent.locationY });
      } else if (hoveredPoint !== null) {
        setHoveredPoint(null);
        setTouchPosition(null);
      }
    },
    onPanResponderRelease: () => {
      setHoveredPoint(null);
      setTouchPosition(null);
    },
  });

  // Responsive sizing functions
  const getDataPointSize = (isHovered: boolean) => {
    const baseSize = GRAPH_WIDTH < 250 ? 3.5 : 4.5;
    const hoveredSize = GRAPH_WIDTH < 250 ? 6 : 7;
    return isHovered ? hoveredSize : baseSize;
  };

  const getStrokeWidth = () => {
    return GRAPH_WIDTH < 250 ? 2 : 2.5;
  };

  // Font sizes optimized for single-line year display
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

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingHorizontal: containerPadding }]}>
        <Text style={styles.title}>Performance</Text>
        <View style={styles.performanceIndicator}>
          {avgOutperformance >= 0 ? (
            <TrendingUp size={16} color="#10B981" />
          ) : (
            <TrendingDown size={16} color="#EF4444" />
          )}
          <Text style={[
            styles.outperformanceText,
            { color: avgOutperformance >= 0 ? '#10B981' : '#EF4444' }
          ]}>
            {balanceVisible 
              ? `${avgOutperformance >= 0 ? '+' : ''}${avgOutperformance.toFixed(1)}% vs VWRL`
              : '••••'
            }
          </Text>
        </View>
      </View>

      <View style={[styles.metricsContainer, { paddingHorizontal: containerPadding }]}>
        <View style={styles.metricItem}>
          <View style={[styles.metricDot, { backgroundColor: accountColor }]} />
          <Text style={styles.metricLabel}>{getPortfolioLabel()}</Text>
          <Text style={[styles.metricValue, { color: avgPortfolioReturn >= 0 ? '#10B981' : '#EF4444' }]}>
            {balanceVisible 
              ? `${avgPortfolioReturn >= 0 ? '+' : ''}${avgPortfolioReturn.toFixed(1)}% avg`
              : '••••'
            }
          </Text>
        </View>
        <View style={styles.metricItem}>
          <View style={[styles.metricDot, { backgroundColor: '#94A3B8' }]} />
          <Text style={styles.metricLabel}>VWRL</Text>
          <Text style={[styles.metricValue, { color: avgBenchmarkReturn >= 0 ? '#10B981' : '#EF4444' }]}>
            {balanceVisible 
              ? `${avgBenchmarkReturn >= 0 ? '+' : ''}${avgBenchmarkReturn.toFixed(1)}% avg`
              : '••••'
            }
          </Text>
        </View>
      </View>

      {balanceVisible ? (
        <View style={styles.graphSection}>
          <View style={[styles.interactionHintContainer, { paddingHorizontal: containerPadding }]}>
            <Text style={styles.interactionHint}>Tap and hold data points to see values</Text>
          </View>
          
          <View style={[styles.graphContainer, { paddingHorizontal: containerPadding }]}>
            <View style={[styles.yAxisLabels, { width: yAxisWidth, height: GRAPH_HEIGHT, marginLeft: leftMargin }]}>
              {gridLines.map((line, index) => (
                <Text 
                  key={index} 
                  style={[
                    styles.yAxisLabel, 
                    { 
                      top: line.y - 6,
                      fontSize: getFontSize('axis'),
                      fontWeight: '500',
                      width: yAxisWidth - 2, // Use full width minus small margin
                      textAlign: 'right',
                    }
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.8}
                >
                  {line.value}%
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
                    <LinearGradient id="portfolioGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <Stop offset="0%" stopColor={accountColor} stopOpacity="0.1" />
                      <Stop offset="100%" stopColor={accountColor} stopOpacity="0.02" />
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
                  
                  {/* Zero line */}
                  {zeroY >= 0 && zeroY <= GRAPH_HEIGHT && (
                    <Line
                      x1={graphPadding * 2}
                      y1={zeroY}
                      x2={GRAPH_WIDTH - graphPadding * 2}
                      y2={zeroY}
                      stroke="#E2E8F0"
                      strokeWidth="2"
                      strokeDasharray="4,4"
                    />
                  )}
                  
                  {/* Benchmark line */}
                  <Path
                    d={benchmarkPath}
                    stroke="#94A3B8"
                    strokeWidth={getStrokeWidth()}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.8}
                  />
                  
                  {/* Portfolio line with gradient fill */}
                  <Path
                    d={`${portfolioPath} L ${lineData[lineData.length - 1].x} ${GRAPH_HEIGHT} L ${lineData[0].x} ${GRAPH_HEIGHT} Z`}
                    fill="url(#portfolioGradient)"
                  />
                  
                  <Path
                    d={portfolioPath}
                    stroke={accountColor}
                    strokeWidth={getStrokeWidth()}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {/* Data points for portfolio */}
                  {lineData.map((point, index) => (
                    <Circle
                      key={`portfolio-point-${index}`}
                      cx={point.x}
                      cy={point.portfolioY}
                      r={getDataPointSize(hoveredPoint === index)}
                      fill={accountColor}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      opacity={hoveredPoint === index ? 1 : 0.9}
                    />
                  ))}
                  
                  {/* Data points for benchmark */}
                  {lineData.map((point, index) => (
                    <Circle
                      key={`benchmark-point-${index}`}
                      cx={point.x}
                      cy={point.benchmarkY}
                      r={getDataPointSize(hoveredPoint === index)}
                      fill="#94A3B8"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      opacity={hoveredPoint === index ? 1 : 0.7}
                    />
                  ))}

                  {/* Hover labels */}
                  {hoveredPoint !== null && (
                    <>
                      <SvgText
                        x={lineData[hoveredPoint].x}
                        y={lineData[hoveredPoint].portfolioY - 15}
                        fontSize={getFontSize('value')}
                        fontFamily="Inter-SemiBold"
                        fill={accountColor}
                        textAnchor="middle"
                      >
                        {lineData[hoveredPoint].portfolioValue >= 0 ? '+' : ''}{lineData[hoveredPoint].portfolioValue.toFixed(1)}%
                      </SvgText>
                      
                      <SvgText
                        x={lineData[hoveredPoint].x}
                        y={lineData[hoveredPoint].benchmarkY + 20}
                        fontSize={getFontSize('value')}
                        fontFamily="Inter-Medium"
                        fill="#94A3B8"
                        textAnchor="middle"
                      >
                        {lineData[hoveredPoint].benchmarkValue >= 0 ? '+' : ''}{lineData[hoveredPoint].benchmarkValue.toFixed(1)}%
                      </SvgText>
                    </>
                  )}
                </Svg>
              </View>
              
              {/* Year labels - centered under data points with smaller font */}
              <View style={styles.xAxisLabels}>
                {lineData.map((point, index) => (
                  <Text 
                    key={`year-${index}`}
                    style={[
                      styles.yearLabel, 
                      { 
                        left: point.x - 20, // Center the label (assuming 40px width, so -20 to center)
                        top: GRAPH_HEIGHT + 16,
                        fontSize: getFontSize('year'),
                        fontWeight: hoveredPoint === index ? '700' : '600',
                        color: hoveredPoint === index ? accountColor : '#374151',
                        width: 40, // Fixed width for centering
                        textAlign: 'center', // Center text within the fixed width
                      }
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit={false}
                  >
                    <Text>{point.year}</Text>
                  </Text>
                ))}
              </View>
            </View>
          </View>

          {/* Hover tooltip */}
          {hoveredPoint !== null && (
            <View style={[styles.tooltip, { marginHorizontal: containerPadding }]}>
              <Text style={styles.tooltipYear}>{lineData[hoveredPoint].year}</Text>
              <View style={styles.tooltipRow}>
                <View style={[styles.tooltipDot, { backgroundColor: accountColor }]} />
                <Text style={styles.tooltipLabel}>{getPortfolioLabel()}:</Text>
                <Text style={[styles.tooltipValue, { color: lineData[hoveredPoint].portfolioValue >= 0 ? '#10B981' : '#EF4444' }]}>
                  {lineData[hoveredPoint].portfolioValue >= 0 ? '+' : ''}{lineData[hoveredPoint].portfolioValue.toFixed(1)}%
                </Text>
              </View>
              <View style={styles.tooltipRow}>
                <View style={[styles.tooltipDot, { backgroundColor: '#94A3B8' }]} />
                <Text style={styles.tooltipLabel}>VWRL:</Text>
                <Text style={[styles.tooltipValue, { color: lineData[hoveredPoint].benchmarkValue >= 0 ? '#10B981' : '#EF4444' }]}>
                  {lineData[hoveredPoint].benchmarkValue >= 0 ? '+' : ''}{lineData[hoveredPoint].benchmarkValue.toFixed(1)}%
                </Text>
              </View>
            </View>
          )}

          {/* Compact Legend */}
          <View style={[styles.legend, { paddingHorizontal: containerPadding }]}>
            <View style={styles.legendItem}>
              <View style={[styles.legendLine, { backgroundColor: accountColor }]} />
              <Text style={styles.legendText}>{getPortfolioLabel()}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendLine, { backgroundColor: '#94A3B8' }]} />
              <Text style={styles.legendText}>VWRL</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={[styles.hiddenGraph, { height: GRAPH_HEIGHT + 60, marginHorizontal: containerPadding }]}>
          <Text style={styles.hiddenText}>Performance data hidden</Text>
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
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  metricDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metricLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#64748B',
  },
  metricValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
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
    justifyContent: 'center', // Center the entire graph container
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
    minWidth: 200,
    maxWidth: '95%',
  },
  tooltipYear: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    minWidth: 180,
  },
  tooltipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
    flexShrink: 0,
  },
  tooltipLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#64748B',
    marginRight: 12,
    minWidth: 60,
    flexShrink: 0,
  },
  tooltipValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendLine: {
    width: 16,
    height: 3,
    borderRadius: 2,
  },
  legendText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#64748B',
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