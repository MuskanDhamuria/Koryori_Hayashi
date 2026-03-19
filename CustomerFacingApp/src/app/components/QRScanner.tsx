import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Check, MapPin, QrCode, ScanLine, UtensilsCrossed } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { SeigaihaPattern } from "./JapanesePattern";
import { fetchAvailableTables } from "../services/api";

interface QRScannerProps {
  userName: string;
  onScanComplete: (tableNumber: string) => void;
}

export function QRScanner({ userName, onScanComplete }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [tableNumber, setTableNumber] = useState("");
  const [availableTables, setAvailableTables] = useState<
    Array<{ code: string; label: string; seatCount: number }>
  >([]);

  useEffect(() => {
    let cancelled = false;

    fetchAvailableTables()
      .then((tables) => {
        if (!cancelled) {
          setAvailableTables(tables);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAvailableTables([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const tableCodes = availableTables.length > 0
    ? availableTables.map((table) => table.code)
    : ["A-1", "A-2", "B-1", "B-2"];

  const handleScan = () => {
    setIsScanning(true);

    setTimeout(() => {
      const mockTableNumber = tableCodes[Math.floor(Math.random() * tableCodes.length)] ?? "";
      setTableNumber(mockTableNumber);
      setScanned(Boolean(mockTableNumber));
      setIsScanning(false);
    }, 2000);
  };

  const handleConfirm = () => {
    onScanComplete(tableNumber);
  };

  const handleManualEntry = (table: string) => {
    setTableNumber(table);
    setScanned(true);
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <SeigaihaPattern />
      <div className="pointer-events-none absolute right-[-4rem] top-[-3rem] h-56 w-56 rounded-full bg-[color:var(--gold)]/14 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-5rem] left-[-3rem] h-60 w-60 rounded-full bg-[color:var(--olive)]/14 blur-3xl" />

      <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center">
        <Card className="paper-panel w-full max-w-3xl gap-0 rounded-[32px] border-[color:var(--border)]">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[0.86fr_1.14fr]">
            <aside className="paper-panel-dark rounded-[28px] p-6 text-[color:var(--paper)]">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white/10 text-[color:var(--gold-soft)]">
                  <UtensilsCrossed className="h-6 w-6" />
                </div>
                <div>
                  <p className="menu-kicker text-[color:var(--gold-soft)]">Table Access</p>
                  <h2 className="menu-title text-4xl text-[color:var(--paper)]">Hello, {userName}</h2>
                </div>
              </div>

              <p className="text-sm leading-7 text-[color:var(--paper)]/76">
                Confirm the table code on your desk to unlock ordering, recommendations, and loyalty tracking.
              </p>

              <div className="mt-8 grid gap-3">
                {[
                  "Scan the table QR code for the fastest entry.",
                  "Or pick from the available table codes below.",
                  "Once confirmed, your menu will be ready immediately.",
                ].map((item, index) => (
                  <div
                    key={item}
                    className="rounded-[22px] border border-white/10 bg-white/6 px-4 py-4 text-sm leading-6 text-[color:var(--paper)]/78"
                  >
                    <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-[color:var(--gold-soft)]">
                      {index + 1}
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </aside>

            <section className="flex flex-col justify-center">
              {!scanned ? (
                <>
                  <div className="mb-6">
                    <p className="menu-kicker mb-3">Scan or Select</p>
                    <h1 className="menu-title text-4xl leading-tight">Find your table and begin.</h1>
                    <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">
                      This step links the order to the correct table before customers start browsing the menu.
                    </p>
                  </div>

                  <div className="relative mx-auto mb-8 aspect-square w-full max-w-xs rounded-[32px] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(240,234,220,0.92))] p-5 shadow-[0_18px_44px_rgba(40,52,90,0.08)]">
                    <div className="absolute left-4 top-4 h-8 w-8 rounded-tl-[18px] border-l-2 border-t-2 border-[color:var(--gold)]" />
                    <div className="absolute right-4 top-4 h-8 w-8 rounded-tr-[18px] border-r-2 border-t-2 border-[color:var(--gold)]" />
                    <div className="absolute bottom-4 left-4 h-8 w-8 rounded-bl-[18px] border-b-2 border-l-2 border-[color:var(--gold)]" />
                    <div className="absolute bottom-4 right-4 h-8 w-8 rounded-br-[18px] border-b-2 border-r-2 border-[color:var(--gold)]" />

                    {!isScanning ? (
                      <div className="flex h-full items-center justify-center rounded-[24px] border border-dashed border-[color:var(--border)] bg-white/55">
                        <QrCode className="h-28 w-28 text-[color:var(--ink-soft)]" />
                      </div>
                    ) : (
                      <div className="paper-panel-dark relative flex h-full items-center justify-center rounded-[24px]">
                        <div className="relative h-48 w-48 rounded-[20px] border border-[color:var(--gold-soft)]/55">
                          <motion.div
                            className="absolute left-0 right-0 h-[2px] bg-[color:var(--gold)] shadow-[0_0_16px_rgba(196,163,91,0.65)]"
                            animate={{ top: ["10%", "90%", "10%"] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          />
                          <ScanLine className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-[color:var(--gold-soft)]/65" />
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleScan}
                    disabled={isScanning}
                    className="h-14 w-full rounded-full bg-[color:var(--ink)] text-[color:var(--paper)] shadow-[0_18px_38px_rgba(40,52,90,0.18)] hover:bg-[color:var(--ink)]/92"
                  >
                    {isScanning ? (
                      <span className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <ScanLine className="h-5 w-5" />
                        </motion.div>
                        Scanning table
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <QrCode className="h-5 w-5" />
                        Scan QR Code
                      </span>
                    )}
                  </Button>

                  <div className="my-7 flex items-center gap-4">
                    <div className="menu-rule" />
                    <span className="menu-kicker shrink-0">Manual Select</span>
                    <div className="menu-rule" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {tableCodes.map((table) => (
                      <button
                        key={table}
                        type="button"
                        onClick={() => handleManualEntry(table)}
                        className="rounded-[22px] border border-[color:var(--border)] bg-white/76 px-4 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--ink)] transition-all hover:border-[color:var(--gold)]/55 hover:bg-white"
                      >
                        {table}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/12">
                      <Check className="h-10 w-10 text-emerald-600" />
                    </div>
                    <p className="menu-kicker mb-3">Table Confirmed</p>
                    <h1 className="menu-title text-4xl leading-tight">Everything is linked to {tableNumber}.</h1>
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-white/82 px-5 py-2 text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--ink)]">
                      <MapPin className="h-4 w-4 text-[color:var(--gold)]" />
                      {tableNumber}
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {[
                      "Browse the digital lunch menu.",
                      "Send dishes straight from your phone.",
                      "Collect loyalty points as soon as you pay.",
                    ].map((item) => (
                      <div
                        key={item}
                        className="rounded-[22px] border border-[color:var(--border)] bg-white/76 px-5 py-4 text-sm leading-6 text-[color:var(--ink-soft)]"
                      >
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      onClick={handleConfirm}
                      className="h-14 flex-1 rounded-full bg-[color:var(--ink)] text-[color:var(--paper)] shadow-[0_18px_38px_rgba(40,52,90,0.18)] hover:bg-[color:var(--ink)]/92"
                    >
                      Start Ordering
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setScanned(false)}
                      className="h-14 flex-1 rounded-full border-[color:var(--border)] bg-white/80 text-[color:var(--ink)] hover:border-[color:var(--gold)]/55 hover:bg-white"
                    >
                      Change Table
                    </Button>
                  </div>
                </motion.div>
              )}
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}
