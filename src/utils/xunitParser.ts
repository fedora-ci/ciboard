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
import { X2jOptions, XMLParser } from 'fast-xml-parser';
import _ from 'lodash';

// IDEAL TYPES
type DetailedTestResults = TestSuiteResult[];

interface TestSuiteResult {
    cases: TestCaseResult[];
    /*
     * Are there logs at the testsuite level? Yes, but only as an attribute of
     * <testuite>.
     */
    log?: TestResultLog;
    message?: string;
    properties: TestProperties;
}

interface TestCaseResult {
    logs?: TestResultLog[];
    name: string;
    phases: TestCasePhase[];
    result?: TestCaseOutcome;
    time?: number;
}

interface TestCasePhase {
    logs: TestResultLog[]; // > logs > log
    name: string;
    result?: TestPhaseOutcome;
    time?: number;
}

interface TestResultLog {
    label: string; // $name
    link: string; // $href
}

type TestCaseOutcome = 'error' | 'fail' | 'pass' | 'skip';
type TestPhaseOutcome = Exclude<TestCaseOutcome, 'error'>;
type TestProperties = Partial<Record<string, string>>;
// END IDEAL TYPES

const XML_PARSER_OPTIONS: Partial<X2jOptions> = {
    alwaysCreateTextNode: true,
    attributeNamePrefix: '$',
    ignoreAttributes: false,
};

const parseSuitesXml = (xml: string) => {
    const parser = new XMLParser(XML_PARSER_OPTIONS);
    const data = parser.parse(xml);

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
    const properties = suite?.properties?.property;
    const propsMap: any = {};

    if (properties) {
        if (_.isArray(properties)) {
            properties.forEach((prop: any) => {
                /*
                 * NOTE: This overwrites previous values with subsequent ones.
                 * For example, given the xunit
                 *      ...
                 *      <property name="osci.result" value="failed" />
                 *      <property name="osci.result" value="passed" />
                 *      ...
                 * the `osci.result` property will have the value 'passed'.
                 */
                propsMap[prop.$name] = prop.$value;
            });
        } else if (
            _.isObject(properties) &&
            '$name' in properties &&
            '$value' in properties
        ) {
            const prop = properties;
            propsMap[prop.$name as string] = prop.$value;
        } else {
            console.warn('Invalid <properties> in xunit');
        }
    }

    propsMap._uuid = uuid.v4();
    return propsMap;
};

const extractMessage = (thing: any) => {
    if (!thing || _.isString(thing)) return;
    thing.message = '';
    if (thing['#text']) {
        thing.message = thing['#text'];
        delete thing['#text'];
    }
};

const extractTestCore = (test: any, type: string, status: string) => {
    if (!test[type]) return;

    test.status = status;

    const core = test[type];
    extractMessage(core);

    if (test.message === '') {
        if (_.isString(core)) {
            test.message = core;
        } else if (core.message) {
            test.message = core.message;
        } else if (core.$message || core.$type) {
            test.message = '';
            if (core.$message) test.message += core.$message;
            if (core.$type) test.message += core.$type;
        }
    }

    if (test.message) test.message = escape(test.message);

    delete test[type];
};

const buildTest = (test: any) => {
    test.status = test.$status || 'pass';
    test.name = test.$name || 'no name';

    // expandMeta(test);

    extractMessage(test);

    test.properties = buildProperties(test);

    extractTestCore(test, 'passed', 'pass');
    extractTestCore(test, 'passing', 'pass');
    extractTestCore(test, 'pass', 'pass');

    extractTestCore(test, 'failure', 'fail');
    extractTestCore(test, 'failed', 'fail');
    extractTestCore(test, 'failing', 'fail');
    extractTestCore(test, 'fail', 'fail');

    extractTestCore(test, 'errored', 'error');
    extractTestCore(test, 'erroring', 'error');
    extractTestCore(test, 'error', 'error');

    extractTestCore(test, 'skipped', 'skip');
    extractTestCore(test, 'skipping', 'skip');
    extractTestCore(test, 'skip', 'skip');

    /*
     * Treat `needs_inspection` result as an error to make it more visible in the UI.
     * See https://issues.redhat.com/browse/OSCI-4096
     */
    if (test.result === 'needs_inspection') test.status = 'error';

    test._uuid = uuid.v4();
    return test;
};

const buildTests = (suite: any) => {
    let testcases = suite.testcase;
    if (!_.isArray(testcases)) testcases = [testcases];
    suite.tests = testcases
        .filter((test: any) => {
            if (_.isString(test)) return test.trim() !== '';
            return true;
        })
        .map((test: any) => {
            if (_.isString(test)) return buildTest({ '#text': test });
            return buildTest(test);
        });
    delete suite.testcase;
};

const buildSuites = (suites: any[]) =>
    suites
        .filter((suite: any) => {
            if (_.isString(suite)) return suite.trim() !== '';
            return true;
        })
        .map((suite: any) => {
            // expandMeta(suite);
            suite.properties = buildProperties(suite);

            delete suite.tests;
            delete suite.failures;
            delete suite.errors;
            delete suite.skipped;

            suite.name = suite.name || 'Unnamed suite';

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

export const xunitParser = (xml: string) => {
    const suites = parseSuitesXml(xml);
    return buildSuites(suites);
};
