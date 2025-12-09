try {
    const { getDefaultConfig } = require("expo/metro-config");
    const { withNativeWind } = require("nativewind/metro");

    console.log("Modules loaded");

    const config = getDefaultConfig(__dirname);
    console.log("Config loaded");

    config.resolver.assetExts.push("wasm");
    console.log("WASM added");

    const finalConfig = withNativeWind(config, { input: "./global.css" });
    console.log("NativeWind wrapped");
} catch (e) {
    console.error("Diagnostic failed:", e);
}
