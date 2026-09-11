import { CellStateKind } from '../../domain/models/CellState';
import { RuleConflict } from '../../domain/services/RuleEngine';

export interface EvaluateMoveRequestDTO {
  row: number;
  col: number;
  action: 'PLACE_SUSPECT' | 'PLACE_CROSS' | 'SET_NOTES' | 'CLEAR';
  suspectId?: string;
  notes?: string[];
}

export interface EvaluateMoveResponseDTO {
  isAllowed: boolean;
  isValidBoardState: boolean;
  message: string;
  conflicts: {
    type: string;
    message: string;
    affectedCoordinates: { row: number; col: number }[];
    ruleOrClueId?: string;
  }[];
  activeClueViolations: string[];
  isSolved: boolean;
}
