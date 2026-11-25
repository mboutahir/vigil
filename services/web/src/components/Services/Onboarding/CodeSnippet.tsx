import { useState } from 'react';
import { toast } from 'sonner';
import { faCheck, faCopy } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface Data {
  code: string;
  label: string;
}

export default function CodeSnippet({ code, label }: Data) {
  const [copiedCode, setCopiedCode] = useState('');
  const copied = copiedCode === code;

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(
        () => setCopiedCode((current) => (current === code ? '' : current)),
        1500,
      );
    } catch {
      toast.error('Unable to copy. Select the text to copy it manually.');
    }
  }

  return (
    <div className="rounded-(--vigil-radius-control) mt-2 border border-vigil-border bg-vigil-surface-code">
      <div className="flex items-center justify-between gap-3 border-b border-vigil-border px-3 py-2">
        <span className="text-[12px] text-vigil-muted">{label}</span>
        <button
          type="button"
          onClick={copy}
          disabled={copied}
          aria-label={copied ? `${label} copied` : `Copy ${label}`}
          title={copied ? 'Copied' : 'Copy'}
          className="cursor-pointer px-2 py-1 text-xs text-vigil-muted hover:text-vigil-text active:scale-95 disabled:text-vigil-accent"
        >
          <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-[13px]">{code}</pre>
    </div>
  );
}
