'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { MoveRight, Brain, Mail } from 'lucide-react';

interface WelcomeScreenProps {
  onEnter: () => void;
}

export default function WelcomeScreen({ onEnter }: WelcomeScreenProps) {
  return (
    <div className="w-full min-h-screen bg-background">
      <div className="container mx-auto">
        <div className="flex gap-8 py-20 lg:py-40 items-center justify-center flex-col">
          {/* Badge */}
          <div>
            <Button variant="secondary" size="sm" className="gap-4">
              Powered by AI Research & Copywriting <Brain className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Main content */}
          <div className="flex gap-4 flex-col">
            <h1 className="text-5xl md:text-7xl max-w-4xl tracking-tighter text-center font-regular">
              AI-Powered Email Campaign Generator
            </h1>
            <p className="text-lg md:text-xl leading-relaxed tracking-tight text-muted-foreground max-w-3xl text-center">
              Transform company research into personalized email campaigns. Our AI agent analyzes your prospects, 
              crafts compelling copy, and generates multi-email sequences that convert.
            </p>
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" className="gap-4" onClick={onEnter}>
              Start Creating Campaigns <MoveRight className="w-4 h-4" />
            </Button>
            <Button size="lg" className="gap-4" variant="outline">
              See Demo <Mail className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mt-16">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold mb-2">AI Research</h3>
              <p className="text-sm text-muted-foreground">
                Comprehensive company analysis using advanced web research
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold mb-2">Smart Copywriting</h3>
              <p className="text-sm text-muted-foreground">
                Personalized email copy crafted by specialized copywriting AI
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <MoveRight className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold mb-2">Multi-Email Sequences</h3>
              <p className="text-sm text-muted-foreground">
                Complete campaign sequences with follow-ups and timing
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}