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
import * as React from 'react';
import {
    Flex,
    Text,
    Alert,
    Badge,
    Button,
    FlexItem,
    TextContent,
    DataListCell,
    DataListItem,
    DataListToggle,
    DescriptionList,
    DataListItemRow,
    DataListItemCells,
    DataListContent,
} from '@patternfly/react-core';

import { RedoIcon } from '@patternfly/react-icons';

import styles from '../custom.module.css';
import { mappingDatagrepperUrl } from '../config';
import { TestSuites } from './TestSuites';
import {
    getThreadID,
    getTestcaseName,
    renderStatusIcon,
} from '../utils/artifactUtils';
import { MSG_V_1, MSG_V_0_1, BrokerMessagesType } from '../types';
import { Artifact, StateKaiType, StateNameType } from '../artifact';
import {
    StateDetailsEntry,
    StateLink,
    mkLabel,
    mkPairs,
} from './ArtifactState';
import { ArtifactStateProps } from './ArtifactState';
import classnames from 'classnames';

/**
 * 0.1.x: .label - string
 * 0.2.x: test.label - string[]
 */
const mkLabels = (broker_msg_body: BrokerMessagesType): Array<JSX.Element> => {
    let labels: string | Array<string> = [];
    if (MSG_V_0_1.isMsg(broker_msg_body)) {
        if (!broker_msg_body.label) {
            return [];
        }
        labels = broker_msg_body.label;
    }
    if (MSG_V_1.isMsg(broker_msg_body)) {
        if (!broker_msg_body.test.label) {
            return [];
        }
        labels = broker_msg_body.test.label;
    }
    var labels_str: Array<string> = [];
    if (typeof labels === 'string') {
        /** Workaround with convert array string to array */
        if (labels.startsWith('[')) {
            labels_str = labels.replace(/^\[|\]$|'|\s+/g, '').split(',');
            /** Get rid of python unicode identifier 'u' */
            for (const key in labels_str) {
                if (labels_str.hasOwnProperty(key))
                    labels_str[key] = labels_str[key].substr(1);
            }
        } else {
            labels_str.push(labels);
        }
    } else {
        labels_str.push(...labels);
    }
    const components: Array<JSX.Element> = [];
    for (const key in labels_str) {
        if (_.has(labels_str, key)) {
            components.push(
                <Badge isRead key={labels_str[key]}>
                    <TextContent>
                        <Text component="small">{labels_str[key]}</Text>
                    </TextContent>
                </Badge>,
                <>' '</>,
            );
        }
    }
    return components;
};

export interface ArtifactKaiStateProps extends ArtifactStateProps {
    state: StateKaiType;
}
export const ArtifactKaiState: React.FC<ArtifactKaiStateProps> = (props) => {
    const {
        state,
        artifact,
        forceExpand,
        setExpandedResult,
        artifactDashboardUrl,
    } = props;

    const { broker_msg_body, kai_state } = state;
    /*
     * Expand a specific testcase according to query string and scroll to it
     * ?focus=tc:<test-case-name> or ?focus=id:<pipeline-id>
     */
    const onToggle = () => {
        if (!forceExpand) {
            const key = kai_state.msg_id || kai_state.test_case_name;
            setExpandedResult(key);
        } else if (forceExpand) {
            setExpandedResult('');
        }
    };
    /** Note for info test results */
    const thread_id = getThreadID({ broker_msg_body });
    const resultClasses = classnames(styles['helpSelect'], styles['level2']);
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
                                state={state}
                                artifactDashboardUrl={artifactDashboardUrl}
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
                        <KaiStateActions state={state} />
                        <KaiStateMapping state={state} artifact={artifact} />
                        <KaiStateXunit state={state} artifact={artifact} />
                    </>
                )}
            </DataListContent>
        </DataListItem>
    );

    return toRender;
};

interface KaiStateXunitProps {
    state: StateKaiType;
    artifact: Artifact;
}
export const KaiStateXunit: React.FC<KaiStateXunitProps> = (props) => {
    const { state, artifact } = props;
    const { broker_msg_body, kai_state } = state;
    /* [OSCI-1861]: info messages also can have xunit */
    const stateName = kai_state.state;
    /* https://pagure.io/fedora-ci/messages/blob/master/f/schemas/test-common.yaml#_120 */
    const showFor: Array<StateNameType> = [
        'error',
        'queued',
        'running',
        'complete',
    ];
    if (!_.includes(showFor, stateName)) {
        return null;
    }
    const render = (
        <StateDetailsEntry caption="Xunit">
            <TestSuites state={state} artifact={artifact} />
        </StateDetailsEntry>
    );
    return render;
};

interface KaiReTestButtonProps {
    state: StateKaiType;
}
export const KaiReTestButton: React.FC<KaiReTestButtonProps> = (props) => {
    const {
        state: { kai_state, broker_msg_body },
    } = props;
    const href = _.get(broker_msg_body, 'run.rebuild');
    const key = kai_state.thread_id;
    if (_.isNil(href)) {
        return null;
    }
    return (
        <a
            href={href}
            key={key}
            target="_blank"
            title="Rerun testing. Note login to the linked system might be required."
            rel="noopener noreferrer"
        >
            <Button
                variant="tertiary"
                onClick={(e) => {
                    e.stopPropagation();
                }}
            >
                <RedoIcon />
                <span className={styles.waive}>rerun</span>
            </Button>
        </a>
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
    ['error.reason', 'error reason'],
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

interface StateExplainProps {
    state: StateKaiType;
}
const StateExplain: React.FC<StateExplainProps> = (props) => {
    const { state } = props;
    const explain: { [key in StateNameType]?: JSX.Element } = {
        running: (
            <Alert isInline isPlain variant="info" title="Test running.">
                Testing has been started and is in progress.
            </Alert>
        ),
        queued: (
            <Alert isInline isPlain variant="info" title="Queued test">
                Testing has been queued, but not yet started.
            </Alert>
        ),
        error: (
            <Alert isInline isPlain variant="info" title="Test error.">
                Testing has aborted, it was not finished, e.g. because of
                infrastructure error, CI system error, etc. Note that a test
                failure is not an error.
            </Alert>
        ),
    };
    return _.get(explain, state.kai_state.state, null);
};

interface KaiStateInfoProps {
    state: StateKaiType;
    artifact: Artifact;
}
export const KaiStateMapping: React.FC<KaiStateInfoProps> = (props) => {
    const { state, artifact } = props;
    const { broker_msg_body, kai_state } = state;
    var pairs: string[][] = [];
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
    //const brokerMsgUrl = `${config.datagrepper.url}/id?id=${kai_state.msg_id}&is_raw=true&size=extra-large`;
    pairs.push(['broker msg', brokerMsgUrl]);
    const elements: Array<JSX.Element> = _.map(pairs, ([name, value]) =>
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

interface KaiStateActionsProps {
    state: StateKaiType;
}
export const KaiStateActions: React.FC<KaiStateActionsProps> = (props) => {
    const { state } = props;
    const { broker_msg_body } = state;
    var hideWidget = true;
    const rebuildUrl = _.get(broker_msg_body, 'run.rebuild');
    if (!_.isNil(rebuildUrl)) {
        hideWidget = false;
    }
    if (hideWidget) {
        return null;
    }
    return (
        <StateDetailsEntry caption="Actions">
            <Flex>
                <FlexItem>
                    <KaiReTestButton state={state} />
                </FlexItem>
            </Flex>
        </StateDetailsEntry>
    );
};

interface StageNameProps {
    state: StateKaiType;
}
const StageName: React.FC<StageNameProps> = (props) => {
    const { state } = props;
    const { kai_state } = state;
    if (kai_state.stage === 'dispatch') {
        return <>`dispatcher / ${_.get(state.broker_msg_body, 'ci.name')}`</>;
    }
    if (kai_state.stage === 'build') {
        return <>'build'</>;
    }
    const name = getTestcaseName(state);
    return (
        <TextContent>
            <Text>{name}</Text>
        </TextContent>
    );
};

interface FaceForKaiStateProps {
    state: StateKaiType;
    artifactDashboardUrl: string;
}
const FaceForKaiState: React.FC<FaceForKaiStateProps> = (props) => {
    const { state, artifactDashboardUrl } = props;
    const { kai_state } = state;
    const element = (
        <Flex style={{ minHeight: '34px' }}>
            <FlexItem>{renderStatusIcon(kai_state.state)}</FlexItem>
            <Flex flexWrap={{ default: 'nowrap' }}>
                <StageName state={state} />
            </Flex>
            <Flex>
                <StateLink
                    state={state}
                    artifactDashboardUrl={artifactDashboardUrl}
                />
            </Flex>
        </Flex>
    );
    return element;
};
