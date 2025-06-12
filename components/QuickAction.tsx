import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}

export function QuickAction({ icon, label, onPress }: QuickActionProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.iconContainer}>
        {icon}
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
});