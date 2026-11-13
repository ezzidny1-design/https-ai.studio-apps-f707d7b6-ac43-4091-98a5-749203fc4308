export type Phase = 'B' | 'C';

export type MascotId = 'a' | 'b';

export interface VerticalMath {
  top: number;
  bottom: number;
  operator: '+' | '-' | '×';
}

export interface NumeracyQuestion {
  id: string;
  prompt: string;
  vertical?: VerticalMath;
  options: number[];
  answer: number;
}

export interface ClientQuestion {
  id: string;
  prompt: string;
  vertical?: VerticalMath;
  options: number[];
}

export interface PlayerState {
  id: string;
  name: string;
  mascot: MascotId;
  score: number;
  correctCount: number;
  questionIndex: number;
  isBot?: boolean;
}

export interface MatchPublicState {
  id: string;
  phase: Phase;
  targetSteps: number;
  status: 'countdown' | 'active' | 'finished';
  countdownSec: number;
  timeLeftSec: number;
  isBotMatch: boolean;
  players: [PlayerState, PlayerState];
  winnerId: string | null;
  createdAt: number;
  finishedAt: number | null;
}

export interface WaitingStudentPublic {
  id: string;
  name: string;
  phase: Phase;
  mascot: MascotId;
  joinedAt: number;
}

export interface TeacherBoardState {
  waiting: WaitingStudentPublic[];
  matches: MatchPublicState[];
  stats: {
    waitingCount: number;
    activeCount: number;
    finishedCount: number;
  };
}

// Client -> Server WebSocket messages
export type ClientMessage =
  | { type: 'teacher:subscribe' }
  | { type: 'teacher:clear_finished' }
  | { type: 'teacher:start_demo'; phase?: Phase }
  | { type: 'teacher:pair_with_bot'; studentId: string }
  | { type: 'student:join'; name: string; phase: Phase }
  | { type: 'student:cancel' }
  | { type: 'student:play_bot' }
  | { type: 'match:answer'; matchId: string; questionIndex: number; selectedOption: number }
  | { type: 'match:leave'; matchId: string };

// Server -> Client WebSocket messages
export type ServerMessage =
  | { type: 'connected'; clientId: string }
  | { type: 'error'; message: string }
  | { type: 'student:waiting'; student: WaitingStudentPublic }
  | { type: 'student:cancelled' }
  | {
      type: 'match:started';
      match: MatchPublicState;
      playerId: string;
      question: ClientQuestion;
    }
  | {
      type: 'match:answer_result';
      matchId: string;
      correct: boolean;
      correctAnswer: number;
      nextQuestion: ClientQuestion | null;
    }
  | {
      type: 'match:update';
      match: MatchPublicState;
    }
  | {
      type: 'match:finished';
      match: MatchPublicState;
      reason: 'goal' | 'time_up' | 'opponent_left';
    }
  | {
      type: 'teacher:state';
      board: TeacherBoardState;
    }
  | {
      type: 'teacher:cheer';
      winnerName: string;
      phase: Phase;
      matchId: string;
    };
