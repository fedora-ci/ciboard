/*
 * This file is part of ciboard

 * Copyright (c) 2021, 2022, 2023 Andrei Stepanov <astepano@redhat.com>
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
import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Text,
    Flex,
    Alert,
    FlexItem,
    DataList,
    TextContent,
    TextVariants,
    DataListCell,
    DataListItem,
    DataListItemRow,
    DataListItemCells,
} from '@patternfly/react-core';

import {
    Artifact,
    StateName,
    MsgStageName,
    ArtifactChild,
    isChildTestMsg,
    getTestcaseName,
    isGreenwaveChild,
    getAType,
    getArtifactId,
    getTestMsgExtendedStatus,
    getMsgStageName,
} from '../types';
import { AChild } from './AChild';
import {
    mkStagesAndStates,
    StageNameStateNameStates,
} from '../utils/stages_states';

// XXX: adapt to Opensearch
const artifactDashboardUrl = (artifact: Artifact) => {
    const aType = getAType(artifact);
    const aId = getArtifactId(artifact);
    return `${window.location.origin}/#/artifact/${aType}/aid/${aId}`;
};

interface StageAndStateProps {
    stageName: MsgStageName;
    stateName: StateName;
}

function mkStageStateTitle(stage: MsgStageName, state: StateName): string {
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

const mustExpandState = (
    child: ArtifactChild,
    expandedResult: string,
): boolean => {
    /*
     * expandedResult - is set to testcase-name by state-widget, when it handles click for expanding
     * State-widget uses call-back to set this param.
     */
    const testcase = getTestcaseName(child);
    if (testcase === expandedResult) {
        return true;
    }
    return false;
};

const mkStateKey = (aChild: ArtifactChild): string => {
    const testcase = getTestcaseName(aChild) || 'unknown';
    if (isChildTestMsg(aChild)) {
        const msgStage = getMsgStageName(aChild);
        const msgState = getTestMsgExtendedStatus(aChild);
        return `${testcase}-${msgStage}-${msgState}`;
    }
    if (isGreenwaveChild(aChild)) {
        return `greenwave-${testcase}`;
    }
    return testcase;
};

interface AChildrenListProps {
    artifact: Artifact;
}

export function AChildrenList(props: AChildrenListProps) {
    const { artifact } = props;
    const [searchParams] = useSearchParams();
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
    const focusOnParam = searchParams.get('focus') || '';
    const focusOnFromURL = _.isString(focusOnParam) ? focusOnParam : '';
    if (!_.isEmpty(focusOnFromURL) && !wasExpandedForURLParam) {
        const testCaseName = focusOnFromURL.replace(/^(tc:)/, '');
        setExpandedResult(testCaseName);
        setWasExpandedForURLParam(true);
    }
    const stagesAndStates: StageNameStateNameStates[] =
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
        for (const aChild of statesList) {
            /** testcase match. Can match multiple as is not unique */
            const forceExpand: boolean = mustExpandState(
                aChild,
                expandedResult,
            );
            const key = mkStateKey(aChild);
            const ref = forceExpand ? focusedRef : undefined;
            resultRows.push(
                <div key={key} ref={ref}>
                    <AChild
                        artifact={artifact}
                        artifactDashboardUrl={artifactDashboardUrl(artifact)}
                        forceExpand={forceExpand}
                        setExpandedResult={setExpandedResult}
                        aChild={aChild}
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
