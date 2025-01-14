import React from 'react';
import { View } from 'react-native';
import MedicationTracker from '../components/MedicationTracker';

export default function MedsPage() {
  return (
    <View style={{ flex: 1 }}>
      <MedicationTracker />
    </View>
  );
}