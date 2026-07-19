import { buildTeachingProfile } from "@/lib/adaptive-prompt";
import type { TeachingMode } from "@/lib/ai/types";
import { learningDimensionLabels, type LearningScores } from "@/lib/learning-dna";
import { dnaHex } from "@/lib/learning-dna-visuals";

interface TopicFormProps {
  topic: string;
  subject: string;
  level: string;
  scores: LearningScores;
  teachingMode: TeachingMode;
  isLoading: boolean;
  onTopicChange: (topic: string) => void;
  onSubjectChange: (subject: string) => void;
  onLevelChange: (level: string) => void;
  onTeachingModeChange: (mode: TeachingMode) => void;
  onSubmit: () => void;
}

const suggestions = ["Photosynthesis", "Newton's First Law", "The Pythagorean theorem"];

const teachingModes: Array<{ value: TeachingMode; label: string; description: string; dimension: keyof typeof dnaHex }> = [
  { value: "adaptive", label: "Use my Learning DNA", description: "Ada blends your two strongest dimensions.", dimension: "visual" },
  { value: "visual", label: "Visual breakdown", description: "See the structure and relationships.", dimension: "visual" },
  { value: "example", label: "Worked example", description: "Start with a concrete situation.", dimension: "examples" },
  { value: "analogy", label: "Analogy", description: "Connect the idea to something familiar.", dimension: "analogies" },
  { value: "story", label: "Story", description: "A concise, contextual scenario.", dimension: "stories" },
  { value: "challenge", label: "Challenge", description: "Reason through a guided question.", dimension: "challenges" },
];

export function TopicForm({
  topic, subject, level, scores, teachingMode, isLoading,
  onTopicChange, onSubjectChange, onLevelChange, onTeachingModeChange, onSubmit,
}: TopicFormProps) {
  const profile = buildTeachingProfile(scores);
  const [primary, secondary] = profile.dominantDimensions;
  const selectedMode = teachingModes.find((mode) => mode.value === teachingMode);

  return (
    <form
      className="surface-paper rounded-[2rem] p-5 sm:p-6"
      onSubmit={(event) => { event.preventDefault(); onSubmit(); }}
    >
      <label htmlFor="topic" className="eyebrow-num text-ink-500">Ask Ada what you want to learn</label>
      <input
        id="topic"
        value={topic}
        onChange={(event) => onTopicChange(event.target.value)}
        maxLength={160}
        placeholder="For example, explain Newton's First Law"
        className="mt-3 w-full rounded-xl border border-ink-900/12 bg-paper-100/50 px-4 py-3.5 text-ink-950 outline-none transition placeholder:text-ink-400 focus:border-dna-visual focus:bg-paper-50 focus:ring-2 focus:ring-dna-visual/20"
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-ink-700">Subject
          <select value={subject} onChange={(event) => onSubjectChange(event.target.value)} className="mt-2 w-full rounded-xl border border-ink-900/12 bg-paper-50 px-3 py-3 text-ink-800 outline-none focus:border-dna-visual focus:ring-2 focus:ring-dna-visual/20">
            <option>Science</option><option>Mathematics</option><option>History</option><option>Literature</option><option>General learning</option>
          </select>
        </label>
        <label className="text-sm font-medium text-ink-700">Learner level
          <select value={level} onChange={(event) => onLevelChange(event.target.value)} className="mt-2 w-full rounded-xl border border-ink-900/12 bg-paper-50 px-3 py-3 text-ink-800 outline-none focus:border-dna-visual focus:ring-2 focus:ring-dna-visual/20">
            <option>High school</option><option>University</option><option>Independent learner</option><option>Beginner</option>
          </select>
        </label>
      </div>

      <fieldset className="mt-5 border-t border-ink-900/8 pt-5">
        <legend className="eyebrow-num text-ink-500">How should Ada teach this?</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {teachingModes.map((mode) => {
            const isSelected = teachingMode === mode.value;
            const color = mode.value === "adaptive" ? dnaHex[primary] : dnaHex[mode.dimension];
            return (
              <label
                key={mode.value}
                className={`relative cursor-pointer rounded-xl border p-3.5 transition ${
                  isSelected ? "bg-paper-50" : "border-ink-900/10 bg-paper-100/40 hover:bg-paper-50"
                }`}
                style={isSelected ? { borderColor: color, boxShadow: `0 0 0 1px ${color}, 0 0 18px -8px ${color}` } : undefined}
              >
                <input type="radio" name="teaching-mode" value={mode.value} checked={isSelected} onChange={() => onTeachingModeChange(mode.value)} className="sr-only" />
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: color, opacity: isSelected ? 1 : 0.5 }} />
                  <span className="text-sm font-semibold text-ink-900">{mode.label}</span>
                </span>
                <span className="mt-1 block pl-4 text-xs leading-5 text-ink-600">{mode.description}</span>
              </label>
            );
          })}
        </div>
        <p className="mt-3 text-xs leading-5 text-ink-600">
          Your profile favors {learningDimensionLabels[primary]} + {learningDimensionLabels[secondary]}.
          {" "}{teachingMode === "adaptive" ? "Ada will use both as a starting point." : `You chose ${selectedMode?.label} for this lesson.`}
        </p>
      </fieldset>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" aria-label="Example topics">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onTopicChange(suggestion)}
              className="rounded-full border border-ink-900/12 px-3 py-1.5 text-xs font-medium text-ink-600 transition hover:border-ink-900/25 hover:text-ink-950"
            >
              {suggestion}
            </button>
          ))}
        </div>
        <button
          type="submit"
          disabled={isLoading || !topic.trim()}
          className="rounded-full bg-ink-950 px-5 py-3 text-sm font-semibold text-paper-50 shadow-lg transition hover:-translate-y-0.5 hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Preparing lesson…" : "Teach me →"}
        </button>
      </div>
    </form>
  );
}
