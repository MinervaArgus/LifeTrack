import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, ScrollView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { TimeIntervalTriggerInput, SchedulableTriggerInputTypes } from 'expo-notifications';
import { format } from 'date-fns';

interface Medication {
  id: string;
  name: string;
  time: string;
  notificationId: string;
  lastTaken: string | null;
  isActive: boolean;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function MedicationTracker() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isAddingMed, setIsAddingMed] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    loadMedications();
    setupNotifications();
  }, []);

  const setupNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please enable notifications to receive medication reminders.');
    }
  };

  const loadMedications = async () => {
    try {
      const storedMeds = await AsyncStorage.getItem('medications');
      if (storedMeds) {
        setMedications(JSON.parse(storedMeds));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load medications');
    }
  };

  const saveMedications = async (updatedMeds: Medication[]) => {
    try {
      await AsyncStorage.setItem('medications', JSON.stringify(updatedMeds));
    } catch (error) {
      Alert.alert('Error', 'Failed to save medications');
    }
  };

  const scheduleNotification = async (medication: Medication) => {
    try {
      const [hours, minutes] = medication.time.split(':');
      const now = new Date();
      let notificationTime = new Date();
      notificationTime.setHours(parseInt(hours), parseInt(minutes), 0);

      if (notificationTime < now) {
        notificationTime.setDate(notificationTime.getDate() + 1);
      }

      const trigger: TimeIntervalTriggerInput = {
        seconds: Math.floor((notificationTime.getTime() - now.getTime()) / 1000),
        repeats: true,
        type: SchedulableTriggerInputTypes.TIME_INTERVAL
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Medication Reminder',
          body: `Time to take ${medication.name}!`,
          data: { medicationId: medication.id },
        },
        trigger,
      });

      return notificationId;
    } catch (error) {
      console.error('Notification scheduling error:', error);
      Alert.alert('Error', 'Failed to schedule notification');
      return '';
    }
  };

  const addMedication = async () => {
    if (!newMedName.trim()) {
      Alert.alert('Error', 'Please enter a medication name');
      return;
    }

    try {
      const newMed: Medication = {
        id: Date.now().toString(),
        name: newMedName.trim(),
        time: format(selectedTime, 'HH:mm'),
        notificationId: '',
        lastTaken: null,
        isActive: true,
      };

      const notificationId = await scheduleNotification(newMed);
      newMed.notificationId = notificationId;

      const updatedMeds = [...medications, newMed];
      setMedications(updatedMeds);
      await saveMedications(updatedMeds);
      setIsAddingMed(false);
      setNewMedName('');
    } catch (error) {
      console.error('Error adding medication:', error);
      Alert.alert('Error', 'Failed to add medication');
    }
  };

  const markAsTaken = async (medicationId: string) => {
    const updatedMeds = medications.map(med => {
      if (med.id === medicationId) {
        return {
          ...med,
          lastTaken: new Date().toISOString(),
          isActive: false,
        };
      }
      return med;
    });

    setMedications(updatedMeds);
    saveMedications(updatedMeds);
  };

  const deleteMedication = async (medicationId: string) => {
    const medToDelete = medications.find(med => med.id === medicationId);
    if (medToDelete?.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(medToDelete.notificationId);
    }

    const updatedMeds = medications.filter(med => med.id !== medicationId);
    setMedications(updatedMeds);
    saveMedications(updatedMeds);
  };

  return (
    <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.glass}>
          {isAddingMed ? (
            <View style={styles.addMedContainer}>
              <Text style={styles.headerText}>Add New Medication</Text>
              <TextInput
                style={styles.input}
                placeholder="Medication Name"
                value={newMedName}
                onChangeText={setNewMedName}
                placeholderTextColor="#666"
              />
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.timeButtonText}>
                  Set Time: {format(selectedTime, 'hh:mm a')}
                </Text>
              </TouchableOpacity>

              {showTimePicker && (
                <DateTimePicker
                  value={selectedTime}
                  mode="time"
                  is24Hour={false}
                  onChange={(event, date) => {
                    setShowTimePicker(false);
                    if (date) setSelectedTime(date);
                  }}
                />
              )}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setIsAddingMed(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.button}
                  onPress={addMedication}
                >
                  <Text style={styles.buttonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setIsAddingMed(true)}
              >
                <MaterialCommunityIcons name="plus" size={24} color="white" />
                <Text style={styles.buttonText}>Add Medication</Text>
              </TouchableOpacity>

              {medications.map(med => (
                <View key={med.id} style={styles.medicationCard}>
                  <View style={styles.medicationInfo}>
                    <Text style={styles.medicationName}>{med.name}</Text>
                    <Text style={styles.medicationTime}>
                      Reminder: {format(new Date(`2000-01-01T${med.time}`), 'hh:mm a')}
                    </Text>
                    {med.lastTaken && (
                      <Text style={styles.lastTaken}>
                        Last taken: {format(new Date(med.lastTaken), 'hh:mm a')}
                      </Text>
                    )}
                  </View>
                  <View style={styles.medicationButtons}>
                    <TouchableOpacity
                      style={[
                        styles.takenButton,
                        med.isActive ? styles.activeButton : styles.inactiveButton,
                      ]}
                      onPress={() => markAsTaken(med.id)}
                      disabled={!med.isActive}
                    >
                      <Text style={styles.buttonText}>
                        {med.isActive ? 'TAKE' : 'TAKEN'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteMedication(med.id)}
                    >
                      <MaterialCommunityIcons name="delete" size={24} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 30,
    padding: 20,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  addMedContainer: {
    width: '100%',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#4facfe',
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: 'white',
  },
  timeButton: {
    backgroundColor: '#4facfe',
    padding: 15,
    borderRadius: 15,
    width: '100%',
    marginBottom: 20,
  },
  timeButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    backgroundColor: '#4facfe',
    padding: 15,
    borderRadius: 25,
    flex: 0.45,
  },
  cancelButton: {
    backgroundColor: '#ff6b6b',
  },
  addButton: {
    backgroundColor: '#4facfe',
    padding: 15,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginLeft: 5,
  },
  medicationCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medicationInfo: {
    marginBottom: 10,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  medicationTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  lastTaken: {
    fontSize: 14,
    color: '#4facfe',
    marginTop: 5,
  },
  medicationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  takenButton: {
    padding: 10,
    borderRadius: 15,
    flex: 0.8,
    marginRight: 10,
  },
  activeButton: {
    backgroundColor: '#4facfe',
  },
  inactiveButton: {
    backgroundColor: '#90caf9',
  },
  deleteButton: {
    backgroundColor: '#ff6b6b',
    padding: 10,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});