/*
 * This file is part of ciboard
 *
 * Copyright (c) 2023 Matěj Grabovský <mgrabovs@redhat.com>
 * Copyright (c) 2023, 2024 Andrei Stepanov <astepano@redhat.com>
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

import { CiContact, CiTest, TestStatus } from './types';
import {
    AChild,
    MSG_V_1,
    Artifact,
    getMsgId,
    MSG_V_0_1,
    StateName,
    getDocsUrl,
    getRerunUrl,
    MetadataRaw,
    TestMetadata,
    AChildTestMsg,
    getTestMsgBody,
    MetadataContact,
    getTestcaseName,
    isAChildTestMsg,
    isAChildGreenwave,
    GreenwaveWaiveType,
    getMsgExtendedStatus,
    isAChildGreenwaveAndTestMsg,
    GreenwaveRequirementOutcome,
    getArtifactProduct,
} from '../../types';
import { getMessageError, isResultWaivable } from '../../utils/utils';
import { mkStagesAndStates } from '../../utils/stages_states';

function transformUmbStatus(stateName: StateName): TestStatus {
    if (
        ['error', 'test-result-errored', 'test-result-errored-waived'].includes(
            stateName,
        )
    ) {
        return 'error';
    } else if (
        ['failed', 'test-result-failed', 'test-result-failed-waived'].includes(
            stateName,
        )
    ) {
        return 'failed';
    } else if (
        [
            'missing-gating-yaml',
            'test-result-missing',
            'test-result-missing-waived',
        ].includes(stateName)
    ) {
        return 'missing';
    } else if (
        [
            'blacklisted',
            'complete',
            'excluded',
            'passed',
            'test-result-passed',
        ].includes(stateName)
    ) {
        return 'passed';
    } else if (stateName === 'queued') {
        return 'queued';
    } else if (stateName === 'running') {
        return 'running';
    } else if (
        ['info', 'needs_inspection', 'not_applicable'].includes(stateName)
    ) {
        return 'info';
    }
    return 'unknown';
}

function transformGreenwaveOutcome(
    outcome: GreenwaveRequirementOutcome,
    isRequired?: boolean,
): TestStatus {
    // NOT_APPLICABLE is fine for unrequired tests but not for required ones.
    if (outcome === 'INFO' || (outcome === 'NOT_APPLICABLE' && !isRequired))
        return 'info';
    if (outcome === 'PASSED') return 'passed';
    if (outcome === 'QUEUED') return 'queued';
    if (outcome === 'RUNNING') return 'running';
    return 'failed';
}

function extractContactFromUmb(aChild: AChildTestMsg): CiContact | undefined {
    const testMsg = getTestMsgBody(aChild);
    let contact: MSG_V_0_1.MsgContactType | MSG_V_1.MsgContactType | undefined;
    if (MSG_V_0_1.isMsg(testMsg)) {
        contact = testMsg.ci;
    } else if (MSG_V_1.isMsg(testMsg)) {
        contact = testMsg.contact;
    }

    if (!contact) {
        return;
    }

    return {
        docsUrl: contact.docs,
        email: contact.email,
        name: contact.name,
        // NOTE: There is no Slack URL in the v0.1.x messages.
        slackChannelUrl: _.get(contact, 'slack'),
        team: contact.team,
        url: contact.url,
    };
}

function extractContact(aChild: AChild, testMetadata: TestMetadata): CiContact {
    let contact: CiContact = {};
    let metadataContact: MetadataContact | undefined;
    metadataContact = testMetadata?.payload?.contact;

    if (isAChildTestMsg(aChild)) {
        _.merge(contact, extractContactFromUmb(aChild));
    }
    if (isAChildGreenwaveAndTestMsg(aChild)) {
        _.merge(contact, extractContactFromUmb(aChild.ms));
    }

    // Merge in data from the `custom_metadata` Kai state field.
    if (metadataContact?.docs) {
        contact.docsUrl = metadataContact.docs;
    }
    if (metadataContact?.email) {
        contact.email = metadataContact.email;
    }
    if (metadataContact?.gchat_room_url) {
        contact.gchatRoomUrl = metadataContact.gchat_room_url;
    }
    if (metadataContact?.name) {
        contact.name = metadataContact.name;
    }
    if (metadataContact?.report_issue_url) {
        contact.reportIssueUrl = metadataContact.report_issue_url;
    }
    if (metadataContact?.slack_channel_url) {
        contact.slackChannelUrl = metadataContact.slack_channel_url;
    }
    if (metadataContact?.team) {
        contact.team = metadataContact.team;
    }
    if (metadataContact?.url) {
        contact.url = metadataContact.url;
    }

    return contact;
}

const metadataFilter = (
    testcaseName: string,
    productVersion: string | undefined,
    metadataEntry: MetadataRaw,
) => {
    const entryProductVersion = metadataEntry.productVersion;
    const entryTestcaseName = metadataEntry.testcaseName;
    const entryTestcaseNameIsRegex = metadataEntry.testcaseNameIsRegex;
    if (!entryTestcaseName) {
        return false;
    }
    if (entryProductVersion && productVersion !== entryProductVersion) {
        return false;
    }
    if (entryTestcaseNameIsRegex) {
        const regex = new RegExp(entryTestcaseName);
        if (regex.test(testcaseName)) {
            return true;
        }
    } else if (entryTestcaseName === testcaseName) {
        return true;
    }
    return false;
};

function customMerge(presentVaule: any, newValue: any) {
    if (
        ((_.isArray(presentVaule) && _.isArray(newValue)) ||
            (_.isString(presentVaule) && _.isString(newValue))) &&
        _.isEmpty(newValue)
    ) {
        return presentVaule;
    }
    /**
     * Return: undefined
     * If customizer returns undefined, merging is handled by the method instead:
     * Source properties that resolve to undefined are skipped if a destination value exists.
     * Array and plain object properties are merged recursively.
     * Other objects and value types are overridden by assignment.
     */
}

const mergedMetadata = (
    artifact: Artifact,
    aChild: AChild,
    metadata: MetadataRaw[],
): TestMetadata => {
    const testcaseName = getTestcaseName(aChild);
    const productVersion = getArtifactProduct(artifact);
    const relatedEntries = _.filter(
        metadata,
        _.partial(metadataFilter, testcaseName, productVersion),
    );
    const sortedByPrio = _.sortBy(relatedEntries, [
        function (o: any) {
            return o?.priority;
        },
    ]);
    const payloads = _.map(sortedByPrio, _.partial(_.get, _, 'payload'));
    const mergedMetadata = _.mergeWith({}, ...payloads, customMerge);
    return { payload: mergedMetadata };
};

function transformTest(
    artifact: Artifact,
    aChild: AChild,
    stateName: StateName,
    metadata: MetadataRaw[],
): CiTest {
    const docsUrl = getDocsUrl(aChild);
    let error: MSG_V_1.MsgErrorType | undefined;
    let logsUrl: string | undefined;
    let messageId: string | undefined;
    const name = getTestcaseName(aChild);
    const rerunUrl = getRerunUrl(aChild);
    const required =
        (isAChildGreenwave(aChild) || isAChildGreenwaveAndTestMsg(aChild)) &&
        stateName !== 'additional-tests';
    let runDetailsUrl: string | undefined;
    const waivable = isResultWaivable(aChild);
    let waiver: GreenwaveWaiveType | undefined;
    const testMetadata = mergedMetadata(artifact, aChild, metadata);
    const contact = extractContact(aChild, testMetadata);
    const dependencies = testMetadata?.payload?.dependency;
    const description = testMetadata?.payload?.description;
    const waiveMessage = testMetadata.payload?.waive_message;
    const knownIssues = testMetadata?.payload?.known_issues;

    if (isAChildGreenwave(aChild)) {
        waiver = aChild.waiver;
    } else if (isAChildTestMsg(aChild)) {
        const testMsg = getTestMsgBody(aChild);
        error = getMessageError(testMsg);
        logsUrl = testMsg.run.log;
        messageId = getMsgId(aChild);
        runDetailsUrl = testMsg.run.url;
    } else if (isAChildGreenwaveAndTestMsg(aChild)) {
        const msgBody = getTestMsgBody(aChild.ms);
        const msgId = getMsgId(aChild.ms);
        logsUrl = msgBody.run.log;
        runDetailsUrl = msgBody.run.url;
        error = getMessageError(msgBody);
        messageId = msgId;
        waiver = aChild.gs.waiver;
    }

    let status = transformUmbStatus(stateName);
    if (isAChildGreenwave(aChild) && aChild.result && !waiver) {
        status = transformGreenwaveOutcome(
            aChild.result.outcome,
            stateName !== 'additional-tests',
        );
    } else if (
        isAChildGreenwaveAndTestMsg(aChild) &&
        aChild.gs.result &&
        stateName !== 'additional-tests' &&
        !waiver
    ) {
        status = transformGreenwaveOutcome(aChild.gs.result.outcome, true);
    } else if (
        isAChildGreenwaveAndTestMsg(aChild) &&
        stateName === 'additional-tests'
    ) {
        /*
         * TODO: For some osci and baseos-ci tests, this will return `failed`
         * even if the failure is in infrastructure. The message is sent to
         * `/topic/VirtualTopic.eng.ci.osci.brew-build.test.error` and has
         * `error.reason`, but `test.result === 'failed'`. For an example, see
         * https://datagrepper.engineering.redhat.com/id?id=ID:osci-jenkins-master-0-43277-1681457299489-309:1:1:1:1&is_raw=true&size=extra-large
         */
        status = transformUmbStatus(getMsgExtendedStatus(aChild.ms));
    }

    return {
        name: name || 'unknown',
        error,
        status,
        waiver,
        docsUrl,
        contact,
        logsUrl,
        waivable,
        required,
        rerunUrl,
        messageId,
        knownIssues,
        description,
        dependencies,
        originalState: aChild,
        runDetailsUrl,
        waiveMessage,
    };
}

export function extractTests(
    artifact: Artifact,
    metadata: MetadataRaw[],
): CiTest[] {
    const stagesStates = mkStagesAndStates(artifact);
    const tests = stagesStates.flatMap(([_stage, stateName, tests]) =>
        tests.map((aChild) =>
            transformTest(artifact, aChild, stateName, metadata),
        ),
    );
    return _.sortBy(tests, (test) => test.name);
}
