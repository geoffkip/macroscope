import React from 'react';
import { cn } from '../utils';

const StatBar = ({ label, current, target, colorClass, bgClass }) => {
    const percentage = Math.min(100, Math.max(0, (current / target) * 100));

    return (
        <div className="mb-2">
            <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-gray-700">{label}</span>
                <span className="text-gray-500">{current} / {target}g</span>
            </div>
            <div className={cn("h-2 rounded-full", bgClass)}>
                <div
                    className={cn("h-full rounded-full transition-all duration-500", colorClass)}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

const DailyStats = ({ totals }) => {
    // Default targets for now - these could be settings later
    const targets = {
        calories: 2000,
        protein: 150,
        carbs: 200,
        fats: 70
    };

    const caloricPercentage = Math.min(100, Math.max(0, (totals.calories / targets.calories) * 100));

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Daily Summary</h2>

            <div className="flex items-center justify-between mb-6">
                <div className="relative w-24 h-24 flex items-center justify-center">
                    {/* Simple Circular Progress Placeholder */}
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100" />
                        <circle
                            cx="48"
                            cy="48"
                            r="40"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className="text-blue-500 transition-all duration-500"
                            strokeDasharray={251.2}
                            strokeDashoffset={251.2 - (251.2 * caloricPercentage / 100)}
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                        <span className="text-xl font-bold text-gray-900">{totals.calories}</span>
                        <span className="text-xs text-gray-500">Kcal</span>
                    </div>
                </div>

                <div className="flex-1 ml-6">
                    <StatBar label="Protein" current={totals.protein} target={targets.protein} colorClass="bg-orange-500" bgClass="bg-orange-100" />
                    <StatBar label="Carbs" current={totals.carbs} target={targets.carbs} colorClass="bg-green-500" bgClass="bg-green-100" />
                    <StatBar label="Fats" current={totals.fats} target={targets.fats} colorClass="bg-yellow-500" bgClass="bg-yellow-100" />
                </div>
            </div>
        </div>
    );
};

export default DailyStats;
