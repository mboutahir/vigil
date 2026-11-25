import { Link } from 'react-router-dom';

interface Data {
  className?: string;
  imageClassName?: string;
  full?: boolean;
}

export default function Logo({ className = 'text-4xl px-7', full = false, imageClassName }: Data) {
  return (
    <Link
      to="/overview"
      className={`block w-fit max-w-full py-1 mx-auto lg:m-0 ${className}`}
    >
      <img
        src={full ? '/vigil-logo-full.svg' : '/vigil-logo.svg'}
        alt={full ? 'Vigil Observability Platform' : 'Vigil'}
        width="384"
        height="120"
        className={imageClassName ?? (full ? 'h-auto w-60 max-w-full' : 'h-[1.35em] w-auto')}
      />
    </Link>
  );
}
