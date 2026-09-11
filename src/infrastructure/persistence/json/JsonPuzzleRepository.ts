import { IPuzzleRepository } from '../../../application/ports/output/IPuzzleRepository';
import { Puzzle } from '../../../domain/models/Puzzle';
import { PuzzleFactory } from '../../../application/factories/PuzzleFactory';
import { PUZZLES_DATA } from './puzzlesData';

/**
 * Adaptador Secundario / Driven Adapter: JsonPuzzleRepository
 * Implementa la interfaz IPuzzleRepository leyendo casos de estudio desde un almacén estático JSON.
 * Cumple con el Principio de Inversión de Dependencias (DIP):
 * Las capas superiores dependen de la abstracción IPuzzleRepository, no de esta implementación concreta.
 */
export class JsonPuzzleRepository implements IPuzzleRepository {
  private cache: Puzzle[] | null = null;

  private loadAllPuzzles(): Puzzle[] {
    if (!this.cache) {
      this.cache = PUZZLES_DATA.map(rawJson => PuzzleFactory.fromJSON(rawJson));
    }
    return this.cache;
  }

  public async findAll(): Promise<Puzzle[]> {
    // Simulamos comportamiento asíncrono para reflejar I/O real
    return [...this.loadAllPuzzles()];
  }

  public async findById(id: string): Promise<Puzzle | null> {
    const all = this.loadAllPuzzles();
    const found = all.find(p => p.id === id);
    return found ? found : null;
  }

  public async findByCaseNumber(caseNumber: number): Promise<Puzzle | null> {
    const all = this.loadAllPuzzles();
    const found = all.find(p => p.caseNumber === caseNumber);
    return found ? found : null;
  }
}
