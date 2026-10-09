import { useEffect } from 'react';
import { Description, TextLink, Title } from './application.styles';

export function NotFound({ homePath = '/filmes' }: { homePath?: string }) {
  useEffect(() => {
    document.title = 'Página não encontrada · Nexo Filmes';
  }, []);
  return (
    <section>
      <Title>Página não encontrada</Title>
      <Description>O endereço informado não está disponível.</Description>
      <TextLink to={homePath}>Voltar ao início</TextLink>
    </section>
  );
}
