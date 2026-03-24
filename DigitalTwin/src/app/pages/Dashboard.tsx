import { useState } from "react";
import { useNavigate } from "react-router";
import { Play, Zap, LogOut, User, Sparkles, Activity, Download } from "lucide-react";
import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { SimulationInputPanel } from "../components/SimulationInputPanel";
import { SimulationOutputPanel } from "../components/SimulationOutputPanel";
import { runSimulation, SimulationResult } from "../utils/simulationApi";
import { AnimatedBackground } from "../components/AnimatedBackground";

export function Dashboard() {
  const navigate = useNavigate();
  const [demandChange, setDemandChange] = useState(0);
  const [staffCount, setStaffCount] = useState(5);
  const [priceChange, setPriceChange] = useState(0);
  const [inventoryLevel, setInventoryLevel] = useState(0);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const formatSingaporeTimestamp = (date: Date) => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Singapore",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(date);

    const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const year = byType.year;
    const month = byType.month;
    const day = byType.day;
    const hour = byType.hour;
    const minute = byType.minute;
    const second = byType.second;
    const ms = String(date.getMilliseconds()).padStart(3, "0");

    // Singapore is always UTC+08:00 (no DST).
    return `${year}-${month}-${day}T${hour}:${minute}:${second}.${ms}+08:00`;
  };

  const formatSingaporeDateKey = (date: Date) => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Singapore",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);

    const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${byType.year}-${byType.month}-${byType.day}`;
  };

  const handleRunSimulation = async () => {
    setIsLoading(true);
    
    try {
      const simulationResult = await runSimulation({
        demand_change: demandChange,
        staff: staffCount,
        price_change: priceChange,
        inventory_level: inventoryLevel,
        engine: "ml",
      });
      
      setResult(simulationResult);
    } catch (error) {
      console.error("Simulation failed:", error);
      alert("Simulation failed. Make sure the backend is running on VITE_API_URL (default: http://localhost:4000).");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    navigate("/");
  };

  const handleExportReport = () => {
    if (!result) {
      alert("No simulation results to export. Please run a simulation first.");
      return;
    }

    const now = new Date();

    const reportData = {
      timestamp: formatSingaporeTimestamp(now),
      simulationInputs: {
        demandChange: `${demandChange > 0 ? '+' : ''}${demandChange}%`,
        staffCount: staffCount,
        priceChange: `${priceChange > 0 ? '+' : ''}${priceChange}%`,
        inventoryLevel: `${inventoryLevel}%`,
      },
      metrics: {
        waitTime: result.wait_time || 'N/A',
        revenueProjection: result.revenue || 'N/A',
        staffUtilization: result.staff_utilisation || 'N/A',
        stockoutRisk: result.inventory_usage || 'N/A',
      },
      recommendations: result.recommendations || [],
      generatedAt: new Intl.DateTimeFormat("en-SG", {
        timeZone: "Asia/Singapore",
        dateStyle: "medium",
        timeStyle: "medium",
      }).format(now),
    };

    const reportText = `
DIGITAL TWIN SIMULATION REPORT
Generated: ${reportData.generatedAt}
=====================================

SIMULATION INPUTS:
------------------
Demand Change: ${reportData.simulationInputs.demandChange}
Staff Count: ${reportData.simulationInputs.staffCount}
Price Adjustment: ${reportData.simulationInputs.priceChange}
Inventory Level: ${reportData.simulationInputs.inventoryLevel}

PREDICTED OUTCOMES:
------------------
Wait Time: ${reportData.metrics.waitTime}
Revenue Projection: ${reportData.metrics.revenueProjection}
Staff Utilization: ${reportData.metrics.staffUtilization}
Stockout Risk: ${reportData.metrics.stockoutRisk}

AI RECOMMENDATIONS:
------------------
${reportData.recommendations.length > 0 ? reportData.recommendations.map((rec, idx) => `${idx + 1}. ${rec}`).join('\n') : 'No recommendations available.'}

=====================================
Report ID: ${reportData.timestamp}
    `.trim();

    // Create and download the file
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulation-report-${formatSingaporeDateKey(now)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950 relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Animated gradient orbs */}
      <motion.div
        className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 15, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          x: [0, -30, 0],
          y: [0, -50, 0],
        }}
        transition={{ duration: 12, repeat: Infinity }}
      />

      {/* Top Navigation Bar */}
      <nav className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-50 relative">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <motion.div 
                className="rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 p-2.5 shadow-lg shadow-blue-500/30"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Zap className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Digital Twin Platform
                </h1>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  Based on Machine Learning Simulation Engine
                </p>
              </div>
            </motion.div>

            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-300">Admin User</span>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="gap-2 border-gray-700 hover:border-red-500 hover:bg-red-500/10 hover:text-red-400"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 max-w-7xl relative z-10">
        {/* Page Header */}
        <motion.div 
          className="mb-8 flex items-start justify-between"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div>
            <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-300 via-indigo-300 to-purple-300 bg-clip-text text-transparent">
              What-If Scenario Simulator
            </h2>
            <p className="text-gray-400 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              Adjust operational parameters and predict outcomes using AI-powered simulations
            </p>
          </div>
          
          {/* Export Report Button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={handleExportReport}
              disabled={!result}
              variant="outline"
              className="gap-2 border-green-700 bg-green-950/30 hover:bg-green-900/40 hover:border-green-600 text-green-300 hover:text-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </motion.div>
        </motion.div>

        {/* Main Simulation Interface */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Panel - Inputs */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Card className="p-6 bg-gray-900/60 backdrop-blur-sm border-gray-800 shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative z-10">
                <SimulationInputPanel
                  demandChange={demandChange}
                  staffCount={staffCount}
                  priceChange={priceChange}
                  inventoryLevel={inventoryLevel}
                  onDemandChange={setDemandChange}
                  onStaffCountChange={setStaffCount}
                  onPriceChange={setPriceChange}
                  onInventoryLevelChange={setInventoryLevel}
                />

                {/* Run Simulation Button */}
                <div className="mt-8 pt-6 border-t border-gray-800">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={handleRunSimulation}
                      disabled={isLoading}
                      className="w-full h-14 text-base bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 relative overflow-hidden group"
                      size="lg"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                      <Play className="h-5 w-5 mr-2 relative z-10" />
                      <span className="relative z-10">{isLoading ? "Running Simulation..." : "Run Simulation"}</span>
                    </Button>
                  </motion.div>
                  
                  
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Right Panel - Outputs */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <Card className="p-6 bg-gray-900/60 backdrop-blur-sm border-gray-800 shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <SimulationOutputPanel result={result} isLoading={isLoading} />
              </div>
            </Card>
          </motion.div>
        </div>

        {/* API Integration Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          
        </motion.div>
      </div>
    </div>
  );
}
