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

import * as _ from 'lodash';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
    Bullseye,
    Card,
    EmptyState,
    EmptyStateIcon,
    Flex,
    PageSection,
    PageSectionVariants,
    Spinner,
    Title,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { useQuery } from '@apollo/client';

import './index.css';
import {
    ArtifactsCompleteQuery,
    ArtifactsCompleteQueryData,
} from '../../queries/Artifacts';
import { config } from '../../config';
import {
    Artifact,
    GreenwaveRequirementOutcome,
    GreenwaveWaiveType,
    isArtifactMBS,
    isArtifactRPM,
    StateExtendedNameType,
    StateKaiType,
    StateType,
} from '../../artifact';
import { MSG_V_1, MetadataContact } from '../../types';
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
import { mkStagesAndStates } from '../../utils/stages_states';
import { CiContact, CiTest, TestStatus } from './types';
import { SelectedTestContext } from './contexts';
import { TestResultsTable } from './TestResultsTable';
import { BuildInfo } from './BuildInfo';
import { DetailsDrawer } from './DetailsDrawer';
import { ArtifactHeader } from './Header';
import { PageCommon } from '../PageCommon';

// TODO: This function is temporary only and will be removed once the UI is finalized.
function transformUmbStatus(stateName: StateExtendedNameType): TestStatus {
    if (['error', 'test-result-errored'].includes(stateName)) {
        return 'error';
    } else if (['failed', 'test-result-failed'].includes(stateName)) {
        return 'failed';
    } else if (
        ['missing-gating-yaml', 'test-result-missing'].includes(stateName)
    ) {
        return 'missing';
    } else if (
        [
            'blacklisted',
            'complete',
            'excluded',
            'passed',
            'test-result-passed',
            /*
             * TODO: Handle this more appropriately. This is just a flag used by
             * Greenwave, but the outcome can be anything from `running` to `passed`
             * to `failed` or `not_applicable`.
             */
            // 'additional-tests',
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
    } else if (stateName.endsWith('-waived')) {
        return 'waived';
    }
    // TODO: Handle `*-gating-yaml` statuses.
    return 'unknown';
}

// TODO: This function is temporary only and will be removed once the UI is finalized.
function transformGreenwaveOutcome(
    outcome: GreenwaveRequirementOutcome,
): TestStatus {
    // TODO: NOT_APPLICABLE is fine for additional-tests but not for required tests. Make
    // sure this works as expected.
    if (outcome === 'INFO' || outcome === 'NOT_APPLICABLE') return 'info';
    if (outcome === 'PASSED') return 'passed';
    if (outcome === 'RUNNING') return 'running';
    return 'failed';
}

function extractContactFromUmb(test: StateKaiType): CiContact | undefined {
    // TODO: Incorporate contact info from metadata somehow.
    if (!MSG_V_1.isMsg(test.broker_msg_body)) return;
    const { contact } = test.broker_msg_body;
    return {
        docsUrl: contact.docs,
        email: contact.email,
        gchatRoomUrl: undefined,
        name: contact.name,
        reportIssueUrl: undefined,
        slackChannelUrl: contact.slack,
        team: contact.team,
        url: contact.url,
    };
}

function extractContact(test: StateType): CiContact {
    let contact: CiContact = {};
    let metadataContact: MetadataContact | undefined;

    /*
     * TODO: What to do in the Greenwave-only case? Is there any info
     * in the Greenwave response? As a last resort, we would need to
     * query our API for custom metadata.
     */
    // if (isGreenwaveState(test)) return;
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

// TODO: This function is temporary only and will be removed once the UI is finalized.
function transformTest(
    test: StateType,
    stateName: StateExtendedNameType,
): CiTest {
    const contact = extractContact(test);
    const docsUrl = getDocsUrl(test);
    let error;
    let messageId: string | undefined;
    const name = getTestcaseName(test);
    const rerunUrl = getRerunUrl(test);
    const required =
        (isGreenwaveState(test) || isGreenwaveKaiState(test)) &&
        stateName !== 'additional-tests';
    const waivable = isResultWaivable(test);
    let waiver: GreenwaveWaiveType | undefined;

    let status = transformUmbStatus(stateName);
    if (
        isGreenwaveState(test) &&
        test.result &&
        // stateName !== 'additional-tests' &&
        status !== 'waived'
    ) {
        status = transformGreenwaveOutcome(test.result.outcome);
    } else if (
        isGreenwaveKaiState(test) &&
        test.gs.result &&
        stateName !== 'additional-tests' &&
        status !== 'waived'
    ) {
        status = transformGreenwaveOutcome(test.gs.result.outcome);
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

    if (isGreenwaveState(test)) {
        waiver = test.waiver;
    } else if (isKaiState(test)) {
        error = getMessageError(test.broker_msg_body);
        messageId = test.kai_state.msg_id;
    } else if (isGreenwaveKaiState(test)) {
        error = getMessageError(test.ks.broker_msg_body);
        messageId = test.ks.kai_state.msg_id;
        waiver = test.gs.waiver;
    }

    return {
        contact,
        docsUrl,
        error,
        messageId,
        name,
        required,
        rerunUrl,
        status,
        waivable,
        waiver,
    };
}

// TODO: This function is temporary only and will be removed once the UI is finalized.
function extractTests(artifact: Artifact): CiTest[] {
    const stagesStates = mkStagesAndStates(artifact);
    const tests = stagesStates.flatMap(([_stage, stateName, tests]) =>
        tests.map((test) => transformTest(test, stateName)),
    );
    return _.sortBy(tests, (test) => test.name);
}

type PageResultsNewParams = 'aid' | 'type';

export function PageResultsNew(_props: {}) {
    const [selectedTest, setSelectedTest] = useState<CiTest | undefined>();
    const params = useParams<PageResultsNewParams>();
    // Docs: https://reactrouter.com/en/main/hooks/use-search-params
    const [searchParams, setSearchParams] = useSearchParams();

    let tests: CiTest[] = [];
    const findTestByName = (name: string) =>
        _.find(tests, (test) => test.name === name);

    useEffect(() => {
        // Set selected test based on URL, if present.
        if (searchParams.has('focus')) {
            // NOTE: We know that `.get()` must return non-null since `.has()` is true.
            const test = findTestByName(searchParams.get('focus')!);
            setSelectedTest(test);
        } else {
            setSelectedTest(undefined);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    // TODO: Update title dynamically.
    const pageTitle = `🚧 New test results | ${config.defaultTitle}`;

    const aid = params.aid || '47942709';
    const atype = params.type || 'brew-build';

    const { data, error, loading } = useQuery<ArtifactsCompleteQueryData>(
        ArtifactsCompleteQuery,
        {
            variables: {
                atype,
                dbFieldName1: 'aid',
                dbFieldValues1: [aid],
                limit: 1,
            },
            errorPolicy: 'all',
            fetchPolicy: 'cache-first',
        },
    );

    // TODO: Error state.
    // TODO: Multiple results state?

    /*
     * TODO: Load build info and test results if `taskId` is specified.
     * - build info: ArtifactsDetailedInfoKojiTask for RPMs,
     *               ArtifactsDetailedInfoModuleBuild for modules
     * - list of artifacts: ArtifactsCompleteQuery
     * For details, see `PageByMongoField`.
     */

    const artifact = data?.artifacts.artifacts?.[0];
    const haveData = !_.isNil(artifact) && !error && !loading;

    if (loading) {
        return (
            <PageCommon title={pageTitle}>
                <PageSection isFilled>
                    <Bullseye>
                        <EmptyState>
                            <EmptyStateIcon
                                variant="container"
                                component={Spinner}
                            />
                            <Title headingLevel="h2" size="lg">
                                Loading artifact…
                            </Title>
                        </EmptyState>
                    </Bullseye>
                </PageSection>
            </PageCommon>
        );
    }

    if (!haveData || (!isArtifactMBS(artifact) && !isArtifactRPM(artifact))) {
        return (
            <PageCommon title={pageTitle}>
                <PageSection isFilled>
                    <Bullseye>
                        <EmptyState>
                            <EmptyStateIcon
                                className="pf-u-danger-color-100"
                                icon={ExclamationCircleIcon}
                            />
                            <Title headingLevel="h2" size="lg">
                                Failed to load artifact
                            </Title>
                            {/* TODO: Render more specific error message. */}
                        </EmptyState>
                    </Bullseye>
                </PageSection>
            </PageCommon>
        );
    }

    tests = extractTests(artifact);

    // TODO: Use unique key later on.
    const onTestSelect = (name: string | undefined) => {
        if (name && name !== selectedTest?.name) {
            setSelectedTest(findTestByName(name));
            setSearchParams({ focus: name });
        } else {
            setSelectedTest(undefined);
            setSearchParams({});
        }
    };

    return (
        <PageCommon title={pageTitle}>
            <SelectedTestContext.Provider value={selectedTest}>
                <DetailsDrawer
                    artifact={artifact}
                    onClose={() => onTestSelect(undefined)}
                >
                    <PageSection variant={PageSectionVariants.light}>
                        <ArtifactHeader
                            artifact={artifact}
                            gatingStatus="fail"
                            gatingTag={artifact.payload.gate_tag_name}
                            // TODO: Is this logic correct?
                            isScratch={_.isEmpty(
                                artifact.payload.gate_tag_name,
                            )}
                            nvr={artifact.payload.nvr}
                            owner={artifact.payload.issuer}
                        />
                    </PageSection>
                    <PageSection isFilled variant={PageSectionVariants.default}>
                        <Flex
                            className="resultsNarrower"
                            direction={{ default: 'column' }}
                        >
                            <Card>
                                <BuildInfo artifact={artifact} />
                            </Card>
                            <Card>
                                <TestResultsTable
                                    onSelect={onTestSelect}
                                    tests={tests}
                                />
                            </Card>
                        </Flex>
                    </PageSection>
                </DetailsDrawer>
            </SelectedTestContext.Provider>
        </PageCommon>
    );
}
