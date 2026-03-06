import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { ChefHat } from 'lucide-react';
import { FlavorPreferences } from '../types';
import { motion } from 'motion/react';

interface FlavorProfileQuizProps {
  onComplete: (preferences: FlavorPreferences) => void;
  userName: string;
}

export function FlavorProfileQuiz({ onComplete, userName }: FlavorProfileQuizProps) {
  const [step, setStep] = useState(0);
  const [preferences, setPreferences] = useState<Partial<FlavorPreferences>>({});

  const questions = [
    {
      id: 'umamiVsCitrus',
      question: 'What flavor profile speaks to your palate?',
      subtitle: 'This helps us understand your taste preferences',
      options: [
        { value: 'umami', label: 'Deep & Umami', emoji: '🍜', description: 'Rich, savory, complex flavors' },
        { value: 'citrus', label: 'Bright & Citrus', emoji: '🍋', description: 'Fresh, tangy, vibrant notes' },
        { value: 'balanced', label: 'Balanced Mix', emoji: '⚖️', description: 'Best of both worlds' },
      ],
    },
    {
      id: 'refreshingVsHearty',
      question: 'What kind of dining experience are you craving?',
      subtitle: 'Let us match the perfect dishes to your mood',
      options: [
        { value: 'refreshing', label: 'Light & Refreshing', emoji: '🌊', description: 'Clean, crisp, energizing' },
        { value: 'hearty', label: 'Rich & Hearty', emoji: '🍲', description: 'Warm, filling, comforting' },
        { value: 'balanced', label: 'Variety', emoji: '🎌', description: 'Mix of both styles' },
      ],
    },
    {
      id: 'spicyTolerance',
      question: 'How adventurous are you with spice?',
      subtitle: 'We\'ll adjust heat levels to match your preference',
      options: [
        { value: 'mild', label: 'Gentle & Mild', emoji: '🌸', description: 'Just a hint of warmth' },
        { value: 'medium', label: 'Moderate Heat', emoji: '🌶️', description: 'Noticeable but balanced' },
        { value: 'very-spicy', label: 'Fiery & Bold', emoji: '🔥', description: 'Bring on the heat!' },
      ],
    },
  ];

  const currentQuestion = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  const handleSelect = (value: string) => {
    const newPreferences = {
      ...preferences,
      [currentQuestion.id]: value,
    };
    setPreferences(newPreferences);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(newPreferences as FlavorPreferences);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#0F1729] to-[#1A2642] flex items-center justify-center p-6">
      {/* Subtle grid pattern */}
      <div className="fixed inset-0 opacity-5" style={{
        backgroundImage: `linear-gradient(#D4AF37 1px, transparent 1px), linear-gradient(90deg, #D4AF37 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />

      <Card className="w-full max-w-2xl relative bg-white shadow-2xl">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#0F1729] to-[#2D3E5F] rounded-full mb-4">
              <ChefHat className="w-8 h-8 text-[#D4AF37]" />
            </div>
            
            <h1 className="text-2xl font-bold text-[#0F1729] mb-2">
              Welcome, {userName}! 👋
            </h1>
            
            <p className="text-[#6B7280]">
              Let's personalize your menu in 3 quick questions
            </p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-[#6B7280]">
                Question {step + 1} of {questions.length}
              </span>
              <span className="text-sm font-medium text-[#D4AF37]">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Question */}
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-[#0F1729] mb-1">
                {currentQuestion.question}
              </h2>
              <p className="text-[#6B7280] text-sm">
                {currentQuestion.subtitle}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <motion.div
                  key={option.value}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Button
                    variant="outline"
                    className="w-full h-auto p-4 border-2 hover:bg-[#F9FAFB] hover:border-[#D4AF37] text-left group"
                    onClick={() => handleSelect(option.value)}
                  >
                    <div className="flex items-center gap-4 w-full">
                      <div className="text-4xl group-hover:scale-110 transition-transform">
                        {option.emoji}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-base text-[#0F1729] mb-0.5">
                          {option.label}
                        </div>
                        <div className="text-sm text-[#6B7280]">
                          {option.description}
                        </div>
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 border-[#E5E7EB] group-hover:border-[#D4AF37] group-hover:bg-[#D4AF37]/10" />
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Skip button */}
          <div className="mt-6 text-center">
            <button
              onClick={() => onComplete({
                umamiVsCitrus: 'balanced',
                refreshingVsHearty: 'balanced',
                spicyTolerance: 'medium',
              })}
              className="text-sm text-[#6B7280] hover:text-[#0F1729] transition-colors"
            >
              Skip and use balanced preferences →
            </button>
          </div>
        </div>

        {/* Gold accent line */}
        <div className="h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
      </Card>
    </div>
  );
}
