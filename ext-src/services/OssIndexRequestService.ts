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
import * as request from "request";
import * as HttpStatus from "http-status-codes";

import { LiteRequestService } from "./LiteRequestService";
import { RequestHelpers } from "./RequestHelpers";
import { PackageType } from "../packages/PackageType";

const MAX_COORDS: number = 128;

const URL = `https://ossindex.sonatype.org/api/v3/component-report`;

export class OssIndexRequestService implements LiteRequestService {

  constructor(readonly username: string, private password: string){}

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

  private async callOssIndex(purls: String[]) {
    return new Promise((resolve, reject) => {
      request.post(
        {
          method: "POST",
          url: `${URL}`,
          json: this.turnPurlsIntoOssIndexRequestObject(purls),
          headers: RequestHelpers.getUserAgentHeader()
        },
        (err: any, response: any, body: any) => {
          if (err) {            
            reject(`Unable to retrieve Component Report: ${err}`);
            return;
          }
          if (response.statusCode != HttpStatus.OK) {
            reject(`Unable to retrieve Component Report. Could not communicate with server. Server error: ${response.statusCode}`);
            return;
          }
          resolve(body);
          return;
        }
      );
    });
  }

  private turnPurlsIntoOssIndexRequestObject(purls: String[]): any {
    let components = {
      coordinates: purls
    }
    return components;
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
