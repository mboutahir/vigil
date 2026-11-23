import { Link } from 'react-router-dom';

export default function Logo({ className = 'text-4xl px-7' }) {
  return (
    <Link
      to="/overview"
      className={`logo block font-semibold uppercase bg-vigil-accent text-vigil-surface w-fit py-1 skew-x-10 -rotate-3 mx-auto lg:m-0 lg:mb-0 ${className}`}
    >
      vigil
    </Link>
  );
}
