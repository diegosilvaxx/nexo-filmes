import { PageContent } from '@nexo/ui';
import { useLocation } from 'react-router-dom';

export function App() {
  const { pathname } = useLocation();
  if (pathname === '/painel')
    return <PageContent title="Painel" description="Um resumo dos seus filmes e avaliações." />;
  return <PageContent title="Favoritos" description="Seus filmes favoritos em um só lugar." />;
}
