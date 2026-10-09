import { movieIdSchema } from '@nexo/contracts';
import { NotFound } from '@nexo/ui';
import { useParams } from 'react-router-dom';
import { MoviePage } from './MoviePage';

export function App() {
  const { id } = useParams();
  if (!id || !/^\d+$/.test(id) || !movieIdSchema.safeParse(id).success) return <NotFound />;
  return <MoviePage key={id} movieId={Number(id)} />;
}
