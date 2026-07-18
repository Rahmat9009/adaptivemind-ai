interface TutorErrorStateProps { message: string; }

export function TutorErrorState({ message }: TutorErrorStateProps) {
  return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-900" role="alert"><p className="font-semibold">The lesson could not be prepared.</p><p className="mt-1 text-sm leading-6 text-rose-800">{message}</p></div>;
}
