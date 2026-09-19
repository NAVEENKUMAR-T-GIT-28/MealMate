import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '@/utils/theme';
import { ThemeProvider } from '@/utils/ThemeProvider';
import { QueryProvider } from '@/query/QueryProvider';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { GroupProvider } from '@/context/GroupContext';
import { useSegments, useRouter, Slot } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native';

function LayoutContent() {
  const colors = useAppTheme();
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const firstSegment = segments[0];

  React.useEffect(() => {
    if (isLoading) return;
    
    const inAuthScreen = firstSegment === 'login' || firstSegment === 'signup';
    
    if (!isAuthenticated && !inAuthScreen) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthScreen) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, firstSegment]);

  if (isLoading) {
    return null; // Or a splash screen
  }



  return (
    <>
      <StatusBar style="auto" />
      <Tabs
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
          },
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
            paddingTop: 4,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textDim,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
          headerRight: () => {
            if (!user) return null;
            return (
              <TouchableOpacity 
                style={{ marginRight: 16, width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}
                onPress={() => router.push('/profile')}
              >
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                  {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Today',
            tabBarIcon: ({ color, size }: { color: any; size: number }) => (
              <Ionicons name="today-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="members"
          options={{
            title: 'Group',
            tabBarIcon: ({ color, size }: { color: any; size: number }) => (
              <Ionicons name="people-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="summary"
          options={{
            title: 'Summary',
            headerShown: false,
            tabBarIcon: ({ color, size }: { color: any; size: number }) => (
              <Ionicons name="bar-chart-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ color, size }: { color: any; size: number }) => (
              <Ionicons name="time-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }: { color: any; size: number }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="login"
          options={{
            href: null,
            headerShown: false,
            tabBarStyle: { display: 'none' },
          }}
        />
        <Tabs.Screen
          name="signup"
          options={{
            href: null,
            headerShown: false,
            tabBarStyle: { display: 'none' },
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'My Profile',
            href: null,
          }}
        />
      </Tabs>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryProvider>
      <AuthProvider>
        <GroupProvider>
          <ThemeProvider>
            <LayoutContent />
          </ThemeProvider>
        </GroupProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
