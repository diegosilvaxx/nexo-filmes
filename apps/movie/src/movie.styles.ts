import styled from 'styled-components';
export const Detail = styled.div`
  display: grid;
  grid-template-columns: minmax(180px, 280px) minmax(0, 1fr);
  gap: 48px;
  margin-top: 32px;
  @media (max-width: 760px) {
    grid-template-columns: 1fr;
    gap: 28px;
  }
`;
export const DetailPoster = styled.div`
  aspect-ratio: 2 / 3;
  border-radius: 10px;
  overflow: hidden;
  background: #202026;
  display: grid;
  place-items: center;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.muted};
  align-self: start;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  @media (max-width: 760px) {
    width: min(100%, 240px);
  }
`;
export const MovieActions = styled.div`
  max-width: 280px;
  a {
    display: inline-block;
    color: ${({ theme }) => theme.colors.muted};
    font-size: 13px;
    margin-top: 16px;
    text-underline-offset: 4px;
  }
`;
export const Metadata = styled.p`
  margin: 18px 0 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px 20px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.muted};
`;
export const Genres = styled.p`
  color: ${({ theme }) => theme.colors.muted};
  font-size: 13px;
  line-height: 1.7;
  margin: 0 0 24px;
`;
export const SectionTitle = styled.h2`
  font-weight: 500;
  font-size: 21px;
  letter-spacing: -0.02em;
  margin: 32px 0 16px;
`;
export const Synopsis = styled.p`
  font-size: 15px;
  line-height: 1.8;
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  overflow-wrap: anywhere;
`;
export const Credits = styled.dl`
  margin: 28px 0 0;
  dt {
    font-size: 12px;
    color: ${({ theme }) => theme.colors.muted};
    margin-bottom: 10px;
  }
  dd {
    margin: 0;
    font-size: 14px;
    line-height: 1.7;
  }
`;
export const CastList = styled.ul`
  padding: 0;
  margin: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  li {
    min-width: 0;
    font-size: 14px;
    line-height: 1.6;
    overflow-wrap: anywhere;
  }
  span {
    display: block;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.muted};
  }
  @media (max-width: 760px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;
export const ReviewArea = styled.section`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  margin-top: 40px;
  padding-top: 8px;
`;
export const CastDetails = styled.details`
  margin-top: 12px;
  summary {
    cursor: pointer;
    font-size: 13px;
    color: ${({ theme }) => theme.colors.muted};
    padding: 12px 0;
    min-height: 44px;
  }
  ul {
    margin-top: 12px;
  }
`;
export const Form = styled.form`
  max-width: 640px;
`;
export const FormField = styled.div`
  margin-bottom: 24px;
  label {
    display: block;
    font-size: 14px;
    margin-bottom: 10px;
  }
  input,
  textarea {
    background: #1b1b20;
    border: 1px solid #ffffff24;
    border-radius: 6px;
    color: ${({ theme }) => theme.colors.text};
    font: inherit;
    font-size: 15px;
    min-height: 46px;
    padding: 12px;
  }
  input {
    width: 160px;
  }
  textarea {
    width: 100%;
    resize: vertical;
    min-height: 132px;
    line-height: 1.6;
  }
  [aria-invalid='true'] {
    border-color: #d6a2a2;
  }
  :disabled {
    opacity: 0.65;
  }
`;
export const Help = styled.p`
  font-size: 12px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.muted};
  margin: 8px 0 0;
`;
export const FieldError = styled.p`
  color: #e3aaaa;
  font-size: 13px;
  line-height: 1.6;
  margin: 8px 0 0;
`;
export const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;
export const FormStatus = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.muted};
  line-height: 1.7;
  margin: 20px 0 0;
`;
