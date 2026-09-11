import { Puzzle } from '../../../domain/models/Puzzle';

/**
 * Puerto de Salida (Secondary / Driven Port): IPuzzleRepository
 * Define el contrato de persistencia o recuperación de casos de Murdoku.
 * La capa de Dominio y Aplicación no conocen si los datos vienen de JSON, LocalStorage o SQLite.
 */
export interface IPuzzleRepository {
  /**
   * Obtiene todos los casos de investigación disponibles.
   */
  findAll(): Promise<Puzzle[]>;

  /**
   * Obtiene un caso por su ID único.
   */
  findById(id: string): Promise<Puzzle | null>;

  /**
   * Obtiene el caso actual o por número de caso.
   */
  findByCaseNumber(caseNumber: number): Promise<Puzzle | null>;
}
