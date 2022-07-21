/*
 * This file is part of ciboard
 *
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

import { getProperty, TestCase } from './testsuite';

describe('getProperty function', () => {
    test('returns `undefined` when there are no properties', () => {
        const testCase: TestCase = {
            _uuid: 'd50ce531-01f0-4e8f-b398-ee1bdb4be223',
            name: '/test/basic',
            time: '1658312226',
            logs: [],
            status: 'pass',
            phases: [],
            message: '',
            properties: [],
            'test-outputs': [],
        };
        expect(getProperty(testCase, 'ci.arch')).toBeUndefined();
    });

    test('returns `undefined` if no property matches', () => {
        const testCase: TestCase = {
            _uuid: 'd50ce531-01f0-4e8f-b398-ee1bdb4be223',
            name: '/test/basic',
            time: '1658312226',
            logs: [],
            status: 'pass',
            phases: [],
            message: '',
            properties: [
                {
                    property: [
                        { $: { name: 'ci.name', value: 'Fedora CI' } },
                        { $: { name: 'ci.epoch', value: '2022' } },
                    ],
                },
            ],
            'test-outputs': [],
        };
        expect(getProperty(testCase, 'ci.arch')).toBeUndefined();
    });

    test('returns property value if a property matches', () => {
        const testCase: TestCase = {
            _uuid: 'd50ce531-01f0-4e8f-b398-ee1bdb4be223',
            name: '/test/basic',
            time: '1658312226',
            logs: [],
            status: 'pass',
            phases: [],
            message: '',
            properties: [
                {
                    property: [
                        { $: { name: 'ci.name', value: 'Fedora CI' } },
                        { $: { name: 'ci.epoch', value: '2022' } },
                        { $: { name: 'ci.arch', value: 'aarch64' } },
                    ],
                },
            ],
            'test-outputs': [],
        };
        expect(getProperty(testCase, 'ci.arch')).toStrictEqual('aarch64');
    });

    test('returns first property value if multiple properties match', () => {
        const testCase: TestCase = {
            _uuid: 'd50ce531-01f0-4e8f-b398-ee1bdb4be223',
            name: '/test/basic',
            time: '1658312226',
            logs: [],
            status: 'pass',
            phases: [],
            message: '',
            properties: [
                {
                    property: [
                        { $: { name: 'ci.name', value: 'Fedora CI' } },
                        { $: { name: 'ci.epoch', value: '2022' } },
                        { $: { name: 'ci.arch', value: 'aarch64' } },
                    ],
                },
                {
                    property: [
                        { $: { name: 'ci.name', value: 'Second CI' } },
                        { $: { name: 'ci.arch', value: 's390x' } },
                    ],
                },
            ],
            'test-outputs': [],
        };
        expect(getProperty(testCase, 'ci.arch')).toStrictEqual('aarch64');
    });
});
