
export interface RequestService {
  getApplicationId(applicationPublicId: string): Promise<any>;
  submitToIqForEvaluation(data: any, applicationInternalId: string): Promise<any>;
  asyncPollForEvaluationResults(applicationInternalId: string, resultId: string): Promise<any>;
  getAllVersions(component: any, iqApplicationPublicId: string): Promise<any>;
  GetCVEDetails(cve: any, nexusArtifact: any): Promise<any>;
  getRemediation(nexusArtifact: any, iqApplicationId: string): Promise<any>;
  showSelectedVersion(componentIdentifier: any, version: string): Promise<any>
}