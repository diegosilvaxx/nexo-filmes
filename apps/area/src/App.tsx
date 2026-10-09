import { PageContent } from '@nexo/ui';
import { useLocation } from 'react-router-dom';
import { Favorites } from './Favorites';

export function App({ standalone = false }: { standalone?: boolean }) {
  const { pathname } = useLocation();
  if (pathname === '/painel')
    return <PageContent title="Painel" description="Um resumo dos seus filmes e avaliações." />;
  return <Favorites standalone={standalone} />;
}
