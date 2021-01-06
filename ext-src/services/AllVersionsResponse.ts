import { ComponentCoordinate } from "../types/ComponentCoordinate";

export interface AllVersionsResponse {
    allVersions: VersionResponse[],
    remediation?: any
}

export interface VersionResponse {
    catalogDate: number,
    componentIdentifier: ComponentIdentifier,
    declaredLicenses?: any[],
    effectiveLicenses?: any[],
    observedLicenses?: any[],
    overriddenLicenses?: any[],
    identificationSource: string,
    highestSecurityVulnerabilitySeverity: number,
    securityVulnerabilityCount: number,
    displayName: any,
    matchState: string,
    policyAlerts?: any[],
    policyMaxThreatLevelsByCategory?: any
}

export interface ComponentIdentifier {
    coordinates: ComponentCoordinate,
    format: string
}
