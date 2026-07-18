import { buildTeachingProfile } from "@/lib/adaptive-prompt";
import type { TeachingMode } from "@/lib/ai/types";
import { learningDimensionLabels, type LearningScores } from "@/lib/learning-dna";

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
const teachingModes: Array<{ value: TeachingMode; label: string; description: string }> = [
  { value: "adaptive", label: "Use my Learning DNA", description: "Ada blends your strongest preferences." },
  { value: "visual", label: "Visual breakdown", description: "See the structure and relationships." },
  { value: "example", label: "Practical example", description: "Start with a concrete situation." },
  { value: "analogy", label: "Analogy", description: "Connect the idea to something familiar." },
  { value: "story", label: "Story", description: "Use a concise, contextual scenario." },
  { value: "challenge", label: "Challenge", description: "Reason through a guided question." },
];

export function TopicForm({
  topic,
  subject,
  level,
  scores,
  teachingMode,
  isLoading,
  onTopicChange,
  onSubjectChange,
  onLevelChange,
  onTeachingModeChange,
  onSubmit,
}: TopicFormProps) {
  const profile = buildTeachingProfile(scores);
  const [primary, secondary] = profile.dominantDimensions;
  const selectedMode = teachingModes.find((mode) => mode.value === teachingMode);

  return (
    <form
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label htmlFor="topic" className="text-sm font-semibold text-slate-900">Ask Ada what you want to learn.</label>
      <input
        id="topic"
        value={topic}
        onChange={(event) => onTopicChange(event.target.value)}
        maxLength={160}
        placeholder="For example, explain Newton's First Law"
        className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
      />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">Subject
          <select value={subject} onChange={(event) => onSubjectChange(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20">
            <option>Science</option><option>Mathematics</option><option>History</option><option>Literature</option><option>General learning</option>
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">Learner level
          <select value={level} onChange={(event) => onLevelChange(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20">
            <option>High school</option><option>University</option><option>Independent learner</option><option>Beginner</option>
          </select>
        </label>
      </div>
      <fieldset className="mt-6 border-t border-slate-200 pt-6">
        <legend className="text-sm font-semibold text-slate-900">How should Ada teach this?</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {teachingModes.map((mode) => {
            const isSelected = teachingMode === mode.value;
            return (
              <label key={mode.value} className={`relative cursor-pointer rounded-2xl border p-3.5 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal-500 has-[:focus-visible]:ring-offset-2 ${isSelected ? "border-teal-500 bg-teal-50" : "border-slate-200 bg-white hover:border-teal-200 hover:bg-teal-50/40"}`}>
                <input type="radio" name="teaching-mode" value={mode.value} checked={isSelected} onChange={() => onTeachingModeChange(mode.value)} className="sr-only" />
                <span className="block text-sm font-semibold text-slate-900">{mode.label}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-600">{mode.description}</span>
              </label>
            );
          })}
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-600">
          Your profile favors {learningDimensionLabels[primary]} + {learningDimensionLabels[secondary]}. {teachingMode === "adaptive" ? "Ada will use both as a starting point." : `You chose ${selectedMode?.label} for this lesson.`}
        </p>
      </fieldset>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" aria-label="Example topics">
          {suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => onTopicChange(suggestion)} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-teal-300 hover:text-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2">{suggestion}</button>)}
        </div>
        <button type="submit" disabled={isLoading || !topic.trim()} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-4">{isLoading ? "Preparing lesson..." : "Teach me"}</button>
      </div>
    </form>
  );
}
