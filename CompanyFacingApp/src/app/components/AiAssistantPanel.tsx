import { useState, type FormEvent } from "react";
import { Brain, Loader2, Send } from "lucide-react";
import { askDashboardAi } from "../services/api";

interface AiAssistantPanelProps {
  token: string;
}

const SUGGESTED_QUESTIONS = [
  "What are the top drivers of revenue this week?",
  "Which inventory items should we restock first?",
  "Give me 3 actions to improve margin next week.",
];

export function AiAssistantPanel({ token }: AiAssistantPanelProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modelName, setModelName] = useState("");

  const submitQuestion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = question.trim();
    if (trimmed.length < 3) {
      setError("Please enter at least 3 characters.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await askDashboardAi(token, trimmed);
      setAnswer(response.answer);
      setModelName(response.model);
    } catch (requestError) {
      setAnswer("");
      setModelName("");
      setError(requestError instanceof Error ? requestError.message : "Unable to get AI answer");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-indigo-900/40 to-cyan-900/30 border border-indigo-600/40 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-indigo-600 to-cyan-600 rounded-xl">
            <Brain className="h-7 w-7 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Gemini Assistant</h3>
            <p className="text-slate-300 mt-2">
              Ask business questions and get answers based on live dashboard database data.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={submitQuestion} className="bg-slate-900 border border-slate-700 rounded-xl p-5 space-y-4">
        <label htmlFor="dashboard-ai-question" className="block text-sm font-medium text-slate-200">
          Question
        </label>
        <textarea
          id="dashboard-ai-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Example: What should we prioritize tomorrow morning to reduce stockout risk?"
          className="w-full min-h-28 rounded-lg bg-slate-800 border border-slate-600 px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          disabled={isSubmitting}
        />
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => setQuestion(sample)}
              className="text-xs px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700"
            >
              {sample}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          {error ? <p className="text-sm text-red-400">{error}</p> : <div />}
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-70 text-white font-semibold px-4 py-2.5"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {isSubmitting ? "Asking..." : "Ask Gemini"}
          </button>
        </div>
      </form>

      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-white">Answer</h4>
          {modelName ? <span className="text-xs text-slate-400">Model: {modelName}</span> : null}
        </div>
        {answer ? (
          <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{answer}</p>
        ) : (
          <p className="text-slate-400 text-sm">
            Submit a question to get a Gemini response grounded on your dashboard data.
          </p>
        )}
      </div>
    </div>
  );
}
