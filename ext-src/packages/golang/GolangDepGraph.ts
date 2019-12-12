
export class GolangDepGraph {
  private adjList: Map<string, string[]>

  constructor() {
    this.adjList = new Map();
  }

  public addVertex(v: string): void {
    this.adjList.set(v, []);
  }

  public addEdge(v: string, e: string): void {
    if (this.adjList.has(v)) {
      this.adjList.get(v)!.push(e);
    } else {
      this.adjList.set(v, []);
      this.adjList.get(v)!.push(e)
    }

    if (this.adjList.has(e)) {
      this.adjList.get(e)!.push(v);
    } else {
      this.adjList.set(e, []);
      this.adjList.get(e)!.push(v)
    }
  }

  public getAdjacencyList(): Map<string, string[]> {
    return this.adjList;
  }
}
