import Logo from '../../components/shared/Logo';

export default function SetupCheckError() {
  return (
    <div className="flex min-h-dvh flex-col bg-vigil-bg">
      <header className="flex justify-center border-b border-vigil-border px-6 py-5">
        <Logo className="px-4.5 text-2xl" />
      </header>
      <main role="alert" className="flex flex-1 items-center justify-center px-6 pt-12 pb-16 text-center">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Unable to connect</h1>
          <p className="mt-2 text-base text-vigil-muted">Please try again.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 h-9 cursor-pointer bg-vigil-accent px-4 text-sm font-semibold uppercase tracking-wider text-vigil-bg hover:opacity-85"
          >
            Retry
          </button>
        </div>
      </main>
    </div>
  );
}
