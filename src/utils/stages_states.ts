/*
 * This file is part of ciboard

 * Copyright (c) 2022, 2023 Andrei Stepanov <astepano@redhat.com>
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
    MSG_V_1,
    Artifact,
    ChildMsg,
    MSG_V_0_1,
    StateName,
    MsgStageName,
    ChildTestMsg,
    ArtifactChild,
    KnownMsgStates,
    getTestMsgBody,
    ChildGreenwave,
    isChildTestMsg,
    getTestcaseName,
    GreenwaveResult,
    isGreenwaveChild,
    ChildrenByStateName,
    GreenwaveRequirement,
    isGreenwaveAndTestMsg,
    GreenwaveDecisionReply,
    TestMsgStateName,
    ChildGreenwaveAndTestMsg,
    GreenwaveRequirementTypes,
} from '../types';

/**
 * Derived from topic
 *
 * Stage can be: 'build', 'dispatch', 'test', 'promote', etc....
 * stage (in standard called as `event`) is always the second item from the end of the topic
 * Examples:
 *
 * * pull-request.test.error -> test
 * * brew-build.promote.error -> promote
 *
 * State is always the latest part of the topic
 * Examples:
 *
 *  * brew-build.promote.error -> error
 *  * brew-build.test.complete -> complete
 */

// XXX: rename
export type StageNameStateNameStates = [
    MsgStageName,
    StateName,
    ArtifactChild[],
];

/**
 * Entry point. This file is the most complicated part in this project.
 */
export const mkStagesAndStates = (
    artifact: Artifact,
): StageNameStateNameStates[] => {
    const stagesStates: Array<{
        stage: MsgStageName;
        children: ChildrenByStateName;
    }> = [];
    // Preprocess Kai results into a list of results sorted by stage and state.
    const kaiStagesStates = mkStagesTestStates(artifact);
    stagesStates.push(...kaiStagesStates);
    /*
     * Greenwave always produces structured-reply, check if this reply makes any sense.
     * TODO: Move this into a parsing and validation module.
     */
    if (
        artifact.greenwaveDecision &&
        _.isBoolean(artifact.greenwaveDecision?.policies_satisfied)
    ) {
        /*
         * Preprocess Greenwave response into a list of results sorted by state.
         * The stage is fixed to 'greenwave' for all of them.
         */
        const greenwaveStageStates = mkGreenwaveStageStates(
            artifact.greenwaveDecision,
        );
        stagesStates.push(greenwaveStageStates);
    } else {
        console.warn('Greenwave response seems invalid');
    }
    /*
     * Merge all the results into a list of triples with the structure
     *   [stage, state, [result1, ..., resultN]]
     */
    const stageStatesArray = mkStageStatesArray(stagesStates);
    /*
     * Merge Kai and Greenwave results corresponding to the same test into a single
     * consolidated structure.
     */
    mergeKaiAndGreenwaveState(stageStatesArray);
    /*
     * Remove superfluous items left over after the merge.
     */
    minimizeStagesStates(stageStatesArray);
    return stageStatesArray;
};

/**
 * Find all stage-state combinations in the given stage.
 * @param stage The result stage to looks for.
 * @param stagesStates Array of stage-state combinations to traverse.
 * @returns All items from the `stagesStates` array that are in the stage `stage`.
 */
const filterByStageName = (
    stage: MsgStageName,
    stagesStates: StageNameStateNameStates[],
) =>
    _.filter(
        stagesStates,
        ([stageName, _stateName, _state]) => stageName === stage,
    );

const getKaiState = (
    states: StageNameStateNameStates[],
    stateNameReq: TestMsgStateName,
    runUrl: string,
    msgId: string | undefined,
): ChildTestMsg | undefined => {
    const s = _.find(
        states,
        ([_stageName, stateName, _states]) =>
            stateNameReq.toLocaleLowerCase() === stateName.toLocaleLowerCase(),
    );
    if (_.isNil(s)) return;
    const [_stageName, _stateName, testStates] = s;
    const kaiState = _.find(testStates as ChildTestMsg[], (child) => {
        /* this is broken and should be removed */
        const testMsg = getTestMsgBody(child);
        const theSameRefUrl = runUrl === testMsg.run.url;
        /*
         * Next test should stay. It must be the only 1 way to test Greenwave-to-Kai correspondance.
         * It must be done by using by msg_id
         * When https://issues.redhat.com/browse/OSCI-3605 is closed remove `theSameRefUrl` test.
         */
        const theSameMsgId =
            _.isString(msgId) &&
            !_.isEmpty(msgId) &&
            msgId === child.hitSource.rawData.message.brokerMsgId;
        return theSameMsgId || theSameRefUrl;
    });
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
// XXX: was: mkStagesKaiStates
const mkStagesTestStates = (
    artifact: Artifact,
): {
    stage: MsgStageName;
    children: ChildrenByStateName;
}[] => {
    const stageStates = [];
    const buildStates = _.omitBy(
        transformTestMsgStates(artifact.children.hits, 'build'),
        (x) => _.isEmpty(x),
    );
    if (_.some(_.values(buildStates), 'length')) {
        const stage: MsgStageName = 'build';
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
    // XXXXXXXX ?????????????
    let testStates: ChildrenByStateName = transformTestMsgStates(
        artifact.children.hits,
        'test',
    );
    testStates = _.omitBy(testStates, (x) => _.isEmpty(x));
    if (_.some(_.values(testStates), 'length')) {
        const stage: MsgStageName = 'test';
        stageStates.push({ stage, states: testStates });
    }
    return stageStates;
};

const mkGreenwaveStateReq = (
    req: GreenwaveRequirement,
    decision: GreenwaveDecisionReply,
): ChildGreenwave => {
    const state: ChildGreenwave = {
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
    decision: GreenwaveDecisionReply,
): {
    /* stage is always `greenwave` */
    stage: MsgStageName;
    children: ChildrenByStateName;
} => {
    const children: ChildrenByStateName = {};
    const reqStatesGreenwave = mkReqStatesGreenwave(decision);
    const resultStatesGreenwave = mkResultStatesGreenwave(decision);
    _.assign(states, reqStatesGreenwave, resultStatesGreenwave);
    return { stage: 'greenwave', states };
};

const mkReqStatesGreenwave = (
    decision: GreenwaveDecisionReply,
): ChildrenByStateName => {
    const { satisfied_requirements, unsatisfied_requirements } = decision;
    const requirements: GreenwaveRequirement[] = _.concat(
        satisfied_requirements,
        unsatisfied_requirements,
    );
    /* {'test-result-passed' : [GreenwaveRequirementType], 'fetched-gating-yaml' : ... } */
    const requirementsByType = _.groupBy(requirements, 'type');
    /* {'test-result-passed' : [StateGreenWaveType], 'fetched-gating-yaml' : ... } */
    const statesByReqType: ChildrenByStateName = {};
    _.forOwn(
        requirementsByType,
        (
            reqsByType: GreenwaveRequirement[],
            reqType /* GreenwaveRequirementTypesType */,
        ) => {
            /* [r1,r2,r3] => [{req:r1}, {req:r2}, {req:r3}] */
            const greenwaveStates: ChildGreenwave[] = _.map(reqsByType, (req) =>
                mkGreenwaveStateReq(req, decision),
            );
            statesByReqType[reqType as GreenwaveRequirementTypes] =
                greenwaveStates;
        },
    );
    return statesByReqType;
};

const mkResultStatesGreenwave = (
    decision: GreenwaveDecisionReply,
): ChildrenByStateName => {
    const { satisfied_requirements, unsatisfied_requirements, results } =
        decision;
    const requirements: GreenwaveRequirement[] = _.concat(
        satisfied_requirements,
        unsatisfied_requirements,
    );
    const resultsToShow: GreenwaveResult[] = _.filter(
        results,
        (result) =>
            !requirements.some((req) => result.testcase.name === req.testcase),
    );
    const resultStates: ChildGreenwave[] = _.map(
        resultsToShow,
        (res): ChildGreenwave => ({
            testcase: res.testcase.name,
            result: res,
        }),
    );
    return { 'additional-tests': resultStates };
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
        stage: MsgStageName;
        children: ChildrenByStateName;
    }>,
): StageNameStateNameStates[] => {
    const stageStatesArray: StageNameStateNameStates[] = [];
    for (const { stage, states } of stageStates) {
        for (const [stateName, statesList] of _.toPairs(states)) {
            /** _.toPairs(obj) ===> [pair1, pair2, pair3] where pair == [key, value] */
            stageStatesArray.push([
                stage,
                stateName as TestMsgStateName,
                statesList,
            ]);
        }
    }
    return stageStatesArray;
};

const mergeKaiAndGreenwaveState = (
    stageStatesArray: StageNameStateNameStates[],
): void => {
    /**
     * Add Kai state to Greenwave state if both apply:
     * 1) greenwaveState.result.outcome == Kai extended state
     * 2) greenwaveState.result.ref_url == Kai message run.url
     */
    const greenwaveStageStates = filterByStageName(
        'greenwave',
        stageStatesArray,
    );
    const kaiStageStates = filterByStageName('test', stageStatesArray);
    _.forEach(greenwaveStageStates, ([_stageName, _stateName, children]) => {
        _.forEach(children as ChildGreenwave[], (greenwaveState, index) => {
            const outcome = greenwaveState.result?.outcome;
            const refUrl = greenwaveState.result?.ref_url;
            const msgId = greenwaveState.result?.data.msg_id?.[0];
            if (_.isNil(outcome) || _.isNil(refUrl)) {
                return;
            }
            const kaiState = getKaiState(
                kaiStageStates,
                _.toLower(outcome) as TestMsgStateName,
                refUrl,
                msgId,
            );
            if (_.isNil(kaiState)) {
                return;
            }
            const newState: ChildGreenwaveAndTestMsg = {
                gs: greenwaveState,
                ms: kaiState,
            };
            children[index] = newState;
        });
    });
};

/**
 * Remove states from `test` stage that also appear in the `greenwave` stage.
 */
const minimizeStagesStates = (
    stageStatesArray: StageNameStateNameStates[],
): void => {
    const greenwave = filterByStageName('greenwave', stageStatesArray);
    // Consolidate all Greenwave and Greenwave+Kai results into a single array.
    const greenwaveTestNames: string[] = [];
    _.forEach(greenwave, ([_stageName, _stateName, states]) =>
        _.forEach(states, (state) => {
            if (isGreenwaveChild(state)) {
                greenwaveTestNames.push(state.testcase);
            }
            if (isGreenwaveAndTestMsg(state)) {
                greenwaveTestNames.push(state.gs.testcase);
            }
        }),
    );
    // Remove Kai results that appear in the above array.
    const test = filterByStageName('test', stageStatesArray);
    _.forEach(test, ([_stageName, _stateName, children]) => {
        _.remove(children, (child) => {
            if (!isChildTestMsg(child)) {
                return false;
            }
            const testCaseName = getTestcaseName(child);
            return _.includes(greenwaveTestNames, testCaseName);
        });
    });
    // Remove stage-state combinations that have no results in them afterwards.
    _.remove(stageStatesArray, ([_stageName, _stateName, states]) =>
        _.isEmpty(states),
    );
};

const getTestCompleteResult = (
    state: ChildTestMsg,
    reqStage: MsgStageName,
    reqState: StateName,
): string | undefined => {
    if (
        state.hitSource.msgStage !== reqStage ||
        state.hitSource.msgState !== reqState
    ) {
        return undefined;
    }
    let testResult: string | undefined;
    const testMsg = getTestMsgBody(state);
    if (MSG_V_0_1.isMsg(testMsg)) {
        const broker_msg = testMsg as MSG_V_0_1.MsgRPMBuildTestComplete;
        testResult = broker_msg.status;
    }
    if (MSG_V_1.isMsg(testMsg)) {
        const broker_msg = testMsg as MSG_V_1.MsgRPMBuildTestComplete;
        testResult = broker_msg.test.result;
    }
    return testResult;
};

/**
 * Transforms state provided by kai to expected states in UI.
 *
 * For test events in the complete state is split between passed and failed.
 *
 * For build events the error is recognized as a failed state.
 *
 * for stage == 'test' replace complete: [] ==> failed: [], info: [], passed: []
 * From: [ state1, state2, state3, ...]
 * To:   { error: [], queued: [], running: [], failed: [], info: [], passed: [] }
 */
// was: transformKaiStates
export const transformTestMsgStates = (
    children: ChildMsg[],
    stage: MsgStageName,
): ChildrenByStateName => {
    const statesByCategory: ChildrenByStateName = {};
    /** statesNames: ['running', 'complete'] */
    const statesNames: StateName[] = _.intersection<StateName>(
        _.map(children, _.flow(_.identity, _.partialRight(_.get, 'msgState'))),
        KnownMsgStates,
    );
    _.forEach(statesNames, (stateName) => {
        /**
         * For complete test states, count failed, passed and other events
         */
        /**
         * complete tests to extended: [passed, failed, info, needs_inspection, not_applicable]
         */
        if (stateName === 'complete' && stage === 'test') {
            /**
             * pass tests
             */
            const category_passed = _.filter(
                children,
                (child: ChildTestMsg) => {
                    const testResult = getTestCompleteResult(
                        child,
                        stage,
                        stateName,
                    );
                    return _.includes(
                        ['PASS', 'PASSED'],
                        _.toUpper(testResult),
                    );
                },
            );
            if (!_.isEmpty(category_passed)) {
                statesByCategory.passed = category_passed;
            }
            /**
             * failed tests
             */
            const category_failed = _.filter(
                children,
                (child: ChildTestMsg) => {
                    const testResult = getTestCompleteResult(
                        child,
                        stage,
                        stateName,
                    );
                    return _.includes(
                        ['FAIL', 'FAILED'],
                        _.toUpper(testResult),
                    );
                },
            );
            if (!_.isEmpty(category_failed)) {
                statesByCategory.failed = category_failed;
            }
            /**
             * info tests
             */
            const category_info = _.filter(children, (child: ChildTestMsg) => {
                const testResult = getTestCompleteResult(
                    child,
                    stage,
                    stateName,
                );
                return _.isEqual('INFO', _.toUpper(testResult));
            });
            if (!_.isEmpty(category_info)) {
                statesByCategory.info = category_info;
            }
            /**
             * needs_inspection tests
             */
            const category_needs_inspections = _.filter(
                children,
                (state: ChildTestMsg) => {
                    const testResult = getTestCompleteResult(
                        state,
                        stage,
                        stateName,
                    );
                    return _.isEqual('NEEDS_INSPECTION', _.toUpper(testResult));
                },
            );
            if (!_.isEmpty(category_needs_inspections)) {
                statesByCategory.needs_inspection = category_needs_inspections;
            }
            /**
             * not_applicable tests
             */
            const category_not_applicable = _.filter(
                children,
                (child: ChildTestMsg) => {
                    const testResult = getTestCompleteResult(
                        child,
                        stage,
                        stateName,
                    );
                    return _.isEqual('NOT_APPLICABLE', _.toUpper(testResult));
                },
            );
            if (!_.isEmpty(category_not_applicable)) {
                statesByCategory.not_applicable = category_not_applicable;
            }
        } else if (stateName === 'error' && stage === 'build') {
            const category_failed = _.filter(
                children,
                (child: ChildTestMsg) => {
                    if (
                        child.hitSource.msgStage === stage &&
                        child.hitSource.msgState === stateName
                    ) {
                        return true;
                    }
                    return false;
                },
            );
            if (!_.isEmpty(category_failed)) {
                statesByCategory.failed = category_failed;
            }
        } else {
            /** other categories for asked stage */
            const category_other = _.filter(children, (child: ChildTestMsg) => {
                const hitSource = child.hitSource;
                if (
                    hitSource.msgStage === stage &&
                    hitSource.msgState === stateName
                ) {
                    return true;
                }
                return false;
            });
            if (!_.isEmpty(category_other)) {
                statesByCategory[stateName] = category_other;
            }
        }
    });

    return statesByCategory;
};
