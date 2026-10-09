import { Navigate, Route, Routes } from 'react-router-dom';
import { IsolatedArea, NotFound, SiteLayout } from '@nexo/ui';
import { App } from './App';

export function Standalone() {
  return (
    <SiteLayout homePath="/filme/1" navigation={[]}>
      <Routes>
        <Route path="/" element={<Navigate to="/filme/1" replace />} />
        <Route
          path="/filme/:id"
          element={
            <IsolatedArea>
              <App />
            </IsolatedArea>
          }
        />
        <Route path="*" element={<NotFound homePath="/filme/1" />} />
      </Routes>
    </SiteLayout>
  );
}
