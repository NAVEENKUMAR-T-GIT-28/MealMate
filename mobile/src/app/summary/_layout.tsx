import React from 'react';
import { Stack } from 'expo-router';

export default function SummaryLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[month]" />
      <Stack.Screen name="member/[memberId]/[month]" />
    </Stack>
  );
}
