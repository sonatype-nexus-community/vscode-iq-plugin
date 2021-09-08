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
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { Application } from '../../models/Application';
import { ConanPackage } from './ConanPackage';

export class ConanUtils {
    constructor(readonly lockFilesToExclude: string[]) { }

    public async getDependencyArray(application: Application): Promise<Array<ConanPackage>> {
        try {
            const dirCont = readdirSync(application.workspaceFolder);

            const files = dirCont.filter((file) => {
                return !this.lockFilesToExclude.includes(file) && file.endsWith(".lock");
            });

            let res: Array<ConanPackage> = [];
            files.forEach((f) => {
                const conanLockFile = readFileSync(join(application.workspaceFolder, f));
                const lockFileJson: ConanLockFile = JSON.parse(conanLockFile.toString());

                if (lockFileJson && lockFileJson.graph_lock && lockFileJson.graph_lock.nodes) {
                    for (const [key, value] of Object.entries(lockFileJson.graph_lock.nodes)) {
                        let val = value as any;

                        const nameVerArr = val.ref.split("@");
                        const nameVer = nameVerArr[0].split("/");
                        res.push(new ConanPackage(nameVer[0], nameVer[1]));
                    }
                }
            });

            return Promise.resolve(res);
        } catch (ex) {
            return Promise.reject(`Uh oh, spaghetti-o, an exception occurred while parsing Conan dependencies: ${ex}`);
        }
    }
}

interface ConanLockFile {
    graph_lock: GraphLock,
    version: string
}

interface GraphLock {
    nodes: any,
    revisions_enabled: boolean
}
