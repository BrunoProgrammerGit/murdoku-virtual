/**
 * Excepción base para violaciones de invariantes en la capa de Dominio.
 */
export abstract class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidMoveException extends DomainException {
  constructor(message: string, public readonly coordinate?: { row: number; col: number }) {
    super(message);
  }
}

export class RuleViolationException extends DomainException {
  constructor(
    message: string,
    public readonly ruleId: string,
    public readonly affectedCoordinates: { row: number; col: number }[] = []
  ) {
    super(message);
  }
}
