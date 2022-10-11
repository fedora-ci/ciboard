/*
 * This file is part of ciboard

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
import classNames from 'classnames';
import * as React from 'react';
import { useState } from 'react';
import { useLazyQuery } from '@apollo/client';
import {
    Alert,
    Button,
    DataListCell,
    DataListContent,
    DataListItem,
    DataListItemCells,
    DataListItemRow,
    DataListToggle,
    DescriptionList,
    Flex,
    FlexItem,
    Spinner,
    Tab,
    Tabs,
    TabsProps,
    TabTitleIcon,
    TabTitleText,
    Text,
    TextContent,
    TextVariants,
} from '@patternfly/react-core';
import {
    BookIcon,
    ExclamationCircleIcon,
    ExclamationTriangleIcon,
    InfoCircleIcon,
    ListIcon,
    RedoIcon,
    RegistryIcon,
} from '@patternfly/react-icons';

import styles from '../custom.module.css';
import { mappingDatagrepperUrl } from '../config';
import { TestSuites } from './TestSuites';
import {
    getArtifactProduct,
    getKaiExtendedStatus,
    getTestcaseName,
    getThreadID,
    getUmbDocsUrl,
    LinkifyNewTab,
    renderStatusIcon,
} from '../utils/artifactUtils';
import { MSG_V_1, MSG_V_0_1, Metadata } from '../types';
import { Artifact, StateKaiType, StateNameType } from '../artifact';
import {
    StateDetailsEntry,
    StateLink,
    mkLabel,
    mkPairs,
} from './ArtifactState';
import { ArtifactStateProps } from './ArtifactState';
import {
    MetadataQueryResult,
    TestDependency,
    TestInfo,
    TestKnownIssues,
    useOnceCall,
} from './MetadataInfo';
import { MetadataQuery } from '../queries/Metadata';

export interface PropsWithKaiState {
    state: StateKaiType;
    metadata?: Metadata;
}

/**
 * Display the note associated with a result as provided by the CI system if available.
 */
export function ResultNote(props: PropsWithKaiState) {
    const { broker_msg_body } = props.state;
    let note: string | undefined;
    if (MSG_V_0_1.isMsg(broker_msg_body)) {
        note = broker_msg_body.note;
    } else if (MSG_V_1.isMsg(broker_msg_body)) {
        note = broker_msg_body.test.note;
    }
    if (_.isEmpty(note)) return null;
    return (
        <Alert isInline title="Note from CI system" variant="info">
            {note}
        </Alert>
    );
}

export interface KaiDetailedResultsProps extends PropsWithKaiState {
    artifact: Artifact;
}

export const KaiDetailedResults: React.FC<KaiDetailedResultsProps> = (
    props,
) => {
    const { state, artifact } = props;
    const { kai_state } = state;
    /* [OSCI-1861]: info messages also can have xunit */
    const stateName = kai_state.state;
    /* https://pagure.io/fedora-ci/messages/blob/master/f/schemas/test-common.yaml#_120 */
    const showFor: StateNameType[] = ['error', 'queued', 'running', 'complete'];
    if (!_.includes(showFor, stateName)) return null;
    const render = (
        <StateDetailsEntry caption="Test results">
            <TestSuites state={state} artifact={artifact} />
        </StateDetailsEntry>
    );
    return render;
};

export interface KaiDocsButtonProps {
    docsUrl?: string;
}

export const KaiDocsButton: React.FC<KaiDocsButtonProps> = (props) => {
    const { docsUrl } = props;
    if (_.isEmpty(docsUrl)) return null;
    return (
        <Button
            className={styles.actionButton}
            component="a"
            href={docsUrl}
            icon={<BookIcon />}
            isSmall
            rel="noopener noreferrer"
            target="_blank"
            title="Documentation for this test provided by the CI system."
            variant="secondary"
        >
            docs
        </Button>
    );
};

export interface KaiRerunButtonProps {
    rerunUrl?: string;
}

export const KaiRerunButton: React.FC<KaiRerunButtonProps> = (props) => {
    const { rerunUrl } = props;
    if (_.isEmpty(rerunUrl)) return null;
    return (
        <Button
            className={styles.actionButton}
            component="a"
            href={rerunUrl}
            icon={<RedoIcon />}
            isSmall
            onClick={(e) => {
                e.stopPropagation();
            }}
            rel="noopener noreferrer"
            target="_blank"
            title="Rerun testing. Note login to the linked system might be required."
            variant="control"
        >
            rerun
        </Button>
    );
};

/**
 * v 1.x
 */
const schemaMappingV1 = [
    ['contact.name', 'ci name'],
    ['contact.team', 'ci team'],
    ['contact.docs', 'ci docs'],
    ['contact.email', 'ci email'],
    ['contact.url', 'ci web ui'],
    ['contact.irc', 'ci irc'],
    ['contact.slack', 'ci slack'],
    ['contact.version', 'ci version'],
    ['notification.recipients', 'recipients'],
    ['run.url', 'run details'],
    ['run.log', 'logs'],
    ['test.category', 'test category'],
    ['test.docs', 'test docs'],
    ['test.label', 'test label'],
    ['test.lifetime', 'test lifetime'],
    ['test.lifetime', 'test namespace'],
    ['test.note', 'test note'],
    ['test.progress', 'test progress'],
    ['test.type', 'test type'],
    ['test.scenario', 'test scenario'],
];

const schemaMappingV01 = [
    ['notification.recipients', 'recipients'],
    ['reason', 'error reason'],
];

const StateExplain: React.FC<PropsWithKaiState> = (props) => {
    const { state } = props;
    const { broker_msg_body, kai_state } = state;
    const explain: { [key in StateNameType]?: JSX.Element } = {
        running: (
            <Alert isInline isPlain title="Test running" variant="info">
                Testing has been started and is in progress.
            </Alert>
        ),
        queued: (
            <Alert isInline isPlain title="Test queued" variant="info">
                Test has been queued, but has not yet started.
            </Alert>
        ),
        error: (
            <Alert isInline isPlain title="Test error." variant="warning">
                Testing was aborted due to an error in the pipeline. This might
                be, for instance, an infrastructure error or a CI system error.
                Please, contact the CI system maintainers for further
                information.
            </Alert>
        ),
    };
    const columns: JSX.Element[] = [];
    const stateExplanation = _.get(explain, kai_state.state, null);
    if (stateExplanation) {
        columns.push(stateExplanation);
    }
    let errorReason: string | undefined;
    let errorIssueUrl: string | undefined;
    if (MSG_V_1.isMsg(broker_msg_body)) {
        errorReason = _.get(broker_msg_body, 'error.reason');
        errorIssueUrl = _.get(broker_msg_body, 'error.issue_url');
    } else if (MSG_V_0_1.isMsg(broker_msg_body)) {
        errorReason = _.get(broker_msg_body, 'reason');
        errorIssueUrl = _.get(broker_msg_body, 'issue_url');
    }
    if (!_.isNil(errorReason)) {
        const jsxElement = (
            <Alert isInline isPlain title="CI system error" variant="warning">
                {errorReason} <LinkifyNewTab>{errorIssueUrl}</LinkifyNewTab>
            </Alert>
        );
        columns.push(jsxElement);
    }
    if (_.size(columns)) {
        return (
            <Flex direction={{ default: 'column' }}>
                {_.map(columns, (c) => (
                    <FlexItem>{c}</FlexItem>
                ))}
            </Flex>
        );
    }
    return null;
};

export interface KaiStateMappingProps extends PropsWithKaiState {
    artifact: Artifact;
}

export const KaiStateMapping: React.FC<KaiStateMappingProps> = (props) => {
    const { artifact, state } = props;
    const { broker_msg_body, kai_state } = state;
    let pairs: string[][] = [];
    if (MSG_V_1.isMsg(broker_msg_body)) {
        pairs = mkPairs(schemaMappingV1, state.broker_msg_body);
    } else if (MSG_V_0_1.isMsg(broker_msg_body)) {
        pairs = mkPairs(schemaMappingV01, state.broker_msg_body);
    } else {
        return null;
    }
    const brokerMsgUrl: string = new URL(
        `id?id=${kai_state.msg_id}&is_raw=true&size=extra-large`,
        mappingDatagrepperUrl[artifact.type],
    ).toString();
    pairs.push(['broker msg', brokerMsgUrl]);
    const elements: JSX.Element[] = _.map(pairs, ([name, value]) =>
        mkLabel(name, value, 'green'),
    );
    return (
        <Flex>
            <FlexItem>
                <StateDetailsEntry caption="Result details">
                    <Flex direction={{ default: 'column' }}>
                        <FlexItem key="1">
                            <StateExplain state={state} />
                        </FlexItem>
                        <FlexItem key="2">
                            <DescriptionList
                                isCompact
                                isHorizontal
                                columnModifier={{
                                    default: '2Col',
                                }}
                            >
                                {elements}
                            </DescriptionList>
                        </FlexItem>
                    </Flex>
                </StateDetailsEntry>
            </FlexItem>
        </Flex>
    );
};

export const KaiStateActions: React.FC<PropsWithKaiState> = (props) => {
    const { broker_msg_body } = props.state;
    const docsUrl = getUmbDocsUrl(broker_msg_body);
    const rerunUrl = broker_msg_body.run.rebuild;
    return (
        <Flex style={{ minWidth: '20em' }}>
            <Flex flex={{ default: 'flex_1' }}></Flex>
            <Flex flex={{ default: 'flex_1' }}>
                <KaiRerunButton rerunUrl={rerunUrl} />
            </Flex>
            <Flex flex={{ default: 'flex_1' }}>
                <KaiDocsButton docsUrl={docsUrl} />
            </Flex>
        </Flex>
    );
};

const StageName: React.FC<PropsWithKaiState> = (props) => {
    const { state } = props;
    const { kai_state } = state;
    if (kai_state.stage === 'dispatch') {
        return <>{`dispatcher / ${_.get(state.broker_msg_body, 'ci.name')}`}</>;
    }
    if (kai_state.stage === 'build') {
        return <>build</>;
    }
    const name = getTestcaseName(state);
    return (
        <TextContent>
            <Text>{name}</Text>
        </TextContent>
    );
};

interface FaceForKaiStateProps extends PropsWithKaiState {
    artifactDashboardUrl: string;
}

const FaceForKaiState: React.FC<FaceForKaiStateProps> = (props) => {
    const { artifactDashboardUrl, state } = props;
    let result = getKaiExtendedStatus(state);
    return (
        <Flex>
            <Flex flex={{ default: 'flex_1' }}>
                <Flex>{renderStatusIcon(result)}</Flex>
                <Flex flexWrap={{ default: 'nowrap' }}>
                    <StageName state={state} />
                </Flex>
            </Flex>
            <Flex flex={{ default: 'flex_1' }}>
                <Flex>
                    <KaiStateActions state={state} />
                </Flex>
                <Flex>
                    <StateLink
                        artifactDashboardUrl={artifactDashboardUrl}
                        state={state}
                    />
                </Flex>
            </Flex>
        </Flex>
    );
};

interface BodyForKaiStateProps {
    state: StateKaiType;
    artifact: Artifact;
    isVisible: boolean;
}

export const BodyForKaiState: React.FC<BodyForKaiStateProps> = (props) => {
    const { artifact, isVisible, state } = props;
    const [activeTabKey, setActiveTabKey] = useState<number | string>(0);
    const handleTabClick: TabsProps['onSelect'] = (event, tabIndex) => {
        setActiveTabKey(tabIndex);
    };
    const testcase_name = getTestcaseName(state);
    const product_version = getArtifactProduct(artifact);
    const variables: any = { testcase_name };
    if (!_.isNil(product_version)) {
        variables.product_version = product_version;
    }
    const [getMetadata, { loading: metadataLoading, error: _error, data }] =
        useLazyQuery<MetadataQueryResult>(MetadataQuery, {
            variables,
            errorPolicy: 'all',
            /* need to re-fetch each time when user press save/back button */
            fetchPolicy: 'cache-and-network',
            notifyOnNetworkStatusChange: true,
        });
    useOnceCall(() => {
        /* Fetch data only when ci-system is expanded. */
        getMetadata();
    }, isVisible);
    if (!isVisible) {
        return null;
    }
    if (metadataLoading) {
        return (
            <Flex className="pf-u-p-lg">
                <FlexItem>
                    <Spinner className="pf-u-mr-md" size="md" /> Loading test
                    information…
                </FlexItem>
            </Flex>
        );
    }
    const metadata = data?.metadata_consolidated;
    if (_.isNil(metadata) || _.isNil(metadata?.payload)) {
        return (
            <Flex className="pf-u-p-lg">
                <FlexItem>Cannot fetch metadata info.</FlexItem>
            </Flex>
        );
    }
    const { contact, dependency, description, known_issues } = metadata.payload;
    const isTestKnownIssuesTabHidden = !known_issues;
    const isTestDependencyTabHidden = !dependency;
    const isTestInfoTabHidden = !description && !contact;
    return (
        <>
            <Tabs
                activeKey={activeTabKey}
                onSelect={handleTabClick}
                isBox
                aria-label="Tabs with ci-system info"
                role="region"
            >
                <Tab
                    eventKey={0}
                    title={
                        <>
                            <TabTitleIcon>
                                <RegistryIcon />
                            </TabTitleIcon>{' '}
                            <TabTitleText>Result</TabTitleText>{' '}
                        </>
                    }
                    aria-label="Tab with results info"
                >
                    <ResultNote state={state} />
                    <KaiDetailedResults state={state} artifact={artifact} />
                </Tab>
                <Tab
                    eventKey={1}
                    isHidden={isTestKnownIssuesTabHidden}
                    title={
                        <>
                            <TabTitleIcon>
                                <ExclamationCircleIcon />
                            </TabTitleIcon>
                            <TabTitleText>Known issues</TabTitleText>
                        </>
                    }
                    aria-label="Tab with known issues"
                >
                    <>
                        <TestKnownIssues metadata={metadata} />
                    </>
                </Tab>
                <Tab
                    eventKey={2}
                    isHidden={isTestDependencyTabHidden}
                    title={
                        <>
                            <TabTitleIcon>
                                <ExclamationTriangleIcon />
                            </TabTitleIcon>
                            <TabTitleText>Dependency</TabTitleText>
                        </>
                    }
                    aria-label="Tab with dependency information"
                >
                    <>
                        <TestDependency metadata={metadata} />
                    </>
                </Tab>
                <Tab
                    eventKey={3}
                    isHidden={isTestInfoTabHidden}
                    title={
                        <>
                            <TabTitleIcon>
                                <InfoCircleIcon />
                            </TabTitleIcon>
                            <TabTitleText>Test info</TabTitleText>
                        </>
                    }
                    aria-label="Tab with test info"
                >
                    <>
                        <TestInfo metadata={metadata} />
                        <TextContent>
                            <Text component={TextVariants.small}>
                                CI owners can update info on metadata page.
                            </Text>
                        </TextContent>
                    </>
                </Tab>
                <Tab
                    eventKey={4}
                    title={
                        <>
                            <TabTitleIcon>
                                <ListIcon />
                            </TabTitleIcon>{' '}
                            <TabTitleText>Details</TabTitleText>{' '}
                        </>
                    }
                    aria-label="Tab with test details"
                >
                    <KaiStateMapping state={state} artifact={artifact} />
                </Tab>
            </Tabs>
        </>
    );
};

export type ArtifactKaiStateProps = ArtifactStateProps & PropsWithKaiState;

export const ArtifactKaiState: React.FC<ArtifactKaiStateProps> = (props) => {
    const {
        artifact,
        artifactDashboardUrl,
        forceExpand,
        setExpandedResult,
        state,
    } = props;

    const { broker_msg_body, kai_state } = state;
    /*
     * Expand a specific testcase according to query string and scroll to it
     * ?focus=tc:<test-case-name>
     */
    const onToggle = () => {
        if (forceExpand) {
            setExpandedResult('');
        } else {
            const key = kai_state.test_case_name;
            setExpandedResult(key);
        }
    };
    /** Note for info test results */
    const thread_id = getThreadID({ broker_msg_body });
    const resultClasses = classNames(styles.helpSelect, {
        [styles.expandedResult]: forceExpand,
    });
    const toRender = (
        <DataListItem
            key={thread_id}
            isExpanded={forceExpand}
            className={resultClasses}
            aria-labelledby="artifact-item-result"
        >
            <DataListItemRow>
                <DataListToggle
                    id="toggle"
                    onClick={onToggle}
                    isExpanded={forceExpand}
                />
                <DataListItemCells
                    className="pf-u-m-0 pf-u-p-0"
                    dataListCells={[
                        <DataListCell
                            className="pf-u-m-0 pf-u-p-0"
                            key="secondary content"
                        >
                            <FaceForKaiState
                                artifactDashboardUrl={artifactDashboardUrl}
                                state={state}
                            />
                        </DataListCell>,
                    ]}
                />
            </DataListItemRow>
            <DataListContent
                aria-label="State details"
                id="ex-result-expand"
                isHidden={!forceExpand}
            >
                <BodyForKaiState
                    state={state}
                    artifact={artifact}
                    isVisible={forceExpand}
                />
            </DataListContent>
        </DataListItem>
    );

    return toRender;
};
