import {
  Availability,
  BrandSubtitle,
  Description,
  Footer,
  Header,
  Main,
  Page,
  SkipLink,
  Title,
  Wordmark,
} from './application.styles';

export { UIProvider } from './UIProvider';

interface ApplicationPageProps {
  title: string;
  description: string;
}

export function ApplicationPage({ title, description }: ApplicationPageProps) {
  return (
    <Page>
      <SkipLink href="#content">Ir para o conteúdo</SkipLink>
      <Header>
        <Wordmark>
          Nexo<BrandSubtitle>FILMES</BrandSubtitle>
        </Wordmark>
      </Header>
      <Main id="content" tabIndex={-1}>
        <Title>{title}</Title>
        <Description>{description}</Description>
        <Availability>Em breve</Availability>
      </Main>
      <Footer>Nexo Filmes</Footer>
    </Page>
  );
}
