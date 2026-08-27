'use client';

import React, {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import type {
  ClothingCategory,
  GameAction,
  GameState,
  HistoryState,
  SessionState,
  SubscriptionInfo,
  UsageInfo,
  UserState,
} from '@/types/game';

const INITIAL_SESSION: SessionState = {
  personPhoto: null,
  personPhotoUrl: null,
  clothingPhoto: null,
  clothingPhotoUrl: null,
  detectedCategory: null,
  currentTry: null,
  step: 'landing',
  isGenerating: false,
  generatingProgress: 0,
  error: null,
  personReuseCount: 0,
  trySeqInSession: 0,
};

const INITIAL_SUBSCRIPTION: SubscriptionInfo = {
  plan: 'FREE',
  status: 'ACTIVE',
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  stripeCustomerId: null,
};

const INITIAL_USAGE: UsageInfo = {
  totalCredits: 5,
  usedCredits: 0,
  bonusCredits: 0,
  remainingCredits: 5,
  lastResetAt: null,
};

const INITIAL_USER: UserState = {
  isAuthenticated: false,
  profile: null,
  subscription: INITIAL_SUBSCRIPTION,
  usage: INITIAL_USAGE,
};

const INITIAL_HISTORY: HistoryState = {
  items: [],
  isLoading: false,
  page: 1,
  pageSize: 20,
  hasMore: false,
};

const INITIAL_STATE: GameState = {
  session: INITIAL_SESSION,
  user: INITIAL_USER,
  history: INITIAL_HISTORY,
};

function sessionReducer(state: SessionState, action: GameAction): SessionState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.payload, error: null };

    case 'SET_PERSON_PHOTO':
      return {
        ...state,
        personPhoto: action.payload.file,
        personPhotoUrl: action.payload.url,
        personReuseCount: state.personPhoto ? state.personReuseCount + 1 : 0,
        error: null,
      };
    case 'CLEAR_PERSON_PHOTO':
      return {
        ...state,
        personPhoto: null,
        personPhotoUrl: null,
        personReuseCount: 0,
      };

    case 'SET_CLOTHING_PHOTO':
      return {
        ...state,
        clothingPhoto: action.payload.file,
        clothingPhotoUrl: action.payload.url,
        error: null,
      };
    case 'CLEAR_CLOTHING_PHOTO':
      return {
        ...state,
        clothingPhoto: null,
        clothingPhotoUrl: null,
        detectedCategory: null,
      };

    case 'GENERATE_START':
      return {
        ...state,
        step: 'generating',
        isGenerating: true,
        generatingProgress: 0,
        error: null,
        trySeqInSession: state.trySeqInSession + 1,
      };
    case 'GENERATE_PROGRESS':
      return {
        ...state,
        generatingProgress: Math.min(100, Math.max(0, action.payload)),
      };
    case 'CATEGORY_DETECTED':
      return {
        ...state,
        detectedCategory: action.payload,
      };
    case 'GENERATE_SUCCESS':
      return {
        ...state,
        step: 'result',
        isGenerating: false,
        generatingProgress: 100,
        detectedCategory: action.payload.category,
        currentTry: action.payload.result,
        error: null,
      };
    case 'GENERATE_FAIL':
      return {
        ...state,
        step: 'result',
        isGenerating: false,
        generatingProgress: 0,
        error: action.payload.error,
        currentTry: null,
      };

    case 'TRY_ANOTHER_OUTFIT':
      return {
        ...state,
        step: 'step-clothing',
        clothingPhoto: null,
        clothingPhotoUrl: null,
        detectedCategory: null,
        currentTry: null,
        error: null,
        isGenerating: false,
        generatingProgress: 0,
      };

    case 'RESET_SESSION':
      return { ...INITIAL_SESSION, step: state.step };

    default:
      return state;
  }
}

function userReducer(state: UserState, action: GameAction): UserState {
  switch (action.type) {
    case 'USER_SET':
      return {
        isAuthenticated: true,
        profile: action.payload.profile,
        subscription: action.payload.subscription,
        usage: action.payload.usage,
      };
    case 'USER_LOGOUT':
      return { ...INITIAL_USER };
    case 'USAGE_CONSUME':
    case 'USAGE_REFUND':
      return {
        ...state,
        usage: {
          ...state.usage,
          usedCredits: action.payload.usedCredits,
          remainingCredits: action.payload.remainingCredits,
        },
      };
    case 'USAGE_REFRESH':
      return { ...state, usage: action.payload };
    default:
      return state;
  }
}

function historyReducer(state: HistoryState, action: GameAction): HistoryState {
  switch (action.type) {
    case 'HISTORY_LOAD_START':
      return { ...state, isLoading: true };
    case 'HISTORY_LOAD_SUCCESS':
      return {
        ...state,
        isLoading: false,
        items: action.payload.append
          ? [...state.items, ...action.payload.items]
          : action.payload.items,
        hasMore: action.payload.hasMore,
        page: action.payload.append ? state.page + 1 : 1,
      };
    case 'HISTORY_LOAD_FAIL':
      return { ...state, isLoading: false };
    case 'HISTORY_ITEM_SAVE':
      return { ...state, items: [action.payload, ...state.items] };
    case 'HISTORY_ITEM_DELETE':
      return {
        ...state,
        items: state.items.filter((i) => i.id !== action.payload.id),
      };
    default:
      return state;
  }
}

function gameReducer(state: GameState, action: GameAction): GameState {
  return {
    session: sessionReducer(state.session, action),
    user: userReducer(state.user, action),
    history: historyReducer(state.history, action),
  };
}

interface GameContextValue {
  state: GameState;
  session: SessionState;
  user: UserState;
  subscription: SubscriptionInfo;
  usage: UsageInfo;
  history: HistoryState;
  dispatch: React.Dispatch<GameAction>;
  hasEnoughCredits: (required?: number) => boolean;
  consumeCredit: () => { ok: boolean; remaining: number; used: number };
  refundCredit: () => { remaining: number; used: number };
}

function createStubContextValue(): GameContextValue {
  return {
    state: INITIAL_STATE,
    session: INITIAL_STATE.session,
    user: INITIAL_STATE.user,
    subscription: INITIAL_STATE.user.subscription,
    usage: INITIAL_STATE.user.usage,
    history: INITIAL_STATE.history,
    dispatch: () => {},
    hasEnoughCredits: (required = 1) =>
      INITIAL_STATE.user.usage.remainingCredits >= required,
    consumeCredit: () => ({
      ok: false,
      remaining: INITIAL_STATE.user.usage.remainingCredits,
      used: INITIAL_STATE.user.usage.usedCredits,
    }),
    refundCredit: () => ({
      remaining: INITIAL_STATE.user.usage.remainingCredits,
      used: INITIAL_STATE.user.usage.usedCredits,
    }),
  };
}

const GameContext = createContext<GameContextValue>(createStubContextValue());

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);

  const value = useMemo<GameContextValue>(() => {
    const hasEnoughCredits = (required = 1) =>
      state.user.usage.remainingCredits >= required;

    const consumeCredit = () => {
      const used = state.user.usage.usedCredits + 1;
      const remaining = Math.max(0, state.user.usage.remainingCredits - 1);
      dispatch({
        type: 'USAGE_CONSUME',
        payload: { usedCredits: used, remainingCredits: remaining },
      });
      return { ok: remaining >= 0, remaining, used };
    };

    const refundCredit = () => {
      const used = Math.max(0, state.user.usage.usedCredits - 1);
      const remaining = state.user.usage.remainingCredits + 1;
      dispatch({
        type: 'USAGE_REFUND',
        payload: { usedCredits: used, remainingCredits: remaining },
      });
      return { remaining, used };
    };

    return {
      state,
      session: state.session,
      user: state.user,
      subscription: state.user.subscription,
      usage: state.user.usage,
      history: state.history,
      dispatch,
      hasEnoughCredits,
      consumeCredit,
      refundCredit,
    };
  }, [state]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  return useContext(GameContext);
}

export function useSession() {
  const { state, dispatch } = useGame();
  return { session: state.session, dispatch };
}

export function useUser() {
  const { state, dispatch, hasEnoughCredits, consumeCredit, refundCredit } =
    useGame();
  return {
    user: state.user,
    subscription: state.user.subscription,
    usage: state.user.usage,
    dispatch,
    hasEnoughCredits,
    consumeCredit,
    refundCredit,
  };
}

export function useHistory() {
  const { state, dispatch } = useGame();
  return { history: state.history, dispatch };
}

export type { ClothingCategory };
