import { avatarColor } from '../lib/constants';

export default function CompanyAvatar({ name, size = 'h-9 w-9 text-sm' }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-xl bg-gradient-to-br font-bold text-white shadow-sm ${size} ${avatarColor(name)}`}
    >
      {name?.trim()?.[0]?.toUpperCase() || '?'}
    </span>
  );
}
