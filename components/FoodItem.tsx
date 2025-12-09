import React from 'react';
import { View, Text } from 'react-native';

const FoodItem = ({ item }) => {
    return (
        <View className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm mb-2">
            <View className="flex-row justify-between items-start mb-1">
                <Text className="font-medium text-gray-900 text-base">{item.name}</Text>
                <Text className="text-sm font-bold text-blue-600">{item.calories} kcal</Text>
            </View>
            <Text className="text-xs text-gray-500 mb-2">
                {item.quantity && item.unit ? `${item.quantity} ${item.unit}` : item.portion}
            </Text>

            <View className="flex-row gap-2">
                <View className="bg-orange-50 p-1.5 rounded flex-1 items-center">
                    <Text className="font-semibold text-orange-700 text-xs">{item.protein}g</Text>
                    <Text className="text-orange-600 font-medium text-[10px]">Protein</Text>
                </View>
                <View className="bg-green-50 p-1.5 rounded flex-1 items-center">
                    <Text className="font-semibold text-green-700 text-xs">{item.carbs}g</Text>
                    <Text className="text-green-600 font-medium text-[10px]">Carbs</Text>
                </View>
                <View className="bg-yellow-50 p-1.5 rounded flex-1 items-center">
                    <Text className="font-semibold text-yellow-700 text-xs">{item.fats}g</Text>
                    <Text className="text-yellow-600 font-medium text-[10px]">Fats</Text>
                </View>
            </View>
        </View>
    );
};

export default FoodItem;
