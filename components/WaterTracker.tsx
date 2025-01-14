import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useAnimatedStyle, 
  withSpring,
  withSequence,
  withTiming,
  useSharedValue
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function WaterTracker() {
  const [dailyGoal, setDailyGoal] = useState<number>(64); // Default goal of 64 oz
  const [currentIntake, setCurrentIntake] = useState<number>(0);
  const [isSettingGoal, setIsSettingGoal] = useState<boolean>(false);
  const [tempGoal, setTempGoal] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const scale = useSharedValue(1);
  const progress = useSharedValue(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      progress.value = withSpring(currentIntake / (dailyGoal || 1));
    }
  }, [currentIntake, dailyGoal, isLoaded]);

  const loadData = async () => {
    try {
      const storedGoal = await AsyncStorage.getItem('dailyGoal');
      const storedIntake = await AsyncStorage.getItem('currentIntake');
      
      if (storedGoal) {
        setDailyGoal(parseInt(storedGoal));
      } else {
        // If no stored goal, save the default goal
        await AsyncStorage.setItem('dailyGoal', '64');
      }
      
      if (storedIntake) {
        setCurrentIntake(parseInt(storedIntake));
      }
      
      setIsLoaded(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
      setIsLoaded(true);
    }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem('dailyGoal', dailyGoal.toString());
      await AsyncStorage.setItem('currentIntake', currentIntake.toString());
    } catch (error) {
      Alert.alert('Error', 'Failed to save data');
    }
  };

  const addWater = (amount: number) => {
    scale.value = withSequence(
      withSpring(1.2),
      withSpring(1)
    );
    
    const newIntake = currentIntake + amount;
    setCurrentIntake(newIntake);
    saveData();

    if (newIntake >= dailyGoal) {
      Alert.alert('Congratulations! 💦', "You've reached your daily water intake goal! 🎉");
    }
  };

  const saveGoal = () => {
    const newGoal = parseInt(tempGoal);
    if (isNaN(newGoal) || newGoal <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number');
      return;
    }
    setDailyGoal(newGoal);
    setIsSettingGoal(false);
    setTempGoal('');
    saveData();
  };

  const resetDay = () => {
    setCurrentIntake(0);
    saveData();
  };

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${Math.min(progress.value * 100, 100)}%`,
  }));

  const animatedScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <LinearGradient
      colors={['#4facfe', '#00f2fe']}
      style={styles.container}
    >
      {isLoaded ? (
        <View style={styles.glass}>
          {isSettingGoal ? (
            <View style={styles.goalInputContainer}>
              <Text style={styles.headerText}>Set Your Daily Goal</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter daily goal (fl oz)"
                keyboardType="numeric"
                value={tempGoal}
                onChangeText={setTempGoal}
                placeholderTextColor="#666"
              />
              <TouchableOpacity style={styles.goalButton} onPress={saveGoal}>
                <Text style={styles.buttonText}>Set Goal</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.goalDisplay}
                onPress={() => setIsSettingGoal(true)}
              >
                <Text style={styles.goalText}>Daily Goal: {dailyGoal} fl oz</Text>
                <Text style={styles.tapText}>Tap to change</Text>
              </TouchableOpacity>

              <Animated.View style={[styles.progressContainer, animatedScaleStyle]}>
                <Text style={styles.progressText}>
                  {currentIntake} / {dailyGoal} fl oz
                </Text>
                <View style={styles.progressBar}>
                  <Animated.View
                    style={[styles.progressFill, animatedProgressStyle]}
                  />
                </View>
              </Animated.View>

              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => addWater(8)}
                >
                  <MaterialCommunityIcons name="water" size={24} color="white" />
                  <Text style={styles.buttonText}>Add 8 fl oz</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.button}
                  onPress={() => addWater(16)}
                >
                  <MaterialCommunityIcons name="water" size={24} color="white" />
                  <Text style={styles.buttonText}>Add 16 fl oz</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.resetButton]}
                  onPress={resetDay}
                >
                  <MaterialCommunityIcons name="refresh" size={24} color="white" />
                  <Text style={styles.buttonText}>Reset Day</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      ) : (
        <View style={styles.glass}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 30,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
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
  goalInputContainer: {
    width: '100%',
    alignItems: 'center',
  },
  input: {
    width: '80%',
    height: 50,
    borderWidth: 1,
    borderColor: '#4facfe',
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: 'white',
  },
  goalDisplay: {
    marginBottom: 40,
    alignItems: 'center',
  },
  goalText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  tapText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  progressText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4facfe',
    marginBottom: 10,
  },
  progressBar: {
    width: '100%',
    height: 25,
    backgroundColor: '#e0e0e0',
    borderRadius: 15,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4facfe',
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#4facfe',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginVertical: 10,
    width: '80%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  goalButton: {
    backgroundColor: '#4facfe',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  resetButton: {
    backgroundColor: '#ff6b6b',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginLeft: 10,
  },
  loadingText: {
    fontSize: 18,
    color: '#333',
  },
});