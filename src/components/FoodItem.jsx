import React from 'react';
import { cn } from '../utils';

const FoodItem = ({ item }) => {
    return (
        <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm mb-2">
            <div className="flex justify-between items-start mb-1">
                <h4 className="font-medium text-gray-900">{item.name}</h4>
                <span className="text-sm font-bold text-blue-600">{item.calories} kcal</span>
            </div>
            {item.portion && <div className="text-xs text-gray-500 mb-2">{item.portion}</div>}

            <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-orange-50 p-1 rounded text-center">
                    <div className="font-semibold text-orange-700">{item.protein}g</div>
                    <div className="text-orange-600 font-medium">Protein</div>
                </div>
                <div className="bg-green-50 p-1 rounded text-center">
                    <div className="font-semibold text-green-700">{item.carbs}g</div>
                    <div className="text-green-600 font-medium">Carbs</div>
                </div>
                <div className="bg-yellow-50 p-1 rounded text-center">
                    <div className="font-semibold text-yellow-700">{item.fats}g</div>
                    <div className="text-yellow-600 font-medium">Fats</div>
                </div>
            </div>
        </div>
    );
};

export default FoodItem;
