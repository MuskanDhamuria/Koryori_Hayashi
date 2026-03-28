import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Clock, Users, Bell, CheckCircle, ArrowLeft, TrendingDown, Ticket } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import { queueStore, QueueEntry } from '../../lib/queueStore';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export function QueueStatus() {
  const { queueId } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<QueueEntry | undefined>();
  const lastStatusRef = useRef<QueueEntry['status'] | undefined>(undefined);

  useEffect(() => {
    if (!queueId) return;

    // Initial load
    const initial = queueStore.getEntry(queueId);
    lastStatusRef.current = initial?.status;
    setEntry(initial);

    // Subscribe to updates
    const unsubscribe = queueStore.subscribe(() => {
      const updated = queueStore.getEntry(queueId);
      const previousStatus = lastStatusRef.current;
      lastStatusRef.current = updated?.status;
      setEntry(updated);

      // Show notification when ready
      if (updated?.status === 'ready' && previousStatus === 'waiting') {
        toast.success('Your table is ready!', {
          description: 'Please proceed to the host stand',
          duration: 10000,
        });
      }
    });

    return unsubscribe;
  }, [queueId]);

  const waitProgress = useMemo(() => {
    const remaining = entry?.estimatedWait ?? 0;
    return Math.max(0, 100 - (remaining / 30) * 100);
  }, [entry?.estimatedWait]);

  if (!entry) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950 flex items-center justify-center">
        <Card className="p-6 text-center bg-white/80 backdrop-blur dark:bg-slate-950/50 dark:border-slate-800">
          <p>Queue entry not found</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Return Home
          </Button>
        </Card>
      </div>
    );
  }

  const peopleAhead = Math.max(0, entry.position - 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950">
      <div className="container mx-auto px-4 py-10 max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="p-5 bg-white/80 backdrop-blur shadow-sm dark:bg-slate-950/50 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Ticket className="w-4 h-4" />
                <span>Queue Ticket</span>
              </div>
              <span className="text-xs text-muted-foreground">ID: {entry.id}</span>
            </div>
          </Card>

          {entry.status === 'ready' && (
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <Card className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl mb-1">Table Ready!</h2>
                    <p className="text-white/90">Please proceed to the host stand</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {entry.status === 'waiting' && (
            <>
              <Card className="p-8 bg-white/80 backdrop-blur text-center shadow-sm dark:bg-slate-950/50 dark:border-slate-800">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-sm">
                    <Clock className="w-10 h-10 text-white" />
                  </div>
                  <h1 className="text-4xl mb-2">{entry.estimatedWait} min</h1>
                  <p className="text-muted-foreground">Estimated wait time</p>
                </div>

                <Progress value={waitProgress} className="h-2 mb-4" />

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <TrendingDown className="w-4 h-4 text-green-600" />
                  <span>Predicted based on current conditions</span>
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 bg-white/80 backdrop-blur shadow-sm dark:bg-slate-950/50 dark:border-slate-800">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-400 flex items-center justify-center mb-3">
                      <span className="text-2xl">#</span>
                    </div>
                    <div className="text-3xl mb-1">{entry.position}</div>
                    <div className="text-sm text-muted-foreground">Your Position</div>
                  </div>
                </Card>

                <Card className="p-4 bg-white/80 backdrop-blur shadow-sm dark:bg-slate-950/50 dark:border-slate-800">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-purple-300 flex items-center justify-center mb-3">
                      <Users className="w-6 h-6 text-purple-700" />
                    </div>
                    <div className="text-3xl mb-1">{peopleAhead}</div>
                    <div className="text-sm text-muted-foreground">
                      {peopleAhead === 1 ? 'Party' : 'Parties'} Ahead
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="p-5 bg-white/80 backdrop-blur shadow-sm dark:bg-slate-950/50 dark:border-slate-800">
                <h3 className="mb-3 flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Queue Details
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span>{entry.phoneNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Group Size</span>
                    <span>{entry.groupSize} people</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Joined At</span>
                    <span>{new Date(entry.joinedAt).toLocaleTimeString()}</span>
                  </div>
                  {entry.predictedDiningDuration != null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Est. Dining Duration</span>
                      <span>{entry.predictedDiningDuration} min</span>
                    </div>
                  )}
                </div>
              </Card>
            </>
          )}

          {entry.status === 'seated' && (
            <Card className="p-6 bg-white/80 backdrop-blur text-center shadow-sm dark:bg-slate-950/50 dark:border-slate-800">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl mb-2">Enjoy Your Meal!</h2>
              <p className="text-muted-foreground">You've been seated at Table {entry.assignedTable}</p>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
