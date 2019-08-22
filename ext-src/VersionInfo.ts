
export class VersionInfo {
  public displayName: DisplayName = new DisplayName();
  public threatLevel: number = 0;
  public popularity: number = 0;

  public toString = () : string => {
    return `VersionInfo (displayName: ${this.displayName}, popularity: ${this.popularity})`;
  }
}

export class DisplayName {
  public packageId: string = "";
  public version: string = "";

  public toString = () : string => {
    return `DisplayName (packageId: ${this.packageId}, version: ${this.version})`;
  }
}