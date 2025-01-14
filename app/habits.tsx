import React from 'react';
import { View } from 'react-native';
import HabitsTracker from '../components/HabitTracker';

export default function HabitsPage() {
  return (
    <View style={{ flex: 1 }}>
      <HabitsTracker />
    </View>
  );
}