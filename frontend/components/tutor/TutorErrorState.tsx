interface TutorErrorStateProps {
  message: string;
}

export function TutorErrorState({ message }: TutorErrorStateProps) {
  return (
    <div
      className="rounded-[var(--am-radius-xl)] border border-[var(--am-error)]/30 bg-[var(--am-error-light)] p-5"
      role="alert"
    >
      <p className="font-semibold text-[var(--am-error)]">
        The lesson could not be prepared.
      </p>
      <p className="mt-1 text-sm leading-6 text-[var(--am-error)]/80">
        {message}
      </p>
    </div>
  );
}
