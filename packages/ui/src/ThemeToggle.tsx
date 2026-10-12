import { useContext } from 'react';
import styled from 'styled-components';
import { Button } from './movie.styles';
import { ThemePreferenceContext } from './theme-preference';

const ToggleButton = styled(Button)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  gap: 6px;
  padding: 0;
  border: 0;
  border-radius: 8px;

  &:hover:not(:disabled) {
    background: transparent;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    gap: 4px;
  }
`;

const ModeIcon = styled.svg`
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.muted};
  opacity: 0.55;

  &[data-active='true'] {
    color: ${({ theme }) => theme.colors.text};
    opacity: 0.9;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 12px;
    height: 12px;
  }
`;

const Track = styled.span`
  --thumb-travel: 20px;
  position: relative;
  display: inline-block;
  flex-shrink: 0;
  width: 40px;
  height: 20px;
  border: 1px solid ${({ theme }) => theme.colors.controlBorder};
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.switchTrack};
  box-shadow:
    inset 2px 2px 4px #00000030,
    inset -1px -1px 2px #ffffff14;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    --thumb-travel: 16px;
    width: 36px;
  }
`;

const Thumb = styled.span`
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background:
    linear-gradient(160deg, #ffffff30, #00000012), ${({ theme }) => theme.colors.switchThumb};
  box-shadow: 0 1px 3px #00000045;
  transform: translateX(${({ theme }) => (theme.mode === 'dark' ? 'var(--thumb-travel)' : '0')});
  transition: transform 180ms ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export function ThemeToggle() {
  const preference = useContext(ThemePreferenceContext);
  if (!preference) throw new Error('ThemeToggle deve ser utilizado dentro de UIProvider.');
  const { mode, toggleTheme } = preference;
  const label = mode === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro';

  return (
    <ToggleButton type="button" aria-label={label} title={label} onClick={toggleTheme}>
      <ModeIcon
        data-active={mode === 'light'}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
      </ModeIcon>
      <Track aria-hidden="true">
        <Thumb />
      </Track>
      <ModeIcon
        data-active={mode === 'dark'}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.9 13.1A9 9 0 0 1 10.9 3.1a9 9 0 1 0 10 10Z" />
      </ModeIcon>
    </ToggleButton>
  );
}
