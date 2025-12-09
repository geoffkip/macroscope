# MacroScope 🍎📸

**MacroScope** is an AI-powered nutrition tracker that lets you instantly analyze your food just by taking a picture. Built with React and powered by Google's Gemini API, it identifies your meal and breaks it down into detailed nutritional data (calories, protein, carbs, fats).

## Features ✨

- **AI Food Analysis**: Snap a photo and let Gemini identify the food and estimate macros.
- **Instant Nutritional Breakdown**: Get detailed info on calories, protein, carbs, and fats in seconds.
- **Privacy First**: Your API key is stored locally on your device, not on a central server.
- **Mobile Optimized**: Built with Capacitor to run smoothly as a native Android or iOS app.

## Tech Stack 🛠️

- **Frontend**: React 19, Vite, Tailwind CSS
- **AI Integration**: Google Gemini API (`@google/generative-ai`)
- **Mobile Wrapper**: Capacitor
- **Icons**: Lucide React

## Getting Started 🚀

### Prerequisites
- Node.js installed
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd macroscope
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Add your API Key**
   - Launch the app.
   - Click the **Settings** (gear) icon in the top right.
   - Paste your Gemini API key to enable AI analysis.

### Building for Mobile (Android)
To build the Android project (requires Android Studio):
```bash
npm run build
npx cap sync
npx cap open android
```
