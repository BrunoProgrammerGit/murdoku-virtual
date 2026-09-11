/**
 * Entity: Suspect
 * Representa a un personaje de la investigación criminal (sospechoso o víctima).
 */
export interface SuspectAttributes {
  hasHat?: boolean;
  hasGlasses?: boolean;
  isVictim?: boolean;
  gender?: 'M' | 'F';
  role?: string;
}

export class Suspect {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly initial: string,
    public readonly color: string,
    public readonly attributes: SuspectAttributes = {},
    public readonly clueSummary: string = '',
    public readonly avatarIcon: string = '👤'
  ) {}

  public isVictim(): boolean {
    return Boolean(this.attributes.isVictim);
  }
}
