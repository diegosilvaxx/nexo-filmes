import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import type { NavigationItem } from '@nexo/contracts';
import {
  BrandSubtitle,
  Footer,
  Header,
  Main,
  Navigation,
  NavigationLink,
  Page,
  SkipLink,
  Wordmark,
} from './application.styles';

interface SiteLayoutProps {
  children: ReactNode;
  navigation: readonly NavigationItem[];
  headerSlot?: ReactNode;
  homePath?: string;
}

export function SiteLayout({
  children,
  navigation,
  headerSlot,
  homePath = '/filmes',
}: SiteLayoutProps) {
  const { pathname } = useLocation();
  useEffect(() => {
    document.getElementById('content')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <Page>
      <SkipLink href="#content">Ir para o conteúdo</SkipLink>
      <Header>
        <Wordmark to={homePath} aria-label="Nexo Filmes, início">
          Nexo <BrandSubtitle>FILMES</BrandSubtitle>
        </Wordmark>
        <Navigation aria-label="Navegação principal">
          {navigation.map((item) => (
            <NavigationLink key={item.to} to={item.to}>
              {item.label}
            </NavigationLink>
          ))}
          {headerSlot}
        </Navigation>
      </Header>
      <Main id="content" tabIndex={-1}>
        {children}
      </Main>
      <Footer>Nexo Filmes</Footer>
    </Page>
  );
}
