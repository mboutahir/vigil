interface Data {
  text: string;
  isError?: boolean;
}

export default function StateMessage({ text, isError }: Data) {
  return (
    <p
      className={`rounded-(--vigil-radius-panel) col-span-full border border-vigil-border bg-vigil-card py-6 text-center text-[13px] ${
        isError ? 'text-vigil-state-danger-text' : 'text-vigil-muted'
      }`}
    >
      {text}
    </p>
  );
}
