interface TutorErrorStateProps { message: string; }

export function TutorErrorState({ message }: TutorErrorStateProps) {
  return (
    <div
      className="rounded-2xl border p-5"
      role="alert"
      style={{
        borderColor: "rgba(255,107,91,0.4)",
        background: "linear-gradient(160deg, rgba(255,107,91,0.08), var(--color-paper-50) 70%)",
      }}
    >
      <p className="font-display text-lg text-ink-950">The lesson could not be prepared.</p>
      <p className="mt-1 text-sm leading-6 text-ink-700">{message}</p>
    </div>
  );
}
