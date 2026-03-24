import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "./ui/utils";

interface CenteredSliderProps extends React.ComponentProps<typeof SliderPrimitive.Root> {
  min: number;
  max: number;
  value: number[];
  onValueChange: (value: number[]) => void;
}

export function CenteredSlider({
  className,
  min,
  max,
  value,
  onValueChange,
  ...props
}: CenteredSliderProps) {
  const currentValue = value[0];
  const center = 0; // Assuming center is at 0
  
  // Calculate percentage positions
  const minPercent = 0;
  const maxPercent = 100;
  const centerPercent = ((center - min) / (max - min)) * 100;
  const valuePercent = ((currentValue - min) / (max - min)) * 100;
  
  // Calculate range position and width
  const rangeLeft = currentValue < center ? valuePercent : centerPercent;
  const rangeWidth = Math.abs(valuePercent - centerPercent);
  
  return (
    <SliderPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      min={min}
      max={max}
      step={props.step || 1}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-800">
        {/* Center indicator */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-gray-600 z-10"
          style={{ left: `${centerPercent}%` }}
        />
        
        {/* Colored range from center to value */}
        <div
          className={cn(
            "absolute h-full transition-all duration-200",
            currentValue < 0
              ? "bg-gradient-to-r from-red-500 to-red-600"
              : currentValue > 0
              ? "bg-gradient-to-r from-green-500 to-green-600"
              : "bg-gray-600"
          )}
          style={{
            left: `${rangeLeft}%`,
            width: `${rangeWidth}%`,
          }}
        />
      </SliderPrimitive.Track>
      
      <SliderPrimitive.Thumb
        className={cn(
          "block h-5 w-5 rounded-full border-2 shadow-lg transition-all",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900",
          "disabled:pointer-events-none disabled:opacity-50",
          "hover:scale-110",
          currentValue < 0
            ? "bg-red-500 border-red-400 focus:ring-red-500"
            : currentValue > 0
            ? "bg-green-500 border-green-400 focus:ring-green-500"
            : "bg-gray-500 border-gray-400 focus:ring-gray-500"
        )}
      />
    </SliderPrimitive.Root>
  );
}
