import styled from 'styled-components';

export const Notice = styled.div<{ $compact: boolean }>`
  display: flex;
  flex-direction: ${({ $compact }) => ($compact ? 'row' : 'column')};
  align-items: ${({ $compact }) => ($compact ? 'center' : 'flex-start')};
  flex-wrap: wrap;
  gap: ${({ $compact }) => ($compact ? '8px' : '16px')};
  color: ${({ theme }) => theme.colors.muted};
  font-size: ${({ $compact }) => ($compact ? '12px' : '16px')};
`;

export const RetryButton = styled.button<{ $compact: boolean }>`
  padding: ${({ $compact }) => ($compact ? '5px 8px' : '10px 14px')};
  border: 1px solid ${({ theme }) => theme.colors.badgeBorder};
  border-radius: 6px;
  color: ${({ theme }) => theme.colors.text};
  background: transparent;
  font-size: ${({ $compact }) => ($compact ? '12px' : '14px')};
  cursor: pointer;
  &:hover {
    border-color: ${({ theme }) => theme.colors.focus};
  }
`;

export const LoadingText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font-size: 14px;
`;
