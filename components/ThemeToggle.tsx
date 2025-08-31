'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="fixed top-4 right-4 z-[9999] w-10 h-10 p-0 bg-white/10 dark:bg-gray-800/80 border-white/20 dark:border-gray-600/40 hover:bg-white/20 dark:hover:bg-gray-700/80 backdrop-blur-sm transition-all duration-200"
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 text-yellow-400" />
      ) : (
        <Moon className="h-4 w-4 text-[#0201ff]" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}