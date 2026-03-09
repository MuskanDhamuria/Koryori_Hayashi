import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ArrowLeft, Gamepad2 } from "lucide-react";
import { fetchGameLeaderboards, submitGameScore } from "../services/api";
import type { GameKey, GameLeaderboardEntry } from "../types";

interface InAppGamesProps {
  currentPoints: number;
  phoneNumber: string;
  userName: string;
  onEarnPoints: (
    points: number,
    source: string,
    updatedLoyalty?: {
      pointsBalance: number;
      tier: "silver" | "gold" | "platinum";
    },
  ) => void;
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

type Game3WinMessage = {
  type: "GAME3_ROUND_WIN";
  score: number;
};

const SCORE_TO_EARN_POINTS = 3000;

const EMPTY_LEADERBOARDS: Record<GameKey, GameLeaderboardEntry[]> = {
  PLATE_DASH: [],
  SAKE_POUR: [],
};

export function InAppGames({
  currentPoints,
  phoneNumber,
  userName,
  onEarnPoints,
  onBackToOrdering,
}: InAppGamesProps) {
  const [plays, setPlays] = useState(0);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [lastAwarded, setLastAwarded] = useState(false);
  const [game2Wins, setGame2Wins] = useState(0);
  const [game2LastScore, setGame2LastScore] = useState<number | null>(null);
  const [game3Wins, setGame3Wins] = useState(0);
  const [game3LastScore, setGame3LastScore] = useState<number | null>(null);
  const [leaderboards, setLeaderboards] =
    useState<Record<GameKey, GameLeaderboardEntry[]>>(EMPTY_LEADERBOARDS);

  useEffect(() => {
    const loadLeaderboards = async () => {
      try {
        const response = await fetchGameLeaderboards();
        setLeaderboards({
          PLATE_DASH: response.PLATE_DASH ?? [],
          SAKE_POUR: response.SAKE_POUR ?? [],
        });
      } catch {
        setLeaderboards(EMPTY_LEADERBOARDS);
      }
    };

    void loadLeaderboards();
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      const data = event.data as GameOverMessage | Game2WinMessage | Game3WinMessage | undefined;
      if (!data) return;

      if (data.type === "SAKE_POUR_ROUND_WIN") {
        void (async () => {
          const winScore = Number(data.score);
          if (!Number.isFinite(winScore)) return;

          setGame2Wins((prev) => prev + 1);
          setGame2LastScore(winScore);

          try {
            const response = await submitGameScore({
              phoneNumber,
              fullName: userName,
              gameKey: "SAKE_POUR",
              score: winScore,
              rewardPoints: 5,
              rewardReason: "Game 2 round win",
            });

            setLeaderboards((current) => ({
              ...current,
              SAKE_POUR: response.leaderboard,
            }));
            onEarnPoints(5, "Game 2 Win", response.loyalty ?? undefined);
          } catch {
            onEarnPoints(5, "Game 2 Win");
          }
        })();
        return;
      }

      if (data.type === "GAME3_ROUND_WIN") {
        const winScore = Number(data.score);
        if (!Number.isFinite(winScore)) return;

        setGame3Wins((prev) => prev + 1);
        setGame3LastScore(winScore);
        onEarnPoints(5, "Game 3 Win");
        return;
      }

      if (data.type !== "PLATE_DASH_GAME_OVER") return;

      void (async () => {
        const score = Number(data.score);
        if (!Number.isFinite(score)) return;

        setPlays((prev) => prev + 1);
        setLastScore(score);

        const rewardPoints = score >= SCORE_TO_EARN_POINTS ? 5 : 0;
        setLastAwarded(rewardPoints > 0);

        try {
          const response = await submitGameScore({
            phoneNumber,
            fullName: userName,
            gameKey: "PLATE_DASH",
            score,
            rewardPoints,
            rewardReason: "Plate Dash score submission",
          });

          setLeaderboards((current) => ({
            ...current,
            PLATE_DASH: response.leaderboard,
          }));

          if (rewardPoints > 0) {
            onEarnPoints(5, "In-App Game (3000+ score)", response.loyalty ?? undefined);
          }
        } catch {
          if (rewardPoints > 0) {
            onEarnPoints(5, "In-App Game (3000+ score)");
          }
        }
      })();
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onEarnPoints, phoneNumber, userName]);

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
          <div className="mt-4 rounded-md border border-[#E5E7EB] bg-[#F9FAFB] p-3">
            <p className="mb-2 text-sm font-semibold text-[#0F1729]">Sushi Catch Leaderboard</p>
            <div className="space-y-1 text-xs text-[#6B7280]">
              {leaderboards.PLATE_DASH.length === 0 ? (
                <p>No scores yet.</p>
              ) : (
                leaderboards.PLATE_DASH.slice(0, 5).map((entry) => (
                  <div key={`${entry.playerName}-${entry.rank}-${entry.score}`} className="flex items-center justify-between">
                    <span>#{entry.rank} {entry.playerName}</span>
                    <span className="font-medium text-[#0F1729]">{entry.score}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>

        <Card className="p-4 border-2 border-[#E5E7EB]">
          <div className="mb-3">
            <p className="font-semibold text-[#0F1729]">SAKE POUR</p>
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
          <div className="mt-4 rounded-md border border-[#E5E7EB] bg-[#F9FAFB] p-3">
            <p className="mb-2 text-sm font-semibold text-[#0F1729]">Sake Pour Leaderboard</p>
            <div className="space-y-1 text-xs text-[#6B7280]">
              {leaderboards.SAKE_POUR.length === 0 ? (
                <p>No scores yet.</p>
              ) : (
                leaderboards.SAKE_POUR.slice(0, 5).map((entry) => (
                  <div key={`${entry.playerName}-${entry.rank}-${entry.score}`} className="flex items-center justify-between">
                    <span>#{entry.rank} {entry.playerName}</span>
                    <span className="font-medium text-[#0F1729]">{entry.score}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>

        <Card className="p-4 border-2 border-[#E5E7EB]">
          <div className="mb-3">
            <p className="font-semibold text-[#0F1729]">SUSHI memory</p>
            <p className="text-xs text-[#6B7280]">
              Earn <span className="font-semibold">+5</span> loyalty points every time you win one round.
            </p>
          </div>
          <iframe
            src="/games/game3.html"
            title="Game 3"
            className="w-full h-[600px] rounded-md border border-[#E5E7EB]"
          />
          <div className="mt-4 flex items-center justify-between gap-3 text-xs text-[#6B7280]">
            <p>Round wins: {game3Wins}</p>
            <p>Last winning score: {game3LastScore ?? "-"}</p>
          </div>
        </Card>
      </div>
    </main>
  );
}
