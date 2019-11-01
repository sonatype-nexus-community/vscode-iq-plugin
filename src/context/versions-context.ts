import * as React from 'react';

export interface VersionsContextInterface {
  allVersions: any[],
  component: any,
  selectedVersionDetails?: any,
  selectedVersion: string,
  initialVersion: string
}

const ctxt = React.createContext<VersionsContextInterface | undefined>(undefined);

export const VersionsContextProvider = ctxt.Provider;

export const VersionsContextConsumer = ctxt.Consumer;
