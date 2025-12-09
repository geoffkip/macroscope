import React from 'react';
import { motion } from 'framer-motion';
import { ChefHat, Flame, Droplet, Wheat, Dumbbell } from 'lucide-react';

const MacroCard = ({ icon: Icon, label, value, unit, color }) => (
    <div className={`p-4 rounded-xl ${color} bg-opacity-10 border border-opacity-20`}>
        <div className="flex items-center gap-2 mb-1">
            <Icon className={`w-4 h-4 ${color.replace('bg-', 'text-')}`} />
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{label}</span>
        </div>
        <div className="text-xl font-bold text-gray-900">
            {value}<span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>
        </div>
    </div>
);

const MacroDisplay = ({ data, isLoading }) => {
    if (isLoading) {
        return (
            <div className="w-full max-w-md mx-auto p-4">
                <div className="animate-pulse space-y-4">
                    <div className="h-48 bg-gray-200 rounded-xl"></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="h-24 bg-gray-200 rounded-xl"></div>
                        <div className="h-24 bg-gray-200 rounded-xl"></div>
                        <div className="h-24 bg-gray-200 rounded-xl"></div>
                        <div className="h-24 bg-gray-200 rounded-xl"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { foodName, calories, protein, carbs, fats, description } = data;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md mx-auto p-4 pt-0"
        >
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-6">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">{foodName}</h2>
                        <p className="text-gray-500 text-sm">{description}</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-xl">
                        <ChefHat className="w-6 h-6 text-orange-500" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                    <MacroCard
                        icon={Flame}
                        label="Calories"
                        value={calories}
                        unit="kcal"
                        color="bg-orange-500 border-orange-500"
                    />
                    <MacroCard
                        icon={Dumbbell}
                        label="Protein"
                        value={protein}
                        unit="g"
                        color="bg-blue-500 border-blue-500"
                    />
                    <MacroCard
                        icon={Wheat}
                        label="Carbs"
                        value={carbs}
                        unit="g"
                        color="bg-green-500 border-green-500"
                    />
                    <MacroCard
                        icon={Droplet}
                        label="Fats"
                        value={fats}
                        unit="g"
                        color="bg-yellow-500 border-yellow-500"
                    />
                </div>

                <div className="pt-4 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-400">AI Estimate • Verify portions manually</p>
                </div>
            </div>
        </motion.div>
    );
};

export default MacroDisplay;
