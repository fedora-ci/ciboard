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
    ArtifactsStatesQuery,
} from '../queries/Artifacts';
import { RootStateType } from '../reducers';
import { IStateQueryString } from '../actions/types';

const artifactDashboardUrl = (artifact: DB.ArtifactType) => {
    return `${window.location.origin}/#/artifact/${artifact.type}/aid/${artifact.aid}`;
};

/**
 * Return a list of gating requirements of a specific type
 * (e.g. missing, failed, etc.) for the given artifact and their
 * waiving status. If the type is `test-result-missing`, for instance,
 * the function returns all the tests that Greenwave considers missing,
 * including those that were waived. Tests that are present in normal
 * results are excluded, so that there are no duplicates with queued
 * or running tests.
 */
const getGatingTests = (
    type: string,
    states: DB.StatesByCategoryType,
    artifact: DB.ArtifactType,
) => {
    if (!artifact || !artifact.gating_decision) return [];
    /**
     * Names of test cases that we got from Kai, no matter the result.
     */
    const testcases = _.map(_.flatten(_.values(states)), (state) => {
        return getTestcaseName({ kai_state: state.kai_state });
    });
    /**
     * List of all gating requirements of the given type.
     */
    const allRequirements = (
        artifact.gating_decision.unsatisfied_requirements || []
    )
        .concat(artifact.gating_decision.satisfied_requirements || [])
        .filter(
            (requirement) =>
                requirement.type === type ||
                requirement.type === `${type}-waived`,
        )
        .map((requirement) => ({
            testcase: requirement.testcase.name || requirement.testcase,
            waived: requirement.type.endsWith('-waived'),
        }));
    /**
     * Discard requirements that already appear in Kai results, preventing
     * duplicates in the UI.
     */
    const matchingTests = allRequirements
        .filter(({ testcase }) => !testcases.includes(testcase))
        .map(({ testcase, waived }) => ({
            gating_test: true,
            stage: 'gate',
            status: waived ? 'waived' : null,
            testcase,
        }));

    return matchingTests;
};

interface StageAndStateProps {
    stageName: DB.StageNameType;
    stateName: DB.StateExtendedNameType;
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

/**
 * Return list of stages along with our current knowledge of the results
 * in each stage.
 *
 * It might happen from time to time that we don't receive a message about
 * a finished test while Greenwave does. In that case, Greenwave bases its
 * gating decision on information we don't have and cannot display. This
 * would also cause some important test suites to be omitted from the results
 * list and thus make their status invisible to maintainers.
 *
 * This function collects all the artifact's results that we know about as
 * well as those that only Greenwave knows (or does not know) about and
 * packs them into a unified structure. In this process, at the moment the
 * results we have (from Kai) have precendence over Greenwave's info.
 *
 * As an example, assume that the test `x.y.z` is required for gating.
 * Until the test finishes (or the requirement is waived), it's missing
 * from Greenwave's point of view. As long as it is so, we will display
 * the test as such in the dashboard.
 *
 * Now image that Greenwave receives a message that `x.y.z` has failed but
 * we receive no such message. Greenwave now changes its type to
 * `test-result-failed`. At this point, the dashboard should display it as
 * failed as well because Greenwave has just told us the result, even
 * though we didn't get the original message.
 *
 * mk_stages_states() returns a list of the form
 *     [
 *         {stage: 'test', states: {}},
 *         {stage: 'build', states: {}}
 *     ]
 * where each `states` key has the form
 *     {
 *         passed: [result1, result2]
 *         failed: [result3]
 *         info: [...]
 *
 *         error: [...]
 *         queued: [...]
 *         running: [...]
 *         waived: [...]
 *
 *         missing: [...]
 *     }
 */
const mk_stages_states = (artifact: DB.ArtifactType) => {
    const stage_states = [];
    var buildStates = transformArtifactStates(artifact.states, 'build');
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
            waived: [] // XXX do we have this ?
        }
    */
    let testStates = transformArtifactStates(artifact.states, 'test');
    /**
     * Collect tests that resulted in an error according to Greenwave.
     * XXX: cannot be concatenated with kai-state
    testStates['error'] = _.concat(
        _.defaultTo(testStates['error'], []),
        getGatingTests('test-result-errored', testStates, artifact),
    );
     */
    /**
     * Collect tests that failed according to Greenwave.
     * XXX: cannot be concatenated with kai-state
    testStates['failed'] = _.concat(
        _.defaultTo(testStates['failed'], []),
        getGatingTests('test-result-failed', testStates, artifact),
    );
     */
    /**
     * Collect missing tests that neither Greenwave nor us have any
     * information about.
     */
    /** XXX: revisit missing states cannot be added here, since they are not present in DB in terms of Kai-state
    testStates['missing'] = getGatingTests(
        'test-result-missing',
        testStates,
        artifact,
    );
    */
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
        states: DB.StatesByCategoryType;
    }>,
): Array<[DB.StageNameType, DB.StateExtendedNameType, DB.StateType[]]> => {
    const stage_states_array: Array<
        [DB.StageNameType, DB.StateExtendedNameType, DB.StateType[]]
    > = [];
    for (const { stage, states } of stage_states) {
        for (const [stateName, statesList] of _.toPairs(states)) {
            /** _.toPairs(obj) ===> [pair1, pair2, pair3] where pair == [key, value] */
            stage_states_array.push([
                stage,
                stateName as DB.StateExtendedNameType,
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
    } = useQuery(ArtifactsStatesQuery, {
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
        !loadingCurrentState &&
        _.has(dataCurrentState, 'db_artifacts.artifacts');
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
    var artifact: DB.ArtifactType | null = null;
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
        artifact = _.get(reply, 'db_artifacts.artifacts[0]');
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
