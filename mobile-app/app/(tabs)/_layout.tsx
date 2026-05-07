import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { TouchableOpacity, View, StyleSheet, Text } from 'react-native';
import { LayoutDashboard, ListOrdered, Target, GraduationCap, ArrowRightLeft, Wallet, Shield } from 'lucide-react-native';
import { useFinanceData } from '../../hooks/useFinanceData';
import { HeroIcon } from '../../components/HeroIcon';
import { useHeroTheme } from '../../lib/themeContext';

export default function TabLayout() {
  const { userData } = useFinanceData();
  const router = useRouter();
  const theme = useHeroTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tabActive,
        tabBarInactiveTintColor: '#94a3b8',
        headerShown: true,
        headerTitle: "Finance Hub",
        headerTitleStyle: {
          fontWeight: '900',
          fontSize: 20,
          color: theme.headerText,
        },
        headerLeft: () => (
          <View style={[styles.logoIcon, { backgroundColor: theme.primary }]}>
            <Shield size={18} color="white" />
          </View>
        ),
        headerRight: () => (
          <TouchableOpacity
            onPress={() => router.push('/profile')}
            style={styles.headerAvatar}
          >
            <HeroIcon heroId={userData?.heroId || 'cap'} size={32} />
          </TouchableOpacity>
        ),
        headerStyle: {
          backgroundColor: theme.headerBg,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
          height: 100,
        },
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          backgroundColor: '#ffffff',
          height: 65,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ color }) => <ListOrdered size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          tabBarLabel: 'Accounts',
          tabBarIcon: ({ color }) => <Wallet size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          tabBarLabel: 'Budgets',
          tabBarIcon: ({ color }) => <Target size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="lend-borrow"
        options={{
          tabBarLabel: 'Lend',
          tabBarIcon: ({ color }) => <ArrowRightLeft size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  logoIcon: {
    marginLeft: 16,
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: {
    marginRight: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
});
