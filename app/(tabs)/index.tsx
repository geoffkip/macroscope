import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, SafeAreaView, Modal, Image, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { format, addDays, subDays } from 'date-fns';
import { Settings, ChevronLeft, ChevronRight, X, Camera as CameraIcon, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

import DailyStats from '@/components/DailyStats';
import MealSection from '@/components/MealSection';
import { addMeal, getMealsByDate, getSetting, saveSetting, deleteMeal } from '@/services/db';
import { analyzeImage } from '@/services/ai';

export default function HomeScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [meals, setMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMealType, setActiveMealType] = useState(null); // 'breakfast', 'lunch', etc.

  // Settings & API Key
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
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
      } catch (e) {
        console.error("Failed to load settings:", e);
      }
      loadMeals();
    };
    loadData();
  }, []);

  useEffect(() => {
    loadMeals();
  }, [currentDate]);

  const loadMeals = async () => {
    try {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const dayMeals = await getMealsByDate(dateStr);
      setMeals(dayMeals);
    } catch (e) {
      console.error("Failed to load meals:", e);
    }
  };

  const handleSaveApiKey = async (key) => {
    setApiKey(key);
    await saveSetting('gemini_api_key', key);
    setShowSettings(false);
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

      await addMeal(dateStr, activeMealType, analysis, base64);
      await loadMeals();

    } catch (error) {
      Alert.alert("Error", "Failed to analyze food: " + error.message);
    } finally {
      setIsLoading(false);
      setActiveMealType(null);
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
      <View className="px-4 py-3 bg-white border-b border-gray-100">
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
          <Text className="font-semibold text-gray-800 text-base">
            {format(currentDate, 'EEEE, MMM do')}
          </Text>
          <TouchableOpacity onPress={() => setCurrentDate(prev => addDays(prev, 1))} className="p-2 bg-white rounded-lg shadow-sm">
            <ChevronRight size={20} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        <DailyStats totals={dailyTotals} />

        {/* Meal Sections */}
        {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
          <MealSection
            key={type}
            title={type.charAt(0).toUpperCase() + type.slice(1)}
            meals={getMealsForSection(type)}
            onAddPhoto={() => openCamera(type)}
            onUploadPhoto={() => pickImage(type)}
            onDelete={handleDeleteMeal}
            isLoading={isLoading}
          />
        ))}

        <View className="h-20" />
      </ScrollView>

      {/* Loading Overlay */}
      {isLoading && !showCamera && (
        <View className="absolute inset-0 bg-black/50 items-center justify-center z-50">
          <View className="bg-white p-6 rounded-2xl items-center shadow-xl">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="mt-4 font-medium text-gray-700">Analyzing Food...</Text>
          </View>
        </View>
      )}

      {/* Camera Modal */}
      <Modal visible={showCamera} animationType="slide">
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

      {/* Settings Modal */}
      <Modal visible={showSettings} animationType="fade" transparent>
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <View className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl">
            <Text className="text-xl font-bold text-gray-900 mb-2">Settings</Text>
            <Text className="text-sm text-gray-500 mb-4">Enter your Gemini API Key to enable AI analysis.</Text>

            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4 text-base"
              placeholder="API Key"
              value={apiKey}
              onChangeText={setApiKey}
              autoCapitalize="none"
              secureTextEntry
            />

            <TouchableOpacity
              onPress={() => handleSaveApiKey(apiKey)}
              className="bg-blue-600 rounded-xl py-3 items-center"
            >
              <Text className="text-white font-bold font-medium">Save Key</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
