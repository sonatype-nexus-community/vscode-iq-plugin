
export class VersionInfo {
  constructor(public displayName: DisplayName, public threatLevel: number, public popularity: number){}

  public toString = () : string => {
    return `VersionInfo (displayName: ${this.displayName}, popularity: ${this.popularity})`;
  }
}

export class DisplayName {
  constructor(public packageId: string, public version: string){}
  public toString = () : string => {
    return `DisplayName (packageId: ${this.packageId}, version: ${this.version})`;
  }
}