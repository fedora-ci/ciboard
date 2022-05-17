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

import * as React from 'react';
import _ from 'lodash';
import qs from 'qs';
import { useSelector } from 'react-redux';
import { useQuery } from '@apollo/client';
import { useState, useRef, useEffect } from 'react';
import {
    Alert,
    DataList,
    DataListCell,
    DataListItem,
    DataListItemCells,
    DataListItemRow,
    Flex,
    FlexItem,
    Spinner,
    Text,
    TextContent,
    TextVariants,
} from '@patternfly/react-core';

import {
    Artifact,
    StateExtendedNameType,
    StageNameType,
    StateType,
} from '../artifact';
import {
    getTestcaseName,
    getThreadID,
    isGreenwaveState,
    isKaiState,
} from '../utils/artifactUtils';
import { RootStateType } from '../reducers';
import { ArtifactState } from './ArtifactState';
import { IStateQueryString } from '../actions/types';
import { ArtifactsCompleteQuery } from '../queries/Artifacts';
import {
    StageNameStateNameStatesType,
    mkStagesAndStates,
} from '../utils/stages_states';

const artifactDashboardUrl = (artifact: Artifact) =>
    `${window.location.origin}/#/artifact/${artifact.type}/aid/${artifact.aid}`;

interface StageAndStateProps {
    stageName: StageNameType;
    stateName: StateExtendedNameType;
}

function mkStageStateTitle(
    stage: StageNameType,
    state: StateExtendedNameType,
): string {
    if (stage === 'greenwave') {
        if (state === 'test-result-failed') return 'Failed required tests';
        if (state === 'test-result-missing') return 'Missing required tests';
        if (state === 'test-result-passed') return 'Passed required tests';
        if (state === 'additional-tests')
            return 'Additional tests (not required for gating)';
    }
    return `${stage} / ${state}`;
}

const StageAndState: React.FC<StageAndStateProps> = (props) => {
    const { stageName, stateName } = props;
    const title = mkStageStateTitle(stageName, stateName);
    return (
        <DataListItem
            aria-labelledby="artifact-item-result"
            key={title}
            style={{ borderBottom: 'none' }}
        >
            <DataListItemRow>
                <DataListItemCells
                    className="pf-u-m-0 pf-u-p-0"
                    dataListCells={[
                        <DataListCell
                            className="pf-u-m-0 pf-u-p-0"
                            key="secondary content"
                        >
                            <TextContent>
                                <Text component={TextVariants.small}>
                                    {title}
                                </Text>
                            </TextContent>
                        </DataListCell>,
                    ]}
                />
            </DataListItemRow>
        </DataListItem>
    );
};

const mustExpandResult = (
    state: StateType,
    focusOn: string,
    expandedResult: string,
    canExpand: boolean,
): boolean => {
    const testcase = getTestcaseName(state);
    if (testcase === expandedResult) {
        return true;
    }
    if (focusOn === `tc:${testcase}`) {
        if (canExpand) {
            return true;
        }
    }
    if (isKaiState(state)) {
        const { broker_msg_body, kai_state } = state;
        if (focusOn === `id:${getThreadID({ broker_msg_body })}`) {
            if (canExpand) {
                return true;
            }
        }
        if (kai_state.msg_id === expandedResult) {
            return true;
        }
    }
    return false;
};

const mkStateKey = (state: StateType): string => {
    const testcase = getTestcaseName(state);
    if (isKaiState(state)) {
        const { kai_state } = state;
        return `${testcase}-${kai_state.stage}-${kai_state.state}`;
    }
    if (isGreenwaveState(state)) {
        return `greenwave-${testcase}`;
    }
    return testcase;
};

interface ArtifactResultsListProps {
    artifact: Artifact;
}

export function ArtifactStatesList(props: ArtifactResultsListProps) {
    const { artifact: artifactParent } = props;
    const { loading: loadingCurrentState, data: dataCurrentState } = useQuery(
        ArtifactsCompleteQuery,
        {
            variables: {
                limit: 1,
                dbFieldName1: 'aid',
                atype: artifactParent.type,
                dbFieldValues1: [artifactParent.aid],
            },
            errorPolicy: 'all',
            notifyOnNetworkStatusChange: true,
        },
    );
    const haveData =
        !loadingCurrentState && _.has(dataCurrentState, 'artifacts.artifacts');
    const queryString = useSelector<RootStateType, IStateQueryString>(
        (store) => store.queryString,
    );
    const focusedRef = useRef<HTMLDivElement>(null);
    /**
     * canScroll Used in logic when URL has hasFocus.
     * canScroll is set to false when scrolled, to scroll only once
     */
    const [canScroll, setCanScroll] = useState(true);
    /** canExpand == was not expanded */
    const [canExpand, setCanExpand] = useState(true);
    /**
     * Only one result can be expanded.
     * Result sets that it is expanded with help of setExpandedResult()
     * expandedResult - holds msg_id or result., getTestcaseNametestcase
     */
    const [expandedResult, setExpandedResult] = useState('');
    useEffect(() => {
        if (focusedRef.current && canScroll) {
            focusedRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
            setCanScroll(false);
        }
        if (!canScroll) {
            setCanExpand(false);
        }
    }, [expandedResult, canScroll]);
    const focusOnParam: qs.ParsedQs[keyof qs.ParsedQs] = _.get(
        queryString.queryString,
        'focus',
        '',
    );
    const focusOn = _.isString(focusOnParam) ? focusOnParam : '';
    var artifact: Artifact | null = null;
    if (haveData) {
        artifact = _.get(dataCurrentState, 'artifacts.artifacts[0]');
    }
    if (loadingCurrentState) {
        return (
            <Flex className="pf-u-p-lg">
                <FlexItem>
                    <Spinner className="pf-u-mr-md" size="md" /> Loading test
                    results…
                </FlexItem>
            </Flex>
        );
    }
    if (!artifact) {
        return (
            <Flex className="pf-u-p-lg">
                <FlexItem>
                    <Alert
                        isInline
                        isPlain
                        title="Could not load test results"
                        variant="warning"
                    />
                </FlexItem>
            </Flex>
        );
    }
    const stagesAndStates: StageNameStateNameStatesType[] =
        mkStagesAndStates(artifact);
    if (!_.size(stagesAndStates)) {
        return <>No test results available for this artifact.</>;
    }
    const resultRows: React.ReactNode[] = [];
    for (const [stageName, stateName, statesList] of stagesAndStates) {
        if (stateName === 'fetched-gating-yaml') continue;
        const key = `${stageName} / ${stateName}`;
        resultRows.push(
            <StageAndState
                key={key}
                stageName={stageName}
                stateName={stateName}
            />,
        );
        for (const state of statesList) {
            /** testcase match. Can match multiple as is not unique */
            const forceExpand: boolean = mustExpandResult(
                state,
                focusOn,
                expandedResult,
                canExpand,
            );
            const key = mkStateKey(state);
            const ref = forceExpand ? focusedRef : undefined;
            resultRows.push(
                <div key={key} ref={ref}>
                    <ArtifactState
                        artifact={artifact}
                        artifactDashboardUrl={artifactDashboardUrl(artifact)}
                        forceExpand={forceExpand}
                        setExpandedResult={setExpandedResult}
                        state={state}
                        stateName={stateName}
                    />
                </div>,
            );
        }
    }
    return (
        <DataList
            aria-label="Expandable data list with artifacts"
            style={{
                borderTop: 0,
            }}
            isCompact
        >
            {resultRows}
        </DataList>
    );
}
