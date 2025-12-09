import React from 'react';
import { View, Text } from 'react-native';

const StatBar = ({ label, current, target, colorClass, bgClass }) => {
    const percentage = Math.min(100, Math.max(0, (current / target) * 100));

    return (
        <View className="mb-2">
            <View className="flex-row justify-between mb-1">
                <Text className="font-medium text-gray-700 text-xs">{label}</Text>
                <Text className="text-gray-500 text-xs">{current} / {target}g</Text>
            </View>
            <View className={`h-2 rounded-full overflow-hidden ${bgClass}`}>
                <View
                    className={`h-full rounded-full ${colorClass}`}
                    style={{ width: `${percentage}%` }}
                />
            </View>
        </View>
    );
};

const DailyStats = ({ totals }) => {
    const targets = {
        calories: 2000,
        protein: 150,
        carbs: 200,
        fats: 70
    };

    const caloricPercentage = Math.min(100, Math.max(0, (totals.calories / targets.calories) * 100));

    return (
        <View className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">Daily Summary</Text>

            <View className="flex-row items-center justify-between">
                <View className="w-24 h-24 items-center justify-center border-4 border-gray-100 rounded-full relative">
                    <View className="items-center">
                        <Text className="text-xl font-bold text-gray-900">{totals.calories}</Text>
                        <Text className="text-xs text-gray-500">Kcal</Text>
                    </View>
                    {/* Note: Circular progress is harder in basic RN without SVG. 
               Using a simple border approximation for now or we could add react-native-svg later.
               For this MVP, the border-gray-100 is the 'empty' state.
           */}
                </View>

                <View className="flex-1 ml-6">
                    <StatBar label="Protein" current={totals.protein} target={targets.protein} colorClass="bg-orange-500" bgClass="bg-orange-100" />
                    <StatBar label="Carbs" current={totals.carbs} target={targets.carbs} colorClass="bg-green-500" bgClass="bg-green-100" />
                    <StatBar label="Fats" current={totals.fats} target={targets.fats} colorClass="bg-yellow-500" bgClass="bg-yellow-100" />
                </View>
            </View>
        </View>
    );
};

export default DailyStats;
