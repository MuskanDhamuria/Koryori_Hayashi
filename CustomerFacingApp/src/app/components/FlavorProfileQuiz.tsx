import { useState } from "react";
import { motion } from "motion/react";
import { ChefHat, X } from "lucide-react";
import { FlavorPreferences } from "../types";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { SeigaihaPattern } from "./JapanesePattern";

interface FlavorProfileQuizProps {
  onComplete: (preferences: FlavorPreferences) => Promise<void> | void;
  userName: string;
  initialPreferences?: FlavorPreferences;
  onClose?: () => void;
}

export function FlavorProfileQuiz({
  onComplete,
  userName,
  initialPreferences,
  onClose,
}: FlavorProfileQuizProps) {
  const [step, setStep] = useState(0);
  const [preferences, setPreferences] = useState<Partial<FlavorPreferences>>(
    initialPreferences ?? {},
  );

  const questions = [
    {
      id: "umamiVsCitrus",
      question: "What flavor profile speaks to your palate?",
      subtitle: "We will use this to balance savory depth against brighter dishes.",
      options: [
        { value: "umami", label: "Deep and Umami", marker: "01", description: "Rich, savory, and complex flavors." },
        { value: "citrus", label: "Bright and Citrus", marker: "02", description: "Fresh, tangy, and lively notes." },
        { value: "balanced", label: "Balanced Mix", marker: "03", description: "A little depth and a little brightness." },
      ],
    },
    {
      id: "refreshingVsHearty",
      question: "What kind of meal are you craving?",
      subtitle: "This helps us lean toward lighter bowls or richer comfort dishes.",
      options: [
        { value: "refreshing", label: "Light and Refreshing", marker: "01", description: "Clean, crisp, and energizing." },
        { value: "hearty", label: "Rich and Hearty", marker: "02", description: "Warm, filling, and comforting." },
        { value: "balanced", label: "A Bit of Both", marker: "03", description: "A mix of lighter and fuller dishes." },
      ],
    },
    {
      id: "spicyTolerance",
      question: "How adventurous are you with spice?",
      subtitle: "We will keep recommendations within your comfort zone.",
      options: [
        { value: "mild", label: "Gentle and Mild", marker: "01", description: "Just a hint of warmth." },
        { value: "medium", label: "Moderate Heat", marker: "02", description: "Noticeable but still balanced." },
        { value: "very-spicy", label: "Fiery and Bold", marker: "03", description: "Bring on the heat." },
      ],
    },
  ];

  const currentQuestion = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  const handleSelect = async (value: string) => {
    const newPreferences = {
      ...preferences,
      [currentQuestion.id]: value,
    };
    setPreferences(newPreferences);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      await onComplete(newPreferences as FlavorPreferences);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-3 py-4 sm:px-4 sm:py-6 lg:px-8 lg:py-8">
      <SeigaihaPattern />
      <div className="pointer-events-none absolute left-[-4rem] top-16 h-48 w-48 rounded-full bg-[color:var(--gold)]/12 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-5rem] right-[-2rem] h-56 w-56 rounded-full bg-[color:var(--rose)]/10 blur-3xl" />

      <div className="mx-auto flex min-h-screen max-w-6xl items-center py-4 sm:py-8">
        <Card className="paper-panel relative w-full gap-0 rounded-2xl border-[color:var(--border)] sm:rounded-3xl lg:rounded-[32px]">

          {/* ── Close button — sits inside the top-right corner of the card ── */}
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--ink)] text-[color:var(--paper)] shadow-lg transition-all hover:scale-110 hover:bg-[color:var(--navy)] active:scale-95 sm:right-4 sm:top-4 sm:h-11 sm:w-11"
            aria-label="Close and return to ordering"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.8} />
          </button>

          {/* Mobile: Stack vertically, Desktop: Side by side */}
          <div className="flex flex-col gap-0 lg:grid lg:grid-cols-[0.8fr_1.2fr] lg:gap-6">
            {/* Sidebar - Compact on mobile */}
            <aside className="paper-panel-dark rounded-t-2xl p-4 text-[color:var(--paper)] sm:rounded-t-3xl sm:p-6 lg:rounded-l-[28px] lg:rounded-tr-none lg:p-8">

              {/* Header row: icon + title */}
              <div className="mb-4 flex items-center gap-2.5 sm:mb-5 sm:gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[color:var(--gold-soft)] sm:h-12 sm:w-12 sm:rounded-[16px]">
                  <ChefHat className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <p className="menu-kicker text-[9px] text-[color:var(--gold-soft)] sm:text-[10px]">Taste Profile</p>
                  <h1 className="menu-title text-2xl text-[color:var(--paper)] sm:text-3xl lg:text-4xl">Welcome, {userName}</h1>
                </div>
              </div>

              <p className="text-xs leading-6 text-[color:var(--paper)]/78 sm:text-sm sm:leading-7">
                Three quick questions help us shape the menu around what feels most appealing today.
              </p>

              <div className="my-4 h-px bg-white/12 sm:my-5 lg:my-6" />

              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <span className="menu-kicker text-[9px] text-[color:var(--paper)]/68 sm:text-[10px]">Progress</span>
                  <span className="text-xs font-semibold text-[color:var(--gold-soft)] sm:text-sm">
                    {step + 1} / {questions.length}
                  </span>
                </div>
                <Progress value={progress} className="h-1.5 bg-white/10 sm:h-2" />
              </div>

              {/* Why this matters - Hide on mobile, show on tablet+ */}
              <div className="mt-4 hidden rounded-2xl border border-white/10 bg-white/6 p-4 sm:mt-6 sm:block sm:rounded-[24px] sm:p-5">
                <p className="menu-kicker mb-2 text-[color:var(--gold-soft)]">Why this matters</p>
                <p className="text-xs leading-6 text-[color:var(--paper)]/74 sm:text-sm sm:leading-7">
                  Your selections inform pairings, personalized recommendations, and which dishes get
                  featured first during ordering.
                </p>
              </div>
            </aside>

            {/* Question Section - More compact on mobile */}
            <section className="flex flex-col justify-between p-4 sm:p-6 lg:p-8 lg:py-10">
              <div>
                <p className="menu-kicker mb-2 text-[9px] sm:mb-3 sm:text-[10px]">Question {step + 1}</p>
                <h2 className="menu-title text-2xl leading-tight sm:text-3xl lg:text-4xl">{currentQuestion.question}</h2>
                <p className="mt-2 max-w-2xl text-xs leading-6 text-[color:var(--ink-soft)] sm:mt-3 sm:text-sm sm:leading-7">
                  {currentQuestion.subtitle}
                </p>
              </div>

              <motion.div
                key={step}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28 }}
                className="mt-5 grid gap-3 sm:mt-6 sm:gap-4 lg:mt-8"
              >
                {currentQuestion.options.map((option, index) => (
                  <motion.button
                    key={option.value}
                    type="button"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, delay: index * 0.06 }}
                    onClick={() => void handleSelect(option.value)}
                    className="group rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:border-[color:var(--gold)]/55 hover:bg-white sm:rounded-[24px] sm:px-5 sm:py-5 lg:rounded-[28px]"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--ink)]/7 text-[10px] font-bold tracking-[0.2em] text-[color:var(--ink)] sm:h-12 sm:w-12 sm:text-xs">
                        {option.marker}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--ink)] sm:text-sm">
                          {option.label}
                        </div>
                        <div className="mt-0.5 text-xs leading-5 text-[color:var(--ink-soft)] sm:mt-1 sm:text-sm sm:leading-6">
                          {option.description}
                        </div>
                      </div>
                      <div className="h-2.5 w-2.5 rounded-full bg-[color:var(--gold)]/18 transition-all group-hover:scale-125 group-hover:bg-[color:var(--gold)] sm:h-3 sm:w-3" />
                    </div>
                  </motion.button>
                ))}
              </motion.div>

              {/* Skip button - More compact on mobile */}
              <div className="mt-5 flex flex-col gap-2 border-t border-[color:var(--border)] pt-4 sm:mt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pt-5 lg:mt-8">
                <p className="text-xs leading-5 text-[color:var(--ink-soft)] sm:text-sm sm:leading-6">
                  Prefer not to customize? Use balanced defaults.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    void onComplete({
                      umamiVsCitrus: "balanced",
                      refreshingVsHearty: "balanced",
                      spicyTolerance: "medium",
                    })
                  }
                  className="w-full whitespace-nowrap rounded-full border border-[color:var(--border)] px-4 py-2.5 text-xs font-semibold text-[color:var(--ink)] transition-colors hover:border-[color:var(--gold)]/55 hover:bg-white sm:w-auto sm:text-sm"
                >
                  Use Balanced
                </button>
              </div>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}
