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
import { ComposerCoordinate } from "../packages/composer/ComposerCoordinate";
import { CargoCoordinate } from "../packages/cargo/CargoCoordinate";
import { GolangCoordinate } from "../packages/golang/GolangCoordinate";
import { MavenCoordinate } from "../packages/maven/MavenCoordinate";
import { NpmCoordinate } from "../packages/npm/NpmCoordinate";
import { PyPICoordinate } from "../packages/pypi/PyPICoordinate";
import { RubyGemsCoordinate } from "../packages/rubygems/RubyGemsCoordinate";

export class ComponentEntryConversions {
    static ConvertToComponentEntry(format: string, entry: any): string {
        switch(format) {
            case 'golang':
                return this.convertFromGolang(entry);
            case 'maven':
                return this.convertFromMaven(entry);
            case 'pypi':
                return this.convertFromPyPi(entry);
            case 'npm':
                return this.convertFromNpm(entry);
            case 'gem':
                return this.convertFromGem(entry);
            case 'composer':
                return this.convertFromComposer(entry);
            case 'cargo':
                return this.convertFromCargo(entry);
            default:
                console.debug('Unsupported format', format);
                return "";
        }
    }

    private static convertFromGolang(entry: any): string {
        let coordinates = new GolangCoordinate(entry.component.componentIdentifier.coordinates.name, 
            entry.component.componentIdentifier.coordinates.version);
      
        return coordinates.asCoordinates();
    }

    private static convertFromMaven(entry: any): string {
        let coordinates = new MavenCoordinate(entry.component.componentIdentifier.coordinates.artifactId, 
            entry.component.componentIdentifier.coordinates.groupId, 
            entry.component.componentIdentifier.coordinates.version, 
            entry.component.componentIdentifier.coordinates.extension);
      
        return coordinates.asCoordinates();
    }

    private static convertFromPyPi(entry: any): string {
        let coordinates = new PyPICoordinate(entry.component.componentIdentifier.coordinates.name,
            entry.component.componentIdentifier.coordinates.version,
            "", "");
          
        return coordinates.asCoordinates();
    }

    private static convertFromNpm(entry: any): string {
        let coordinates = new NpmCoordinate(entry.component.componentIdentifier.coordinates.packageId, 
            entry.component.componentIdentifier.coordinates.version);
          
        return coordinates.asCoordinates();
    }

    private static convertFromGem(entry: any): string {
        let coordinates = new RubyGemsCoordinate(entry.component.componentIdentifier.coordinates.name, 
            entry.component.componentIdentifier.coordinates.version);
          
        return coordinates.asCoordinates();
    }

    private static convertFromComposer(entry: any): string {
        let coordinates = new ComposerCoordinate(entry.component.componentIdentifier.coordinates.name, 
            entry.component.componentIdentifier.coordinates.namespace,
            entry.component.componentIdentifier.coordinates.version);
          
        return coordinates.asCoordinates();
    }

    private static convertFromCargo(entry: any): string {
        let coordinates = new CargoCoordinate(entry.component.componentIdentifier.coordinates.name,
            entry.component.componentIdentifier.coordinates.version);
          
        return coordinates.asCoordinates();
    }
}
