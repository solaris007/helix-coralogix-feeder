/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { hostname } from 'os';

export class CoralogixLogger {
  constructor(apiKey, logGroup, opts = {}) {
    const {
      host = hostname(),
      apiUrl = 'https://api.coralogix.com/api/v1/',
    } = opts;

    this._apiKey = apiKey;
    this._host = host;
    this._apiUrl = apiUrl;

    const [,,, longFuncName] = logGroup.split('/');
    [this._subsystem, this._funcName] = longFuncName.split('--');
  }

  // eslint-disable-next-line class-methods-use-this, no-unused-vars
  async sendEvents(events) {
    return Promise.resolve();
  }
}
