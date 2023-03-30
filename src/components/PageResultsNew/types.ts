/*
 * This file is part of ciboard
 *
 * Copyright (c) 2023 Matěj Grabovský <mgrabovs@redhat.com>
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

import { GreenwaveWaiveType } from '../../artifact';

export type TestStatus =
    | 'error'
    | 'failed'
    | 'info'
    | 'missing'
    | 'passed'
    | 'queued'
    | 'running'
    | 'unknown'
    | 'waived';

export type TestCaseStatus = 'fail' | 'pass' | 'skip';

export interface CiContact {
    docsUrl?: string;
    email?: string;
    gchatRoomUrl?: string;
    name?: string;
    reportIssueUrl?: string;
    slackRoomUrl?: string;
    team?: string;
    url?: string;
}

export interface CiTest {
    contact?: CiContact;
    docsUrl?: string;
    labels?: string[];
    name: string;
    required?: boolean;
    rerunUrl?: string;
    status: TestStatus;
    subtitle?: string;
    waivable?: boolean;
    waiver?: GreenwaveWaiveType;
}

export interface TestCase {
    arch?: string;
    logs?: string[];
    name: string;
    status: TestCaseStatus;
    time?: number;
}

export interface TestSuite {
    name: string;
    cases: TestCase[];
}
