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

  // Calculate dimensions - 20% narrower than PerformanceGraph
  const calculateGraphDimensions = () => {
    const { width: screenWidth } = screenData;
    
    // Y-axis configuration for better visibility
    const yAxisWidth = 45; // Increased from 15 to 45 for better visibility
    const containerHorizontalPadding = 40;
    const leftMargin = 10; // Reduced from 30 to 10 to give more space for Y-axis
    const rightMargin = 20;
    
    // Calculate maximum available width for the graph
    const maxAvailableWidth = screenWidth - containerHorizontalPadding - yAxisWidth - leftMargin - rightMargin;
    
    // Set responsive dimensions - 20% narrower than PerformanceGraph
    let graphWidth, graphHeight;
    
    if (screenWidth <= 375) {
      // Small phones (iPhone SE, etc.) - 20% narrower
      graphWidth = Math.min(192, maxAvailableWidth); // 240 * 0.8 = 192
      graphHeight = 140;
    } else if (screenWidth <= 393) {
      // iPhone 16, iPhone 14/15 Pro - 20% narrower
      graphWidth = Math.min(220, maxAvailableWidth); // 275 * 0.8 = 120
      graphHeight = 150;
    } else if (screenWidth <= 430) {
      // iPhone 16 Plus, iPhone 14/15 Pro Max - 20% narrower
      graphWidth = Math.min(244, maxAvailableWidth); // 305 * 0.8 = 144
      graphHeight = 160;
    } else {
      // Larger screens (tablets, etc.) - 20% narrower
      graphWidth = Math.min(272, maxAvailableWidth); // 340 * 0.8 = 120
      graphHeight = 170;
    }
    
    // Ensure minimum viable size - 20% narrower
    graphWidth = Math.max(184, graphWidth); // 230 * 0.8 = 120
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
    onMoveShouldSe