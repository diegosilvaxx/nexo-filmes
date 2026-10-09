import styled from 'styled-components';
import { Link } from 'react-router-dom';

export const MovieGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 32px 20px;
  @media (max-width: 1000px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  @media (max-width: 760px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  @media (max-width: 540px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 28px 16px;
  }
`;
export const MovieArticle = styled.article`
  min-width: 0;
`;
export const MovieLink = styled(Link)`
  color: ${({ theme }) => theme.colors.text};
  text-decoration: none;
  display: block;
  border-radius: 8px;
  &:hover h2 {
    text-decoration: underline;
    text-underline-offset: 4px;
  }
`;
export const Poster = styled.div`
  aspect-ratio: 2 / 3;
  overflow: hidden;
  border-radius: 8px;
  background: #202026;
  display: grid;
  place-items: center;
  color: ${({ theme }) => theme.colors.muted};
  font-size: 12px;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;
export const MovieTitle = styled.h2`
  font-size: 15px;
  font-weight: 550;
  margin: 14px 0 7px;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.9em;
`;
export const MovieMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 4px 8px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.muted};
`;
export const Rating = styled.span`
  color: #dccb9c;
`;
export const MovieGenres = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.muted};
  line-height: 1.6;
  min-height: 3.2em;
  margin: 8px 0 12px;
`;
export const Button = styled.button`
  border: 1px solid #ffffff24;
  border-radius: 6px;
  padding: 10px 14px;
  min-height: 44px;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  font-size: 13px;
  &:hover:not(:disabled) {
    background: #ffffff08;
    border-color: #ffffff50;
  }
  &:disabled {
    cursor: default;
    opacity: 0.5;
  }
`;
export const FavoriteButton = styled(Button)`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 7px;
  padding: 8px;
  &[aria-pressed='true'] {
    color: #c9badd;
    border-color: #b8accf55;
    background: #b8accf09;
  }
`;
export const Notice = styled.div`
  padding: 20px;
  margin: 24px 0;
  border: 1px solid #ffffff20;
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.muted};
  font-size: 14px;
  line-height: 1.6;
  p {
    margin: 0 0 12px;
  }
  button {
    margin-top: 8px;
  }
`;
export const SectionHeader = styled.header`
  margin-bottom: 32px;
`;
export const PageHeading = styled.h1`
  margin: 0 0 12px;
  font-size: clamp(30px, 5vw, 42px);
  font-weight: 500;
  letter-spacing: -0.04em;
`;
export const Intro = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  line-height: 1.7;
  font-size: 15px;
`;
export const ResultsInfo = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.muted};
  margin: 28px 0 24px;
`;
