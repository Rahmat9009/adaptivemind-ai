interface TopicFormProps {
  topic: string;
  subject: string;
  level: string;
  isLoading: boolean;
  onTopicChange: (topic: string) => void;
  onSubjectChange: (subject: string) => void;
  onLevelChange: (level: string) => void;
  onSubmit: () => void;
}

const suggestions = ["Photosynthesis", "Newton's First Law", "The Pythagorean theorem"];

export function TopicForm({
  topic,
  subject,
  level,
  isLoading,
  onTopicChange,
  onSubjectChange,
  onLevelChange,
  onSubmit,
}: TopicFormProps) {
  return (
    <form
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label htmlFor="topic" className="text-sm font-semibold text-slate-900">What would you like to learn?</label>
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
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" aria-label="Example topics">
          {suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => onTopicChange(suggestion)} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-teal-300 hover:text-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2">{suggestion}</button>)}
        </div>
        <button type="submit" disabled={isLoading || !topic.trim()} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-4">{isLoading ? "Preparing lesson..." : "Teach me"}</button>
      </div>
    </form>
  );
}
