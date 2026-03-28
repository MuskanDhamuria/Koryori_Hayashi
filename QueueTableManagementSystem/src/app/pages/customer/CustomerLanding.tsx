import { QrCode, Users, Clock, Bell, ArrowRight, Shield } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';

export function CustomerLanding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950">
      <div className="container mx-auto px-4 py-10 max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-11 h-11 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-sm">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl leading-tight">Smart Queue</h1>
                <p className="text-xs text-muted-foreground">
                  Real-time updates
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => navigate('/staff')}
              className="bg-white/70 backdrop-blur dark:bg-slate-950/50 dark:border-slate-800"
            >
              <Shield className="w-4 h-4" />
              Staff
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <Card className="p-7 mb-6 bg-white/80 backdrop-blur shadow-sm dark:bg-slate-950/50 dark:border-slate-800">
            <div className="flex items-start gap-5">
              <div className="w-28 h-28 bg-white rounded-xl shadow-sm flex items-center justify-center border border-dashed border-gray-300">
                <QrCode className="w-14 h-14 text-gray-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl mb-2">Join in seconds</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Scan the restaurant QR or tap below to get an estimated wait time.
                </p>
                <Button
                  onClick={() => navigate('/join')}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                >
                  Join Queue
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  You’ll get a notification when your table is ready.
                </p>
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-4 bg-white/60 backdrop-blur hover:bg-white/70 transition-colors dark:bg-slate-950/40 dark:hover:bg-slate-950/55 dark:border-slate-800">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-300 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="mb-1">Real-time Updates</h3>
                    <p className="text-sm text-muted-foreground">
                      Predictions based on current conditions.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-4 bg-white/60 backdrop-blur hover:bg-white/70 transition-colors dark:bg-slate-950/40 dark:hover:bg-slate-950/55 dark:border-slate-800">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-300 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-5 h-5 text-purple-700" />
                  </div>
                  <div>
                    <h3 className="mb-1">Smart Notifications</h3>
                    <p className="text-sm text-muted-foreground">
                      Get alerted when your table is ready. No more waiting by the counter.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="p-4 bg-white/60 backdrop-blur hover:bg-white/70 transition-colors dark:bg-slate-950/40 dark:hover:bg-slate-950/55 dark:border-slate-800">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-300 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <h3 className="mb-1">Optimized Seating</h3>
                    <p className="text-sm text-muted-foreground">
                      Better table utilization means shorter waits for everyone.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          <div className="mt-8 text-center text-xs text-muted-foreground">
            By joining the queue, you agree to receive status updates about your table.
          </div>
        </motion.div>
      </div>
    </div>
  );
}
