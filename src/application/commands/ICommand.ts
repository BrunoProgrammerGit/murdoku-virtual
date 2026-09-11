import { Board } from '../../domain/models/Board';

/**
 * Patrón Command: ICommand
 * Interfaz para encapsular una solicitud o mutación como un objeto.
 * Permite parametrizar operaciones, mantener historial y soportar Undo/Redo.
 */
export interface ICommand {
  /**
   * Nombre o descripción legible de la acción.
   */
  readonly description: string;

  /**
   * Ejecuta el comando transformando el tablero actual.
   * @param currentBoard Tablero previo.
   * @returns Nuevo tablero tras la aplicación del comando.
   */
  execute(currentBoard: Board): Board;

  /**
   * Deshace la acción devolviendo el tablero a su estado anterior.
   * @param currentBoard Tablero actual.
   * @returns Tablero revertido.
   */
  undo(currentBoard: Board): Board;
}
