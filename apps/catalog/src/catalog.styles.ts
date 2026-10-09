import styled from 'styled-components';
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
  gap: 16px;
  margin-top: 48px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.muted};
  @media (max-width: 380px) {
    gap: 10px;
  }
`;
