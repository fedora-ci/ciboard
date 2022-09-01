/*
 * This file is part of ciboard
 *
 * Copyright (c) 2021 Andrei Stepanov <astepano@redhat.com>
 * Copyright (c) 2022 Matěj Grabovský <mgrabovs@redhat.com>
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

export type TestCaseStatus = 'error' | 'fail' | 'pass' | 'skip';

export interface TestCaseLogsEntry {
    $: { name: string; href: string };
}

export interface TestCaseLogs {
    log: TestCaseLogsEntry[];
}

export interface TestCasePhasesEntry {
    $: { name: string; result: string };
    logs: TestCaseLogs[];
}

export interface TestCasePhases {
    phase: TestCasePhasesEntry[];
}

export interface TestCasePropertiesEntry {
    $: { name: string; value: string };
}

export interface TestCaseProperties {
    property: TestCasePropertiesEntry[];
}

export interface TestCaseTestOutputsEntry {
    $: { message: string; remedy: string; result: string };
}

export interface TestCaseTestOutputs {
    'test-output': TestCaseTestOutputsEntry[];
}

/**
 * A test case represents the result of a single test run. It may comprise of
 * several phases. It may have a collection logs and key-value-style collection
 * of properties associated with it.
 */
export interface TestCase {
    _uuid: string;
    name: string;
    time: string;
    logs: TestCaseLogs[];
    status: TestCaseStatus;
    phases?: TestCasePhases[];
    message: string;
    properties?: TestCaseProperties[];
    'test-outputs'?: TestCaseTestOutputs[];
}

export type TestSuiteStatus = 'error' | 'fail' | 'pass' | 'skip' | 'tests';

export interface TestSuitePropertiesEntry {
    $: { name: string; value: string };
}

export interface TestSuiteProperties {
    property: TestSuitePropertiesEntry[];
}

/**
 * A test suite consists of multiple test cases.
 */
export interface TestSuite {
    _uuid: string;
    name: string;
    time?: string;
    tests: TestCase[];
    status: string;
    properties: TestSuiteProperties[];
    /** Number of test cases with each of the possible statuses. */
    count: Record<TestSuiteStatus, number>;
}

export const getProperty = (testCase: TestCase, propertyName: string) =>
    testCase.properties
        ?.flatMap((property) => property.property)
        .find((property) => property.$.name === propertyName)?.$.value;
