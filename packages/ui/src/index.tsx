import { useEffect } from 'react';
import { Availability, Description, Title } from './application.styles';

export { UIProvider } from './UIProvider';
export { SiteLayout } from './SiteLayout';
export { RecoveryBoundary, IsolatedArea, LoadingState } from './RecoveryBoundary';
export { NotFound } from './NotFound';
export { NavigationLink, FavoriteCount, TextLink } from './application.styles';
export { MovieCard } from './MovieCard';
export { RequestError } from './RequestError';
export {
  Button,
  MovieGrid,
  Notice,
  SectionHeader,
  PageHeading,
  Intro,
  ResultsInfo,
} from './movie.styles';

interface ApplicationPageProps {
  title: string;
  description: string;
}

export function PageContent({ title, description }: ApplicationPageProps) {
  useEffect(() => {
    document.title = `${title} · Nexo Filmes`;
  }, [title]);
  return (
    <section>
      <Title>{title}</Title>
      <Description>{description}</Description>
      <Availability>Em breve</Availability>
    </section>
  );
}
