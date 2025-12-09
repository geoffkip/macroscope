import React from 'react';
import { Camera, Plus } from 'lucide-react';
import FoodItem from './FoodItem';
import { cn } from '../utils';

const MealSection = ({ title, meals, onAddPhoto, isLoading }) => {
    // Calculate specific meal total
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
        <div className="mb-6">
            <div className="flex justify-between items-end mb-3 px-1">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                    <div className="text-xs text-gray-500">
                        {sectionTotals.calories} kcal • {sectionTotals.protein}p • {sectionTotals.carbs}c • {sectionTotals.fats}f
                    </div>
                </div>
                <button
                    onClick={onAddPhoto}
                    disabled={isLoading}
                    className="flex items-center gap-1 text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full active:bg-blue-100 disabled:opacity-50"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add Food</span>
                </button>
            </div>

            <div className="space-y-3">
                {meals.length === 0 ? (
                    <div className="border border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 bg-white/50">
                        <span className="text-sm">No food logged yet</span>
                    </div>
                ) : (
                    meals.map((meal) => (
                        <div key={meal.id} className="relative group">
                            {/* Simplified for now - assuming one analysis per meal entry, but could be multiple items in one analysis */}
                            {meal.analysis.items && meal.analysis.items.map((item, idx) => (
                                <FoodItem key={`${meal.id}-${idx}`} item={item} />
                            ))}

                            {/* Optional: Show the image that was verified */}
                            {meal.image && (
                                <div className="absolute top-2 right-2 w-8 h-8 rounded-lg overflow-hidden border border-white shadow-sm opacity-50 hover:opacity-100 transition-opacity">
                                    <img src={meal.image} alt="Meal" className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MealSection;
