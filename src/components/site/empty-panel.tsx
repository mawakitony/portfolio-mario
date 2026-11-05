export function EmptyPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-dashed border-border px-6 py-16 md:px-10">
      <p className="font-display text-3xl">{title}</p>
      <p className="mt-3 max-w-lg text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
