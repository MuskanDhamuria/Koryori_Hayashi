import { useEffect, useState } from "react";
import { ArrowLeft, Gamepad2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
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
  SUSHI_MEMORY: [],
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
          SUSHI_MEMORY: response.SUSHI_MEMORY ?? [],
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
            toast.error("Score submission failed. Points were not awarded.");
          }
        })();
        return;
      }

      if (data.type === "GAME3_ROUND_WIN") {
        void (async () => {
          const winScore = Number(data.score);
          if (!Number.isFinite(winScore)) return;

          setGame3Wins((prev) => prev + 1);
          setGame3LastScore(winScore);

          try {
            const response = await submitGameScore({
              phoneNumber,
              fullName: userName,
              gameKey: "SUSHI_MEMORY",
              score: winScore,
              rewardPoints: 5,
              rewardReason: "Game 3 round win",
            });

            setLeaderboards((current) => ({
              ...current,
              SUSHI_MEMORY: response.leaderboard,
            }));
            onEarnPoints(5, "Game 3 Win", response.loyalty ?? undefined);
          } catch {
            toast.error("Score submission failed. Points were not awarded.");
          }
        })();
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
            toast.error("Score submission failed. Points were not awarded.");
          }
        }
      })();
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onEarnPoints, phoneNumber, userName]);

  const gameCards: Array<{
    key: GameKey;
    title: string;
    description: string;
    src: string;
    stats: string;
    leaderboard: GameLeaderboardEntry[];
  }> = [
    {
      key: "PLATE_DASH",
      title: "Sushi Catch",
      description: `Reach ${SCORE_TO_EARN_POINTS} in-game to earn 5 loyalty points.`,
      src: "/games/game1.html",
      stats:
        lastScore === null
          ? `${plays} rounds played so far.`
          : `${plays} rounds played. Last score: ${lastScore}${lastAwarded ? " and reward earned." : "."}`,
      leaderboard: leaderboards.PLATE_DASH,
    },
    {
      key: "SAKE_POUR",
      title: "Sake Pour",
      description: "Earn 5 loyalty points every time you win a round.",
      src: "/games/game2.html",
      stats:
        game2LastScore === null
          ? `${game2Wins} wins recorded so far.`
          : `${game2Wins} wins recorded. Last winning score: ${game2LastScore}.`,
      leaderboard: leaderboards.SAKE_POUR,
    },
    {
      key: "SUSHI_MEMORY",
      title: "Sushi Memory",
      description: "Earn 5 loyalty points every time you clear a round.",
      src: "/games/game3.html",
      stats:
        game3LastScore === null
          ? `${game3Wins} wins recorded so far.`
          : `${game3Wins} wins recorded. Last winning score: ${game3LastScore}.`,
      leaderboard: leaderboards.SUSHI_MEMORY,
    },
  ];

  return (
    <section className="space-y-6">
      <div className="relative z-20 flex flex-col gap-4 rounded-[30px] border border-[color:var(--border)] bg-white/70 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="menu-kicker mb-2">After-Meal Experience</p>
          <h2 className="menu-title flex items-center gap-2 text-4xl text-[color:var(--ink)]">
            <Gamepad2 className="h-6 w-6 text-[color:var(--gold)]" />
            In-App Games
          </h2>
          <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
            Play a mini-game while you wait and add a few more points to the current visit.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => onBackToOrdering()}
          variant="outline"
          className="h-12 rounded-full border-[color:var(--border)] bg-white/80 text-[color:var(--ink)] hover:border-[color:var(--gold)]/55 hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Ordering
        </Button>
      </div>

      <Card className="paper-panel-dark rounded-[30px] border-0 p-6 text-[color:var(--paper)]">
        <p className="menu-kicker text-[color:var(--gold-soft)]">Current Balance</p>
        <p className="mt-2 text-4xl font-bold">{currentPoints} pts</p>
        <p className="mt-2 text-sm text-[color:var(--paper)]/76">
          Scores sync back into loyalty as long as the table session stays active.
        </p>
      </Card>

      <div className="space-y-6">
        {gameCards.map((game) => (
          <Card
            key={game.key}
            className="paper-panel relative z-0 rounded-[30px] border-[color:var(--border)] p-5"
          >
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="menu-kicker mb-2">{game.key.replace("_", " ")}</p>
                <h3 className="menu-title text-3xl text-[color:var(--ink)]">{game.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">{game.description}</p>
              </div>
              <div className="rounded-full border border-[color:var(--border)] bg-white/72 px-4 py-2 text-xs uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                {game.stats}
              </div>
            </div>

            <iframe
              src={game.src}
              title={game.title}
              className="h-[600px] w-full rounded-[24px] border border-[color:var(--border)] bg-white"
            />

            <div className="mt-4 rounded-[24px] border border-[color:var(--border)] bg-white/72 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[color:var(--gold)]" />
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--ink)]">
                  Leaderboard
                </p>
              </div>
              <div className="space-y-2 text-sm text-[color:var(--ink-soft)]">
                {game.leaderboard.length === 0 ? (
                  <p>No scores recorded yet.</p>
                ) : (
                  game.leaderboard.slice(0, 5).map((entry) => (
                    <div
                      key={`${game.key}-${entry.playerName}-${entry.rank}-${entry.score}`}
                      className="flex items-center justify-between"
                    >
                      <span>
                        #{entry.rank} {entry.playerName}
                      </span>
                      <span className="font-semibold text-[color:var(--ink)]">{entry.score}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
