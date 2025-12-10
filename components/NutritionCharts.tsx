import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { X, TrendingUp } from 'lucide-react-native';
import { format, subDays } from 'date-fns';
import { getAggregatedMealData } from '@/services/db';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { r: '4', strokeWidth: '2', stroke: '#2563eb' },
    propsForBackgroundLines: { strokeWidth: 1, stroke: '#e5e7eb' },
};

const macroChartConfig = {
    ...chartConfig,
    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
};

const NutritionCharts = ({ visible, onClose }) => {
    const [period, setPeriod] = useState('week'); // 'week' or 'month'
    const [loading, setLoading] = useState(true);
    const [calorieData, setCalorieData] = useState({ labels: [], datasets: [{ data: [0] }] });
    const [macroData, setMacroData] = useState({ labels: [], datasets: [] });
    const [stats, setStats] = useState({ avgCalories: 0, avgProtein: 0, totalDays: 0 });

    useEffect(() => {
        if (visible) {
            loadChartData();
        }
    }, [visible, period]);

    const loadChartData = async () => {
        setLoading(true);
        try {
            const days = period === 'week' ? 7 : 30;
            const endDate = format(new Date(), 'yyyy-MM-dd');
            const startDate = format(subDays(new Date(), days - 1), 'yyyy-MM-dd');

            const aggregated = await getAggregatedMealData(startDate, endDate);

            // Build arrays for all days in range
            const labels = [];
            const calories = [];
            const protein = [];
            const carbs = [];
            const fats = [];

            let totalCalories = 0;
            let totalProtein = 0;
            let daysWithData = 0;

            for (let i = 0; i < days; i++) {
                const date = format(subDays(new Date(), days - 1 - i), 'yyyy-MM-dd');
                const dayLabel = format(subDays(new Date(), days - 1 - i), period === 'week' ? 'EEE' : 'd');
                labels.push(dayLabel);

                const dayData = aggregated[date] || { calories: 0, protein: 0, carbs: 0, fats: 0 };
                calories.push(dayData.calories);
                protein.push(dayData.protein);
                carbs.push(dayData.carbs);
                fats.push(dayData.fats);

                if (dayData.calories > 0) {
                    totalCalories += dayData.calories;
                    totalProtein += dayData.protein;
                    daysWithData++;
                }
            }

            // Ensure at least one data point
            if (calories.length === 0) {
                calories.push(0);
                labels.push('Today');
            }

            setCalorieData({
                labels: period === 'month' ? labels.filter((_, i) => i % 5 === 0 || i === labels.length - 1) : labels,
                datasets: [{ data: period === 'month' ? calories.filter((_, i) => i % 5 === 0 || i === calories.length - 1) : calories }],
            });

            setMacroData({
                labels: period === 'month' ? labels.filter((_, i) => i % 5 === 0 || i === labels.length - 1) : labels,
                datasets: [
                    { data: period === 'month' ? protein.filter((_, i) => i % 5 === 0 || i === protein.length - 1) : protein, color: () => '#3b82f6', strokeWidth: 2 },
                    { data: period === 'month' ? carbs.filter((_, i) => i % 5 === 0 || i === carbs.length - 1) : carbs, color: () => '#f59e0b', strokeWidth: 2 },
                    { data: period === 'month' ? fats.filter((_, i) => i % 5 === 0 || i === fats.length - 1) : fats, color: () => '#ef4444', strokeWidth: 2 },
                ],
                legend: ['Protein', 'Carbs', 'Fats'],
            });

            setStats({
                avgCalories: daysWithData > 0 ? Math.round(totalCalories / daysWithData) : 0,
                avgProtein: daysWithData > 0 ? Math.round(totalProtein / daysWithData) : 0,
                totalDays: daysWithData,
            });
        } catch (e) {
            console.error('Failed to load chart data:', e);
        } finally {
            setLoading(false);
        }
    };

    if (!visible) return null;

    return (
        <View className="absolute inset-0 bg-white z-50">
            <View className="flex-1 bg-gray-50">
                {/* Header */}
                <View className="px-4 py-3 bg-white border-b border-gray-100 pt-12">
                    <View className="flex-row justify-between items-center">
                        <View className="flex-row items-center gap-2">
                            <TrendingUp size={24} color="#2563eb" />
                            <Text className="text-xl font-bold text-gray-900">Nutrition Trends</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} className="p-2 bg-gray-100 rounded-full">
                            <X size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Period Toggle */}
                    <View className="flex-row gap-2 mt-4">
                        <TouchableOpacity
                            onPress={() => setPeriod('week')}
                            className={`flex-1 py-2 rounded-lg ${period === 'week' ? 'bg-blue-600' : 'bg-gray-100'}`}
                        >
                            <Text className={`text-center font-medium ${period === 'week' ? 'text-white' : 'text-gray-600'}`}>
                                Week
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setPeriod('month')}
                            className={`flex-1 py-2 rounded-lg ${period === 'month' ? 'bg-blue-600' : 'bg-gray-100'}`}
                        >
                            <Text className={`text-center font-medium ${period === 'month' ? 'text-white' : 'text-gray-600'}`}>
                                Month
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#2563eb" />
                    </View>
                ) : (
                    <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
                        {/* Stats Summary */}
                        <View className="flex-row gap-3 mb-4">
                            <View className="flex-1 bg-white p-4 rounded-xl border border-gray-100">
                                <Text className="text-gray-500 text-sm">Avg Calories</Text>
                                <Text className="text-2xl font-bold text-gray-900">{stats.avgCalories}</Text>
                                <Text className="text-gray-400 text-xs">per day</Text>
                            </View>
                            <View className="flex-1 bg-white p-4 rounded-xl border border-gray-100">
                                <Text className="text-gray-500 text-sm">Avg Protein</Text>
                                <Text className="text-2xl font-bold text-blue-600">{stats.avgProtein}g</Text>
                                <Text className="text-gray-400 text-xs">per day</Text>
                            </View>
                            <View className="flex-1 bg-white p-4 rounded-xl border border-gray-100">
                                <Text className="text-gray-500 text-sm">Days Logged</Text>
                                <Text className="text-2xl font-bold text-green-600">{stats.totalDays}</Text>
                                <Text className="text-gray-400 text-xs">of {period === 'week' ? 7 : 30}</Text>
                            </View>
                        </View>

                        {/* Calories Chart */}
                        <View className="bg-white p-4 rounded-xl border border-gray-100 mb-4">
                            <Text className="text-lg font-bold text-gray-900 mb-2">Calories</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <BarChart
                                    data={calorieData}
                                    width={period === 'month' ? screenWidth * 1.5 : screenWidth - 48}
                                    height={200}
                                    chartConfig={chartConfig}
                                    style={{ borderRadius: 12 }}
                                    showValuesOnTopOfBars
                                    fromZero
                                    yAxisSuffix=""
                                    yAxisLabel=""
                                />
                            </ScrollView>
                        </View>

                        {/* Macros Chart */}
                        <View className="bg-white p-4 rounded-xl border border-gray-100 mb-4">
                            <Text className="text-lg font-bold text-gray-900 mb-2">Macros (grams)</Text>
                            <View className="flex-row gap-4 mb-2">
                                <View className="flex-row items-center gap-1">
                                    <View className="w-3 h-3 rounded-full bg-blue-500" />
                                    <Text className="text-xs text-gray-600">Protein</Text>
                                </View>
                                <View className="flex-row items-center gap-1">
                                    <View className="w-3 h-3 rounded-full bg-yellow-500" />
                                    <Text className="text-xs text-gray-600">Carbs</Text>
                                </View>
                                <View className="flex-row items-center gap-1">
                                    <View className="w-3 h-3 rounded-full bg-red-500" />
                                    <Text className="text-xs text-gray-600">Fats</Text>
                                </View>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <LineChart
                                    data={macroData}
                                    width={period === 'month' ? screenWidth * 1.5 : screenWidth - 48}
                                    height={200}
                                    chartConfig={macroChartConfig}
                                    style={{ borderRadius: 12 }}
                                    bezier
                                    fromZero
                                />
                            </ScrollView>
                        </View>

                        <View className="h-20" />
                    </ScrollView>
                )}
            </View>
        </View>
    );
};

export default NutritionCharts;
