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
    Text,
    TextContent,
} from '@patternfly/react-core';

import { RedoIcon } from '@patternfly/react-icons';

import styles from '../custom.module.css';
import { mappingDatagrepperUrl } from '../config';
import { TestSuites } from './TestSuites';
import {
    getTestcaseName,
    getThreadID,
    LinkifyNewTab,
    renderStatusIcon,
} from '../utils/artifactUtils';
import { MSG_V_1, MSG_V_0_1 } from '../types';
import { Artifact, StateKaiType, StateNameType } from '../artifact';
import {
    StateDetailsEntry,
    StateLink,
    mkLabel,
    mkPairs,
} from './ArtifactState';
import { ArtifactStateProps } from './ArtifactState';

export interface PropsWithKaiState {
    state: StateKaiType;
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
            isSmall
            onClick={(e) => {
                e.stopPropagation();
            }}
            rel="noopener noreferrer"
            target="_blank"
            title="Rerun testing. Note login to the linked system might be required."
            variant="control"
        >
            <RedoIcon style={{ height: '0.8em' }} /> <span>rerun</span>
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
    const rerunUrl = broker_msg_body.run.rebuild;
    if (_.isEmpty(rerunUrl)) return null;
    return (
        <Flex style={{ minWidth: '15em' }}>
            <Flex flex={{ default: 'flex_1' }}></Flex>
            <Flex flex={{ default: 'flex_1' }}>
                <KaiRerunButton rerunUrl={rerunUrl} />
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
    const { kai_state } = state;
    const element = (
        <Flex>
            <Flex flex={{ default: 'flex_1' }}>
                <Flex>{renderStatusIcon(kai_state.state)}</Flex>
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
    return element;
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
     * ?focus=tc:<test-case-name> or ?focus=id:<pipeline-id>
     */
    const onToggle = () => {
        if (forceExpand) {
            setExpandedResult('');
        } else {
            const key = kai_state.msg_id || kai_state.test_case_name;
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
                {forceExpand && (
                    <>
                        <ResultNote state={state} />
                        <KaiDetailedResults state={state} artifact={artifact} />
                        <KaiStateMapping state={state} artifact={artifact} />
                    </>
                )}
            </DataListContent>
        </DataListItem>
    );

    return toRender;
};
