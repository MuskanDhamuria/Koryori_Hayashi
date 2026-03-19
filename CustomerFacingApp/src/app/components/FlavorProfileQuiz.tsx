import { useState } from "react";
import { motion } from "motion/react";
import { ChefHat } from "lucide-react";
import { FlavorPreferences } from "../types";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { SeigaihaPattern } from "./JapanesePattern";

interface FlavorProfileQuizProps {
  onComplete: (preferences: FlavorPreferences) => Promise<void> | void;
  userName: string;
  initialPreferences?: FlavorPreferences;
}

export function FlavorProfileQuiz({
  onComplete,
  userName,
  initialPreferences,
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
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <SeigaihaPattern />
      <div className="pointer-events-none absolute left-[-4rem] top-16 h-48 w-48 rounded-full bg-[color:var(--gold)]/12 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-5rem] right-[-2rem] h-56 w-56 rounded-full bg-[color:var(--rose)]/10 blur-3xl" />

      <div className="mx-auto flex min-h-screen max-w-6xl items-center">
        <Card className="paper-panel w-full gap-0 rounded-[32px] border-[color:var(--border)]">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[0.8fr_1.2fr] lg:p-10">
            <aside className="paper-panel-dark rounded-[28px] p-6 text-[color:var(--paper)]">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white/10 text-[color:var(--gold-soft)]">
                  <ChefHat className="h-6 w-6" />
                </div>
                <div>
                  <p className="menu-kicker text-[color:var(--gold-soft)]">Taste Profile</p>
                  <h1 className="menu-title text-4xl text-[color:var(--paper)]">Welcome, {userName}</h1>
                </div>
              </div>

              <p className="text-sm leading-7 text-[color:var(--paper)]/78">
                Three quick questions help us shape the menu around what feels most appealing today.
              </p>

              <div className="my-6 h-px bg-white/12" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="menu-kicker text-[color:var(--paper)]/68">Progress</span>
                  <span className="text-sm font-semibold text-[color:var(--gold-soft)]">
                    {step + 1} / {questions.length}
                  </span>
                </div>
                <Progress value={progress} className="h-2 bg-white/10" />
              </div>

              <div className="mt-8 rounded-[24px] border border-white/10 bg-white/6 p-5">
                <p className="menu-kicker mb-2 text-[color:var(--gold-soft)]">Why this matters</p>
                <p className="text-sm leading-7 text-[color:var(--paper)]/74">
                  Your selections inform pairings, personalized recommendations, and which dishes get
                  featured first during ordering.
                </p>
              </div>
            </aside>

            <section className="flex flex-col justify-between">
              <div>
                <p className="menu-kicker mb-3">Question {step + 1}</p>
                <h2 className="menu-title text-4xl leading-tight">{currentQuestion.question}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--ink-soft)]">
                  {currentQuestion.subtitle}
                </p>
              </div>

              <motion.div
                key={step}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28 }}
                className="mt-8 grid gap-4"
              >
                {currentQuestion.options.map((option, index) => (
                  <motion.button
                    key={option.value}
                    type="button"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, delay: index * 0.06 }}
                    onClick={() => void handleSelect(option.value)}
                    className="group rounded-[28px] border border-[color:var(--border)] bg-white/80 px-5 py-5 text-left transition-all hover:-translate-y-0.5 hover:border-[color:var(--gold)]/55 hover:bg-white"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[color:var(--ink)]/7 text-xs font-bold tracking-[0.2em] text-[color:var(--ink)]">
                        {option.marker}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--ink)]">
                          {option.label}
                        </div>
                        <div className="mt-1 text-sm leading-6 text-[color:var(--ink-soft)]">
                          {option.description}
                        </div>
                      </div>
                      <div className="h-3 w-3 rounded-full bg-[color:var(--gold)]/18 transition-all group-hover:scale-125 group-hover:bg-[color:var(--gold)]" />
                    </div>
                  </motion.button>
                ))}
              </motion.div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--border)] pt-5">
                <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                  Prefer not to customize? We can start with balanced recommendations.
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
                  className="rounded-full border border-[color:var(--border)] px-4 py-2 text-sm font-semibold text-[color:var(--ink)] transition-colors hover:border-[color:var(--gold)]/55 hover:bg-white"
                >
                  Use Balanced Preferences
                </button>
              </div>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}
