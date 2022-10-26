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
import util from 'util';
import zlib from 'zlib';
import wrap from '@adobe/helix-shared-wrap';
import { wrap as status } from '@adobe/helix-status';
import { Response } from '@adobe/fetch';
import { CoralogixLogger } from './coralogix.js';

const gunzip = util.promisify(zlib.gunzip);

/**
 * This is the main function
 * @param {Request} request the request object (see fetch api)
 * @param {UniversalContext} context the context of the universal serverless function
 * @returns {Response} a response
 */
async function run(request, context) {
  const {
    invocation: { event },
    env: {
      CORALOGIX_API_KEY: apiKey,
    },
    log,
  } = context;

  if (event?.awslogs?.data) {
    const payload = Buffer.from(event.awslogs.data, 'base64');
    const uncompressed = await gunzip(payload);
    const result = JSON.parse(uncompressed.toString());

    const logger = new CoralogixLogger(apiKey, result.logGroup);
    log.info('Event Data:', JSON.stringify(result, null, 2));
  }
  return new Response('', { status: 204 });
}

export const main = wrap(run)
  .with(status)
  .with((fn) => (req, context) => {
    context.log = console;
    return fn(req, context);
  });
