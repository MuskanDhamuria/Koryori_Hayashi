import { Users, Package, DollarSign, Clock, Lightbulb, Sparkles } from "lucide-react";
import { Card } from "./ui/card";
import { AnimatedMetricCard } from "./AnimatedMetricCard";
import type { SimulationResult } from "../utils/simulationApi";

interface SimulationOutputPanelProps {
  result: SimulationResult | null;
  isLoading: boolean;
}

export function SimulationOutputPanel({ result, isLoading }: SimulationOutputPanelProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h3 className="font-semibold text-xl text-gray-200">Predicted Outcomes</h3>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-800 border-t-blue-500 mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-blue-500 animate-pulse" />
              </div>
            </div>
            <div>
              <p className="text-gray-200 font-semibold">Running AI Simulation...</p>
              <p className="text-gray-500 text-sm mt-1">Analyzing parameters</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h3 className="font-semibold text-xl text-gray-200">Predicted Outcomes</h3>
        </div>
        <div className="flex items-center justify-center h-64 rounded-xl border-2 border-dashed border-gray-700">
          <div className="text-center p-8">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-gray-500" />
            </div>
            <p className="text-gray-200 font-medium mb-2">
              Ready to Simulate
            </p>
            <p className="text-gray-500 text-sm">
              Adjust parameters and click "Run Simulation"<br />to see AI-powered predictions
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md animate-pulse">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-xl text-gray-200">Predicted Outcomes</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Engine: {result.engine_used ?? "unknown"}
            {result.engine_used === "ml" && result.ml_info
              ? ` (trained on ${result.ml_info.sample_count} runs)`
              : ""}
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Wait Time */}
        <AnimatedMetricCard
          icon={Clock}
          label="Wait Time"
          value={`${result.wait_time} min`}
          gradientFrom="from-blue-900/80"
          gradientTo="to-cyan-900/80"
          iconBg="bg-gradient-to-br from-blue-500 to-blue-600"
          textColor="text-blue-200"
          delay={0}
        />

        {/* Revenue */}
        <AnimatedMetricCard
          icon={DollarSign}
          label="Revenue"
          value={`$${result.revenue.toLocaleString()}`}
          gradientFrom="from-green-900/80"
          gradientTo="to-emerald-900/80"
          iconBg="bg-gradient-to-br from-green-500 to-green-600"
          textColor="text-green-200"
          delay={0.1}
        />

        {/* Staff Utilisation */}
        <AnimatedMetricCard
          icon={Users}
          label="Staff Utilisation"
          value={`${result.staff_utilisation}%`}
          gradientFrom="from-purple-900/80"
          gradientTo="to-indigo-900/80"
          iconBg="bg-gradient-to-br from-purple-500 to-purple-600"
          textColor="text-purple-200"
          delay={0.2}
          showProgress
          progressValue={result.staff_utilisation}
        />

        {/* Stockout Risk */}
        <AnimatedMetricCard
          icon={Package}
          label="Stockout Risk"
          value={`${result.inventory_usage}%`}
          gradientFrom="from-orange-900/80"
          gradientTo="to-amber-900/80"
          iconBg="bg-gradient-to-br from-orange-500 to-orange-600"
          textColor="text-orange-200"
          delay={0.3}
          showProgress
          progressValue={result.inventory_usage}
        />
      </div>

      {/* Recommendations Section */}
      <div className="mt-8">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-gray-200">
          <Lightbulb className="h-5 w-5 text-yellow-400" />
          Recommended Actions
        </h3>
        <Card className="p-5 bg-gradient-to-br from-yellow-900/40 via-amber-900/40 to-orange-900/40 border-2 border-yellow-600/50 shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex gap-3 relative z-10">
            <div className="rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 p-3 h-fit shadow-md">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-300 mb-3 flex items-center gap-2">
                <span>🤖 AI Recommendations</span>
              </p>
              <ul className="space-y-2">
                {result.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-yellow-100 leading-relaxed flex gap-2">
                    <span className="text-yellow-400 font-semibold">{idx + 1}.</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
