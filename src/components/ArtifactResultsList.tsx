/*
 * This file is part of ciboard

 * Copyright (c) 2021 Andrei Stepanov <astepano@redhat.com>
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
} from '@patternfly/react-core';

import ArtifactResultsItem from './ArtifactResultsItem';
import {
    getThreadID,
    getTestcaseName,
    transformArtifactStates,
} from '../utils/artifactUtils';
import { DB } from '../types';
import {
    ArtifactsCompleteQuery,
    ArtifactsCurrentStateQuery,
} from '../queries/Artifacts';
import { RootStateType } from '../reducers';
import { IStateQueryString } from '../actions/types';

const artifactDashboardUrl = (artifact: DB.ArtifactType) => {
    return `${window.location.origin}/#/artifact/${artifact.type}/aid/${artifact.aid}`;
};

interface StageAndStateProps {
    stageName: DB.StageNameType;
    stateName: DB.CurrentStateExtendedNameType;
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

/*
mk_stages_states returns:
[
    {stage: 'test', states: {}}
    {stage: 'build', states: {}}
]
    where states: {
        passed: [result1, result2]
        failed: [result3]
        info: [...]

        error: [...]
        queued: [...]
        running: [...]
        waived: [...]

        missing: [...]
        "waived missing": [...]
    }

    + skip empty [...]
*/
const mk_stages_states = (
    artifact: DB.ArtifactType,
): Array<{ stage: DB.StageNameType; states: DB.CurrentStateExtendedType }> => {
    const stage_states = [];
    var buildStates = transformArtifactStates(artifact.current_state, 'build');
    buildStates = _.omitBy(buildStates, (x) => _.isEmpty(x));
    if (_.some(_.values(buildStates), 'length')) {
        const stage: DB.StageNameType = 'build';
        stage_states.push({ stage, states: buildStates });
    }
    /*
    testStates resolves in:
        {
            passed: [artifact1, artifact2]
            failed: [artifact1]
            info: []
            error: []
            queued: []
            running: []
            waived: []
        }
    */
    var testStates = transformArtifactStates(artifact.current_state, 'test');
    testStates = _.omitBy(testStates, (x) => _.isEmpty(x));
    if (_.some(_.values(testStates), 'length')) {
        const stage: DB.StageNameType = 'test';
        stage_states.push({ stage, states: testStates });
    }
    return stage_states;
};

/*
stage_states_array is the second form:
    [
    ['build', 'pass', [result1, result2]],
    ['test', 'pass', [result3]]
    ]
*/
const mk_stage_states_array = (
    stage_states: Array<{
        stage: DB.StageNameType;
        states: DB.CurrentStateExtendedType;
    }>,
): Array<
    [DB.StageNameType, DB.CurrentStateExtendedNameType, DB.StateType[]]
> => {
    const stage_states_array: Array<
        [DB.StageNameType, DB.CurrentStateExtendedNameType, DB.StateType[]]
    > = [];
    for (const { stage, states } of stage_states) {
        for (const [stateName, statesList] of _.toPairs(states)) {
            /** _.toPairs(obj) ===> [pair1, pair2, pair3] where pair == [key, value] */
            stage_states_array.push([
                stage,
                stateName as DB.CurrentStateExtendedNameType,
                statesList,
            ]);
        }
    }
    return stage_states_array;
};

interface ArtifactResultsListProps {
    artifact: DB.ArtifactType;
}

const ArtifactResultsList: React.FC<ArtifactResultsListProps> = (props) => {
    const client = useApolloClient();
    const { artifact: artifactParent } = props;
    const {
        loading: loadingCurrentState,
        error: errorCurrentState,
        data: dataCurrentState,
    } = useQuery(ArtifactsCurrentStateQuery, {
        variables: {
            dbFieldName: 'aid',
            atype: artifactParent.type,
            dbFieldValues: [artifactParent.aid],
        },
        errorPolicy: 'all',
        notifyOnNetworkStatusChange: true,
    });
    const haveData =
        !loadingCurrentState &&
        dataCurrentState &&
        !_.isEmpty(dataCurrentState.db_artifacts.artifacts);
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
    const focusOn = _.get(queryString.queryString, 'focus', false);
    var artifact;
    if (haveData) {
        /**
         * always read data from cache
         * create 1 object artifact that holds all data
         */
        const { db_artifacts } = client.readQuery({
            query: ArtifactsCompleteQuery,
            variables: {
                dbFieldName: 'aid',
                atype: artifactParent.type,
                dbFieldValues: [artifactParent.aid],
            },
        });
        artifact = db_artifacts.artifacts[0];
    }
    if (loadingCurrentState) {
        /**
         * show nothing during load, usually this step is quick
         * do not discrtuct user with jumping interface
         */
        return null;
    }
    if (!artifact) {
        return <div>No test results available for this artifact.</div>;
    }
    const stages_states = mk_stages_states(artifact);
    const stages_states_array = mk_stage_states_array(stages_states);
    if (!_.size(stages_states_array)) {
        return <div>No test results available for this artifact.</div>;
    }
    const result_rows = [];
    for (const [stageName, stateName, statesList] of stages_states_array) {
        const key = `${stageName} / ${stateName}`;
        result_rows.push(
            <StageAndState
                key={key}
                stageName={stageName}
                stateName={stateName}
            />,
        );
        for (const state of statesList) {
            /** testcase match. Can match multiple as is not unique */
            const { broker_msg_body, kai_state } = state;
            const testcase = getTestcaseName({ broker_msg_body, kai_state });
            let hasFocus = false;
            if (
                focusOn === `tc:${testcase}` ||
                focusOn === `id:${getThreadID({ broker_msg_body })}`
            ) {
                hasFocus = true;
            }
            const forceExpand =
                kai_state.msg_id === expandedResult ||
                testcase === expandedResult ||
                (hasFocus && canExpand);
            const key = kai_state.msg_id || testcase;
            const ref = hasFocus ? focusedRef : undefined;
            result_rows.push(
                <div key={key} ref={ref}>
                    <ArtifactResultsItem
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
            <DataList
                aria-label="Expandable data list with artifacts"
                style={{
                    borderTop: 0,
                }}
                isCompact
            >
                {result_rows}
            </DataList>
        </>
    );
};

export default ArtifactResultsList;
