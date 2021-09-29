/*
 * This file is part of ciboard

 * Copyright (c) 2021 Andrei Stepanov <astepano@redhat.com>
 * 
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */

import * as uuid from 'uuid';
const parseString = require('xml2js-parser').parseStringSync;

const xml2js = (xml: any) => {
    const data = parseString(xml);

    let suites = [];
    if (data.testsuites && data.testsuites.testsuite) {
        if (Array.isArray(data.testsuites.testsuite))
            suites = data.testsuites.testsuite;
        else suites.push(data.testsuites.testsuite);
    }

    if (data.testsuite) {
        if (Array.isArray(data.testsuite)) suites = data.testsuite;
        else suites.push(data.testsuite);
    }

    if (data.testcase) {
        if (Array.isArray(data.testcase)) {
            suites = [
                {
                    testcase: data.testcase,
                },
            ];
        } else {
            suites.push({
                testcase: [data.testcase],
            });
        }
    }

    return suites;
};

const expandMeta = (thing: any) => {
    const meta = thing.$;
    if (meta) {
        Object.keys(meta).forEach((key) => {
            thing[key] = meta[key];
        });
        delete thing.$;
    }
};

const buildProperties = (suite: any) => {
    const properties: any = {};
    if (suite.properties) {
        suite.properties
            .filter((property: any) => typeof property !== 'string')
            .forEach((property: any) => {
                property.property.forEach((prop: any) => {
                    const meta = prop.$;
                    properties[meta.name] = meta.value;
                });
            });
    }
    properties._uuid = uuid.v4();
    return properties;
};

const extactMessage = (thing: any) => {
    if (typeof thing === 'string') return;
    thing.message = '';
    if (thing._) {
        thing.message = thing._;
        delete thing._;
    }
};

const extractTestCore = (test: any, type: any, status: any) => {
    if (test[type]) {
        test.status = status;

        const core = test[type][0];
        extactMessage(core);

        if (test.message === '') {
            if (core.message) {
                test.message = core.message;
            } else if (core.$) {
                test.message = '';
                if (core.$.message) test.message += core.$.message;
                if (core.$.type) test.message += core.$.type;
            } else if (typeof core === 'string') {
                test.message = core;
            }
        }

        if (test.message) test.message = escape(test.message);

        delete test[type];
    }
};

const buildTest = (test: any) => {
    test.status = 'pass';
    test.name = 'no name';

    expandMeta(test);

    extactMessage(test);

    extractTestCore(test, 'passed', 'pass');
    extractTestCore(test, 'passing', 'pass');
    extractTestCore(test, 'pass', 'pass');

    extractTestCore(test, 'failure', 'fail');
    extractTestCore(test, 'failed', 'fail');
    extractTestCore(test, 'failint', 'fail');
    extractTestCore(test, 'fail', 'fail');

    extractTestCore(test, 'errored', 'error');
    extractTestCore(test, 'erroring', 'error');
    extractTestCore(test, 'error', 'error');

    extractTestCore(test, 'skipped', 'skip');
    extractTestCore(test, 'skipping', 'skip');
    extractTestCore(test, 'skip', 'skip');

    test._uuid = uuid.v4();
    return test;
};

const buildTests = (suite: any) => {
    suite.tests = suite.testcase
        .filter((test: any) => {
            if (typeof test === 'string') return test.trim() !== '';
            return true;
        })
        .map((test: any) => {
            if (typeof test === 'string') return buildTest({ _: test });
            return buildTest(test);
        });
    delete suite.testcase;
};

const buildSuites = (suites: any) =>
    suites
        .filter((suite: any) => {
            if (typeof suite === 'string') return suite.trim() !== '';
            return true;
        })
        .map((suite: any) => {
            expandMeta(suite);
            suite.properties = buildProperties(suite);

            delete suite.tests;
            delete suite.failures;
            delete suite.errors;
            delete suite.skipped;

            suite.name = suite.name || 'No Name';

            if (suite.testcase) buildTests(suite);

            if (suite.testsuite) {
                if (Array.isArray(suite.testsuite))
                    suite.suites = buildSuites(suite.testsuite);
                else suite.suites = buildSuites([suite.testsuite]);
                delete suite.testsuite;
            }

            suite.status = suite.status || 'unknown';
            let fail = false;
            if (Array.isArray(suite.tests)) {
                const testsFailed =
                    suite.tests.filter((test: any) => test.status !== 'pass')
                        .length > 0;
                if (testsFailed) fail = true;
            }

            if (fail) suite.status = 'fail';

            suite.count = {
                tests: 0,
                pass: 0,
                fail: 0,
                error: 0,
                skip: 0,
                unknown: 0,
            };

            if (suite.tests) {
                suite.tests.forEach((test: any) => {
                    suite.count.tests += 1;
                    suite.count[test.status] += 1;
                });
            }

            suite.status = 'fail';
            if (suite.count.tests > 0 && suite.count.tests === suite.count.pass)
                suite.status = 'pass';
            if (
                suite.count.tests > 0 &&
                suite.count.tests === suite.count.error
            )
                suite.status = 'error';
            if (suite.count.tests > 0 && suite.count.tests === suite.count.skip)
                suite.status = 'skip';
            if (
                suite.count.tests > 0 &&
                suite.count.tests === suite.count.unknown
            )
                suite.status = 'unknown';
            if (suite.count.tests === 0) suite.status = 'pass';

            suite._uuid = uuid.v4();
            return suite;
        });

export const xunitParser = (xml: any) => {
    const suites = xml2js(xml);
    return buildSuites(suites);
};
