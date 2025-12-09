# 🍎 MacroScope

**MacroScope** is an intelligent, privacy-focused food tracking application powered by **Gemini 2.5 Flash**. It allows users to instantly analyze food by taking a photo, uploading an image, or simply typing a description. It provides detailed macronutrient breakdowns and syncs seamlessly with **Google Health Connect** on Android.

<div align="center">
  <img src="./assets/images/icon.png" width="100" alt="MacroScope Icon" />
</div>

## ✨ Features

### 📸 Capture & Analyze
- **Snap & Track**: Instantly analyze meals using your camera.
- **Image Upload**: Upload food photos from your gallery for analysis.
- **Text Mode**: Simply type "Oatmeal with blueberries" to log meals without a photo.

### 🧠 Advanced AI
- **Gemini 2.5 Flash**: State-of-the-art food recognition and macronutrient estimation.
- **Quantity Detection**: Automatically detects portion sizes (e.g., "2 slices", "1 cup").
- **Meal Refinement**: AI made a mistake? Just tell it "Actually, that was turkey bacon" and it instantly updates the nutrition facts.
- **Extended Nutrition**: Tracks Calories, Protein, Carbs, Fats, Sugar, Fiber, Sodium, and Cholesterol.

### 🔗 Integrations
- **Google Health Connect**: Syncs your nutrition data directly to Android's central health hub, allowing it to be shared with other fitness apps (Samsung Health, Google Fit, etc.).

### 📱 User Experience
- **Offline-First**: Uses **SQLite** for robust local storage.
- **Custom Goals**: Set your own daily targets for Calories and Macros.
- **Daily Stats**: Visual progress bars and summaries.
- **Native Performance**: Built with **React Native** & **Expo** for a smooth, reliable experience.

## 🛠️ Tech Stack

- **Framework**: React Native (Expo)
- **AI Model**: Gemini 2.5 Flash
- **Styling**: NativeWind (Tailwind CSS)
- **Database**: `expo-sqlite` (Native)
- **Integrations**: `react-native-health-connect`

## 🚀 Getting Started

### Prerequisites
- Node.js & npm
- Android Studio (for native Android simulation) or an Android Device

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/macroscope.git
    cd macroscope
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run the app**:
    - **Android**: `npm run android`
    - **Web**: `npm run dev` (Feature limited)

## 📱 Building the APK

To generate a standalone release APK for Android:

```bash
cd android
./gradlew assembleRelease
```

The output file will be located at:  
`android/app/build/outputs/apk/release/app-release.apk`

## 🔑 Configuration

1.  **Gemini API Key**: Required for AI features. Enter it in the Settings (Gear icon).
2.  **Health Connect**: Toggle "Connect Google Health" in Settings to enabling syncing.

## 📄 License

MIT
