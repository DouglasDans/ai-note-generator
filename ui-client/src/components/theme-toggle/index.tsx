'use client';

import { useColorScheme } from '@mui/joy/styles';
import IconButton from '@mui/joy/IconButton';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { mode, setMode } = useColorScheme();
  const [mounted, setMounted] = useState(false);

  // Necessário para evitar problemas de hidratação do SSR
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <IconButton size="sm" variant="outlined" color="neutral" disabled />;
  }

  return (
    <IconButton
      size="sm"
      variant="outlined"
      color="neutral"
      onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
    >
      {mode === 'dark' ? '🌙' : '☀️'}
    </IconButton>
  );
}
