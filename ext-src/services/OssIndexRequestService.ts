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
import fetch from 'node-fetch';
import { Headers } from 'node-fetch';
import { ILogger, LogLevel } from '../utils/Logger';

import { LiteRequestService } from "./LiteRequestService";
import { RequestHelpers } from "./RequestHelpers";

const MAX_COORDS: number = 128;

const URL = `https://ossindex.sonatype.org/api/v3/component-report`;

export class OssIndexRequestService implements LiteRequestService {

  constructor(
    readonly username: string, 
    private password: string,
    readonly logger: ILogger) {}

  public isPasswordSet():boolean {
    if(this.password == "") {
      return false;
    }
    return true;
  }

  public setPassword(password: string) {
    this.password = password;
  }

  public async getResultsFromPurls(purls: Array<String>): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let newPurls = this.chunkPurls(purls);
      let response = new Array();

      for (var purlList of newPurls) {
        let err, res = await this.callOssIndex(purlList);
        if (err != null) {
          this.logger.log(LogLevel.ERROR, 'Uh oh');
          reject(err);
        } else {
          response = response.concat(res);
        }
      }

      if (response.length > 0) {
        resolve(response);
        return;
      } else {
        reject("Something has gone wrong, check Debug Console/logs.");
        return;
      }
    })
  }

  private async callOssIndex(purls: String[]): Promise<any> {
    const headers = new Headers(RequestHelpers.getUserAgentHeader());
    headers.append('Content-Type', 'application/json');
    this.logger.log(LogLevel.TRACE, "Got User Agent");

    return new Promise((resolve, reject) => {
      fetch(URL,
        {
          method: 'POST',
          body: JSON.stringify(this.turnPurlsIntoOssIndexRequestObject(purls)),
          headers: headers
        }).then(async (res) => {
          if (res.ok) {
            resolve(await res.json());
          }
          reject(res.status);
        }).catch((ex) => {
          reject(ex);
        });
    });
  }

  private turnPurlsIntoOssIndexRequestObject(purls: String[]): any {
    return { 
      coordinates: purls
    };
  }

  /**
   * Responsible for chunking up am array of purls into a new Array with
   * members of @constant MAX_COORDS
   * @param purls 
   */
  private chunkPurls(purls: Array<String>): Array<Array<String>> {
    let chunkedArray = Array<Array<String>>();

    let i: number;

    let j: number;

    for(i = 0, j = purls.length; i < j; i = i + MAX_COORDS) {
      chunkedArray.push(purls.slice(i, i + MAX_COORDS));
    }

    return chunkedArray;
  }
}
