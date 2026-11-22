import {
  stepLabels,
  type OnboardingStep,
} from '../../../data/serviceOnboarding';

interface Data {
  step: OnboardingStep;
  existing: boolean;
}

export default function OnboardingProgress({ step, existing }: Data) {
  const labels = existing
    ? stepLabels.filter((label) => label !== 'Install')
    : stepLabels;
  const current = labels.indexOf(stepLabels[step - 1]);
  return (
    <ol
      aria-label="Connection progress"
      className="mb-4 flex items-center gap-1 sm:gap-4"
    >
      {labels.map((label, index) => (
        <li
          key={label}
          aria-current={current === index ? 'step' : undefined}
          className={`flex items-center gap-2 text-xs ${current >= index ? 'text-vigil-accent' : 'text-vigil-muted'}`}
        >
          {index > 0 && (
            <span
              aria-hidden="true"
              className="h-px w-1 bg-vigil-border sm:w-8"
            />
          )}
          <span
            aria-hidden="true"
            className="grid size-6 place-items-center border"
          >
            {current > index ? '✓' : index + 1}
          </span>
          {label}
        </li>
      ))}
    </ol>
  );
}
