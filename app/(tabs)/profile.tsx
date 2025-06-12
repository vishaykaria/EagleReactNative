import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Settings, Bell, Shield, CreditCard, CircleHelp as HelpCircle, FileText, LogOut, ChevronRight, Smartphone, Mail, MapPin, Calendar } from 'lucide-react-native';
import { PageTransition } from '@/components/PageTransition';
import { useFocusEffect } from 'expo-router';

export default function ProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Trigger entrance animation when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setIsVisible(true);
      return () => setIsVisible(false);
    }, [])
  );

  // Parallax effect for header
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -30],
    extrapolate: 'clamp',
  });

  const ProfileHeader = () => (
    <Animated.View 
      style={[
        styles.profileHeader,
        { transform: [{ translateY: headerTranslateY }] }
      ]}
    >
      <PageTransition isVisible={isVisible} delay={0}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>SJ</Text>
        </View>
      </PageTransition>
      <PageTransition isVisible={isVisible} delay={100}>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>Sarah Johnson</Text>
          <Text style={styles.profileEmail}>sarah.johnson@email.com</Text>
          <View style={styles.membershipBadge}>
            <Text style={styles.membershipText}>Premium Member</Text>
          </View>
        </View>
      </PageTransition>
      <PageTransition isVisible={isVisible} delay={200}>
        <TouchableOpacity style={styles.editButton}>
          <Settings size={20} color="#64748B" />
        </TouchableOpacity>
      </PageTransition>
    </Animated.View>
  );

  const PersonalInfoCard = () => (
    <PageTransition isVisible={isVisible} delay={300}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personal Information</Text>
        <View style={styles.infoItem}>
          <View style={styles.infoIcon}>
            <Mail size={20} color="#64748B" />
          </View>
          <View>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>sarah.johnson@email.com</Text>
          </View>
        </View>
        <View style={styles.infoItem}>
          <View style={styles.infoIcon}>
            <Smartphone size={20} color="#64748B" />
          </View>
          <View>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>+44 7XXX XXX XXX</Text>
          </View>
        </View>
        <View style={styles.infoItem}>
          <View style={styles.infoIcon}>
            <MapPin size={20} color="#64748B" />
          </View>
          <View>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>123 High Street, London, UK</Text>
          </View>
        </View>
        <View style={styles.infoItem}>
          <View style={styles.infoIcon}>
            <Calendar size={20} color="#64748B" />
          </View>
          <View>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>January 2022</Text>
          </View>
        </View>
      </View>
    </PageTransition>
  );

  const SettingsSection = ({ title, children, delay }: { title: string, children: React.ReactNode, delay: number }) => (
    <PageTransition isVisible={isVisible} delay={delay}>
      <View style={styles.settingsSection}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {children}
      </View>
    </PageTransition>
  );

  const SettingsItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showChevron = true,
    rightComponent,
    delay = 0
  }: { 
    icon: React.ReactNode,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    showChevron?: boolean,
    rightComponent?: React.ReactNode,
    delay?: number
  }) => (
    <PageTransition isVisible={isVisible} delay={delay}>
      <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
        <View style={styles.settingsIcon}>
          {icon}
        </View>
        <View style={styles.settingsContent}>
          <Text style={styles.settingsTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingsSubtitle}>{subtitle}</Text>}
        </View>
        {rightComponent || (showChevron && <ChevronRight size={20} color="#94A3B8" />)}
      </TouchableOpacity>
    </PageTransition>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ProfileHeader />
      
      <Animated.ScrollView 
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <PersonalInfoCard />

        <SettingsSection title="Account Settings" delay={400}>
          <SettingsItem
            icon={<CreditCard size={20} color="#64748B" />}
            title="Cards & Payments"
            subtitle="Manage your cards and payment methods"
            onPress={() => {}}
            delay={450}
          />
          <SettingsItem
            icon={<Bell size={20} color="#64748B" />}
            title="Notifications"
            subtitle="Push notifications, emails & SMS"
            rightComponent={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#E2E8F0', true: '#1E40AF' }}
                thumbColor="#FFFFFF"
              />
            }
            showChevron={false}
            delay={500}
          />
          <SettingsItem
            icon={<Shield size={20} color="#64748B" />}
            title="Security & Privacy"
            subtitle="Biometrics, PIN, and privacy settings"
            onPress={() => {}}
            delay={550}
          />
        </SettingsSection>

        <SettingsSection title="Security" delay={600}>
          <SettingsItem
            icon={<Smartphone size={20} color="#64748B" />}
            title="Biometric Authentication"
            subtitle="Use fingerprint or face ID to sign in"
            rightComponent={
              <Switch
                value={biometricsEnabled}
                onValueChange={setBiometricsEnabled}
                trackColor={{ false: '#E2E8F0', true: '#1E40AF' }}
                thumbColor="#FFFFFF"
              />
            }
            showChevron={false}
            delay={650}
          />
          <SettingsItem
            icon={<Shield size={20} color="#64748B" />}
            title="Change PIN"
            subtitle="Update your 4-digit security PIN"
            onPress={() => {}}
            delay={700}
          />
        </SettingsSection>

        <SettingsSection title="Support" delay={750}>
          <SettingsItem
            icon={<HelpCircle size={20} color="#64748B" />}
            title="Help & Support"
            subtitle="Get help with your account"
            onPress={() => {}}
            delay={800}
          />
          <SettingsItem
            icon={<FileText size={20} color="#64748B" />}
            title="Terms & Conditions"
            subtitle="Read our terms and privacy policy"
            onPress={() => {}}
            delay={850}
          />
        </SettingsSection>

        <PageTransition isVisible={isVisible} delay={900}>
          <View style={styles.logoutSection}>
            <TouchableOpacity style={styles.logoutButton}>
              <LogOut size={20} color="#EF4444" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </PageTransition>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#F8FAFC',
    zIndex: 1,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E40AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#0F172A',
    marginBottom: 4,
  },
  profileEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#64748B',
    marginBottom: 8,
  },
  membershipBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  membershipText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#D97706',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#0F172A',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  infoValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#0F172A',
  },
  settingsSection: {
    marginBottom: 32,
  },
  sectionTitleContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#0F172A',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsContent: {
    flex: 1,
  },
  settingsTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 2,
  },
  settingsSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#64748B',
  },
  logoutSection: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#EF4444',
  },
});