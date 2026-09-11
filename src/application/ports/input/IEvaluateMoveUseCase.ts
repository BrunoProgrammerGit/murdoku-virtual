import { Board } from '../../../domain/models/Board';
import { Puzzle } from '../../../domain/models/Puzzle';
import { EvaluateMoveRequestDTO, EvaluateMoveResponseDTO } from '../../dtos/EvaluateMoveDTO';

/**
 * Puerto de Entrada (Primary / Driving Port): IEvaluateMoveUseCase
 * Define el contrato de ejecución del caso de uso de evaluación de jugadas.
 */
export interface IEvaluateMoveUseCase {
  execute(
    board: Board,
    puzzle: Puzzle,
    request: EvaluateMoveRequestDTO
  ): Promise<EvaluateMoveResponseDTO>;
}
