import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';

interface Habit {
  id: string;
  name: string;
  completedDates: string[];
}

export default function HabitsTracker() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    try {
      const storedHabits = await AsyncStorage.getItem('habits');
      if (storedHabits) {
        setHabits(JSON.parse(storedHabits));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load habits');
    }
  };

  const saveHabits = async (updatedHabits: Habit[]) => {
    try {
      await AsyncStorage.setItem('habits', JSON.stringify(updatedHabits));
    } catch (error) {
      Alert.alert('Error', 'Failed to save habits');
    }
  };

  const addHabit = () => {
    if (!newHabitName.trim()) {
      Alert.alert('Error', 'Please enter a habit name');
      return;
    }

    const newHabit: Habit = {
      id: Date.now().toString(),
      name: newHabitName.trim(),
      completedDates: [],
    };

    const updatedHabits = [...habits, newHabit];
    setHabits(updatedHabits);
    saveHabits(updatedHabits);
    setIsAddingHabit(false);
    setNewHabitName('');
  };

  const toggleHabitCompletion = (habitId: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    const updatedHabits = habits.map(habit => {
      if (habit.id === habitId) {
        const isCompleted = habit.completedDates.includes(today);
        const newCompletedDates = isCompleted
          ? habit.completedDates.filter(date => date !== today)
          : [...habit.completedDates, today];
        
        return {
          ...habit,
          completedDates: newCompletedDates,
        };
      }
      return habit;
    });

    setHabits(updatedHabits);
    saveHabits(updatedHabits);
  };

  const deleteHabit = (habitId: string) => {
    Alert.alert(
      'Delete Habit',
      'Are you sure you want to delete this habit?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: () => {
            const updatedHabits = habits.filter(habit => habit.id !== habitId);
            setHabits(updatedHabits);
            saveHabits(updatedHabits);
          },
          style: 'destructive',
        },
      ]
    );
  };

  const isHabitCompletedToday = (completedDates: string[]) => {
    const today = new Date().toISOString().split('T')[0];
    return completedDates.includes(today);
  };

  const getCompletionStreak = (completedDates: string[]) => {
    if (completedDates.length === 0) return 0;
    
    const sortedDates = [...completedDates].sort();
    const today = new Date().toISOString().split('T')[0];
    let streak = 0;
    let currentDate = new Date(today);

    while (true) {
      const dateString = currentDate.toISOString().split('T')[0];
      if (!completedDates.includes(dateString)) break;
      
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  };

  return (
    <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.glass}>
          {isAddingHabit ? (
            <View style={styles.addHabitContainer}>
              <Text style={styles.headerText}>Add New Habit</Text>
              <TextInput
                style={styles.input}
                placeholder="Habit Name"
                value={newHabitName}
                onChangeText={setNewHabitName}
                placeholderTextColor="#666"
              />
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setIsAddingHabit(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.button}
                  onPress={addHabit}
                >
                  <Text style={styles.buttonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setIsAddingHabit(true)}
              >
                <MaterialCommunityIcons name="plus" size={24} color="white" />
                <Text style={styles.buttonText}>Add Habit</Text>
              </TouchableOpacity>

              {habits.map(habit => (
                <View key={habit.id} style={styles.habitCard}>
                  <View style={styles.habitInfo}>
                    <Text style={styles.habitName}>{habit.name}</Text>
                    <Text style={styles.streakText}>
                      {getCompletionStreak(habit.completedDates)} day streak
                    </Text>
                  </View>
                  <View style={styles.habitButtons}>
                    <TouchableOpacity
                      style={[
                        styles.checkButton,
                        isHabitCompletedToday(habit.completedDates) && styles.checkedButton,
                      ]}
                      onPress={() => toggleHabitCompletion(habit.id)}
                    >
                      <MaterialCommunityIcons
                        name={isHabitCompletedToday(habit.completedDates) ? "check-circle" : "check-circle-outline"}
                        size={30}
                        color="white"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteHabit(habit.id)}
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
  addHabitContainer: {
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
  habitCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  streakText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  habitButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkButton: {
    backgroundColor: '#4facfe',
    padding: 10,
    borderRadius: 15,
    marginRight: 10,
  },
  checkedButton: {
    backgroundColor: '#2ecc71',
  },
  deleteButton: {
    backgroundColor: '#ff6b6b',
    padding: 10,
    borderRadius: 15,
  },
});