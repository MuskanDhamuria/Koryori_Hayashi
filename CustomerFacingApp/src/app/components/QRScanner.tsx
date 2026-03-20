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
    <div className="relative min-h-screen overflow-hidden px-3 py-4 sm:px-4 sm:py-8 lg:px-8">
      <SeigaihaPattern />
      <div className="pointer-events-none absolute right-[-6rem] top-[-5rem] h-48 w-48 rounded-full bg-[color:var(--gold)]/14 blur-3xl sm:right-[-4rem] sm:top-[-3rem] sm:h-56 sm:w-56" />
      <div className="pointer-events-none absolute bottom-[-6rem] left-[-5rem] h-52 w-52 rounded-full bg-[color:var(--olive)]/14 blur-3xl sm:bottom-[-5rem] sm:left-[-3rem] sm:h-60 sm:w-60" />

      <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center">
        <Card className="paper-panel w-full max-w-3xl gap-0 rounded-3xl border-[color:var(--border)] sm:rounded-[32px]">
          <div className="grid gap-4 p-4 sm:gap-6 sm:p-6 lg:grid-cols-[0.86fr_1.14fr] lg:p-8">
            <aside className="paper-panel-dark rounded-3xl p-4 text-[color:var(--paper)] sm:rounded-[28px] sm:p-5 lg:p-6">
              <div className="mb-4 flex items-center gap-2.5 sm:mb-5 sm:gap-3 lg:mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-[color:var(--gold-soft)] sm:h-12 sm:w-12 sm:rounded-[16px]">
                  <UtensilsCrossed className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <p className="menu-kicker text-xs text-[color:var(--gold-soft)] sm:text-sm">Table Access</p>
                  <h2 className="menu-title text-2xl text-[color:var(--paper)] sm:text-3xl lg:text-4xl">Hello, {userName}</h2>
                </div>
              </div>

              <p className="text-xs leading-6 text-[color:var(--paper)]/76 sm:text-sm sm:leading-7">
                Confirm the table code on your desk to unlock ordering, recommendations, and loyalty tracking.
              </p>

              <div className="mt-5 grid gap-2.5 sm:mt-6 sm:gap-3 lg:mt-8">
                {[
                  "Scan the table QR code for the fastest entry.",
                  "Or pick from the available table codes below.",
                  "Once confirmed, your menu will be ready immediately.",
                ].map((item, index) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/6 px-3 py-3 text-xs leading-5 text-[color:var(--paper)]/78 sm:rounded-[22px] sm:px-4 sm:py-4 sm:text-sm sm:leading-6"
                  >
                    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-[color:var(--gold-soft)] sm:mr-3 sm:h-7 sm:w-7">
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
                  <div className="mb-5 sm:mb-6">
                    <p className="menu-kicker mb-2 text-xs sm:mb-3 sm:text-sm">Scan or Select</p>
                    <h1 className="menu-title text-2xl leading-tight sm:text-3xl lg:text-4xl">Find your table and begin.</h1>
                    <p className="mt-2 text-xs leading-6 text-[color:var(--ink-soft)] sm:mt-3 sm:text-sm sm:leading-7">
                      This step links the order to the correct table before customers start browsing the menu.
                    </p>
                  </div>

                  <div className="relative mx-auto mb-6 aspect-square w-full max-w-[280px] rounded-3xl border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(240,234,220,0.92))] p-4 shadow-[0_14px_36px_rgba(40,52,90,0.07)] sm:mb-8 sm:max-w-xs sm:rounded-[32px] sm:p-5 sm:shadow-[0_18px_44px_rgba(40,52,90,0.08)]">
                    <div className="absolute left-3 top-3 h-6 w-6 rounded-tl-[14px] border-l-2 border-t-2 border-[color:var(--gold)] sm:left-4 sm:top-4 sm:h-8 sm:w-8 sm:rounded-tl-[18px]" />
                    <div className="absolute right-3 top-3 h-6 w-6 rounded-tr-[14px] border-r-2 border-t-2 border-[color:var(--gold)] sm:right-4 sm:top-4 sm:h-8 sm:w-8 sm:rounded-tr-[18px]" />
                    <div className="absolute bottom-3 left-3 h-6 w-6 rounded-bl-[14px] border-b-2 border-l-2 border-[color:var(--gold)] sm:bottom-4 sm:left-4 sm:h-8 sm:w-8 sm:rounded-bl-[18px]" />
                    <div className="absolute bottom-3 right-3 h-6 w-6 rounded-br-[14px] border-b-2 border-r-2 border-[color:var(--gold)] sm:bottom-4 sm:right-4 sm:h-8 sm:w-8 sm:rounded-br-[18px]" />

                    {!isScanning ? (
                      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-[color:var(--border)] bg-white/55 sm:rounded-[24px]">
                        <QrCode className="h-20 w-20 text-[color:var(--ink-soft)] sm:h-24 sm:w-24 lg:h-28 lg:w-28" />
                      </div>
                    ) : (
                      <div className="paper-panel-dark relative flex h-full items-center justify-center rounded-2xl sm:rounded-[24px]">
                        <div className="relative h-36 w-36 rounded-2xl border border-[color:var(--gold-soft)]/55 sm:h-40 sm:w-40 sm:rounded-[20px] lg:h-48 lg:w-48">
                          <motion.div
                            className="absolute left-0 right-0 h-[2px] bg-[color:var(--gold)] shadow-[0_0_16px_rgba(196,163,91,0.65)]"
                            animate={{ top: ["10%", "90%", "10%"] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          />
                          <ScanLine className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-[color:var(--gold-soft)]/65 sm:h-9 sm:w-9 lg:h-10 lg:w-10" />
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleScan}
                    disabled={isScanning}
                    className="h-12 w-full rounded-full bg-[color:var(--ink)] text-sm text-[color:var(--paper)] shadow-[0_14px_32px_rgba(40,52,90,0.16)] hover:bg-[color:var(--ink)]/92 sm:h-14 sm:text-base sm:shadow-[0_18px_38px_rgba(40,52,90,0.18)]"
                  >
                    {isScanning ? (
                      <span className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <ScanLine className="h-4 w-4 sm:h-5 sm:w-5" />
                        </motion.div>
                        Scanning table
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <QrCode className="h-4 w-4 sm:h-5 sm:w-5" />
                        Scan QR Code
                      </span>
                    )}
                  </Button>

                  <div className="my-5 flex items-center gap-3 sm:my-7 sm:gap-4">
                    <div className="menu-rule" />
                    <span className="menu-kicker shrink-0 text-xs sm:text-sm">Manual Select</span>
                    <div className="menu-rule" />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
                    {tableCodes.map((table) => (
                      <button
                        key={table}
                        type="button"
                        onClick={() => handleManualEntry(table)}
                        className="rounded-2xl border border-[color:var(--border)] bg-white/76 px-3 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--ink)] transition-all hover:border-[color:var(--gold)]/55 hover:bg-white sm:rounded-[22px] sm:px-4 sm:py-4 sm:text-sm sm:tracking-[0.14em]"
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
                  className="space-y-5 sm:space-y-6"
                >
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/12 sm:mb-5 sm:h-20 sm:w-20">
                      <Check className="h-8 w-8 text-emerald-600 sm:h-10 sm:w-10" />
                    </div>
                    <p className="menu-kicker mb-2 text-xs sm:mb-3 sm:text-sm">Table Confirmed</p>
                    <h1 className="menu-title text-2xl leading-tight sm:text-3xl lg:text-4xl">Everything is linked to {tableNumber}.</h1>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-white/82 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--ink)] sm:mt-4 sm:px-5 sm:py-2 sm:text-sm sm:tracking-[0.14em]">
                      <MapPin className="h-3.5 w-3.5 text-[color:var(--gold)] sm:h-4 sm:w-4" />
                      {tableNumber}
                    </div>
                  </div>

                  <div className="grid gap-2.5 sm:gap-3">
                    {[
                      "Browse the digital lunch menu.",
                      "Send dishes straight from your phone.",
                      "Collect loyalty points as soon as you pay.",
                    ].map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-[color:var(--border)] bg-white/76 px-4 py-3 text-xs leading-5 text-[color:var(--ink-soft)] sm:rounded-[22px] sm:px-5 sm:py-4 sm:text-sm sm:leading-6"
                      >
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-3">
                    <Button
                      onClick={handleConfirm}
                      className="h-12 flex-1 rounded-full bg-[color:var(--ink)] text-sm text-[color:var(--paper)] shadow-[0_14px_32px_rgba(40,52,90,0.16)] hover:bg-[color:var(--ink)]/92 sm:h-14 sm:text-base sm:shadow-[0_18px_38px_rgba(40,52,90,0.18)]"
                    >
                      Start Ordering
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setScanned(false)}
                      className="h-12 flex-1 rounded-full border-[color:var(--border)] bg-white/80 text-sm text-[color:var(--ink)] hover:border-[color:var(--gold)]/55 hover:bg-white sm:h-14 sm:text-base"
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
