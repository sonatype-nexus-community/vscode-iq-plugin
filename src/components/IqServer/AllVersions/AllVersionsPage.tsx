/*
 * Copyright (c) 2019-present Sonatype, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { 
  useContext, 
  useEffect, 
  useState } from "react";
import { 
  VersionsContext, 
  VersionsContextInterface } from "../../../context/versions-context";
import SelectedBadge from "./SelectedBadge/SelectedBadge";
import { Puff } from '@agney/react-loading';
import { 
  NxPolicyViolationIndicator, 
  ThreatLevelNumber } from '@sonatype/react-shared-components';

const AllVersionsPage = (props: any) => {

  const [selectedVersion, setSelectedVersion] = useState("");

  const versionsContext = useContext(VersionsContext);

  const getMaxSecurity = (security: any): number => {
    if (security && security.securityIssues && security.securityIssues.length > 0) {
      return Math.max.apply(Math, security.securityIssues.map((sec: { severity: number; }) => { return sec.severity }));
    }
    return 0;
  }

  useEffect(() => {
    scrollToCurrentVersion();
  });

  const handleClick = (version: string) => {
    setSelectedVersion(version);

    props.versionChangeHandler(version);
  }

  const scrollToCurrentVersion = () => {
    let selectedElement = document.getElementsByClassName("nx-list__item selected");
    console.debug(
      "scrollToCurrentVersion found selected version",
      selectedElement
    );
    if (
      selectedElement &&
      selectedElement.length > 0 &&
      !isElementInViewport(selectedElement[0])
    ) {
      selectedElement[0].scrollIntoView();
    }
  }

  const isElementInViewport = (element: Element) => {
    var bounding = element.getBoundingClientRect();
    return (
      bounding.top >= 0 &&
      bounding.bottom <=
        (window.innerHeight || document.documentElement.clientHeight)
    );
  }

  const getClassName = (initialVersion: string, version: string, className: string):string => {
    console.debug(selectedVersion);
    if (selectedVersion == version) {
      return className += " selected";
    } else if (initialVersion == version) {
      return className += " selected";
    }
    return className;
  }

  const renderAllVersionsList = (versionsContext: VersionsContextInterface | undefined) => {
    if (versionsContext && versionsContext.allVersions && versionsContext.allVersions.length > 0) {
      return (
        <React.Fragment>
          <h3 className="nx-h3">
            Versions
          </h3>
          <ul className="nx-list nx-list--clickable">
          { versionsContext.allVersions.map((version) => (
            <li 
              className={
                getClassName(
                  versionsContext.initialVersion,
                  version.component.componentIdentifier.coordinates.version,
                  "nx-list__item")
              }
              onClick={() => handleClick(version.component.componentIdentifier.coordinates.version)}
              >
              <span className="nx-list__text">
                <SelectedBadge
                  version={
                    version.component.componentIdentifier.coordinates
                      .version
                  }
                  selectedVersion={versionsContext.selectedVersion}
                  initialVersion={versionsContext.initialVersion}
                />
                { " " + version.component.componentIdentifier.coordinates.version + " " }
                <NxPolicyViolationIndicator 
                  style={{float: "right"}}
                  policyThreatLevel={ 
                    Math.round(getMaxSecurity(version.securityData)) as ThreatLevelNumber
                    } >
                  { " " + getMaxSecurity(version.securityData) }
                </NxPolicyViolationIndicator>
              </span>
            </li>
          ))}
          </ul>
        </React.Fragment>
      )
    }
    return <Puff />
  }

  return (
    renderAllVersionsList(versionsContext)
  )
}

export default AllVersionsPage;
