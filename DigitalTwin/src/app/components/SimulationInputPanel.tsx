import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { TrendingUp, Users, DollarSign, Package } from "lucide-react";
import { motion } from "motion/react";
import { CenteredSlider } from "./CenteredSlider";

interface SimulationInputPanelProps {
  demandChange: number;
  staffCount: number;
  priceChange: number;
  inventoryLevel: number;
  onDemandChange: (value: number) => void;
  onStaffCountChange: (value: number) => void;
  onPriceChange: (value: number) => void;
  onInventoryLevelChange: (value: number) => void;
}

export function SimulationInputPanel({
  demandChange,
  staffCount,
  priceChange,
  inventoryLevel,
  onDemandChange,
  onStaffCountChange,
  onPriceChange,
  onInventoryLevelChange,
}: SimulationInputPanelProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <motion.div
          className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <TrendingUp className="h-5 w-5 text-white" />
        </motion.div>
        <h3 className="font-semibold text-xl text-gray-200">Simulation Inputs</h3>
      </div>

      {/* Demand Change Slider */}
      <motion.div
        className={`space-y-3 p-4 rounded-xl border relative overflow-hidden group transition-all duration-500 ${
          demandChange < 0
            ? 'bg-gradient-to-br from-red-900/40 to-rose-900/40 border-red-700/50'
            : demandChange > 0
            ? 'bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-green-700/50'
            : 'bg-gradient-to-br from-gray-900/40 to-slate-900/40 border-gray-700/50'
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        whileHover={{ scale: 1.02 }}
      >
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
          demandChange < 0
            ? 'bg-gradient-to-r from-red-500/10 to-rose-500/10'
            : demandChange > 0
            ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10'
            : 'bg-gradient-to-r from-gray-500/10 to-slate-500/10'
        }`}></div>
        <div className="flex items-center justify-between relative z-10">
          <Label htmlFor="demand-change" className={`flex items-center gap-2 font-medium ${
            demandChange < 0
              ? 'text-red-200'
              : demandChange > 0
              ? 'text-green-200'
              : 'text-gray-200'
          }`}>
            <TrendingUp className={`h-4 w-4 ${
              demandChange < 0
                ? 'text-red-400'
                : demandChange > 0
                ? 'text-green-400'
                : 'text-gray-400'
            }`} />
            Demand Change (%)
          </Label>
          <motion.span
            className={`text-sm font-semibold px-3 py-1 rounded-full border ${
              demandChange < 0
                ? 'bg-red-500/30 text-red-100 border-red-500/50'
                : demandChange > 0
                ? 'bg-green-500/30 text-green-100 border-green-500/50'
                : 'bg-gray-500/30 text-gray-100 border-gray-500/50'
            }`}
            key={demandChange}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
          >
            {demandChange > 0 ? '+' : ''}{demandChange}%
          </motion.span>
        </div>
        <CenteredSlider
          id="demand-change"
          min={-50}
          max={50}
          step={5}
          value={[demandChange]}
          onValueChange={(values) => onDemandChange(values[0])}
          className="w-full"
        />
        <div className={`flex justify-between text-xs ${
          demandChange < 0
            ? 'text-red-300/60'
            : demandChange > 0
            ? 'text-green-300/60'
            : 'text-gray-300/60'
        }`}>
          <span>-50%</span>
          <span>0%</span>
          <span>+50%</span>
        </div>
      </motion.div>

      {/* Staff Count Input */}
      <motion.div
        className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-700/50 relative overflow-hidden group"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        whileHover={{ scale: 1.02 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <Label htmlFor="staff-count" className="flex items-center gap-2 font-medium text-purple-200 relative z-10">
          <Users className="h-4 w-4 text-purple-400" />
          Staff Count
        </Label>
        <Input
          id="staff-count"
          type="number"
          min={1}
          max={20}
          value={staffCount}
          onChange={(e) => onStaffCountChange(parseInt(e.target.value) || 1)}
          className="w-full h-12 text-lg font-semibold bg-gray-950 border-purple-700 text-purple-100 placeholder:text-purple-500/50 relative z-10"
        />
      </motion.div>

      {/* Price Adjustment Slider */}
      <motion.div
        className={`space-y-3 p-4 rounded-xl border relative overflow-hidden group transition-all duration-500 ${
          priceChange < 0
            ? 'bg-gradient-to-br from-red-900/40 to-rose-900/40 border-red-700/50'
            : priceChange > 0
            ? 'bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-green-700/50'
            : 'bg-gradient-to-br from-gray-900/40 to-slate-900/40 border-gray-700/50'
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.02 }}
      >
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
          priceChange < 0
            ? 'bg-gradient-to-r from-red-500/10 to-rose-500/10'
            : priceChange > 0
            ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10'
            : 'bg-gradient-to-r from-gray-500/10 to-slate-500/10'
        }`}></div>
        <div className="flex items-center justify-between relative z-10">
          <Label htmlFor="price-change" className={`flex items-center gap-2 font-medium ${
            priceChange < 0
              ? 'text-red-200'
              : priceChange > 0
              ? 'text-green-200'
              : 'text-gray-200'
          }`}>
            <DollarSign className={`h-4 w-4 ${
              priceChange < 0
                ? 'text-red-400'
                : priceChange > 0
                ? 'text-green-400'
                : 'text-gray-400'
            }`} />
            Price Adjustment (%)
          </Label>
          <motion.span
            className={`text-sm font-semibold px-3 py-1 rounded-full border ${
              priceChange < 0
                ? 'bg-red-500/30 text-red-100 border-red-500/50'
                : priceChange > 0
                ? 'bg-green-500/30 text-green-100 border-green-500/50'
                : 'bg-gray-500/30 text-gray-100 border-gray-500/50'
            }`}
            key={priceChange}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
          >
            {priceChange > 0 ? '+' : ''}{priceChange}%
          </motion.span>
        </div>
        <CenteredSlider
          id="price-change"
          min={-30}
          max={30}
          step={5}
          value={[priceChange]}
          onValueChange={(values) => onPriceChange(values[0])}
          className="w-full"
        />
        <div className={`flex justify-between text-xs ${
          priceChange < 0
            ? 'text-red-300/60'
            : priceChange > 0
            ? 'text-green-300/60'
            : 'text-gray-300/60'
        }`}>
          <span>-30%</span>
          <span>0%</span>
          <span>+30%</span>
        </div>
      </motion.div>

      {/* Inventory Level Input */}
      <motion.div
        className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border border-blue-700/50 relative overflow-hidden group"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        whileHover={{ scale: 1.02 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="flex items-center justify-between relative z-10">
          <Label htmlFor="inventory-level" className="flex items-center gap-2 font-medium text-blue-200">
            <Package className="h-4 w-4 text-blue-400" />
            Inventory Level (%)
          </Label>
          <motion.span
            className="text-sm font-semibold px-3 py-1 rounded-full bg-blue-500/30 text-blue-100 border border-blue-500/50"
            key={inventoryLevel}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
          >
            {inventoryLevel}%
          </motion.span>
        </div>
        <Input
          id="inventory-level"
          inputMode="numeric"
          pattern="[0-9]*"
          type="number"
          min={0}
          max={100}
          step={5}
          value={inventoryLevel}
          onKeyDown={(e) => {
            if (e.key === "e" || e.key === "E" || e.key === "+" || e.key === "-" || e.key === ".") {
              e.preventDefault();
            }
          }}
          onChange={(e) => {
            const parsed = Number.parseInt(e.target.value, 10);
            const next = Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : 0;
            onInventoryLevelChange(next);
          }}
          className="w-full h-12 text-lg font-semibold bg-gray-950 border-blue-700 text-blue-100 placeholder:text-blue-500/50 relative z-10"
        />
        <div className="flex justify-between text-xs text-blue-300/60">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </motion.div>
    </div>
  );
}
