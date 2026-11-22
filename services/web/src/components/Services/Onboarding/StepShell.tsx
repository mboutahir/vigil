import type { ReactNode } from 'react';

interface Data {
  title: string;
  description?: string;
  children: ReactNode;
}

export default function StepShell({ title, description, children }: Data) {
  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <h2 className="mb-3 wrap-break-word text-[22px] font-semibold md:text-[26px]">
        {title}
      </h2>
      <div className="relative min-h-0 overflow-y-auto overscroll-contain">
        {description && (
          <p className="mb-5 text-sm leading-6 text-vigil-muted">
            {description}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
