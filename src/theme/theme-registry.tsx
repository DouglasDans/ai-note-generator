'use client';

import InitColorSchemeScript from '@mui/joy/InitColorSchemeScript';
import { CssBaseline, CssVarsProvider } from '@mui/joy';
import React, { PropsWithChildren } from 'react';
import NextAppDirEmotionCacheProvider from './emotion-cache';

export default function ThemeRegistry({ children }: PropsWithChildren) {
  return (
    <NextAppDirEmotionCacheProvider options={{ key: 'joy' }}>
      <InitColorSchemeScript />
      <CssVarsProvider
        defaultMode="system"
        disableTransitionOnChange
        modeStorageKey="starlight-color-scheme"
      >
        <CssBaseline />
        {children}
      </CssVarsProvider>
    </NextAppDirEmotionCacheProvider>
  );
}
