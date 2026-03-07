import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ArrowLeft, Gamepad2 } from "lucide-react";

interface InAppGamesProps {
  currentPoints: number;
  onEarnPoints: (points: number, source: string) => void;
  onBackToOrdering: () => void;
}

type GameOverMessage = {
  type: "PLATE_DASH_GAME_OVER";
  score: number;
};

type Game2WinMessage = {
  type: "SAKE_POUR_ROUND_WIN";
  score: number;
};

const SCORE_TO_EARN_POINTS = 3000;

export function InAppGames({ currentPoints, onEarnPoints, onBackToOrdering }: InAppGamesProps) {
  const [plays, setPlays] = useState(0);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [lastAwarded, setLastAwarded] = useState(false);
  const [game2Wins, setGame2Wins] = useState(0);
  const [game2LastScore, setGame2LastScore] = useState<number | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      const data = event.data as GameOverMessage | Game2WinMessage | undefined;
      if (!data) return;

      if (data.type === "SAKE_POUR_ROUND_WIN") {
        const winScore = Number(data.score);
        if (!Number.isFinite(winScore)) return;
        setGame2Wins((prev) => prev + 1);
        setGame2LastScore(winScore);
        onEarnPoints(5, "Game 2 Win");
        return;
      }

      if (data.type !== "PLATE_DASH_GAME_OVER") return;

      const score = Number(data.score);
      if (!Number.isFinite(score)) return;

      setPlays((prev) => prev + 1);
      setLastScore(score);

      if (score >= SCORE_TO_EARN_POINTS) {
        onEarnPoints(5, "In-App Game (3000+ score)");
        setLastAwarded(true);
      } else {
        setLastAwarded(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onEarnPoints]);

  return (
    <main className="container mx-auto px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0F1729] flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-[#D4AF37]" />
            In-App Games
          </h2>
          <p className="text-sm text-[#6B7280]">Play mini-games to earn loyalty points.</p>
        </div>
        <Button onClick={onBackToOrdering} variant="outline" className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Ordering
        </Button>
      </div>

      <Card className="p-4 mb-6 bg-gradient-to-r from-[#0F1729] to-[#2D3E5F] text-white border-0">
        <p className="text-xs text-white/70">Current Points</p>
        <p className="text-3xl font-bold">{currentPoints}</p>
      </Card>

      <div className="space-y-6">
        <Card className="p-4 border-2 border-[#E5E7EB]">
          <div className="mb-3">
            <p className="font-semibold text-[#0F1729]">Sushi Catch!</p>
            <p className="text-xs text-[#6B7280]">
              Reach <span className="font-semibold">{SCORE_TO_EARN_POINTS}</span> sushis in-game to earn <span className="font-semibold">+5</span> loyalty points.
            </p>
          </div>
          <iframe
            src="/games/game1.html"
            title="Sushi Catch!"
            className="w-full h-[600px] rounded-md border border-[#E5E7EB]"
          />
          <div className="mt-4 flex items-center justify-between gap-3 text-xs text-[#6B7280]">
            <p>Game rounds: {plays}</p>
            <p>
              Last score: {lastScore ?? "-"}
              {lastScore !== null && (lastAwarded ? " (Reward earned +5)" : " (No reward)")}
            </p>
          </div>
        </Card>

        <Card className="p-4 border-2 border-[#E5E7EB]">
          <div className="mb-3">
            <p className="font-semibold text-[#0F1729]">Game 2</p>
            <p className="text-xs text-[#6B7280]">
              Earn <span className="font-semibold">+5</span> loyalty points every time you win one round.
            </p>
          </div>
          <iframe
            src="/games/game2.html"
            title="Game 2"
            className="w-full h-[600px] rounded-md border border-[#E5E7EB]"
          />
          <div className="mt-4 flex items-center justify-between gap-3 text-xs text-[#6B7280]">
            <p>Round wins: {game2Wins}</p>
            <p>Last winning score: {game2LastScore ?? "-"}</p>
          </div>
        </Card>
      </div>
    </main>
  );
}
