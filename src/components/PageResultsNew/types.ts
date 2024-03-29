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

import { GreenwaveWaiveType, StateType } from '../../artifact';
import { MSG_V_1, MetadataDependency, MetadataKnownIssue } from '../../types';

export type TestStatus =
    | 'error'
    | 'failed'
    | 'info'
    | 'missing'
    | 'passed'
    | 'queued'
    | 'running'
    | 'unknown';

export type TestCaseStatus = 'fail' | 'pass' | 'skip';

export interface CiContact {
    docsUrl?: string;
    email?: string;
    gchatRoomUrl?: string;
    name?: string;
    reportIssueUrl?: string;
    slackChannelUrl?: string;
    team?: string;
    url?: string;
}

export interface CiTest {
    contact?: CiContact;
    dependencies?: MetadataDependency[];
    description?: string;
    docsUrl?: string;
    error?: MSG_V_1.MsgErrorType;
    knownIssues?: MetadataKnownIssue[];
    labels?: string[];
    logsUrl?: string;
    messageId?: string;
    name: string;
    originalState: StateType;
    required?: boolean;
    rerunUrl?: string;
    runDetailsUrl?: string;
    status: TestStatus;
    waivable?: boolean;
    waiver?: GreenwaveWaiveType;
}
