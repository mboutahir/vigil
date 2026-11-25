import { useEffect, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import Logo from '../shared/Logo';

type Props = {
  title: string;
  lastUpdated: string;
  intro: string;
  children: ReactNode;
};

function LegalNavigation() {
  return (
    <nav aria-label="Legal documents" className="flex flex-wrap gap-6">
      <NavLink
        to="/privacy"
        className={({ isActive }) => isActive ? 'text-vigil-accent' : 'hover:text-vigil-accent'}
      >
        Privacy Policy
      </NavLink>
      <NavLink
        to="/terms"
        className={({ isActive }) => isActive ? 'text-vigil-accent' : 'hover:text-vigil-accent'}
      >
        Terms of Service
      </NavLink>
    </nav>
  );
}

export default function LegalLayout({
  title,
  lastUpdated,
  intro,
  children,
}: Props) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-vigil-surface-legal text-vigil-text-legal">
      <header className="sticky top-0 z-10 border-b border-vigil-border-legal bg-vigil-surface-legal/90 backdrop-blur py-2">
        <div className="mx-auto flex max-w-205 flex-wrap items-center justify-between gap-4 px-6 py-3.5">
          <Logo className="text-3xl px-4 py-1" />
          <div className="text-sm uppercase tracking-[0.12em] text-vigil-muted">
            <LegalNavigation />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-205 px-6 pb-12">
        <article>
          <p className="mt-12 mb-2 text-xs uppercase tracking-[0.18em] text-vigil-muted">
            Vigil Observability · Legal
          </p>
          <h1 className="mb-2 text-2xl sm:text-[32px] font-semibold text-vigil-text">
            {title}
          </h1>
          <p className="mb-4 text-sm text-vigil-muted">
            Last updated: {lastUpdated}
          </p>
          <p className="mb-3 leading-7">{intro}</p>
          <div className="legal-content text-base leading-7">
            {children}
          </div>
        </article>
      </main>
      <footer className="mx-auto flex max-w-205 flex-wrap justify-between gap-3 border-t border-vigil-border-legal px-6 py-6 text-xs uppercase tracking-[0.14em] text-vigil-muted">
        <span>Vigil Observability · Secure Access</span>
        <LegalNavigation />
      </footer>
    </div>
  );
}
