import { useEffect, type ReactNode } from 'react';
import { useFavorites, useReviews, type FavoritesSnapshot } from '@nexo/user-data';
import {
  Intro,
  LoadingState,
  Notice,
  PageHeading,
  RequestError,
  SectionHeader,
  TextLink,
} from '@nexo/ui';
import { calculateStatistics } from './statistics';
import { DashboardLinks, MetricCard, Metrics } from './dashboard.styles';

const ratingFormat = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
function unavailable(status: FavoritesSnapshot['status']) {
  return status === 'error' ? 'Indisponível' : '…';
}
function Metric({
  label,
  value,
  description,
  loading,
}: {
  label: string;
  value: ReactNode;
  description: string;
  loading: boolean;
}) {
  return (
    <MetricCard aria-busy={loading}>
      <dt>{label}</dt>
      <dd>
        {value}
        <p>{description}</p>
      </dd>
    </MetricCard>
  );
}
export function Dashboard({ standalone = false }: { standalone?: boolean }) {
  const favorites = useFavorites();
  const reviews = useReviews();
  const statistics = calculateStatistics(favorites.favorites, reviews.reviews);
  const favoritesReady = favorites.status === 'ready';
  const reviewsReady = reviews.status === 'ready';
  const favoritesLoading = favorites.status === 'idle' || favorites.status === 'loading';
  const reviewsLoading = reviews.status === 'idle' || reviews.status === 'loading';
  const genre = statistics.mostFrequentGenre;
  const portal = import.meta.env.VITE_PORTAL_URL || 'http://127.0.0.1:4100';
  useEffect(() => {
    document.title = 'Painel · Nexo Filmes';
  }, []);
  return (
    <section aria-labelledby="dashboard-heading">
      <SectionHeader>
        <PageHeading id="dashboard-heading">Seu painel.</PageHeading>
        <Intro>Um resumo dos seus filmes e avaliações.</Intro>
      </SectionHeader>
      {favoritesLoading && <LoadingState label="Carregando estatísticas dos favoritos…" />}
      {reviewsLoading && <LoadingState label="Carregando estatísticas das avaliações…" />}
      {(favorites.status === 'error' || favorites.error) && (
        <RequestError
          message={favorites.error ?? 'Não foi possível carregar os favoritos.'}
          onRetry={() => void favorites.retry()}
        />
      )}
      {(reviews.status === 'error' || reviews.error) && (
        <RequestError
          message={reviews.error ?? 'Não foi possível carregar as avaliações.'}
          onRetry={() => void reviews.retry()}
        />
      )}
      <Metrics aria-label="Estatísticas pessoais">
        <Metric
          label="Favoritos"
          value={favoritesReady ? statistics.favoriteCount : unavailable(favorites.status)}
          description="Filmes que você guardou."
          loading={favoritesLoading}
        />
        <Metric
          label="Filmes avaliados"
          value={reviewsReady ? statistics.reviewCount : unavailable(reviews.status)}
          description="Todas as suas avaliações."
          loading={reviewsLoading}
        />
        <Metric
          label="Nota média"
          value={
            reviewsReady
              ? statistics.averageRating === null
                ? '—'
                : ratingFormat.format(statistics.averageRating)
              : unavailable(reviews.status)
          }
          description="Média das suas notas, de 0,5 a 10."
          loading={reviewsLoading}
        />
        <Metric
          label="Gênero mais frequente"
          value={favoritesReady ? (genre?.name ?? '—') : unavailable(favorites.status)}
          description={
            favoritesReady && genre
              ? `Em ${genre.count} ${genre.count === 1 ? 'favorito' : 'favoritos'}.`
              : 'Entre os seus favoritos.'
          }
          loading={favoritesLoading}
        />
      </Metrics>
      {(favorites.pendingIds.length > 0 || reviews.pendingIds.length > 0) && (
        <LoadingState label="Salvando alterações…" />
      )}
      {favoritesReady && reviewsReady && !statistics.favoriteCount && !statistics.reviewCount && (
        <Notice>
          <p>Salve seus filmes favoritos e avalie o que assistiu para acompanhar seu resumo.</p>
        </Notice>
      )}
      {favoritesReady && statistics.favoriteCount > 0 && !genre && (
        <Notice>
          <p>Os seus favoritos ainda não têm gêneros informados.</p>
        </Notice>
      )}
      <DashboardLinks aria-label="Atalhos do painel">
        <TextLink to="/favoritos">Ver favoritos</TextLink>
        <TextLink to={standalone ? `${portal}/filmes` : '/filmes'}>Explorar filmes</TextLink>
      </DashboardLinks>
    </section>
  );
}
