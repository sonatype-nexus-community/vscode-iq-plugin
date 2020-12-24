import { GolangCoordinate } from "../packages/golang/GolangCoordinate";
import { MavenCoordinate } from "../packages/maven/MavenCoordinate";
import { NpmCoordinate } from "../packages/npm/NpmCoordinate";
import { PyPICoordinate } from "../packages/pypi/PyPICoordinate";

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
}