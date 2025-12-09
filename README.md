# 🍎 MacroScope

**MacroScope** is an intelligent, offline-first food tracking application powered by **Gemini 2.5 Flash**. It allows users to instantly analyze food by taking a photo or uploading an image, providing detailed macronutrient breakdowns and helping you stay on top of your nutrition goals.

<div align="center">
  <!-- You can add a screenshot here later -->
  <img src="./assets/images/icon.png" width="100" />
</div>

## ✨ Features

- **📸 Snap & Track**: Instantly analyze meals using your camera.
- **🖼️ Image Upload**: Analyze existing photos from your gallery.
- **🧠 AI-Powered**: Uses **Gemini 2.5 Flash** for high-accuracy food recognition and macronutrient estimation (Calories, Protein, Carbs, Fats).
- **📏 Quantity Detection**: Automatically detects portion sizes (e.g., "2 slices", "1 cup").
- **🔒 Offline-First**: Uses **SQLite** on Android for persistent, local storage. No internet required to view your history.
- **📊 Daily Stats**: Visual progress bars for your daily macro goals.
- **🚀 Native Performance**: Built with **React Native** & **Expo** for a smooth, native experience.

## 🛠️ Tech Stack

- **Framework**: React Native (Expo)
- **AI Model**: Gemini 2.5 Flash
- **Styling**: NativeWind (Tailwind CSS)
- **Database**: 
  - **Android**: `expo-sqlite` (Native persistent storage)
  - **Web**: `localStorage` (Cross-platform compatibility)
- **Camera**: `expo-camera`

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
    - **Web**: `npm run dev` (or `npx expo start --web`)
    - **iOS**: `npm run ios`

## 📱 Building the APK

To generate a standalone release APK for Android:

```bash
cd android
./gradlew assembleRelease
```

The output file will be located at:
`android/app/build/outputs/apk/release/app-release.apk`

## 🔑 Configuration

To enable AI features, you must enter your **Gemini API Key** in the app settings (Gear icon). The key is stored securely on your device.

## 📄 License

MIT
