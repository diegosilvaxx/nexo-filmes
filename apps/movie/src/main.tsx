import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { UIProvider } from '@nexo/ui';
import { Standalone } from './Standalone';

const root = document.getElementById('root');
if (!root) throw new Error('Elemento raiz da aplicação não encontrado.');
createRoot(root).render(
  <StrictMode>
    <UIProvider>
      <BrowserRouter>
        <Standalone />
      </BrowserRouter>
    </UIProvider>
  </StrictMode>,
);
