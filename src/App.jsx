import React, { useState } from 'react';
import CameraCapture from './components/CameraCapture';
import MacroDisplay from './components/MacroDisplay';
import { analyzeImage } from './services/ai';
import { Settings, Utensils } from 'lucide-react';

function App() {
  const [analyzedData, setAnalyzedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [showSettings, setShowSettings] = useState(!localStorage.getItem('gemini_api_key'));
  const [error, setError] = useState(null);

  const handleImageCapture = async (imageData) => {
    if (!imageData) {
      setAnalyzedData(null);
      return;
    }

    if (!apiKey) {
      setShowSettings(true);
      setError("Please enter your Gemini API Key first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await analyzeImage(imageData, apiKey);
      setAnalyzedData(data);
    } catch (err) {
      setError("Failed to analyze image. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    setShowSettings(false);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Macro<span className="text-blue-600">Scope</span></h1>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Settings className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </header>

      <main className="pt-6 space-y-6">
        {showSettings && (
          <div className="max-w-md mx-auto px-4 mb-4">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
              <h3 className="font-semibold text-blue-900 mb-2">Gemini API Configuration</h3>
              <p className="text-sm text-blue-700 mb-3">
                To use the AI features, you need a free API key from Google AI Studio.
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste Gemini API Key here"
                  className="flex-1 px-3 py-2 rounded-lg border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => saveApiKey(apiKey)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="max-w-md mx-auto px-4">
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 text-center">
              {error}
            </div>
          </div>
        )}

        <CameraCapture onImageCapture={handleImageCapture} />

        <MacroDisplay data={analyzedData} isLoading={isLoading} />
      </main>
    </div>
  );
}

export default App;
