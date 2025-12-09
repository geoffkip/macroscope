import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, SafeAreaView, Modal, Image, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { format, addDays, subDays } from 'date-fns';
import { Settings, ChevronLeft, ChevronRight, X, Camera as CameraIcon, Image as ImageIcon, Calendar as CalendarIcon, Edit2, Keyboard } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import DailyStats from '@/components/DailyStats';
import MealSection from '@/components/MealSection';
import { addMeal, getMealsByDate, getSetting, saveSetting, deleteMeal, updateMeal } from '@/services/db';
import { analyzeImage, refineAnalysis, analyzeText } from '@/services/ai';
import { initHealthConnect, requestHealthPermissions, syncMealToHealthConnect } from '@/services/health';

export default function HomeScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [meals, setMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMealType, setActiveMealType] = useState(null); // 'breakfast', 'lunch', etc.

  // Refine Modal State
  const [showRefineModal, setShowRefineModal] = useState(false);
  const [mealToRefine, setMealToRefine] = useState(null);
  const [refineInstruction, setRefineInstruction] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  // Text Entry Modal State
  const [showTextModal, setShowTextModal] = useState(false);
  const [textInput, setTextInput] = useState('');

  // Settings & Targets
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // Macro Targets State
  const [targets, setTargets] = useState({
    calories: '2000',
    protein: '150',
    carbs: '200',
    fats: '70'
  });

  const [showCamera, setShowCamera] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      try {
        const key = await getSetting('gemini_api_key');
        if (key) setApiKey(key);
        else setShowSettings(true);

        // Load Targets
        const tCal = await getSetting('target_calories');
        const tPro = await getSetting('target_protein');
        const tCarb = await getSetting('target_carbs');
        const tFat = await getSetting('target_fats');

        setTargets({
          calories: tCal || '2000',
          protein: tPro || '150',
          carbs: tCarb || '200',
          fats: tFat || '70'
        });

      } catch (e) {
        console.error("Failed to load settings:", e);
      }
      loadMeals();

      // Init Health Connect moved to Settings button for safety
    };
    loadData();
  }, []);

  useEffect(() => {
    // Clear meals immediately to avoid confusion when switching dates
    setMeals([]);
    loadMeals();
  }, [currentDate]);

  const loadMeals = async () => {
    // setIsLoading(true); // Optional: if you want a spinner for every date change
    try {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const dayMeals = await getMealsByDate(dateStr);
      setMeals(dayMeals);
    } catch (e) {
      console.error("Failed to load meals:", e);
    } finally {
      // setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    await saveSetting('gemini_api_key', apiKey);
    await saveSetting('target_calories', targets.calories);
    await saveSetting('target_protein', targets.protein);
    await saveSetting('target_carbs', targets.carbs);
    await saveSetting('target_fats', targets.fats);
    setShowSettings(false);
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setCurrentDate(selectedDate);
    }
  };

  const openCamera = (type) => {
    setActiveMealType(type);
    setShowCamera(true);
    if (!permission?.granted) {
      requestPermission();
    }
  };

  const pickImage = async (type) => {
    setActiveMealType(type);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      // Ensure we have the base64 string
      const asset = result.assets[0];
      if (asset.base64) {
        await processImage(asset.base64);
      } else {
        Alert.alert("Error", "Could not get image data.");
      }
    }
  };

  const openTextEntry = (type) => {
    setActiveMealType(type);
    setTextInput('');
    setShowTextModal(true);
  };

  const handleTextAnalysis = async () => {
    if (!textInput.trim()) return;
    if (!apiKey) {
      alert("API Key missing");
      return;
    }
    setIsLoading(true);
    setShowTextModal(false);

    try {
      const analysis = await analyzeText(textInput, apiKey);
      if (analysis.error) {
        Alert.alert("Error", "Could not analyze text: " + analysis.error);
        return;
      }

      const dateStr = format(currentDate, 'yyyy-MM-dd');
      // No image base64 for text entries
      const mealId = await addMeal(dateStr, activeMealType, analysis, null);

      if (Platform.OS === 'android') {
        try {
          await syncMealToHealthConnect({ id: mealId, mealType: activeMealType, analysis, timestamp: Date.now() });
        } catch (e) {
          console.log("Sync failed:", e);
        }
      }
      await loadMeals();

    } catch (error) {
      Alert.alert("Error", "Failed to analyze text: " + error.message);
    } finally {
      setIsLoading(false);
      setActiveMealType(null);
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;
    setIsLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
      setShowCamera(false);
      await processImage(photo.base64);
    } catch (error) {
      console.error(error);
      alert('Failed to take photo');
      setIsLoading(false);
    }
  };

  const processImage = async (base64) => {
    if (!apiKey) {
      alert("API Key missing");
      return;
    }

    setIsLoading(true);
    try {
      const analysis = await analyzeImage(base64, apiKey);

      if (analysis.error) {
        Alert.alert("Not Recognized", "Food not recognized in photo.");
        return;
      }

      const dateStr = format(currentDate, 'yyyy-MM-dd');

      const mealId = await addMeal(dateStr, activeMealType, analysis, base64);

      // Sync to Health Connect
      if (Platform.OS === 'android') {
        try {
          await syncMealToHealthConnect({ id: mealId, mealType: activeMealType, analysis, timestamp: Date.now() });
        } catch (e) {
          console.log("Sync failed silently:", e);
        }
      }

      await loadMeals();

    } catch (error) {
      Alert.alert("Error", "Failed to analyze food: " + error.message);
    } finally {
      setIsLoading(false);
      setActiveMealType(null);
    }
  };

  const handleOpenRefine = (meal) => {
    setMealToRefine(meal);
    setRefineInstruction('');
    setShowRefineModal(true);
  };

  const handleSubmitRefine = async () => {
    if (!refineInstruction.trim() || !mealToRefine) return;

    setIsRefining(true);
    try {
      const newAnalysis = await refineAnalysis(mealToRefine.analysis, refineInstruction, apiKey);

      await updateMeal(mealToRefine.id, newAnalysis);

      if (Platform.OS === 'android') {
        try {
          await syncMealToHealthConnect({ ...mealToRefine, analysis: newAnalysis });
        } catch (e) { console.log("Sync failed silently:", e); }
      }

      await loadMeals();

      setShowRefineModal(false);
      setMealToRefine(null);
      setRefineInstruction('');
      Alert.alert("Success", "Meal updated!");

    } catch (error) {
      Alert.alert("Error", "Failed to refine meal: " + error.message);
    } finally {
      setIsRefining(false);
    }
  };


  const handleDeleteMeal = async (id) => {
    Alert.alert(
      "Delete Meal",
      "Are you sure you want to delete this meal?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteMeal(id);
            loadMeals();
          }
        }
      ]
    );
  };

  // Stats Logic
  const dailyTotals = meals.reduce((acc, meal) => {
    if (meal.analysis && meal.analysis.total) {
      acc.calories += meal.analysis.total.calories || 0;
      acc.protein += meal.analysis.total.protein || 0;
      acc.carbs += meal.analysis.total.carbs || 0;
      acc.fats += meal.analysis.total.fats || 0;
    }
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const getMealsForSection = (type) => meals.filter(m => m.mealType === type);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-gray-100 pt-12">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-bold text-gray-900">Macro<Text className="text-blue-600">Scope</Text></Text>
          <TouchableOpacity onPress={() => setShowSettings(true)} className="p-2 bg-gray-50 rounded-full">
            <Settings size={24} color="#4b5563" />
          </TouchableOpacity>
        </View>

        {/* Date Nav */}
        <View className="flex-row items-center justify-between bg-gray-100 rounded-xl p-1">
          <TouchableOpacity onPress={() => setCurrentDate(prev => subDays(prev, 1))} className="p-2 bg-white rounded-lg shadow-sm">
            <ChevronLeft size={20} color="#374151" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            className="flex-row items-center gap-2 px-4 py-2"
          >
            <CalendarIcon size={20} color="#374151" />
            <Text className="font-semibold text-gray-800 text-base">
              {format(currentDate, 'EEEE, MMM do')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setCurrentDate(prev => addDays(prev, 1))} className="p-2 bg-white rounded-lg shadow-sm">
            <ChevronRight size={20} color="#374151" />
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={currentDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'} // Explicitly check OS
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        <DailyStats totals={dailyTotals} targets={targets} />

        {/* Meal Sections */}
        {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
          <View key={type} className="mb-6">
            <View className="flex-row justify-between items-end mb-3 px-1">
              <View>
                <Text className="text-lg font-bold text-gray-800">{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
              </View>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => openTextEntry(type)}
                  disabled={isLoading}
                  className={`items-center justify-center bg-gray-100 w-8 h-8 rounded-full ${isLoading ? 'opacity-50' : ''}`}
                >
                  <Keyboard size={16} color="#4b5563" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => pickImage(type)}
                  disabled={isLoading}
                  className={`items-center justify-center bg-gray-100 w-8 h-8 rounded-full ${isLoading ? 'opacity-50' : ''}`}
                >
                  <ImageIcon size={16} color="#4b5563" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => openCamera(type)}
                  disabled={isLoading}
                  className={`flex-row items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-full ${isLoading ? 'opacity-50' : ''}`}
                >
                  <CameraIcon size={16} color="#2563eb" />
                  <Text className="text-sm font-medium text-blue-600">Camera</Text>
                </TouchableOpacity>
              </View>
            </View>
            <MealSection
              title="" // Handled above now for custom buttons
              meals={getMealsForSection(type)}
              onAddPhoto={() => { }} // Deprecated in favor of custom buttons above
              onUploadPhoto={() => { }} // Deprecated
              onDelete={handleDeleteMeal}
              onRefine={handleOpenRefine}
              isLoading={isLoading}
            />
          </View>
        ))}

        <View className="h-20" />
      </ScrollView>

      {/* Loading Overlay */}
      {isLoading && !showCamera && (
        <View className="absolute inset-0 bg-black/50 items-center justify-center z-50">
          <View className="bg-white p-6 rounded-2xl items-center shadow-xl">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="mt-4 font-medium text-gray-700">Analyzing...</Text>
          </View>
        </View>
      )}

      {/* Camera Modal */}
      <Modal visible={showCamera} animationType="slide" onRequestClose={() => setShowCamera(false)}>
        <View className="flex-1 bg-black">
          <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back">
            <View className="flex-1 justify-between p-6 safe-area-inset-top safe-area-inset-bottom">
              <TouchableOpacity
                onPress={() => setShowCamera(false)}
                className="self-end p-2 bg-black/40 rounded-full"
              >
                <X color="white" size={24} />
              </TouchableOpacity>

              <View className="items-center mb-8">
                <TouchableOpacity
                  onPress={takePicture}
                  className="w-20 h-20 rounded-full border-4 border-white items-center justify-center bg-white/20"
                >
                  <View className="w-16 h-16 bg-white rounded-full" />
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        </View>
      </Modal>

      {/* Text Entry Modal */}
      <Modal visible={showTextModal} animationType="fade" transparent onRequestClose={() => setShowTextModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black/50 justify-center p-4">
          <View className="bg-white rounded-2xl p-6 shadow-2xl">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-900">Describe Meal</Text>
              <TouchableOpacity onPress={() => setShowTextModal(false)}>
                <X size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            <Text className="text-sm text-gray-500 mb-4">
              E.g. "Create a meal with 2 scrambled eggs, 1 slice of toast, and a coffee."
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4 text-base h-32"
              placeholder="Type your meal description..."
              value={textInput}
              onChangeText={setTextInput}
              multiline
              textAlignVertical="top"
              autoFocus
            />
            <TouchableOpacity
              onPress={handleTextAnalysis}
              className="bg-blue-600 rounded-xl py-3 items-center"
            >
              <Text className="text-white font-bold font-medium">Analyze</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Refine Modal */}
      <Modal visible={showRefineModal} animationType="fade" transparent onRequestClose={() => setShowRefineModal(false)}>
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <View className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-900">Refine Meal</Text>
              <TouchableOpacity onPress={() => setShowRefineModal(false)} disabled={isRefining}>
                <X size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <Text className="text-sm text-gray-500 mb-4">
              Tell me what to correct. E.g. "It was almond butter", "Only 2 eggs".
            </Text>

            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4 text-base h-24"
              placeholder="Your correction..."
              value={refineInstruction}
              onChangeText={setRefineInstruction}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              onPress={handleSubmitRefine}
              disabled={isRefining}
              className={`bg-blue-600 rounded-xl py-3 items-center flex-row justify-center gap-2 ${isRefining ? 'opacity-70' : ''}`}
            >
              {isRefining && <ActivityIndicator size="small" color="white" />}
              <Text className="text-white font-bold font-medium">
                {isRefining ? 'Updating...' : 'Update Meal'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal visible={showSettings} animationType="fade" transparent onRequestClose={() => setShowSettings(false)}>
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <View className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-900">Settings</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <X size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <ScrollView className="mb-6 max-h-96">
              {/* ... Keep settings inputs same as before, simplified for brevity in this replacement block as they didn't change logic, just wrapped in Modal requestClose ... */}
              <View className="mb-6">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Gemini API Key</Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                  placeholder="API Key"
                  value={apiKey}
                  onChangeText={setApiKey}
                  autoCapitalize="none"
                  secureTextEntry
                />
              </View>
              <Text className="text-sm font-semibold text-gray-700 mb-3">Daily Macro Goals</Text>
              {/* ... Inputs ... */}
              <View className="flex-row justify-between gap-2 mb-4">
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1">Calories</Text>
                  <TextInput className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" value={targets.calories} onChangeText={(t) => setTargets({ ...targets, calories: t })} keyboardType="numeric" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1">Protein (g)</Text>
                  <TextInput className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" value={targets.protein} onChangeText={(t) => setTargets({ ...targets, protein: t })} keyboardType="numeric" />
                </View>
              </View>
              <View className="flex-row justify-between gap-2 mb-6">
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1">Carbs (g)</Text>
                  <TextInput className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" value={targets.carbs} onChangeText={(t) => setTargets({ ...targets, carbs: t })} keyboardType="numeric" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1">Fats (g)</Text>
                  <TextInput className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" value={targets.fats} onChangeText={(t) => setTargets({ ...targets, fats: t })} keyboardType="numeric" />
                </View>
              </View>

              {Platform.OS === 'android' && (
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      const initialized = await initHealthConnect();
                      if (initialized) {
                        const granted = await requestHealthPermissions();
                        if (granted) {
                          Alert.alert("Success", "Health Connect configured.");
                        } else {
                          Alert.alert("Notice", "Health Connect permissions were not granted.");
                        }
                      } else {
                        Alert.alert("Error", "Health Connect could not be initialized. Ensure Health Connect app is installed (if Android < 14).");
                      }
                    } catch (e) {
                      Alert.alert("Error", "Failed to connect: " + e.message);
                    }
                  }}
                  className="bg-green-600 rounded-xl py-3 items-center mb-3"
                >
                  <Text className="text-white font-bold font-medium">Connect Google Health</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            <TouchableOpacity
              onPress={handleSaveSettings}
              className="bg-blue-600 rounded-xl py-3 items-center"
            >
              <Text className="text-white font-bold font-medium">Save Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
