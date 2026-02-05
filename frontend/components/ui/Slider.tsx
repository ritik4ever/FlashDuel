interface SliderProps {
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step: number;
    label: string;
    formatValue: (value: number) => string;
    marks?: { value: number; label: string }[];
}

export function Slider({ value, onChange, min, max, step, label, formatValue, marks }: SliderProps) {
    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div>
            <div className="flex justify-between mb-2">
                <label className="text-sm text-dark-300">{label}</label>
                <span className="text-white font-semibold">{formatValue(value)}</span>
            </div>

            <div className="relative">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="w-full h-2 bg-dark-700 rounded-full appearance-none cursor-pointer slider-thumb"
                    style={{
                        background: `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${percentage}%, #374151 ${percentage}%, #374151 100%)`,
                    }}
                />
            </div>

            {marks && (
                <div className="flex justify-between mt-2">
                    {marks.map((mark) => (
                        <button
                            key={mark.value}
                            onClick={() => onChange(mark.value)}
                            className={`text-xs ${value === mark.value ? 'text-primary-400' : 'text-dark-500'}`}
                        >
                            {mark.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}