/*
 * This file is part of ciboard
 *
 * Copyright (c) 2023 Matěj Grabovský <mgrabovs@redhat.com>
 * Copyright (c) 2023 Andrei Stepanov <astepano@redhat.com>
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

import { GreenwaveWaiveType, AChild } from '../../types';
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
    url?: string;
    name?: string;
    team?: string;
    email?: string;
    docsUrl?: string;
    gchatRoomUrl?: string;
    reportIssueUrl?: string;
    slackChannelUrl?: string;
}

export interface CiTest {
    name: string;
    error?: MSG_V_1.MsgErrorType;
    status: TestStatus;
    waiver?: GreenwaveWaiveType;
    labels?: string[];
    logsUrl?: string;
    docsUrl?: string;
    contact?: CiContact;
    waivable?: boolean;
    required?: boolean;
    rerunUrl?: string;
    messageId?: string;
    description?: string;
    knownIssues?: MetadataKnownIssue[];
    dependencies?: MetadataDependency[];
    originalState: AChild;
    runDetailsUrl?: string;
    waiveMessage?: string;
}

// Builds are not tracked by Greenwaive
// https://pagure.io/fedora-ci/messages/blob/master/f/schemas/productmd-compose.build.error.yaml
// https://pagure.io/fedora-ci/messages/blob/master/f/schemas/product-build.build.complete.yaml
// https://pagure.io/fedora-ci/messages/blob/master/f/schemas/product-build.build.error.yaml

export interface CiBuild {
    name: string;
    error?: MSG_V_1.MsgErrorType;
    status: TestStatus;
    logsUrl?: string;
    docsUrl?: string;
    contact?: CiContact;
    rerunUrl?: string;
    messageId?: string;
    description?: string;
    knownIssues?: MetadataKnownIssue[];
    dependencies?: MetadataDependency[];
    originalState: AChild;
    runDetailsUrl?: string;
}
