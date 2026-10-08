import styled from 'styled-components';

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
  padding: 24px
    max(
      ${({ theme }) => theme.layout.gutter},
      calc((100vw - ${({ theme }) => theme.layout.contentWidth}) / 2)
    );
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

export const Wordmark = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.5px;
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
