import { useEffect, useState } from 'react';
import { 
  Users, 
  LayoutGrid, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Sparkles,
  ArrowLeft,
  Bell,
  AlertCircle,
  Search
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import { queueStore, QueueEntry, Table } from '../../lib/queueStore';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';

export function StaffDashboard() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    // Initial load
    setQueue(queueStore.getQueue());
    setTables(queueStore.getTables());

    // Subscribe to updates
    const unsubscribe = queueStore.subscribe(() => {
      setQueue(queueStore.getQueue());
      setTables(queueStore.getTables());
    });

    return unsubscribe;
  }, []);

  const handleMarkReady = (queueId: string) => {
    queueStore.markAsReady(queueId);
    toast.success('Customer notified', {
      description: 'They will be alerted that their table is ready',
    });
  };

  const handleSeatParty = (queueId: string, tableId: number) => {
    queueStore.seatParty(queueId, tableId);
    setSelectedParty(null);
    toast.success('Party seated', {
      description: `Successfully seated at Table ${tableId}`,
    });
  };

  const handleClearTable = (tableId: number) => {
    queueStore.clearTable(tableId);
    toast.success('Table cleared', {
      description: 'Table is now available',
    });
  };

  const handleRemoveFromQueue = (queueId: string) => {
    queueStore.removeFromQueue(queueId);
    toast.success('Removed from queue');
  };

  const waitingParties = queue.filter(e => e.status === 'waiting');
  const readyParties = queue.filter(e => e.status === 'ready');
  const availableTables = tables.filter(t => t.status === 'available');
  const occupiedTables = tables.filter(t => t.status === 'occupied');

  const normalizedQuery = query.trim().toLowerCase();
  const filteredWaitingParties = normalizedQuery.length === 0
    ? waitingParties
    : waitingParties.filter(p => p.phoneNumber.toLowerCase().includes(normalizedQuery));
  const filteredReadyParties = normalizedQuery.length === 0
    ? readyParties
    : readyParties.filter(p => p.phoneNumber.toLowerCase().includes(normalizedQuery));

  // Get AI recommendation for selected party
  const getRecommendation = (party: QueueEntry) => {
    return queueStore.getOptimalTableAssignment(party.groupSize, party.id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl mb-1 flex items-center gap-2">
              <Users className="w-8 h-8 text-blue-600" />
              Staff Dashboard
            </h1>
            <p className="text-muted-foreground">
              Smart queue & table management with AI optimization
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Customer View
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-white/80 backdrop-blur dark:bg-slate-950/50 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">In Queue</p>
                <p className="text-3xl">{waitingParties.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white/80 backdrop-blur dark:bg-slate-950/50 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Ready</p>
                <p className="text-3xl">{readyParties.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white/80 backdrop-blur dark:bg-slate-950/50 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Available Tables</p>
                <p className="text-3xl">{availableTables.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <LayoutGrid className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white/80 backdrop-blur dark:bg-slate-950/50 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Occupied</p>
                <p className="text-3xl">{occupiedTables.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-4 bg-white/70 backdrop-blur mb-6 dark:bg-slate-950/40 dark:border-slate-800">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by phone number..."
                className="pl-9 bg-white/80 dark:bg-slate-950/50 dark:border-slate-800"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Showing {filteredReadyParties.length + filteredWaitingParties.length} of {readyParties.length + waitingParties.length} parties
            </p>
          </div>
        </Card>

        <Tabs defaultValue="queue" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="queue">Queue</TabsTrigger>
            <TabsTrigger value="tables">Tables</TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="space-y-4">
            {waitingParties.length === 0 && readyParties.length === 0 ? (
              <Card className="p-12 text-center bg-white/80 backdrop-blur dark:bg-slate-950/50 dark:border-slate-800">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl mb-2">No parties in queue</h3>
                <p className="text-muted-foreground">
                  Customers will appear here when they join the queue
                </p>
              </Card>
            ) : (
              <>
                {normalizedQuery.length > 0 && filteredReadyParties.length === 0 && filteredWaitingParties.length === 0 && (
                  <Card className="p-10 bg-white/80 backdrop-blur text-center dark:bg-slate-950/50 dark:border-slate-800">
                    <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg mb-1">No matches</h3>
                    <p className="text-sm text-muted-foreground">
                      Try searching a different phone number.
                    </p>
                  </Card>
                )}

                {filteredReadyParties.length > 0 && (
                  <div>
                    <h2 className="text-xl mb-3 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-green-600" />
                      Ready to Seat ({filteredReadyParties.length})
                    </h2>
                    <div className="space-y-3">
                      {filteredReadyParties.map((party) => (
                        <motion.div
                          key={party.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                        >
                          <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                  <p className="mb-1">{party.phoneNumber}</p>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Users className="w-4 h-4" />
                                    <span>{party.groupSize} people</span>
                                    <span>•</span>
                                    <span>Position #{party.position}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => setSelectedParty(party.id)}
                                >
                                  Seat Now
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRemoveFromQueue(party.id)}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h2 className="text-xl mb-3">Waiting ({filteredWaitingParties.length})</h2>
                  <div className="space-y-3">
                    {filteredWaitingParties.map((party, index) => {
                      const recommendation = getRecommendation(party);
                      const isSelected = selectedParty === party.id;

                      return (
                        <motion.div
                          key={party.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card className={`p-4 bg-white/80 backdrop-blur transition-all dark:bg-slate-950/50 dark:border-slate-800 ${isSelected ? 'ring-2 ring-blue-600' : ''}`}>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-start gap-4 flex-1">
                                <div className="w-12 h-12 rounded-full bg-blue-400 flex items-center justify-center flex-shrink-0">
                                  <span className="text-xl">#{party.position}</span>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p>{party.phoneNumber}</p>
                                    <Badge variant="outline">
                                      <Users className="w-3 h-3 mr-1" />
                                      {party.groupSize}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {party.estimatedWait} min wait
                                    </span>
                                    <span>•</span>
                                    <span>~{party.predictedDiningDuration} min dining</span>
                                    <span>•</span>
                                    <span>{new Date(party.joinedAt).toLocaleTimeString()}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleMarkReady(party.id)}
                                >
                                  <Bell className="w-4 h-4 mr-1" />
                                  Notify
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => setSelectedParty(isSelected ? null : party.id)}
                                >
                                  {isSelected ? 'Cancel' : 'Seat'}
                                </Button>
                              </div>
                            </div>

                            {isSelected && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="border-t pt-4"
                              >
                                <div className="mb-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-4 h-4 text-purple-600" />
                                    <span className="text-sm">AI Recommendation</span>
                                  </div>
                                  {recommendation.table ? (
                                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
                                      <p className="text-sm mb-1">
                                        <strong>Table {recommendation.table.id}</strong> (Capacity: {recommendation.table.capacity})
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {recommendation.reasoning}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Optimization Score: {recommendation.score.toFixed(1)}
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3 flex items-start gap-2">
                                      <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                      <p className="text-sm text-yellow-800">
                                        No suitable tables available at the moment
                                      </p>
                                    </div>
                                  )}
                                </div>

                                <div className="grid grid-cols-4 gap-2">
                                  {availableTables.map((table) => {
                                    const isRecommended = recommendation.table?.id === table.id;
                                    const canFit = table.capacity >= party.groupSize;

                                    return (
                                      <Button
                                        key={table.id}
                                        size="sm"
                                        variant={isRecommended ? 'default' : 'outline'}
                                        disabled={!canFit}
                                        onClick={() => handleSeatParty(party.id, table.id)}
                                        className={`h-auto flex-col py-3 ${isRecommended ? 'ring-2 ring-purple-400' : ''}`}
                                      >
                                        <span className="mb-1">Table {table.id}</span>
                                        <span className="text-xs opacity-70">
                                          {table.capacity} seats
                                        </span>
                                        {isRecommended && (
                                          <Sparkles className="w-3 h-3 mt-1" />
                                        )}
                                      </Button>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="tables" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl mb-3 text-green-600">
                  Available Tables ({availableTables.length})
                </h2>
                <div className="space-y-3">
                  {availableTables.map((table) => (
                    <Card key={table.id} className="p-4 bg-green-50 border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="mb-1 text-black font-bold">Table {table.id}</p>
                          <p className="text-sm text-black">
                            Capacity: {table.capacity} people
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                          Available
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xl mb-3 text-orange-600">
                  Occupied Tables ({occupiedTables.length})
                </h2>
                <div className="space-y-3">
                  {occupiedTables.map((table) => {
                    const party = table.currentParty;
                    if (!party) return null;

                    const elapsed = Math.floor((Date.now() - party.seatedAt.getTime()) / 60000);
                    const remaining = Math.max(0, Math.floor((party.estimatedFinish.getTime() - Date.now()) / 60000));

                    return (
                      <Card key={table.id} className="p-4 bg-orange-50 border-orange-200">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="mb-1 text-black font-bold">Table {table.id}</p>
                            <p className="text-sm text-black">
                              Party of {party.size} • {elapsed} min elapsed
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                            Occupied
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-black">
                            Est. {remaining} min remaining
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleClearTable(table.id)}
                          >
                            Clear Table
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
