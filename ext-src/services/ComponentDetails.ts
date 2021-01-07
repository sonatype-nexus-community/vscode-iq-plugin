
export interface ComponentDetails {
    componentDetails: any[]
}

export interface ComponentResponse {
    catalogDate?: any,
    component: any,
    licenseData: any,
    matchState: string,
    securityData?: SecurityData
}

export interface SecurityData {
    securityIssues?: SecurityIssue[]
}

export interface SecurityIssue {
    source: string,
    reference: string,
    severity: number,
    url?: string,
    threatCategory: string
}
