import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { UIProvider } from '@nexo/ui';
import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('Elemento raiz da aplicação não encontrado.');
createRoot(root).render(
  <StrictMode>
    <UIProvider>
      <App />
    </UIProvider>
  </StrictMode>,
);
