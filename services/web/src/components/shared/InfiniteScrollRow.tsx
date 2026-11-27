import { useEffect, useRef } from 'react';

interface Props {
  colSpan: number;
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
}

export default function InfiniteScrollRow({ colSpan, hasMore, loading, onLoadMore }: Props) {
  const rowRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    const row = rowRef.current;
    if (!row || !hasMore || loading) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        observer.disconnect();
        onLoadMore();
      }
    });
    observer.observe(row);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  return (
    <tr ref={rowRef}>
      <td colSpan={colSpan} className="text-center text-vigil-muted-extra py-2.5">
        {loading ? 'Loading more...' : hasMore ? '' : '- end of results -'}
      </td>
    </tr>
  );
}
