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
    isGreenwaveState,
    isKaiState,
} from '../utils/artifactUtils';
import { RootStateType } from '../reducers';
import { ArtifactState } from './ArtifactState';
import { IStateQueryString } from '../actions/types';
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
        /* running tests fall into 'test-result-missing' */
        if (state === 'test-result-missing') return 'Awaited required tests';
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

const mustExpandState = (state: StateType, expandedResult: string): boolean => {
    /*
     * expandedResult - is set to testcase-name by state-widget, when it handles click for expanding
     * State-widget uses call-back to set this param.
     */
    const testcase = getTestcaseName(state);
    if (testcase === expandedResult) {
        return true;
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
    const { artifact } = props;
    const queryString = useSelector<RootStateType, IStateQueryString>(
        (store) => store.queryString,
    );
    const focusedRef = useRef<HTMLDivElement>(null);
    /** canExpandURLState == was not expanded */
    const [wasExpandedForURLParam, setWasExpandedForURLParam] = useState(false);
    /**
     * Only one result can be expanded.
     * Result sets that it is expanded with help of setExpandedResult()
     * expandedResult - holds test case name
     */
    const [expandedResult, setExpandedResult] = useState('');
    useEffect(() => {
        if (focusedRef.current) {
            focusedRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }
    }, [expandedResult]);
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
    const focusOnParam: qs.ParsedQs[keyof qs.ParsedQs] = _.get(
        queryString.queryString,
        'focus',
        '',
    );
    const focusOnFromURL = _.isString(focusOnParam) ? focusOnParam : '';
    if (!_.isEmpty(focusOnFromURL) && !wasExpandedForURLParam) {
        const testCaseName = focusOnFromURL.replace(/^(tc:)/, '');
        setExpandedResult(testCaseName);
        setWasExpandedForURLParam(true);
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
            const forceExpand: boolean = mustExpandState(state, expandedResult);
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
