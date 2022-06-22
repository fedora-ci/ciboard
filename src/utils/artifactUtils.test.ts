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

import { StateGreenwaveType } from '../artifact';
import { isResultWaivable } from './artifactUtils';

test('passed result is not waivable', () => {
    const grenwaveState: StateGreenwaveType = {
        testcase: 'fedora-ci.koji-build.tier0.functional',
        requirement: {
            type: 'test-result-passed',
            testcase: 'fedora-ci.koji-build.tier0.functional',
            subject_type: 'koji-build',
            subject_identifier: 'gnome-abrt-1.4.2-1.fc36',
            result_id: 8427475,
            error_reason: '',
            item: { type: 'koji-build', identifier: 'gnome-abrt-1.4.2-1.fc36' },
        },
    };
    expect(isResultWaivable(grenwaveState)).toStrictEqual(false);
});

test('excluded result is not waivable', () => {
    const grenwaveState: StateGreenwaveType = {
        testcase: 'fedora-ci.koji-build.tier1.functional',
        requirement: {
            type: 'excluded',
            testcase: 'fedora-ci.koji-build.tier1.functional',
            subject_type: 'koji-build',
            subject_identifier: 'gnome-abrt-1.4.2-1.fc36',
            result_id: 8427480,
            error_reason: '',
            item: { type: 'koji-build', identifier: 'gnome-abrt-1.4.2-1.fc36' },
        },
    };
    expect(isResultWaivable(grenwaveState)).toStrictEqual(false);
});

test('failed result is waivable', () => {
    const grenwaveState: StateGreenwaveType = {
        testcase: 'fedora-ci.koji-build.rpminspect.static-analysis',
        requirement: {
            type: 'test-result-failed',
            testcase: 'fedora-ci.koji-build.rpminspect.static-analysis',
            subject_type: 'koji-build',
            subject_identifier: 'gnome-abrt-1.4.2-1.fc36',
            result_id: 8427482,
            error_reason: '',
            item: { type: 'koji-build', identifier: 'gnome-abrt-1.4.2-1.fc36' },
        },
    };
    expect(isResultWaivable(grenwaveState)).toStrictEqual(true);
});

test('waived failed result is waivable', () => {
    const grenwaveState: StateGreenwaveType = {
        testcase: 'fedora-ci.koji-build.rpminspect.static-analysis',
        requirement: {
            type: 'test-result-failed-waived',
            testcase: 'fedora-ci.koji-build.rpminspect.static-analysis',
            subject_type: 'koji-build',
            subject_identifier: 'gnome-abrt-1.4.2-1.fc36',
            result_id: 8427482,
            error_reason: '',
            item: { type: 'koji-build', identifier: 'gnome-abrt-1.4.2-1.fc36' },
        },
    };
    expect(isResultWaivable(grenwaveState)).toStrictEqual(true);
});
