/*
 * This file is part of ciboard
 *
 * Copyright (c) 2021-2022 Andrei Stepanov <astepano@redhat.com>
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

import { StateGreenwaveType, StateKaiType } from '../artifact';
import {
    ScmUrlComponents,
    isResultWaivable,
    parseScmUrl,
    getRerunUrl,
} from './artifact_utils';

describe('getRerunUrl', () => {
    test('get rerun URL from pure Greenwave state', () => {
        const rerunUrl = 'https://example.com/jenkins/job/12345/rerun';
        const greenwaveState: StateGreenwaveType = {
            testcase: 'fedora-ci.koji-build.tier0.functional',
            requirement: {
                type: 'test-result-passed',
                testcase: 'fedora-ci.koji-build.tier0.functional',
                subject_type: 'koji-build',
                subject_identifier: 'gnome-abrt-1.4.2-1.fc36',
                result_id: 8427475,
                error_reason: '',
                item: {
                    type: 'koji-build',
                    identifier: 'gnome-abrt-1.4.2-1.fc36',
                },
            },
            result: {
                data: {
                    brew_task_id: ['919191'],
                    item: ['gnome-abrt-1.4.2-1.fc36'],
                    msg_id: ['ID:testing-jenkins:5434331:1:1:0:1'],
                    scratch: ['false'],
                    type: ['brew-build'],
                    rebuild: [rerunUrl],
                },
                groups: [],
                href: 'https://resultsdb.example.com/result/8427475',
                id: 8427475,
                note: '',
                outcome: 'PASSED',
                ref_url: 'https://example.com/jenkins/job/12345/',
                submit_time: '2023-03-02T12:12:00.341877',
                testcase: {
                    href: 'https://resultsdb.example.com/testcase/fedora-ci.koji-build.tier0.functional',
                    name: 'fedora-ci.koji-build.tier0.functional',
                    ref_url: 'https://docs.example.com/tier0-test',
                },
            },
        };
        expect(getRerunUrl(greenwaveState)).toStrictEqual(rerunUrl);
    });

    test('return undefined if rerun URL not in pure Greenwave state', () => {
        const greenwaveState: StateGreenwaveType = {
            testcase: 'fedora-ci.koji-build.tier0.functional',
            requirement: {
                type: 'test-result-passed',
                testcase: 'fedora-ci.koji-build.tier0.functional',
                subject_type: 'koji-build',
                subject_identifier: 'gnome-abrt-1.4.2-1.fc36',
                result_id: 8427475,
                error_reason: '',
                item: {
                    type: 'koji-build',
                    identifier: 'gnome-abrt-1.4.2-1.fc36',
                },
            },
        };
        expect(getRerunUrl(greenwaveState)).toBeUndefined();
    });
});

describe('isResultWaiable', () => {
    test('passed result is not waivable', () => {
        const greenwaveState: StateGreenwaveType = {
            testcase: 'fedora-ci.koji-build.tier0.functional',
            requirement: {
                type: 'test-result-passed',
                testcase: 'fedora-ci.koji-build.tier0.functional',
                subject_type: 'koji-build',
                subject_identifier: 'gnome-abrt-1.4.2-1.fc36',
                result_id: 8427475,
                error_reason: '',
                item: {
                    type: 'koji-build',
                    identifier: 'gnome-abrt-1.4.2-1.fc36',
                },
            },
        };
        expect(isResultWaivable(greenwaveState)).toStrictEqual(false);
    });

    test('excluded result is not waivable', () => {
        const greenwaveState: StateGreenwaveType = {
            testcase: 'fedora-ci.koji-build.tier1.functional',
            requirement: {
                type: 'excluded',
                testcase: 'fedora-ci.koji-build.tier1.functional',
                subject_type: 'koji-build',
                subject_identifier: 'gnome-abrt-1.4.2-1.fc36',
                result_id: 8427480,
                error_reason: '',
                item: {
                    type: 'koji-build',
                    identifier: 'gnome-abrt-1.4.2-1.fc36',
                },
            },
        };
        expect(isResultWaivable(greenwaveState)).toStrictEqual(false);
    });

    test('failed result is waivable', () => {
        const greenwaveState: StateGreenwaveType = {
            testcase: 'fedora-ci.koji-build.rpminspect.static-analysis',
            requirement: {
                type: 'test-result-failed',
                testcase: 'fedora-ci.koji-build.rpminspect.static-analysis',
                subject_type: 'koji-build',
                subject_identifier: 'gnome-abrt-1.4.2-1.fc36',
                result_id: 8427482,
                error_reason: '',
                item: {
                    type: 'koji-build',
                    identifier: 'gnome-abrt-1.4.2-1.fc36',
                },
            },
        };
        expect(isResultWaivable(greenwaveState)).toStrictEqual(true);
    });

    test('waived failed result is waivable', () => {
        const greenwaveState: StateGreenwaveType = {
            testcase: 'fedora-ci.koji-build.rpminspect.static-analysis',
            requirement: {
                type: 'test-result-failed-waived',
                testcase: 'fedora-ci.koji-build.rpminspect.static-analysis',
                subject_type: 'koji-build',
                subject_identifier: 'gnome-abrt-1.4.2-1.fc36',
                result_id: 8427482,
                error_reason: '',
                item: {
                    type: 'koji-build',
                    identifier: 'gnome-abrt-1.4.2-1.fc36',
                },
            },
        };
        expect(isResultWaivable(greenwaveState)).toStrictEqual(true);
    });

    test('pure UMB result is not waivable', () => {
        const kaiState: StateKaiType = {
            broker_msg_body: {
                run: { log: 'empty', url: 'https://example.com/test-run' },
                test: {
                    category: 'static-analysis',
                    namespace: 'fedora-ci.koji-build',
                    result: 'passed',
                    type: 'rpminspect',
                },
                system: [],
                version: '1.2.0',
                contact: {
                    docs: 'https://testing.example.com/docs',
                    email: 'testing@example.com',
                    name: 'Testing Team CI',
                    team: 'Testing Team',
                },
                artifact: {
                    component: 'gnome-abrt',
                    id: 50915701,
                    issuer: 'auto-build',
                    nvr: 'gnome-abrt-1.4.2-1.fc36',
                    scratch: false,
                    type: 'brew-build',
                },
                pipeline: {
                    id: 'testing-pipeline/job/xy/1112',
                    name: 'rpminspect pipeline',
                },
                generated_at: '2023-03-01 11:57 +01:00',
            },
            kai_state: {
                msg_id: 'ID:testing-jenkings:919191:1:0:1',
                origin: {
                    creator: 'unknown',
                    reason: 'unknown',
                },
                stage: 'test',
                state: 'complete',
                test_case_name:
                    'fedora-ci.koji-build.rpminspect.static-analysis',
                thread_id: 'xy/1112',
                version: '1.2.0',
                timestamp: 1677759990,
            },
        };
        expect(isResultWaivable(kaiState)).toStrictEqual(false);
    });
});

describe('parseScmrl', () => {
    test('parse Git URL from Brew', () => {
        const scmUrl =
            'git://pkgs.devel.redhat.com/rpms/bash.git#4053763aa726f25eea4c9b3cfc5f4cbab69d86f';
        const expected: ScmUrlComponents = {
            commit: '4053763aa726f25eea4c9b3cfc5f4cbab69d86f',
            name: 'bash',
            namespace: 'rpms',
        };
        expect(parseScmUrl(scmUrl)).toEqual(expected);
    });

    test('parse Git URL from MBS', () => {
        const scmUrl =
            'git://pkgs.devel.redhat.com/modules/postgresql?#5e4b83c1a1aee5aebf585f140b538b1c07db84';
        const expected: ScmUrlComponents = {
            commit: '5e4b83c1a1aee5aebf585f140b538b1c07db84',
            name: 'postgresql',
            namespace: 'modules',
        };
        expect(parseScmUrl(scmUrl)).toEqual(expected);
    });

    test('fail to parse Git URL with no commit', () => {
        const scmUrl = 'git://pkgs.devel.redhat.com/rpms/bash.git';
        expect(parseScmUrl(scmUrl)).toBeUndefined();
    });

    test('fail to parse non-Git URL', () => {
        const scmUrl =
            'https://git.example.com/unexpected.git#4053763aa726f25e';
        expect(parseScmUrl(scmUrl)).toBeUndefined();
    });
});
