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
import { useSelector } from 'react-redux';
import { useQuery, useApolloClient } from '@apollo/client';
import { useState, useRef, useEffect } from 'react';
import {
    Text,
    DataList,
    TextContent,
    TextVariants,
    DataListItemRow,
    DataListItem,
    DataListItemCells,
    DataListCell,
    Flex,
    FlexItem,
    Title,
    TitleSizes,
} from '@patternfly/react-core';
import {
    isKaiState,
    getThreadID,
    getTestcaseName,
    isGreenwaveState,
    renderStatusIcon,
    transformKaiStates,
    resultColor,
    isGreenwaveKaiState,
} from '../utils/artifactUtils';
import {
    StateType,
    ArtifactType,
    StageNameType,
    StateExtendedNameType,
    GreenwaveDecisionReplyType,
} from '../artifact';
import { RootStateType } from '../reducers';
import { ArtifactState } from './ArtifactState';
import { IStateQueryString } from '../actions/types';
import { ArtifactsCompleteQuery } from '../queries/Artifacts';
import {
    mkStagesAndStates,
    StageNameStateNameStatesType,
} from '../utils/stages_states';
import { StoreReaderConfig } from '@apollo/client/cache/inmemory/readFromStore';

const artifactDashboardUrl = (artifact: ArtifactType) => {
    return `${window.location.origin}/#/artifact/${artifact.type}/aid/${artifact.aid}`;
};

interface StageAndStateProps {
    stageName: StageNameType;
    stateName: StateExtendedNameType;
}

const StageAndState: React.FC<StageAndStateProps> = (props) => {
    const { stageName, stateName } = props;
    let content = `${stageName} / ${stateName}`;
    return (
        <DataListItem
            key={content}
            aria-labelledby="artifact-item-result"
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
                                    {content}
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
    artifact: ArtifactType;
}
const ArtifactStatesList: React.FC<ArtifactResultsListProps> = (props) => {
    const client = useApolloClient();
    const { artifact: artifactParent } = props;
    const {
        loading: loadingCurrentState,
        error: errorCurrentState,
        data: dataCurrentState,
    } = useQuery(ArtifactsCompleteQuery, {
        variables: {
            limit: 1,
            dbFieldName1: 'aid',
            atype: artifactParent.type,
            dbFieldValues1: [artifactParent.aid],
        },
        errorPolicy: 'all',
        notifyOnNetworkStatusChange: true,
    });
    const haveData =
        !loadingCurrentState && _.has(dataCurrentState, 'artifacts.artifacts');
    // XXX: display errors
    const haveErrorNoData =
        !loadingCurrentState && errorCurrentState && !haveData;
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
    const focusOn: string = _.get(queryString.queryString, 'focus', '');
    var artifact: ArtifactType | null = null;
    if (haveData) {
        /**
         * readQuery() - always read data from cache, never makes request to server.
         * create 1 object artifact that holds all data.
         */
        const reply = client.readQuery({
            query: ArtifactsCompleteQuery,
            variables: {
                limit: 1,
                dbFieldName1: 'aid',
                atype: artifactParent.type,
                dbFieldValues1: [artifactParent.aid],
            },
        });
        artifact = _.get(reply, 'artifacts.artifacts[0]');
    }
    if (loadingCurrentState) {
        /**
         * Show nothing during load, usually this step is quick
         * do not discrtuct user with jumping interface
         */
        return null;
    }
    if (!artifact) {
        return <div>Cannot fetch artifact info.</div>;
    }
    const stagesAndStates: StageNameStateNameStatesType[] =
        mkStagesAndStates(artifact);
    if (!_.size(stagesAndStates)) {
        return <>No test results available for this artifact.</>;
    }
    const resultRows = [];
    for (const [stageName, stateName, statesList] of stagesAndStates) {
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
                        state={state}
                        artifact={artifact}
                        stateName={stateName}
                        forceExpand={forceExpand}
                        setExpandedResult={setExpandedResult}
                        artifactDashboardUrl={artifactDashboardUrl(artifact)}
                    />
                </div>,
            );
        }
    }
    return (
        <>
            <ArtifactGreenwaveStatesSummary artifact={artifact} />
            <br />
            <DataList
                aria-label="Expandable data list with artifacts"
                style={{
                    borderTop: 0,
                }}
                isCompact
            >
                {resultRows}
            </DataList>
        </>
    );
};

export default ArtifactStatesList;

interface PrintRequirementsSizeProps {
    allReqs: { [key: string]: number };
    reqName: string;
}
const PrintRequirementsSize = (props: PrintRequirementsSizeProps) => {
    const { reqName, allReqs } = props;
    const color = resultColor(reqName);
    const style = { color: `var(${color})` };
    return (
        <Title style={style} headingLevel="h1" size={TitleSizes['md']}>
            {allReqs[reqName]} {reqName}
        </Title>
    );
};
interface ArtifactGreenwaveStatesSummaryProps {
    artifact: ArtifactType;
}
export const ArtifactGreenwaveStatesSummary: React.FC<
    ArtifactGreenwaveStatesSummaryProps
> = (props) => {
    const decision: GreenwaveDecisionReplyType | undefined =
        props.artifact.greenwave_decision;
    if (_.isNil(decision) || !_.isBoolean(decision?.policies_satisfied)) {
        return null;
    }
    const reqSummary: { [name: string]: number } = {};
    const satisfied = decision?.satisfied_requirements?.length;
    const unSatisfied = decision?.unsatisfied_requirements?.length;
    if (satisfied) {
        reqSummary['satisfied'] = satisfied;
    }
    if (unSatisfied) {
        reqSummary['unsatisfied'] = unSatisfied;
    }
    return (
        <Flex>
            <FlexItem spacer={{ default: 'spacerMd' }} key="1"></FlexItem>
            <FlexItem key="2">
                <Title headingLevel="h1" size={TitleSizes['md']}>
                    Gating:
                </Title>
            </FlexItem>
            {_.map(reqSummary, (_len, reqName) => (
                <FlexItem key={reqName} spacer={{ default: 'spacerMd' }}>
                    <PrintRequirementsSize
                        reqName={reqName}
                        allReqs={reqSummary}
                    />
                </FlexItem>
            ))}
            <FlexItem key="3">
                <TextContent>
                    <Text>
                        {renderStatusIcon(
                            _.toString(decision.policies_satisfied),
                            'gating',
                            '1.2em',
                        )}
                    </Text>
                </TextContent>
            </FlexItem>
        </Flex>
    );
};
