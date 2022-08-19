/*
 * Copyright (c) 2020-Present Erlend Oftedal, Steve Springett, Sonatype, Inc.
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
import { v4 as uuid } from 'uuid';
import * as builder from 'xmlbuilder';
import { PackageType } from '../packages/PackageType';

export class CycloneDXSbomCreator {

  readonly SBOMSCHEMA: string = 'http://cyclonedx.org/schema/bom/1.1';

  public async createBom(pkgInfo: Array<PackageType>): Promise<string> {
    const bom = builder.create('bom', { encoding: 'utf-8', separateArrayItems: true }).att('xmlns', this.SBOMSCHEMA);

    bom.att('serialNumber', 'urn:uuid:' + uuid());

    bom.att('version', 1);

    const componentsNode = bom.ele('components');
    let components: Array<any> = new Array();

    const pkgs = this.dedupeArray(pkgInfo);

    pkgs.forEach((pkg) => {
        components.push(
          {
            component: this.getComponent(pkg)
          });
    });

    if (components.length > 0) {
      componentsNode.ele(components);
    }

    const bomString = bom.end({
      width: 0,
      allowEmpty: false,
      spaceBeforeSlash: '',
    });

    return bomString;
  }

  private getComponent(pkg: PackageType): Component {
      const component: Component = {
        '@type': 'library',
        '@bom-ref': pkg.toPurl(),
        group: pkg.Group,
        name: pkg.Name,
        version: pkg.Version,
        purl: pkg.toPurl(),
      };
    return component;
  }

  private dedupeArray(pkgs: Array<PackageType>): Array<PackageType> {
    const uniqueArray = pkgs.filter((val, index) => {
      const value = JSON.stringify(val);
      return index === pkgs.findIndex((obj) => {
        return JSON.stringify(obj) === value;
      })
    })
    
    return uniqueArray;
  }
}

export interface Component {
    '@type': string;
    '@bom-ref': string;
    group?: string;
    name: string;
    version: string;
    purl: string;
}
