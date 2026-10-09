import { FavoriteCount, NavigationLink } from '@nexo/ui';

export function FavoritesCounter() {
  return (
    <NavigationLink to="/favoritos">
      Favoritos<FavoriteCount aria-label="0 favoritos">0</FavoriteCount>
    </NavigationLink>
  );
}
