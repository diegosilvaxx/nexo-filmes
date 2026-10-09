import styled from 'styled-components';
import { Link, NavLink } from 'react-router-dom';

export const Page = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

export const SkipLink = styled.a`
  position: absolute;
  left: ${({ theme }) => theme.layout.gutter};
  top: 12px;
  transform: translateY(-150%);
  padding: 12px 18px;
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.background};
  z-index: 10;

  &:focus {
    transform: translateY(0);
  }
`;

export const Header = styled.header`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px 32px;
  padding: 24px
    max(
      ${({ theme }) => theme.layout.gutter},
      calc((100vw - ${({ theme }) => theme.layout.contentWidth}) / 2)
    );
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

export const Wordmark = styled(Link)`
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.5px;
  color: ${({ theme }) => theme.colors.text};
  text-decoration: none;
`;

export const Navigation = styled.nav`
  display: flex;
  align-items: center;
  gap: 24px;
  margin-left: auto;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    gap: 16px;
  }
`;

export const NavigationLink = styled(NavLink)`
  color: ${({ theme }) => theme.colors.muted};
  font-size: 14px;
  text-decoration: none;
  &[aria-current='page'],
  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`;

export const TextLink = styled(Link)`
  display: inline-block;
  margin-top: 24px;
  color: ${({ theme }) => theme.colors.text};
  text-underline-offset: 4px;
`;

export const FavoriteCount = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 21px;
  height: 21px;
  margin-left: 8px;
  padding: 0 5px;
  border: 1px solid ${({ theme }) => theme.colors.badgeBorder};
  border-radius: 5px;
  color: ${({ theme }) => theme.colors.text};
  font-size: 11px;
`;

export const BrandSubtitle = styled.span`
  color: ${({ theme }) => theme.colors.secondary};
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 2px;
`;

export const Main = styled.main`
  width: min(100% - 48px, ${({ theme }) => theme.layout.contentWidth});
  margin: 0 auto;
  padding: 72px 0;
  flex: 1;

  &:focus {
    outline: none;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 48px 0;
  }
`;

export const Title = styled.h1`
  margin: 0 0 16px;
  font-size: clamp(30px, 5vw, 42px);
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: -0.04em;
`;

export const Description = styled.p`
  max-width: 500px;
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font-size: 16px;
  line-height: 1.7;
`;

export const Availability = styled.p`
  display: inline-block;
  align-self: flex-start;
  margin: 28px 0 0;
  padding: 6px 10px;
  border: 1px solid ${({ theme }) => theme.colors.badgeBorder};
  border-radius: 5px;
  color: ${({ theme }) => theme.colors.badge};
  font-size: 12px;
`;

export const Footer = styled.footer`
  padding: 20px
    max(
      ${({ theme }) => theme.layout.gutter},
      calc((100vw - ${({ theme }) => theme.layout.contentWidth}) / 2)
    );
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.subtle};
  font-size: 12px;
`;
