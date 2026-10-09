import { Navigate, Route, Routes } from 'react-router-dom';
import { IsolatedArea, NotFound, SiteLayout } from '@nexo/ui';
import { App } from './App';

export function Standalone() {
  return (
    <SiteLayout navigation={[{ to: '/filmes', label: 'Filmes' }]}>
      <Routes>
        <Route path="/" element={<Navigate to="/filmes" replace />} />
        <Route
          path="/filmes"
          element={
            <IsolatedArea>
              <App standalone />
            </IsolatedArea>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </SiteLayout>
  );
}
