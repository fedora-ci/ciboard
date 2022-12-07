/*
 * This file is part of ciboard
 *
 * Copyright (c) 2021, 2022 Andrei Stepanov <astepano@redhat.com>
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

import _ from 'lodash';
import { TabsProps } from '@patternfly/react-core';

/**
 * Valid for: Version: 1.y.z
 * https://pagure.io/fedora-ci/messages/blob/master/f/schemas/brew-build.test.complete.yaml
 *
 */
export namespace MSG_V_1 {
    export type MessagesType = MessagesRPMBuildType;
    export type RPMBuildsType = 'koji-build' | 'brew-build';

    export type TestCategoryType =
        | 'system'
        | 'functional'
        | 'validation'
        | 'integration'
        | 'performance'
        | 'static-analysis'
        | 'interoperability';

    export type TestResultType =
        | 'info'
        | 'passed'
        | 'failed'
        | 'not_applicable'
        | 'needs_inspection';

    export type MsgRunType = {
        url: string;
        log: string;
        debug?: string;
        rebuild?: string;
        log_raw?: string;
        log_stream?: string;
        trigger_rebuild?: string;
    };

    export type MsgSystemType = {
        os: string;
        label?: string;
        variant?: string;
        provider: string;
        architecture: string;
    };

    export type MsgCommonType = {
        note: string;
        version: string;
        generated_at: string;
    };

    export type MsgContactType = {
        url?: string;
        irc?: string;
        name: string;
        team: string;
        docs: string;
        email: string;
        slack?: string;
        version?: string;
    };

    export type MsgRPMBuildType = {
        id: number;
        nvr: string;
        type: RPMBuildsType;
        issuer: string;
        source?: string;
        scratch: boolean;
        baseline?: string;
        component: string;
        dependencies?: string[];
    };

    export type MsgStageType = {
        name: string;
    };

    export type MsgPipelineType = {
        id: string;
        name: string;
        build?: string;
        stage?: MsgStageType;
    };

    export type MsgTestCommonType = {
        type: string;
        note?: string;
        docs?: string;
        xunit?: string;
        label?: string[];
        category: TestCategoryType;
        lifetime?: number;
        progress?: number;
        scenario?: string;
        namespace: string;
        xunit_urls?: string[];
    };

    export type MsgTestCompleteType = {
        result: TestResultType;
        output?: string;
        runtime?: number;
        output_urls?: string[];
    };

    export type MsgNotificationType = {
        recipients?: string[];
    };

    export type MsgRPMBuildTestComplete = {
        run: MsgRunType;
        test: MsgTestCommonType & MsgTestCompleteType;
        system: MsgSystemType[];
        version: MsgCommonType['version'];
        contact: MsgContactType;
        artifact: MsgRPMBuildType;
        pipeline: MsgPipelineType;
        generated_at: MsgCommonType['generated_at'];
        notification?: MsgNotificationType;
    };

    export type MsgErrorType = {
        reason: string;
        issue_url?: string;
    };

    export type MsgRPMBuildTestError = {
        run: MsgRunType;
        test: MsgTestCommonType;
        error: MsgErrorType;
        version: MsgCommonType['version'];
        contact: MsgContactType;
        artifact: MsgRPMBuildType;
        pipeline: MsgPipelineType;
        generated_at: MsgCommonType['generated_at'];
        notification?: MsgNotificationType;
    };

    export type MsgRPMBuildTestQueued = {
        run: MsgRunType;
        test: MsgTestCommonType;
        contact: MsgContactType;
        version: MsgCommonType['version'];
        artifact: MsgRPMBuildType;
        pipeline: MsgPipelineType;
        generated_at: MsgCommonType['generated_at'];
    };

    export type MsgRPMBuildTestRunning = {
        run: MsgRunType;
        test: MsgTestCommonType;
        contact: MsgContactType;
        version: MsgCommonType['version'];
        artifact: MsgRPMBuildType;
        pipeline: MsgPipelineType;
        generated_at: MsgCommonType['generated_at'];
    };

    export type MessagesRPMBuildType =
        | MsgRPMBuildTestComplete
        | MsgRPMBuildTestError
        | MsgRPMBuildTestQueued
        | MsgRPMBuildTestRunning;

    export function isMsg(msg: BrokerMessagesType): msg is MessagesType {
        return msg.version.startsWith('0.2.') || msg.version.startsWith('1.');
    }
}

/**
 * Valid for: Version: 0.1.z
 * https://pagure.io/fedora-ci/messages/blob/e3f4758ff5a0948cceb09d0b214690351e453e7c/f/schemas/brew-build.test.complete.yaml
 */
export namespace MSG_V_0_1 {
    export type MessagesType = MessagesRPMBuildType;

    export type RPMBuildsType = 'koji-build' | 'brew-build';
    export type ArtifactNameType =
        | 'brew-build'
        | 'koji-build'
        | 'copr-build'
        | 'redhat-module'
        | 'productmd-compose';

    export type TestResultType =
        | 'info'
        | 'passed'
        | 'failed'
        | 'not_applicable'
        | 'needs_inspection';

    export type TestCategoryType =
        | 'system'
        | 'functional'
        | 'validation'
        | 'integration'
        | 'performance'
        | 'static-analysis'
        | 'interoperability';

    export type MessagesRPMBuildType =
        | MsgRPMBuildTestComplete
        | MsgRPMBuildTestError
        | MsgRPMBuildTestQueued
        | MsgRPMBuildTestRunning;

    export type MsgRPMBuildTestComplete = {
        ci: MsgContactType;
        run: MsgRunType;
        artifact: MsgRPMBuildType;
        system: MsgSystemType[];
        docs: string;
        category: TestCategoryType;
        type: string;
        label: string;
        status: TestResultType;
        web_url: string;
        xunit: string;
        recipients: string[];
        thread_id: string;
        namespace: string;
        note: string;
        generated_at: number;
        version: string;
    };

    export type MsgRPMBuildTestError = {
        ci: MsgContactType;
        run: MsgRunType;
        artifact: MsgRPMBuildType;
        docs: string;
        category: TestCategoryType;
        type: string;
        label: string;
        reason: string;
        issue_url: string;
        recipients: string[];
        thread_id: string;
        namespace: string;
        note: string;
        generated_at: number;
        version: string;
    };

    export type MsgRPMBuildTestQueued = {
        ci: MsgContactType;
        run: MsgRunType;
        artifact: MsgRPMBuildType;
        category: TestCategoryType;
        type: string;
        label: string;
        thread_id: string;
        namespace: string;
        note: string;
        generated_at: number;
        version: string;
    };

    export type MsgRPMBuildTestRunning = {
        ci: MsgContactType;
        run: MsgRunType;
        artifact: MsgRPMBuildType;
        category: TestCategoryType;
        type: string;
        label: string;
        lifetime: number;
        thread_id: string;
        namespace: string;
        note: string;
        progress: number;
        generated_at: number;
        version: string;
    };

    export type MsgContactType = {
        name: string;
        team: string;
        docs: string;
        email: string;
        url?: string;
        irc?: string;
        environment?: 'production' | 'stage';
        version?: string;
    };

    export type MsgRunType = {
        url: string;
        log: string;
        log_raw?: string;
        log_stream?: string;
        rebuild?: string;
        debug?: string;
        additional_urls?: {};
    };

    export type MsgRPMBuildType = {
        type: RPMBuildsType;
        id: number;
        component: string;
        issuer: string;
        scratch: boolean;
        nvr: string;
        baseline?: string;
        dependencies?: string[];
        source?: string;
    };

    export type MsgSystemType = {
        os: string;
        provider: string;
        architecture: string;
        variant?: string;
        label?: string;
    };

    export function isMsg(msg: BrokerMessagesType): msg is MessagesType {
        return msg.version.startsWith('0.1.');
    }

    export function resultHasDocs(
        msg: BrokerMessagesType,
    ): msg is MsgRPMBuildTestComplete | MsgRPMBuildTestError {
        return _.has(msg, 'docs');
    }
}

export type BrokerMessagesType = MSG_V_0_1.MessagesType | MSG_V_1.MessagesType;

export type TabClickHandlerType = Extract<TabsProps['onSelect'], Function>;

export interface SSTItem {
    display_name: string;
    name: string;
    releases: string[];
}

/**
export interface SSTResult {
    tag: string;
    nvr: string;
    time: string;
    status: string;
    sortKey: string;
    assignee: string;
    artifact: {
        aid: string;
        aid_link: string;
    };
    testcase: {
        category: string;
        namespace: string;
        type: string;
    };
    log_urls?: string[];
    gating_bug?: {
        text: string;
        url: string;
    };
    rebuild_url?: string;
    metadata_url: string;
    gating_yaml_url?: string;
}
*/

/**
 * Raw reply from SST backend
 *  {
 *     "nvr": "ftp",
 *     "nvr_link": "https://gitlab.com/redhat/centos-stream/rpms/ftp.git",
 *     "assignee": "email@domain.com",
 *     "aid": "0ef459c4-48d4-43cd-8210-e281eedf8899",
 *     "aid_link": "https://artifacts.dev.testing-farm.io/0ef459c4-48d4-43cd-8210-e281eedf8899",
 *     "namespace": "5",
 *     "type": "",
 *     "el8_gating_bug": "File bug",
 *     "el8_gating_bug_link": "http://sst.osci.redhat.com/www/file-bug-centos.html",
 *     "test_git": "git",
 *     "test_git_link": "https://src.fedoraproject.org/tests/ftp.git",
 *     "rebuild_link": "https://sst.osci.redhat.com/www/rebuild-centos.html",
 *     "yaml": "gating.yaml",
 *     "yaml_link": "https://gitlab.com/redhat/centos-stream/rpms/ftp.git",
 *     "log_link": "https://artifacts.dev.testing-farm.io/0ef459c4-48d4-43cd-8210-e281eedf8899/work-testg7QfRB",
 *     "category": "",
 *     "time": "2022-04-26 11:00:56",
 *     "state": "complete",
 *     "status": "failed",
 *     "buildstate": "complete",
 *     "buildstate_link": "https://api.dev.testing-farm.io/v0.1/requests/0ef459c4-48d4-43cd-8210-e281eedf8899",
 *     "tag": "None",
 *     "tests_number": "2"
 *   }
 */
export interface SSTResult {
    nvr: string;
    nvr_link: string;
    assignee: string;
    aid: string;
    aid_link: string;
    namespace: string;
    type: string;
    el8_gating_bug: string;
    el8_gating_bug_link: string;
    test_git: string;
    test_git_link: string;
    rebuild_link: string;
    yaml: string;
    yaml_link: string;
    log_link: string | string[];
    category: string;
    time: string;
    state: string;
    status: string;
    buildstate: string;
    buildstate_link: string;
    tag: string;
    tests_number: string;
}

export interface MetadataQueryResult {
    metadata_consolidated: Metadata;
}

export interface Metadata {
    payload?: MetadataPayload;
}

export interface MetadataPayload {
    contact?: MetadataContact;
    description?: string;
    dependency?: MetadataDependency[];
    known_issues?: MetadataKnownIssue[];
    waive_message?: string;
}

export interface MetadataContact {
    name?: string;
    url?: string;
    irc?: string;
    team?: string;
    docs?: string;
    email?: string;
    gchat_room_url?: string;
    report_issue_url?: string;
}

export interface MetadataDependency {
    comment: string;
    dependency: 'is_required' | 'is_related_to';
    testcase_name: string;
}

export interface MetadataKnownIssue {
    info: string;
    status: 'active' | 'fixed' | 'irrelevant';
    severity: 'blocker' | 'critical' | 'major' | 'normal' | 'minor';
}
