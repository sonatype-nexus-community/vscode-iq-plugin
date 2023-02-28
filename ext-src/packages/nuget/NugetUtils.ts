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

import * as path from 'path';
import * as fs from 'fs';
import { Application } from "../../models/Application";
import { NugetPackage } from "./NugetPackage";

export class NugetUtils {
    public async getDependencyArray(application: Application): Promise<any> {
        // Get all .sln files in the repository
        const solutionFiles = await this.findFiles(application.workspaceFolder, /\.sln$/);

        if(solutionFiles.length == 0){
            return Promise.reject(
                new Error(
                  "Error occurred in generating dependency tree. Please check that you have a solution files in your workspace."
                )
              );
        }

        // Create a Set to store unique packages by name and version
        const packageSet = new Set<string>();

        // Iterate over each .sln file
        for (const solutionFile of solutionFiles) {
            // Get the directory containing the .sln file
            const solutionDirectory = path.dirname(solutionFile);

            // Get all project.assets.json files in the directory
            const projectAssetFiles = await this.findFiles(solutionDirectory, /project\.assets\.json$/);

            // Create a list of PackageReference items for each project.assets.json file
            for (const projectAssetFile of projectAssetFiles) {
                const projectAssetsJson = fs.readFileSync(projectAssetFile, 'utf8');
                const packageReferences = this.parsePackageReferencesFromProjectAssetsJson(projectAssetsJson);

                // Iterate over each PackageReference item
                for (const packageReference of packageReferences) {
                    const packageId = `${packageReference.Name}/${packageReference.Version}`;
                    packageSet.add(packageId);
                }
            }
        }


        if(packageSet.size == 0){
            return Promise.reject(
                new Error(
                  "Error occurred in generating dependency tree. Before analyse, make sure that you build your solution."
                )
              );
        }

        // Convert the Set to an array of Package objects
        const uniquePackages: NugetPackage[] = [];
        for (const packageId of packageSet) {
            const [name, version] = packageId.split('/');
            uniquePackages.push(new NugetPackage(name, version));
        }

        return Promise.resolve(uniquePackages);
    }

    private parsePackageReferencesFromProjectAssetsJson(json: string): NugetPackage[] {
        const packageReferences: NugetPackage[] = [];
    
        const dependencies = JSON.parse(json).targets;
        for (const targetKey of Object.keys(dependencies)) {
            const target = dependencies[targetKey];
            for (const packageName of Object.keys(target)) {
                const [name, version] = packageName.split('/');
                packageReferences.push(new NugetPackage(name, version));
              }
        }
    
        return packageReferences;
    }

    private async findFiles(directory: string, pattern: RegExp): Promise<string[]> {
        const files = fs.readdirSync(directory);

        const matchedFiles = await Promise.all(
            files.map(async (file) => {
                const fullPath = path.join(directory, file);
                const stats = fs.statSync(fullPath);
                if (stats.isDirectory()) {
                    return this.findFiles(fullPath, pattern);
                } else if (stats.isFile() && pattern.test(file)) {
                    return [fullPath];
                } else {
                    return [];
                }
            })
        );

        return Array.prototype.concat(...matchedFiles);
    }
}