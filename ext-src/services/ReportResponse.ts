import { ComponentCoordinate } from "../types/ComponentCoordinate";
import { PolicyViolation } from "../types/PolicyViolation";

export interface ReportResponse {
    application: any,
    commitHash: any,
    components: ReportComponent[],
    counts: any,
    reportTime: any,
    reportTitle: string
}

export interface ReportComponent {
    componentIdentifier: ReportComponentIdentifier,
    displayName: string,
    hash: string,
    matchState: string,
    packageUrl: string,
    violations: PolicyViolation[]
}

export interface ReportComponentIdentifier {
    coordinates: ComponentCoordinate,
    format: string
}
