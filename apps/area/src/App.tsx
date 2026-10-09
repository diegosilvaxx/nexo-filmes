import { useLocation } from 'react-router-dom';
import { Favorites } from './Favorites';
import { Dashboard } from './Dashboard';

export function App({ standalone = false }: { standalone?: boolean }) {
  const { pathname } = useLocation();
  if (pathname === '/painel') return <Dashboard standalone={standalone} />;
  return <Favorites standalone={standalone} />;
}
