import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Users, Phone, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { queueStore } from '../../lib/queueStore';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export function QueueJoin() {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [groupSize, setGroupSize] = useState<number>(2);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const entry = await queueStore.addToQueue(phoneNumber, groupSize);
      navigate(`/status/${entry.id}`);
    } catch (error) {
      toast.error('Unable to join queue', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const groupSizes = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950">
      <div className="container mx-auto px-4 py-10 max-w-lg">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-sm">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl mb-2">Join the Queue</h1>
            <p className="text-muted-foreground">
              Enter your details to get in line
            </p>
          </div>

          <Card className="p-6 bg-white/80 backdrop-blur shadow-sm dark:bg-slate-950/50 dark:border-slate-800">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="555-0123"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-10"
                    required
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  We'll notify you when your table is ready
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Group Size</Label>
                  <span className="text-xs text-muted-foreground">Selected: {groupSize}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {groupSizes.map((size) => (
                    <motion.div key={size} whileTap={{ scale: 0.97 }}>
                      <Button
                        type="button"
                        variant={groupSize === size ? 'default' : 'outline'}
                        onClick={() => setGroupSize(size)}
                        className="h-14 w-full flex-col gap-1"
                        aria-pressed={groupSize === size}
                      >
                        <Users className="w-4 h-4" />
                        <span className="text-sm">{size}</span>
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-4 dark:bg-slate-900/40 dark:border-slate-800">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm">Our AI will predict your wait time based on:</p>
                    <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                      <li>• Real-time arrivals and queue conditions</li>
                      <li>• Dining duration patterns by group size</li>
                      <li>• Table capacity and availability</li>
                      <li>• Optimization for better seat utilization</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="lg"
                disabled={isSubmitting || !phoneNumber}
              >
                {isSubmitting ? 'Joining...' : 'Join Queue'}
              </Button>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
