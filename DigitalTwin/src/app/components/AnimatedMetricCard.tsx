import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Card } from "./ui/card";
import { LucideIcon } from "lucide-react";

interface AnimatedMetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  gradientFrom: string;
  gradientTo: string;
  iconBg: string;
  textColor: string;
  delay?: number;
  showProgress?: boolean;
  progressValue?: number;
}

export function AnimatedMetricCard({
  icon: Icon,
  label,
  value,
  gradientFrom,
  gradientTo,
  iconBg,
  textColor,
  delay = 0,
  showProgress = false,
  progressValue = 0,
}: AnimatedMetricCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === "number" ? value : parseFloat(value.toString().replace(/[^0-9.-]/g, ""));

  useEffect(() => {
    if (isNaN(numericValue)) return;
    
    const duration = 1000;
    const steps = 30;
    const increment = numericValue / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current += increment;
      if (step >= steps) {
        setDisplayValue(numericValue);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [numericValue]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, type: "spring", stiffness: 100 }}
      whileHover={{ scale: 1.05, y: -5 }}
    >
      <Card className={`p-5 bg-gradient-to-br ${gradientFrom} ${gradientTo} border-0 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group`}>
        {/* Animated glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
        
        <div className="flex items-start gap-3 relative z-10">
          <motion.div 
            className={`rounded-xl ${iconBg} p-3 shadow-lg`}
            animate={{ 
              boxShadow: [
                "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                "0 20px 25px -5px rgba(99, 102, 241, 0.3)",
                "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Icon className="h-5 w-5 text-white" />
          </motion.div>
          <div className="flex-1">
            <p className={`text-sm ${textColor} font-medium opacity-90`}>{label}</p>
            <motion.p 
              className={`text-3xl font-bold mt-1 ${textColor.replace('opacity-90', '')}`}
              key={displayValue}
            >
              {typeof value === "string" && value.startsWith("$") ? "$" : ""}
              {typeof value === "number" || !isNaN(numericValue) ? displayValue.toLocaleString() : value}
              {typeof value === "string" && value.includes("min") ? " min" : ""}
              {typeof value === "string" && value.includes("%") ? "%" : ""}
            </motion.p>
            {showProgress && (
              <div className="mt-3">
                <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white/40 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressValue}%` }}
                    transition={{ delay: delay + 0.3, duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
