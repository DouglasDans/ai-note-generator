'use client';

import InitColorSchemeScript from '@mui/joy/InitColorSchemeScript';
import { CssBaseline, CssVarsProvider } from '@mui/joy';
import React, { PropsWithChildren } from 'react';
import NextAppDirEmotionCacheProvider from './emotion-cache';

export default function ThemeRegistry({ children }: PropsWithChildren) {
  return (
    <NextAppDirEmotionCacheProvider options={{ key: 'joy' }}>
      <InitColorSchemeScript />
      <CssVarsProvider>
        <CssBaseline />
        {children}
      </CssVarsProvider>
    </NextAppDirEmotionCacheProvider>
  );
}
