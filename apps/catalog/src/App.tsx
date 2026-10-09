import { PageContent } from '@nexo/ui';
import { useSearchParams } from 'react-router-dom';

export function App() {
  useSearchParams();
  return <PageContent title="Catálogo" description="Encontre filmes para assistir." />;
}
