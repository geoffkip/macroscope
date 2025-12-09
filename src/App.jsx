import React, { useState, useEffect } from 'react';
import CameraCapture from './components/CameraCapture';
import MealSection from './components/MealSection';
import DailyStats from './components/DailyStats';
import { analyzeImage } from './services/ai';
import { addMeal, getMealsByDate } from './services/db';
import { Settings, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [meals, setMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMealType, setActiveMealType] = useState(null); // 'breakfast', 'lunch', etc.

  // API Key State
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [showSettings, setShowSettings] = useState(!localStorage.getItem('gemini_api_key'));
  const [error, setError] = useState(null);

  // Load meals when date changes
  useEffect(() => {
    const loadMeals = async () => {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const dayMeals = await getMealsByDate(dateStr);
      setMeals(dayMeals);
    };
    loadMeals();
  }, [currentDate]);

  // Derived state for stats
  const dailyTotals = meals.reduce((acc, meal) => {
    if (meal.analysis && meal.analysis.total) {
      acc.calories += meal.analysis.total.calories || 0;
      acc.protein += meal.analysis.total.protein || 0;
      acc.carbs += meal.analysis.total.carbs || 0;
      acc.fats += meal.analysis.total.fats || 0;
    }
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const handleImageCapture = async (imageData) => {
    if (!imageData) {
      setActiveMealType(null);
      return;
    }

    if (!apiKey) {
      setShowSettings(true);
      setError("Please enter your Gemini API Key first.");
      setActiveMealType(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Analyze
      const analysis = await analyzeImage(imageData, apiKey);

      // 2. Save to DB
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      await addMeal(dateStr, activeMealType, analysis, imageData);

      // 3. Refresh State
      const updatedMeals = await getMealsByDate(dateStr);
      setMeals(updatedMeals);

    } catch (err) {
      console.error(err);
      setError("Failed to analyze image. Please try again.");
    } finally {
      setIsLoading(false);
      setActiveMealType(null); // Closes camera overlay
    }
  };

  const saveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    setShowSettings(false);
    setError(null);
  };

  // Helper to filter meals by section
  const getMealsForSection = (type) => meals.filter(m => m.mealType === type);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative">

      {/* Header & Date Nav */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex justify-between items-center mb-3">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Macro<span className="text-blue-600">Scope</span></h1>
            <button onClick={() => setShowSettings(!showSettings)} className="p-2 hover:bg-gray-100 rounded-full">
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="flex items-center justify-between bg-gray-100 rounded-lg p-1">
            <button onClick={() => setCurrentDate(prev => subDays(prev, 1))} className="p-1 hover:bg-white rounded-md transition-colors shadow-sm">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <span className="font-semibold text-gray-800 text-sm">
              {format(currentDate, 'EEEE, MMM do')}
            </span>
            <button onClick={() => setCurrentDate(prev => addDays(prev, 1))} className="p-1 hover:bg-white rounded-md transition-colors shadow-sm">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">

        {/* Settings Area */}
        {showSettings && (
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-4">
            <h3 className="font-semibold text-blue-900 mb-2">Gemini API Key</h3>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-blue-200 text-sm mb-2"
              placeholder="Paste API Key"
            />
            <button onClick={() => saveApiKey(apiKey)} className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold">
              Save & Close
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 text-center">{error}</div>
        )}

        <DailyStats totals={dailyTotals} />

        <MealSection
          title="Breakfast"
          meals={getMealsForSection('breakfast')}
          onAddPhoto={() => setActiveMealType('breakfast')}
          isLoading={isLoading}
        />
        <MealSection
          title="Lunch"
          meals={getMealsForSection('lunch')}
          onAddPhoto={() => setActiveMealType('lunch')}
          isLoading={isLoading}
        />
        <MealSection
          title="Dinner"
          meals={getMealsForSection('dinner')}
          onAddPhoto={() => setActiveMealType('dinner')}
          isLoading={isLoading}
        />
        <MealSection
          title="Snacks"
          meals={getMealsForSection('snack')}
          onAddPhoto={() => setActiveMealType('snack')}
          isLoading={isLoading}
        />

      </main>

      {/* Camera Overlay Modal */}
      {activeMealType && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex flex-col">
          <div className="p-4 flex justify-between items-center text-white">
            <h3 className="font-semibold capitalize">Log {activeMealType}</h3>
            <button onClick={() => setActiveMealType(null)} className="p-2 bg-white/20 rounded-full">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            {isLoading ? (
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p>Analyzing food...</p>
              </div>
            ) : (
              /* Reusing CameraCapture but it feels weird covering the whole screen. 
                 Ideally CameraCapture component would just be the camera view. 
                 Assuming current CameraCapture handles its own UI. 
               */
              <CameraCapture onImageCapture={handleImageCapture} />
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
