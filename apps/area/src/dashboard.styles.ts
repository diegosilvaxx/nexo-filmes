import styled from 'styled-components';

export const Metrics = styled.dl`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin: 32px 0;
  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;
export const MetricCard = styled.div`
  padding: 24px;
  border: 1px solid ${({ theme }) => theme.colors.badgeBorder};
  border-radius: 10px;
  background: #1b1b20;
  min-width: 0;
  dt {
    color: ${({ theme }) => theme.colors.muted};
    font-size: 13px;
    line-height: 1.6;
  }
  dd {
    margin: 16px 0 0;
    font-size: clamp(24px, 3vw, 32px);
    font-weight: 500;
    line-height: 1.3;
    letter-spacing: -0.03em;
    overflow-wrap: anywhere;
  }
  p {
    margin: 12px 0 0;
    color: ${({ theme }) => theme.colors.muted};
    font-size: 12px;
    line-height: 1.7;
    font-weight: 400;
    letter-spacing: normal;
  }
`;
export const DashboardLinks = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 12px 28px;
  a {
    margin-top: 0;
    min-height: 44px;
    padding: 12px 0;
    font-size: 14px;
  }
`;
