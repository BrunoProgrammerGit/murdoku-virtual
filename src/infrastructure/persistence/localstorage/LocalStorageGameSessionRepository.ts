export interface GameSessionState {
  puzzleId: string;
  boardStateSerialized: { row: number; col: number; stateKind: string; suspectId: string | null }[];
  elapsedSeconds: number;
  strikes: number;
  completedAt?: string;
}

/**
 * Adaptador Secundario: LocalStorageGameSessionRepository
 * Permite persistir el estado de la sesión de juego en el navegador sin acoplar el Dominio.
 */
export class LocalStorageGameSessionRepository {
  private readonly STORAGE_PREFIX = 'murdoku_session_';

  public saveSession(session: GameSessionState): void {
    try {
      localStorage.setItem(`${this.STORAGE_PREFIX}${session.puzzleId}`, JSON.stringify(session));
    } catch {
      // Manejo silencioso si localStorage está bloqueado o en modo incógnito estricto
    }
  }

  public loadSession(puzzleId: string): GameSessionState | null {
    try {
      const raw = localStorage.getItem(`${this.STORAGE_PREFIX}${puzzleId}`);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public clearSession(puzzleId: string): void {
    try {
      localStorage.removeItem(`${this.STORAGE_PREFIX}${puzzleId}`);
    } catch {}
  }
}
