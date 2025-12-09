import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react-native';
import FoodItem from './FoodItem';

const MealSection = ({ title, meals, onAddPhoto, onUploadPhoto, onDelete, isLoading }) => {
    const sectionTotals = meals.reduce((acc, meal) => {
        if (meal.analysis && meal.analysis.total) {
            acc.calories += meal.analysis.total.calories || 0;
            acc.protein += meal.analysis.total.protein || 0;
            acc.carbs += meal.analysis.total.carbs || 0;
            acc.fats += meal.analysis.total.fats || 0;
        }
        return acc;
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

    return (
        <View className="mb-6">
            <View className="flex-row justify-between items-end mb-3 px-1">
                <View>
                    <Text className="text-lg font-bold text-gray-800">{title}</Text>
                    <Text className="text-xs text-gray-500">
                        {sectionTotals.calories} kcal • {sectionTotals.protein}p • {sectionTotals.carbs}c • {sectionTotals.fats}f
                    </Text>
                </View>
                <View className="flex-row gap-2">
                    <TouchableOpacity
                        onPress={onUploadPhoto}
                        disabled={isLoading}
                        className={`items-center justify-center bg-gray-100 w-8 h-8 rounded-full ${isLoading ? 'opacity-50' : ''}`}
                    >
                        <ImageIcon size={16} color="#4b5563" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={onAddPhoto}
                        disabled={isLoading}
                        className={`flex-row items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-full ${isLoading ? 'opacity-50' : ''}`}
                    >
                        <Plus size={16} color="#2563eb" />
                        <Text className="text-sm font-medium text-blue-600">Camera</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View className="space-y-3">
                {meals.length === 0 ? (
                    <View className="border border-dashed border-gray-200 rounded-xl p-6 items-center justify-center bg-white/50">
                        <Text className="text-sm text-gray-400">No food logged yet</Text>
                    </View>
                ) : (
                    meals.map((meal) => (
                        <View key={meal.id} className="relative bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                            <View className="flex-row justify-between items-start mb-2">
                                <View className="flex-1">
                                    {meal.analysis.items && meal.analysis.items.map((item, idx) => (
                                        <FoodItem key={`${meal.id}-${idx}`} item={item} />
                                    ))}
                                </View>
                                {meal.imageBase64 && (
                                    <View className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 ml-2">
                                        <Image
                                            source={{ uri: `data:image/jpeg;base64,${meal.imageBase64}` }}
                                            className="w-full h-full"
                                        />
                                    </View>
                                )}
                            </View>

                            <TouchableOpacity
                                onPress={() => onDelete(meal.id)}
                                className="absolute bottom-2 right-2 p-2"
                            >
                                <Trash2 size={16} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </View>
        </View>
    );
};

export default MealSection;
