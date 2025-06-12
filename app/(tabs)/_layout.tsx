import React, { useState, useRef, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Chrome as Home, Wallet, Activity, User, ChevronDown } from 'lucide-react-native';
import { TouchableOpacity, View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { router, usePathname } from 'expo-router';

const { width } = Dimensions.get('window');

type AccountType = 'current' | 'isa' | 'sipp';

const accountTypes = [
  { 
    id: 'current' as AccountType, 
    name: 'Current Account', 
    shortName: 'Current',
    balance: 2847.63,
    description: 'Everyday banking and spending'
  },
  { 
    id: 'isa' as AccountType, 
    name: 'Stocks & Shares ISA', 
    shortName: 'ISA',
    balance: 18549.28,
    description: 'Tax-free investment account'
  },
  { 
    id: 'sipp' as AccountType, 
    name: 'SIPP', 
    shortName: 'SIPP',
    balance: 45672.91,
    description: 'Self-invested personal pension'
  },
];

function AccountTabButton({ color, size }: { color: string; size: number }) {
  const [selectedAccount, setSelectedAccount] = useState<AccountType>('current');
  const pathname = usePathname();

  const isAccountsTab = pathname === '/(tabs)/accounts';

  const handleTabPress = () => {
    // Navigate to accounts tab with current selection
    router.push({
      pathname: '/(tabs)/accounts',
      params: { selectedAccount: selectedAccount }
    });
  };

  return (
    <TouchableOpacity 
      style={styles.accountTabButton}
      onPress={handleTabPress}
      activeOpacity={0.7}
    >
      <View style={styles.accountTabContent}>
        <Wallet size={size} color={color} />
      </View>
    </TouchableOpacity>
  );
}

// Custom Tab Bar with Transition Effects
function CustomTabBar({ state, descriptors, navigation }: any) {
  const [tabTransition] = useState(new Animated.Value(0));
  const [previousIndex, setPreviousIndex] = useState(0);

  useEffect(() => {
    // Animate tab transition
    Animated.spring(tabTransition, {
      toValue: state.index,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    setPreviousIndex(state.index);
  }, [state.index]);

  const translateX = tabTransition.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [0, width / 4, width / 2, (3 * width) / 4],
  });

  return (
    <View style={styles.tabBar}>
      {/* Animated Tab Indicator */}
      <Animated.View
        style={[
          styles.tabIndicator,
          {
            transform: [{ translateX }],
          },
        ]}
      />
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel !== undefined
          ? options.tabBarLabel
          : options.title !== undefined
          ? options.title
          : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        // Tab scale animation
        const tabScale = tabTransition.interpolate({
          inputRange: [index - 1, index, index + 1],
          outputRange: [0.9, 1.1, 0.9],
          extrapolate: 'clamp',
        });

        // Tab opacity animation
        const tabOpacity = tabTransition.interpolate({
          inputRange: [index - 1, index, index + 1],
          outputRange: [0.6, 1, 0.6],
          extrapolate: 'clamp',
        });

        // Render tab icon with proper error handling
        const renderTabIcon = () => {
          if (route.name === 'accounts') {
            return (
              <AccountTabButton 
                size={24} 
                color={isFocused ? '#1E40AF' : '#64748B'} 
              />
            );
          }
          
          if (options.tabBarIcon) {
            const iconResult = options.tabBarIcon({
              size: 24,
              color: isFocused ? '#1E40AF' : '#64748B',
              focused: isFocused,
            });
            
            return iconResult;
          }
          
          return null;
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabButton}
            activeOpacity={0.7}
          >
            <Animated.View
              style={[
                styles.tabContent,
                {
                  transform: [{ scale: tabScale }],
                  opacity: tabOpacity,
                },
              ]}
            >
              <View style={styles.tabIconContainer}>
                {renderTabIcon()}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  { color: isFocused ? '#1E40AF' : '#64748B' },
                ]}
              >
                {String(label)}
              </Text>
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: 'Accounts',
          tabBarIcon: ({ size, color }) => (
            <Wallet size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ size, color }) => (
            <Activity size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  // Custom Tab Bar Styles
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    height: 88,
    paddingTop: 8,
    paddingBottom: 24,
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  tabIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width / 4,
    height: 3,
    backgroundColor: '#1E40AF',
    borderRadius: 2,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    marginTop: 4,
  },
  
  // Account Tab Button Styles
  accountTabButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});