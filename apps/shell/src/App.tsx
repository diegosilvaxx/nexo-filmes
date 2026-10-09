import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { NotFound, SiteLayout } from '@nexo/ui';
import { RemoteSlot } from './components/RemoteSlot';

export function App() {
  const { pathname } = useLocation();
  return (
    <SiteLayout
      navigation={[
        { to: '/filmes', label: 'Filmes' },
        { to: '/painel', label: 'Painel' },
      ]}
      headerSlot={<RemoteSlot name="area" expose="FavoritesCounter" label="os favoritos" compact />}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/filmes" replace />} />
        <Route
          path="/filmes"
          element={<RemoteSlot key={pathname} name="catalog" label="o catálogo" />}
        />
        <Route
          path="/filme/:id"
          element={<RemoteSlot key={pathname} name="movie" label="o filme" />}
        />
        <Route
          path="/favoritos"
          element={<RemoteSlot key={pathname} name="area" label="os favoritos" />}
        />
        <Route
          path="/painel"
          element={<RemoteSlot key={pathname} name="area" label="o painel" />}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </SiteLayout>
  );
}
