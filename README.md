# 🍎 MacroScope

**MacroScope** is an intelligent, privacy-focused food and hydration tracking application powered by **Gemini 2.5 Flash**. Snap a photo, upload an image, or simply describe your meal — MacroScope instantly analyzes it and syncs to **Google Health Connect** for seamless integration with Fitbit, Samsung Health, Whoop, and more.

<div align="center">
  <img src="./assets/images/icon.png" width="120" alt="MacroScope Icon" />
</div>

## ✨ Features

### 📸 Capture & Analyze
- **Snap & Track**: Instantly analyze meals using your camera
- **Image Upload**: Upload food photos from your gallery
- **Text Mode**: Type "Oatmeal with blueberries" to log meals without a photo

### 🧠 Advanced AI (Gemini 2.5 Flash)
- **Smart Recognition**: Identifies food items with high accuracy
- **Quantity Detection**: Automatically detects portion sizes ("2 slices", "1 cup")
- **Meal Refinement**: Made a mistake? Say "Actually, that was turkey bacon" and it updates instantly
- **Extended Nutrition**: Tracks Calories, Protein, Carbs, Fats, Sugar, Fiber, Sodium, and Cholesterol

### 💧 Hydration Tracking
- **Quick Add Buttons**: +250ml, +500ml, +750ml for easy logging
- **Daily History**: View and delete individual water logs
- **Health Connect Sync**: Water intake syncs to Google Health Connect

### 🔗 Health Connect Integration (Android)
- **Full Sync**: Nutrition and Hydration data syncs to Health Connect
- **Whoop/Fitbit Compatible**: Data flows to connected fitness apps
- **Smart Upsert**: Editing a meal updates the existing Health Connect record
- **Delete Sync**: Deleting a meal/water log removes it from Health Connect
- **Android 14+ Ready**: Full support for the latest Android versions

### 📱 User Experience
- **Offline-First**: Uses **SQLite** for robust local storage
- **Custom Goals**: Set your own daily targets for Calories and Macros
- **Daily Stats**: Visual progress bars and summaries
- **Date Navigation**: Swipe between days to view history
- **Native Performance**: Built with **React Native** & **Expo**

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | React Native (Expo) |
| AI Model | Gemini 2.5 Flash |
| Styling | NativeWind (Tailwind CSS) |
| Database | expo-sqlite |
| Health Sync | react-native-health-connect |
| Icons | lucide-react-native |

## 🚀 Getting Started

### Prerequisites
- Node.js & npm
- Android Studio (for emulator) or Android device
- Gemini API Key ([Get one free](https://ai.google.dev/))

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/macroscope.git
   cd macroscope
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Generate native project**:
   ```bash
   npx expo prebuild --platform android
   ```

4. **Run the app**:
   ```bash
   npm run android
   ```

## 📱 Building Release APK

```bash
# Set SDK path (if needed)
echo "sdk.dir=$HOME/Library/Android/sdk" > android/local.properties

# Build release APK
cd android && ./gradlew assembleRelease
```

**Output**: `android/app/build/outputs/apk/release/app-release.apk`

## 🔑 Configuration

### Gemini API Key
1. Open Settings (gear icon)
2. Enter your Gemini API Key
3. Tap "Save Settings"

### Health Connect
1. Open Settings
2. Tap "Connect Google Health"
3. Grant permissions when prompted

> **Note**: On Android < 14, you may need to install the [Health Connect app](https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata) from the Play Store.

## 📊 Health Connect Permissions

MacroScope requests the following permissions:

| Permission | Read | Write | Purpose |
|------------|------|-------|---------|
| Nutrition | ✅ | ✅ | Log meals, sync calories & macros |
| Hydration | ✅ | ✅ | Log water intake |
| Total Calories Burned | ✅ | ❌ | Future: Net calorie display |

## 🗂️ Project Structure

```
macroscope/
├── app/                    # Expo Router pages
├── components/             # Reusable UI components
├── services/
│   ├── ai.js              # Gemini API integration
│   ├── db.js              # SQLite database
│   └── health.js          # Health Connect sync
├── plugins/
│   └── withHealthConnect.js  # Expo config plugin
└── assets/                 # Images, icons, fonts
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">
  <strong>Built with ❤️ using React Native, Expo, and Gemini AI</strong>
</div>
