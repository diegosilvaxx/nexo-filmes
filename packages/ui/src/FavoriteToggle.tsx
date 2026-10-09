import { FavoriteButton } from './movie.styles';
export function FavoriteToggle({
  title,
  favorite,
  pending,
  disabled = false,
  onToggle,
}: {
  title: string;
  favorite: boolean;
  pending: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <FavoriteButton
      type="button"
      aria-pressed={favorite}
      aria-busy={pending}
      aria-label={
        pending
          ? `Salvando…: ${title}`
          : `${favorite ? 'Favoritado' : 'Favoritar'}: ${title}${favorite ? '. Remover dos favoritos' : ''}`
      }
      disabled={disabled || pending}
      onClick={onToggle}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill={favorite ? 'currentColor' : 'none'}
        aria-hidden="true"
      >
        <path
          d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
      {pending ? 'Salvando…' : favorite ? 'Favoritado' : 'Favoritar'}
    </FavoriteButton>
  );
}
