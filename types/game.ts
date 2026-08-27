export type TryStep =
  | 'landing'
  | 'step-person'
  | 'step-clothing'
  | 'generating'
  | 'result';

export type ClothingCategory = 'TOP' | 'BOTTOM' | 'DRESS' | 'UNKNOWN';

export type ResultStatus = 'success' | 'failed' | 'saved' | 'pending';

export type SubscriptionPlan =
  | 'FREE'
  | 'PRO_MONTHLY'
  | 'PRO_YEARLY'
  | 'PREMIUM_MONTHLY'
  | 'PREMIUM_YEARLY';

export type SubscriptionStatus =
  | 'ACTIVE'
  | 'CANCELED'
  | 'PAST_DUE'
  | 'EXPIRED'
  | 'TRIALING';

export interface TryResult {
  id: string;
  originalPersonUrl: string;
  originalClothingUrl: string;
  resultImageUrl: string;
  category: ClothingCategory;
  createdAt: string;
  generationMs: number | null;
  status: ResultStatus;
  errorMessage?: string | null;
}

export interface SessionState {
  personPhoto: File | null;
  personPhotoUrl: string | null;
  clothingPhoto: File | null;
  clothingPhotoUrl: string | null;
  detectedCategory: ClothingCategory | null;
  currentTry: TryResult | null;
  step: TryStep;
  isGenerating: boolean;
  generatingProgress: number;
  error: string | null;
  personReuseCount: number;
  trySeqInSession: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

export interface SubscriptionInfo {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
}

export interface UsageInfo {
  totalCredits: number;
  usedCredits: number;
  bonusCredits: number;
  remainingCredits: number;
  lastResetAt: string | null;
}

export interface UserState {
  isAuthenticated: boolean;
  profile: UserProfile | null;
  subscription: SubscriptionInfo;
  usage: UsageInfo;
}

export interface HistoryItem {
  id: string;
  personImageUrl: string;
  clothingImageUrl: string;
  resultImageUrl: string;
  category: ClothingCategory;
  generationMs: number | null;
  outputQuality: string | null;
  createdAt: string;
}

export interface HistoryState {
  items: HistoryItem[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface GameState {
  session: SessionState;
  user: UserState;
  history: HistoryState;
}

export type GameAction =
  // Session: Step navigation
  | { type: 'SET_STEP'; payload: TryStep }

  // Session: Person photo
  | { type: 'SET_PERSON_PHOTO'; payload: { file: File; url: string } }
  | { type: 'CLEAR_PERSON_PHOTO' }

  // Session: Clothing photo
  | { type: 'SET_CLOTHING_PHOTO'; payload: { file: File; url: string } }
  | { type: 'CLEAR_CLOTHING_PHOTO' }

  // Session: Generating
  | { type: 'GENERATE_START' }
  | { type: 'GENERATE_PROGRESS'; payload: number }
  | {
      type: 'GENERATE_SUCCESS';
      payload: {
        result: TryResult;
        category: ClothingCategory;
        usedCredit?: boolean;
      };
    }
  | { type: 'GENERATE_FAIL'; payload: { error: string } }
  | { type: 'CATEGORY_DETECTED'; payload: ClothingCategory }

  // Session: Clear for new try
  | { type: 'TRY_ANOTHER_OUTFIT' }
  | { type: 'RESET_SESSION' }

  // User
  | { type: 'USER_SET'; payload: { profile: UserProfile; subscription: SubscriptionInfo; usage: UsageInfo } }
  | { type: 'USER_LOGOUT' }
  | { type: 'USAGE_CONSUME'; payload: { usedCredits: number; remainingCredits: number } }
  | { type: 'USAGE_REFUND'; payload: { usedCredits: number; remainingCredits: number } }
  | { type: 'USAGE_REFRESH'; payload: UsageInfo }

  // History
  | { type: 'HISTORY_LOAD_START' }
  | { type: 'HISTORY_LOAD_SUCCESS'; payload: { items: HistoryItem[]; hasMore: boolean; append?: boolean } }
  | { type: 'HISTORY_LOAD_FAIL'; payload: { error: string } }
  | { type: 'HISTORY_ITEM_SAVE'; payload: HistoryItem }
  | { type: 'HISTORY_ITEM_DELETE'; payload: { id: string } };
