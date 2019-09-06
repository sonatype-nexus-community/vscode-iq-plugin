
export class VersionInfo {
  public displayName: DisplayName = new DisplayName();
  public threatLevel: number = 0;
  public popularity?: number;
  public hash?: string;
  public matchState?: any;
  public catalogDate?: any;
  public highestCvssScore?: number;
  public dataSource?: string;

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