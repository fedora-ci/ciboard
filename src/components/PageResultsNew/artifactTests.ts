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

import * as _ from 'lodash';

import {
    Artifact,
    GreenwaveRequirementOutcome,
    GreenwaveWaiveType,
    StateExtendedNameType,
    StateKaiType,
    StateType,
} from '../../artifact';
import {
    getDocsUrl,
    getKaiExtendedStatus,
    getMessageError,
    getRerunUrl,
    getTestcaseName,
    isGreenwaveKaiState,
    isGreenwaveState,
    isKaiState,
    isResultWaivable,
} from '../../utils/artifactUtils';
import {
    MSG_V_0_1,
    MSG_V_1,
    MetadataContact,
    MetadataDependency,
} from '../../types';
import { mkStagesAndStates } from '../../utils/stages_states';
import { CiContact, CiTest, TestStatus } from './types';

function transformUmbStatus(stateName: StateExtendedNameType): TestStatus {
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
    if (outcome === 'RUNNING') return 'running';
    return 'failed';
}

function extractContactFromUmb(test: StateKaiType): CiContact | undefined {
    const { broker_msg_body } = test;
    let contact: MSG_V_0_1.MsgContactType | MSG_V_1.MsgContactType | undefined;
    if (MSG_V_0_1.isMsg(broker_msg_body)) {
        contact = broker_msg_body.ci;
    } else if (MSG_V_1.isMsg(broker_msg_body)) {
        contact = broker_msg_body.contact;
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

function extractContact(test: StateType): CiContact {
    let contact: CiContact = {};
    let metadataContact: MetadataContact | undefined;

    if (isGreenwaveState(test)) {
        // This is handled later in the UI by querying custom metadata.
        return contact;
    }
    if (isKaiState(test)) {
        _.merge(contact, extractContactFromUmb(test));
        metadataContact = test.custom_metadata?.payload?.contact;
    }
    if (isGreenwaveKaiState(test)) {
        _.merge(contact, extractContactFromUmb(test.ks));
        metadataContact = test.ks.custom_metadata?.payload?.contact;
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

function transformTest(
    test: StateType,
    stateName: StateExtendedNameType,
): CiTest {
    const contact = extractContact(test);
    let dependencies: MetadataDependency[] | undefined;
    let description: string | undefined;
    const docsUrl = getDocsUrl(test);
    let error: MSG_V_1.MsgErrorType | undefined;
    let knownIssues: CiTest['knownIssues'];
    let logsUrl: string | undefined;
    let messageId: string | undefined;
    const name = getTestcaseName(test);
    const rerunUrl = getRerunUrl(test);
    const required =
        (isGreenwaveState(test) || isGreenwaveKaiState(test)) &&
        stateName !== 'additional-tests';
    let runDetailsUrl: string | undefined;
    const waivable = isResultWaivable(test);
    let waiver: GreenwaveWaiveType | undefined;

    if (isGreenwaveState(test)) {
        waiver = test.waiver;
    } else if (isKaiState(test)) {
        dependencies = test.custom_metadata?.payload?.dependency;
        description = test.custom_metadata?.payload?.description;
        error = getMessageError(test.broker_msg_body);
        knownIssues = test.custom_metadata?.payload?.known_issues;
        logsUrl = test.broker_msg_body.run.log;
        messageId = test.kai_state.msg_id;
        runDetailsUrl = test.broker_msg_body.run.url;
    } else if (isGreenwaveKaiState(test)) {
        dependencies = test.ks.custom_metadata?.payload?.dependency;
        description = test.ks.custom_metadata?.payload?.description;
        error = getMessageError(test.ks.broker_msg_body);
        knownIssues = test.ks.custom_metadata?.payload?.known_issues;
        logsUrl = test.ks.broker_msg_body.run.log;
        messageId = test.ks.kai_state.msg_id;
        runDetailsUrl = test.ks.broker_msg_body.run.url;
        waiver = test.gs.waiver;
    }

    let status = transformUmbStatus(stateName);
    if (isGreenwaveState(test) && test.result && !waiver) {
        status = transformGreenwaveOutcome(
            test.result.outcome,
            stateName !== 'additional-tests',
        );
    } else if (
        isGreenwaveKaiState(test) &&
        test.gs.result &&
        stateName !== 'additional-tests' &&
        !waiver
    ) {
        status = transformGreenwaveOutcome(test.gs.result.outcome, true);
    } else if (isGreenwaveKaiState(test) && stateName === 'additional-tests') {
        /*
         * TODO: For some osci and baseos-ci tests, this will return `failed`
         * even if the failure is in infrastructure. The message is sent to
         * `/topic/VirtualTopic.eng.ci.osci.brew-build.test.error` and has
         * `error.reason`, but `test.result === 'failed'`. For an example, see
         * https://datagrepper.engineering.redhat.com/id?id=ID:osci-jenkins-master-0-43277-1681457299489-309:1:1:1:1&is_raw=true&size=extra-large
         */
        status = transformUmbStatus(getKaiExtendedStatus(test.ks));
    }

    return {
        contact,
        dependencies,
        description,
        docsUrl,
        error,
        knownIssues,
        logsUrl,
        messageId,
        name: name || 'unknown',
        originalState: test,
        required,
        rerunUrl,
        runDetailsUrl,
        status,
        waivable,
        waiver,
    };
}

export function extractTests(artifact: Artifact): CiTest[] {
    const stagesStates = mkStagesAndStates(artifact);
    const tests = stagesStates.flatMap(([_stage, stateName, tests]) =>
        tests.map((test) => transformTest(test, stateName)),
    );
    return _.sortBy(tests, (test) => test.name);
}
