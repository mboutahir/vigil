import * as Switch from '@radix-ui/react-switch';

interface Data {
  label: string;
  checked: boolean;
  onCheckedChange: () => void;
}

export default function SwitchButton({
  label,
  checked,
  onCheckedChange,
}: Data) {
  return (
    <Switch.Root
      aria-label={label}
      className="inline-flex h-6.5 w-11.5 shrink-0 cursor-pointer items-center rounded-full border border-vigil-border bg-vigil-panel p-1 transition-colors hover:border-vigil-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vigil-accent data-[state=checked]:border-vigil-accent data-[state=checked]:bg-vigil-accent motion-reduce:transition-none"
      checked={checked}
      onCheckedChange={onCheckedChange}
    >
      <Switch.Thumb className="pointer-events-none size-4 rounded-full bg-vigil-muted transition-[translate,background-color] data-[state=checked]:translate-x-5 data-[state=checked]:bg-vigil-bg motion-reduce:transition-none" />
    </Switch.Root>
  );
}
