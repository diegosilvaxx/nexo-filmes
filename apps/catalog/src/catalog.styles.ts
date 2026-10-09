import styled from 'styled-components';
import { Button } from '@nexo/ui';
export const Filters = styled.div`
  display: grid;
  grid-template-columns: minmax(200px, 2fr) minmax(140px, 1fr) minmax(140px, 1fr);
  gap: 16px;
  margin-top: 36px;
  @media (max-width: 700px) {
    grid-template-columns: 1fr 1fr;
    > label:first-child {
      grid-column: 1 / -1;
    }
  }
  @media (max-width: 380px) {
    grid-template-columns: 1fr;
  }
`;
export const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.muted};
  input,
  select {
    width: 100%;
    min-height: 46px;
    border: 1px solid #ffffff24;
    border-radius: 6px;
    padding: 12px;
    background: #1b1b20;
    color: ${({ theme }) => theme.colors.text};
    font: inherit;
    font-size: 14px;
  }
  select:disabled {
    opacity: 0.5;
  }
`;
export const FilterHelp = styled.p`
  color: ${({ theme }) => theme.colors.muted};
  font-size: 12px;
  margin: 12px 0 0;
`;
export const Pagination = styled.nav`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 48px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.muted};
  @media (max-width: 540px) {
    gap: 2px;
  }
`;
export const PaginationButton = styled(Button)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 44px;
  padding: 0;
  border-color: transparent;
  color: ${({ theme }) => theme.colors.muted};

  &[aria-current='page'] {
    border-bottom: 2px solid ${({ theme }) => theme.colors.focus};
    border-radius: 0;
    color: ${({ theme }) => theme.colors.text};
    font-weight: 600;
  }

  @media (max-width: 540px) {
    width: 32px;
  }
`;
export const PaginationGap = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 44px;

  @media (max-width: 540px) {
    width: 32px;
  }
`;
export const PaginationStatus = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;
