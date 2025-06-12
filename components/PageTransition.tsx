import React, { useRef, useEffect } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface PageTransitionProps {
  children: React.ReactNode;
  isVisible: boolean;
  style?: ViewStyle;
  duration?: number;
  delay?: number;
  disableNativeOpacity?: boolean;
}

export function PageTransition({ 
  children, 
  isVisible, 
  style, 
  duration = 300, 
  delay = 0,
  disableNativeOpacity = false
}: PageTransitionProps) {
  const fadeAnim = useRef(new Animated.Value(isVisible ? 1 : 0)).current;
  const slideAnim = useRef(new Animated.Value(isVisible ? 0 : 20)).current;
  const scaleAnim = useRef(new Animated.Value(isVisible ? 1 : 0.95)).current;

  useEffect(() => {
    const animations = [
      Animated.timing(fadeAnim, {
        toValue: isVisible ? 1 : 0,
        duration,
        delay,
        useNativeDriver: !disableNativeOpacity,
      }),
      Animated.timing(slideAnim, {
        toValue: isVisible ? 0 : 20,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: isVisible ? 1 : 0.95,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ];

    Animated.parallel(animations).start();
  }, [isVisible, duration, delay, disableNativeOpacity]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// Staggered animation for lists
export function StaggeredPageTransition({ 
  children, 
  isVisible, 
  style, 
  staggerDelay = 50,
  duration = 300 
}: PageTransitionProps & { staggerDelay?: number }) {
  const fadeAnim = useRef(new Animated.Value(isVisible ? 1 : 0)).current;
  const slideAnim = useRef(new Animated.Value(isVisible ? 0 : 30)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.stagger(staggerDelay, [
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 30,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, duration, staggerDelay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}