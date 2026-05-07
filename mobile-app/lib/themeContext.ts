import React, { createContext, useContext } from 'react';
import { HERO_THEMES } from './heroThemes';

type HeroTheme = typeof HERO_THEMES['cap'];

const defaultTheme = HERO_THEMES['cap'];

export const ThemeContext = createContext<HeroTheme>(defaultTheme);

export const useHeroTheme = () => useContext(ThemeContext);

export const getHeroTheme = (heroId?: string): HeroTheme => {
  return HERO_THEMES[heroId || 'cap'] || HERO_THEMES['cap'];
};
