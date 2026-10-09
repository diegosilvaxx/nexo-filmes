import { Navigate, Route, Routes } from 'react-router-dom';
import { IsolatedArea, NotFound, SiteLayout } from '@nexo/ui';
import { App } from './App';
import { FavoritesCounter } from './FavoritesCounter';

export function Standalone() {
  return (
    <SiteLayout
      homePath="/favoritos"
      navigation={[{ to: '/painel', label: 'Painel' }]}
      headerSlot={
        <IsolatedArea>
          <FavoritesCounter />
        </IsolatedArea>
      }
    >
      <Routes>
        <Route path="/" element={<Navigate to="/favoritos" replace />} />
        <Route
          path="/favoritos"
          element={
            <IsolatedArea>
              <App />
            </IsolatedArea>
          }
        />
        <Route
          path="/painel"
          element={
            <IsolatedArea>
              <App />
            </IsolatedArea>
          }
        />
        <Route path="*" element={<NotFound homePath="/favoritos" />} />
      </Routes>
    </SiteLayout>
  );
}
