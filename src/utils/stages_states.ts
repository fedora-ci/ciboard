/*
 * This file is part of ciboard

 * Copyright (c) 2022 Andrei Stepanov <astepano@redhat.com>
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

import {
    isKaiState,
    getTestcaseName,
    isGreenwaveState,
    transformKaiStates,
    isGreenwaveKaiState,
} from './artifactUtils';
import {
    StateType,
    ArtifactType,
    StageNameType,
    StateKaiType,
    StateGreenwaveType,
    StatesByCategoryType,
    StateExtendedNameType,
    GreenwaveRequirementType,
    GreenwaveDecisionReplyType,
    GreenwaveRequirementTypesType,
    GreenwaveResultType,
    StateGreenwaveKaiType,
} from '../artifact';

export type StageNameStateNameStatesType = [
    StageNameType,
    StateExtendedNameType,
    StateType[],
];

/**
 * Entry point. This file is the most complicated part in this project.
 */
export const mkStagesAndStates = (
    artifact: ArtifactType,
): StageNameStateNameStatesType[] => {
    const stagesStates: Array<{
        stage: StageNameType;
        states: StatesByCategoryType;
    }> = [];
    const kaiStagesStates = mkStagesKaiStates(artifact);
    stagesStates.push(...kaiStagesStates);
    if (artifact.greenwave_decision) {
        const greenwaveStageStates = mkGreenwaveStageStates(
            artifact.greenwave_decision,
        );
        stagesStates.push(greenwaveStageStates);
    }
    const stageStatesArray = mkStageStatesArray(stagesStates);
    mergeKaiAndGreenwaveState(stageStatesArray);
    minimizeStagesStates(stageStatesArray);
    return stageStatesArray;
};

const filterByStageName = (
    stage: StageNameType,
    stageStatesArray: Array<StageNameStateNameStatesType>,
) =>
    _.filter(
        stageStatesArray,
        _.flow(_.identity, _.nth, _.partialRight(_.isEqual, stage)),
    );

const getKaiState = (
    states: StageNameStateNameStatesType[],
    stateNameReq: StateExtendedNameType,
    runUrl: string,
): StateKaiType | undefined => {
    const s = _.find(states, ([_stageName, stateName, _states]) =>
        _.isEqual(_.toUpper(stateNameReq), _.toUpper(stateName)),
    );
    if (_.isNil(s)) {
        return;
    }
    const [_stageName, _stateName, kaiStates] = s;
    var kaiState = _.find(kaiStates as StateKaiType[], (state) =>
        _.isEqual(runUrl, _.get(state.broker_msg_body, 'run.url')),
    );
    return kaiState;
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
 * mkStagesStates() returns a list of the form
 *     [
 *         {stage: 'test', states: {}},
 *         {stage: 'build', states: {}}
 *     ]
 * where each `states` key has the form
 *     {
 *         passed: [result1, result2]
 *         failed: [result3]
 *         info: [...]
 *         error: [...]
 *         queued: [...]
 *         running: [...]
 *     }
 */
const mkStagesKaiStates = (
    artifact: ArtifactType,
): {
    stage: StageNameType;
    states: StatesByCategoryType;
}[] => {
    const stageStates = [];
    var buildStates = transformKaiStates(artifact.states, 'build');
    buildStates = _.omitBy(buildStates, (x) => _.isEmpty(x));
    if (_.some(_.values(buildStates), 'length')) {
        const stage: StageNameType = 'build';
        stageStates.push({ stage, states: buildStates });
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
        }
    */
    let testStates: StatesByCategoryType = transformKaiStates(
        artifact.states,
        'test',
    );
    testStates = _.omitBy(testStates, (x) => _.isEmpty(x));
    if (_.some(_.values(testStates), 'length')) {
        const stage: StageNameType = 'test';
        stageStates.push({ stage, states: testStates });
    }
    return stageStates;
};

const mkGreenwaveStateReq = (
    req: GreenwaveRequirementType,
    decision: GreenwaveDecisionReplyType,
): StateGreenwaveType => {
    const state: StateGreenwaveType = {
        testcase: req.testcase,
        requirement: req,
    };
    const testcase = req.testcase;
    const { waivers, results } = decision;
    const waiver = _.find(waivers, (w) => _.isEqual(testcase, w.testcase));
    const result = _.find(results, (r) => _.isEqual(testcase, r.testcase.name));
    state.waiver = waiver;
    state.result = result;
    return state;
};

const mkGreenwaveStageStates = (
    decision: GreenwaveDecisionReplyType,
): {
    /* stage is always `greenwave` */
    stage: StageNameType;
    states: StatesByCategoryType;
} => {
    const states: StatesByCategoryType = {};
    const reqStatesGreenwave = mkReqStatesGreenwave(decision);
    const resultStatesGreenwave = mkResultStatesGreenwave(decision);
    _.assign(states, reqStatesGreenwave, resultStatesGreenwave);
    return { stage: 'greenwave', states };
};

const mkReqStatesGreenwave = (
    decision: GreenwaveDecisionReplyType,
): StatesByCategoryType => {
    const { satisfied_requirements, unsatisfied_requirements } = decision;
    const requirements: Array<GreenwaveRequirementType> = _.concat(
        satisfied_requirements,
        unsatisfied_requirements,
    );
    console.log('xxx1', decision.unsatisfied_requirements);
    /* {'test-result-passed' : [GreenwaveRequirementType], 'fetched-gating-yaml' : ... } */
    const requirementsByType = _.groupBy(requirements, 'type');
    /* {'test-result-passed' : [StateGreenWaveType], 'fetched-gating-yaml' : ... } */
    const statesByReqType: StatesByCategoryType = {};
    _.forOwn(
        requirementsByType,
        (
            reqsByType: Array<GreenwaveRequirementType>,
            reqType /* GreenwaveRequirementTypesType */,
        ) => {
            /* [r1,r2,r3] => [{req:r1}, {req:r2}, {req:r3}] */
            const greenwaveStates: Array<StateGreenwaveType> = _.map(
                reqsByType,
                (req) => mkGreenwaveStateReq(req, decision),
            );
            statesByReqType[reqType as GreenwaveRequirementTypesType] =
                greenwaveStates;
        },
    );
    return statesByReqType;
};

const mkResultStatesGreenwave = (
    decision: GreenwaveDecisionReplyType,
): StatesByCategoryType => {
    const { satisfied_requirements, unsatisfied_requirements, results } =
        decision;
    const requirements: Array<GreenwaveRequirementType> = _.concat(
        satisfied_requirements,
        unsatisfied_requirements,
    );
    const resultsToShow: Array<GreenwaveResultType> = _.filter(
        results,
        (result) =>
            _.isUndefined(
                _.find(requirements, (req) =>
                    _.isEqual(result.testcase.name, req.testcase),
                ),
            ),
    );
    const resultStates: Array<StateGreenwaveType> = _.map(
        resultsToShow,
        (res): StateGreenwaveType => ({
            testcase: res.testcase.name,
            result: res,
        }),
    );
    const stateName: StateExtendedNameType = 'result';
    return { [stateName]: resultStates };
};

/*
stage_states_array is the second form:
    [
    ['build', 'pass', [result1, result2]],
    ['test', 'pass', [result3]]
    ]
*/
const mkStageStatesArray = (
    stageStates: Array<{
        stage: StageNameType;
        states: StatesByCategoryType;
    }>,
): Array<StageNameStateNameStatesType> => {
    const stageStatesArray: Array<StageNameStateNameStatesType> = [];
    for (const { stage, states } of stageStates) {
        for (const [stateName, statesList] of _.toPairs(states)) {
            /** _.toPairs(obj) ===> [pair1, pair2, pair3] where pair == [key, value] */
            stageStatesArray.push([
                stage,
                stateName as StateExtendedNameType,
                statesList,
            ]);
        }
    }
    return stageStatesArray;
};

const mergeKaiAndGreenwaveState = (
    stageStatesArray: Array<StageNameStateNameStatesType>,
): void => {
    /**
     * Add kai state to greenwave state if both apply:
     * 1) greenwaveState.result.outcome == kai extended state
     * 2) greenwaveState.result.ref_url == kai message run.url
     */
    const greenwave = filterByStageName('greenwave', stageStatesArray);
    const test = filterByStageName('test', stageStatesArray);
    _.forEach(greenwave, ([_stageName, _stateName, states]) =>
        _.forEach(states as StateGreenwaveType[], (greenwaveState) => {
            const outcome = greenwaveState.result?.outcome;
            const refUrl = greenwaveState.result?.ref_url;
            if (_.isNil(outcome) || _.isNil(refUrl)) {
                return;
            }
            const kaiState = getKaiState(
                test,
                outcome as StateExtendedNameType,
                refUrl,
            );
            if (_.isNil(kaiState)) {
                return;
            }
            _.pull(states, greenwaveState);
            const newState: StateGreenwaveKaiType = {
                gs: greenwaveState,
                ks: kaiState,
            };
            states.push(newState);
        }),
    );
};

const minimizeStagesStates = (
    stageStatesArray: Array<StageNameStateNameStatesType>,
): void => {
    /**
     * This functions applies only to case where:
     * stage 1 == 'test'
     * stage 2 == 'greenwave'
     *
     * Remove any state in stage == 'test' if testcase appears anywhere in stage == 'greenwave'
     */
    const greenwave = filterByStageName('greenwave', stageStatesArray);
    const greenwaveTestNames: Array<string> = [];
    _.forEach(greenwave, ([_stageName, _stateName, states]) =>
        _.forEach(states, (state) => {
            if (isGreenwaveState(state)) {
                greenwaveTestNames.push(state.testcase);
            }
            if (isGreenwaveKaiState(state)) {
                greenwaveTestNames.push(state.gs.testcase);
            }
        }),
    );
    const test = filterByStageName('test', stageStatesArray);
    _.forEach(test, ([_stageName, _stateName, states]) => {
        _.remove(states, (state) => {
            if (!isKaiState(state)) {
                return false;
            }
            const testCaseName = getTestcaseName(state);
            return _.includes(greenwaveTestNames, testCaseName);
        });
    });
    _.remove(stageStatesArray, ([_stageName, _stateName, states]) =>
        _.isEmpty(states),
    );
};
