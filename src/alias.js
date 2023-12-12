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
import aws4 from 'aws4';
import { Response } from '@adobe/fetch';
import { fetchContext } from './support/utils.js';

const ALIAS_CACHE = {};

async function fetchAliases(context, funcName, funcVersion) {
  const { env, log } = context;

  const awsConfig = {
    region: env.AWS_REGION,
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    sessionToken: env.AWS_SESSION_TOKEN,
  };

  if (!awsConfig.region || !awsConfig.accessKeyId || !awsConfig.secretAccessKey) {
    log.error('Missing AWS configuration (aws_region, aws_access_key_id or aws_secret_access_key)');
    throw new Error('Missing AWS configuration (aws_region, aws_access_key_id or aws_secret_access_key)');
  }

  try {
    const { fetch } = fetchContext;
    const opts = {
      host: `lambda.${awsConfig.region}.amazonaws.com`,
      service: 'lambda',
      region: awsConfig.region,
      method: 'GET',
      path: `/2015-03-31/functions/${funcName}/aliases?FunctionVersion=${funcVersion}`,
    };
    log.info(`Fetching aliases with ${JSON.stringify(opts)} and ${JSON.stringify(awsConfig)}`);
    const req = aws4.sign(opts, {
      accessKeyId: awsConfig.accessKeyId,
      secretAccessKey: awsConfig.secretAccessKey,
      sessionToken: awsConfig.sessionToken,
    });
    log.info(`Fetching aliases from https://${req.host}${req.path}`);
    const resp = await fetch(`https://${req.host}${req.path}`, {
      method: req.method,
      headers: req.headers,
    });
    log.info(`Fetched aliases with status ${resp.status}`);
    return resp;
  } catch (e) {
    log.error(`Error fetching alias: ${e.message}`, e);
    return new Response(e.message, {
      status: 500,
      headers: {
        'content-type': 'text/plain',
        'cache-control': 'no-store, private, must-revalidate',
      },
    });
    /* c8 ignore next 3 */
  } finally {
    await fetchContext.reset();
  }
}

export async function resolve(context, funcName, funcVersion) {
  const { log } = context;

  if (ALIAS_CACHE?.[funcName]?.[funcVersion]) {
    log.info(`Using cached alias ${ALIAS_CACHE[funcName][funcVersion]} for ${funcName} ${funcVersion}`);
    return ALIAS_CACHE[funcName][funcVersion];
  }

  log.info(`Resolving alias for ${funcName} ${funcVersion}`);
  const resp = await fetchAliases(context, funcName, funcVersion);
  log.info(`Fetched aliases with status ${resp.status} and ${resp.ok}`)
  if (!resp.ok) {
    log.warn(`Failed to retrieve aliases for ${funcName} ${resp.status}`);
    return null;
  }

  log.info(`Successfully retrieved aliases for ${funcName} ${funcVersion}`);

  const { Aliases: aliases } = await resp.json();
  log.info(`Found ${aliases.length} aliases for ${funcName} and version ${funcVersion}`)
  if (aliases.length === 0) {
    const msg = `Failed to find any aliases for ${funcName} and version ${funcVersion}`;
    log.warn(msg);
    return null;
  }
  const [{ Name: alias }] = aliases
    .sort(({ Name: name1 }, { Name: name2 }) => name1.length - name2.length);

  log.info(`Found alias ${alias} for ${funcName} ${funcVersion}`);

  ALIAS_CACHE[funcName] = ALIAS_CACHE[funcName] || {};
  ALIAS_CACHE[funcName][funcVersion] = alias;

  log.info(`Caching alias ${alias} for ${funcName} ${funcVersion}`);
  return alias;
}
