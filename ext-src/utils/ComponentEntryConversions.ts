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
import { GolangCoordinate } from "../packages/golang/GolangCoordinate";
import { MavenCoordinate } from "../packages/maven/MavenCoordinate";
import { NpmCoordinate } from "../packages/npm/NpmCoordinate";
import { PyPICoordinate } from "../packages/pypi/PyPICoordinate";
import { RubyGemsCoordinate } from "../packages/rubygems/RubyGemsCoordinate";
import { ComponentCoordinate } from '../types/ComponentCoordinate';

export class ComponentEntryConversions {
    static ConvertToComponentEntry(format: string, entry: ComponentCoordinate): string {
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
            default:
                console.debug('Unsupported format', format);
                return "";
        }
    }

    private static convertFromGolang(entry: ComponentCoordinate): string {
        let coordinates = new GolangCoordinate(entry.name!, 
            ComponentEntryConversions.convertGolangVersion(entry.version));
      
        return coordinates.asCoordinates();
    }

    private static convertFromMaven(entry: ComponentCoordinate): string {
        let coordinates = new MavenCoordinate(entry.artifactId!, 
            entry.groupId!, 
            entry.version, 
            entry.extension!);
      
        return coordinates.asCoordinates();
    }

    private static convertFromPyPi(entry: ComponentCoordinate): string {
        let coordinates = new PyPICoordinate(entry.name!,
            entry.version,
            "tar.gz", "");
          
        return coordinates.asCoordinates();
    }

    private static convertFromNpm(entry: ComponentCoordinate): string {
        let coordinates = new NpmCoordinate(entry.packageId!, 
            entry.version);
          
        return coordinates.asCoordinates();
    }

    private static convertFromGem(entry: ComponentCoordinate): string {
        let coordinates = new RubyGemsCoordinate(entry.name!, 
            entry.version);
          
        return coordinates.asCoordinates();
    }

    private static convertFromComposer(entry: ComponentCoordinate): string {
        let coordinates = new ComposerCoordinate(entry.name!, 
            entry.namespace!,
            entry.version);
          
        return coordinates.asCoordinates();
    }

    public static convertGolangVersion(version: string) {
        if (version.includes("incompatible")) {
            let pos = version.lastIndexOf("incompatible");
            let vers = version.substring(0, pos).trimEnd() + "+" + version.substring(pos);
    
            return vers;
        }
        return version;
    }
}
