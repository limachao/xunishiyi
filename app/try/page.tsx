'use client';

import * as React from 'react';
import { useGame } from '@/contexts/GameContext';
import type { TryStep } from '@/types/game';
import { StepPerson } from '@/components/try-on/steps/step-person';
import { StepClothing } from '@/components/try-on/steps/step-clothing';
import { Generating } from '@/components/try-on/steps/generating';
import { Result } from '@/components/try-on/steps/result';

const STEP_FALLBACK: TryStep = 'step-person';

export default function TryPage() {
  const { state, dispatch } = useGame();
  const initializedRef = React.useRef(false);

  React.useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const step = state.session.step;
    if (step === 'landing') {
      const hasPerson = Boolean(state.session.personPhotoUrl);
      dispatch({
        type: 'SET_STEP',
        payload: hasPerson ? 'step-clothing' : STEP_FALLBACK,
      });
    }
  }, [dispatch, state.session.personPhotoUrl, state.session.step]);

  const step = state.session.step === 'landing' ? STEP_FALLBACK : state.session.step;

  switch (step) {
    case 'step-person':
      return <StepPerson />;
    case 'step-clothing':
      return <StepClothing />;
    case 'generating':
      return <Generating />;
    case 'result':
      return <Result />;
    default:
      return <StepPerson />;
  }
}
