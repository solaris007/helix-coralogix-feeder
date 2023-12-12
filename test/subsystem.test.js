/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/* eslint-env mocha */

import assert from 'assert';
import { mapSubsystem } from '../src/subsystem.js';

describe('Log Feeder Tests', () => {
  describe('mapSubsystem Function', () => {
    it('correctly maps a known alias', () => {
      const context = {
        env: {
          CORALOGIX_ALIAS_MAPPING: JSON.stringify({ ci: 'my-service-dev' }),
        },
      };
      const result = mapSubsystem('ci', 'default-subsystem', context, console);
      assert.strictEqual(result, 'my-service-dev');
    });

    it('falls back to default subsystem for empty alias', () => {
      const result = mapSubsystem(null, 'default-subsystem', context, console);
      assert.strictEqual(result, 'default-subsystem');
    });

    it('falls back to default subsystem for unknown alias', () => {
      const context = {
        env: {
          CORALOGIX_ALIAS_MAPPING: JSON.stringify({ ci: 'my-service-dev' }),
        },
      };
      const result = mapSubsystem('unknown-alias', 'default-subsystem', context, console);
      assert.strictEqual(result, 'default-subsystem');
    });

    it('falls back to default subsystem if CORALOGIX_ALIAS_MAPPING is invalid JSON', () => {
      const context = {
        env: {
          CORALOGIX_ALIAS_MAPPING: 'invalid-json',
        },
      };
      const result = mapSubsystem('ci', 'default-subsystem', context, console);
      assert.strictEqual(result, 'default-subsystem');
    });

    it('falls back to default subsystem if CORALOGIX_ALIAS_MAPPING is not set', () => {
      const context = {
        env: {},
      };
      const result = mapSubsystem('ci', 'default-subsystem', context, console);
      assert.strictEqual(result, 'default-subsystem');
    });
  });
});
