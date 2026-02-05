'use client';

import { cn } from '@/lib/utils';

interface SliderProps {
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step?: number;
    label?: string;
    formatValue?: (value: number) => string;
    marks?: { value: number; label: string }[];
}

export function Slider({
    value,
    onChange,
    min,
    max,
    step = 1,
    label,
    formatValue = (v) => v.toString(),
    marks,
}: SliderProps) {
    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className="space-y-3">
            {label && (
                <div className="flex items-center justify-between">
                    <span className="text-sm text-dark-300">{label}</span>
                    <span className="text-sm font-semibold text-white bg-dark-700 px-3 py-1 rounded-lg">
                        {formatValue(value)}
                    </span>
                </div>
            )}

            <div className="relative">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="w-full h-2 bg-dark-700 rounded-full appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-5
                     [&::-webkit-slider-thumb]:h-5
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-primary-500
                     [&::-webkit-slider-thumb]:shadow-lg
                     [&::-webkit-slider-thumb]:shadow-primary-500/50
                     [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:transition-transform
                     [&::-webkit-slider-thumb]:hover:scale-110"
                    style={{
                        background: `linear-gradient(to right, #22c55e ${percentage}%, #334155 ${percentage}%)`,
                    }}
                />
            </div>

            {marks && (
                <div className="flex justify-between px-1">
                    {marks.map((mark) => (
                        <button
                            key={mark.value}
                            onClick={() => onChange(mark.value)}
                            className={cn(
                                'text-xs transition-colors',
                                value === mark.value ? 'text-primary-400 font-semibold' : 'text-dark-400 hover:text-dark-200'
                            )}
                        >
                            {mark.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}