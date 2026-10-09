import { FavoriteCount, NavigationLink } from '@nexo/ui';
import { useFavorites } from '@nexo/user-data';
import styled from 'styled-components';

const Retry = styled.button`
  background: transparent;
  color: inherit;
  border: 1px solid #ffffff24;
  border-radius: 4px;
  min-height: 36px;
  cursor: pointer;
  font: inherit;
  padding: 4px 8px;
`;

export function FavoritesCounter() {
  const { favorites, status, retry } = useFavorites();
  if (status === 'error')
    return (
      <Retry
        aria-label="Tentar carregar o contador de favoritos novamente"
        onClick={() => void retry()}
      >
        Favoritos · tentar novamente
      </Retry>
    );
  const loading = status === 'idle' || status === 'loading';
  return (
    <NavigationLink to="/favoritos">
      Favoritos
      <FavoriteCount
        aria-label={loading ? 'Carregando favoritos' : `${favorites.length} favoritos`}
      >
        {loading ? '…' : favorites.length}
      </FavoriteCount>
    </NavigationLink>
  );
}
