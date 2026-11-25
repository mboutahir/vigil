import type { ExporterFormat } from '../../../data/serviceOnboarding';

const options: ExporterFormat[] = ['compose', 'bash'];
const chip =
  'relative cursor-pointer rounded-none first:rounded-s-(--vigil-radius-control) last:rounded-e-(--vigil-radius-control) not-first:-ms-px aria-pressed:z-1 focus-visible:z-2 border px-3 py-1 text-xs uppercase tracking-wide transition-colors';
const chipActive = 'border-vigil-accent bg-vigil-accent text-vigil-on-accent';
const chipIdle =
  'border-vigil-border text-vigil-muted hover:border-vigil-text hover:text-vigil-text';

interface Data {
  format: ExporterFormat;
  setFormat: (format: ExporterFormat) => void;
}

export default function ServiceEnvironmentPicker({ format, setFormat }: Data) {
  return (
    <div>
      <p className="mb-2 text-sm">How do you run your service?</p>
      <div role="group" aria-label="Service environment" className="inline-flex">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={format === option}
            onClick={() => setFormat(option)}
            className={`${chip} ${format === option ? chipActive : chipIdle}`}
          >
            {option === 'compose' ? 'Docker Compose' : 'Bash'}
          </button>
        ))}
      </div>
    </div>
  );
}
