import { NotFound, PageContent } from '@nexo/ui';
import { useParams } from 'react-router-dom';

export function App() {
  const { id } = useParams();
  if (!id || !/^\d+$/.test(id) || Number(id) <= 0) return <NotFound />;
  return <PageContent title="Detalhes do filme" description="Sinopse, elenco e avaliações." />;
}
