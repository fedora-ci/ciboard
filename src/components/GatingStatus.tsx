/*
 * This file is part of ciboard

 * Copyright (c) 2022, 2024 Andrei Stepanov <astepano@redhat.com>
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
import {
    Flex,
    Label,
    Spinner,
    FlexItem,
    LabelProps,
} from '@patternfly/react-core';

import { GatingStatusIcon, isGatingArtifact } from '../utils/utils';
import {
    Artifact,
    getGwDecision,
    AChildGreenwave,
    isArtifactScratch,
    GreenwaveRequirementTypes,
} from '../types';
import { mkReqStatesGreenwave } from '../utils/stages_states';

type ColorPropType = Exclude<LabelProps['color'], undefined>;

export const resultColors: Record<ColorPropType, string[]> = {
    green: ['passed'],
    red: ['errored', 'failed'],
    orange: ['missing', 'needs inspection'],

    cyan: ['waived'],
    blue: ['running'],
    purple: ['queued', 'skip'],
    gold: ['info'],
    grey: [],
};

export const resultColor = (result: string) => {
    return _.findKey(resultColors, (item) => item.indexOf(result) !== -1);
};

interface PrintRequirementsSizeProps {
    allReqs: { [key: string]: number };
    reqName: string;
}

const PrintRequirementsSize = (props: PrintRequirementsSizeProps) => {
    const { reqName, allReqs } = props;
    const color: ColorPropType =
        (resultColor(reqName) as ColorPropType | undefined) || 'grey';
    return (
        <Label variant="outline" color={color}>
            {allReqs[reqName]} {reqName}
        </Label>
    );
};

// https://pagure.io/fedora-ci/messages/blob/master/f/schemas/test-complete.yaml#_14

const gwStateMappings: Record<GreenwaveRequirementTypes, any> = {
    excluded: { default: 'excluded' },
    blacklisted: { default: 'blacklisted' },
    'test-result-failed': {
        needs_inspection: 'needs inspection',
        default: 'failed',
    },
    'test-result-passed': {
        default: 'passed',
        passed: 'passed',
        info: 'info',
        not_applicable: 'not applicable',
    },
    'test-result-missing': {
        running: 'running',
        queued: 'queued',
        default: 'missing',
    },
    'test-result-errored': { default: 'errored' },
    'invalid-gating-yaml': { default: 'invalid gating.yaml' },
    // Do not display
    'fetched-gating-yaml': { default: 'fetched gating.yaml' },
    'missing-gating-yaml': { default: 'missing  gating.yaml' },
    'failed-fetch-gating-yaml': { default: 'fail fetch gating.yaml' },
    'invalid-gating-yaml-waived': { default: 'invalid gating.yaml waived' },
    'missing-gating-yaml-waived': { default: 'missing gating.yaml waived' },
    'test-result-failed-waived': { default: 'failed waived' },
    'test-result-missing-waived': { default: 'missing waived' },
    'test-result-errored-waived': { default: 'erroredd waived' },
    'failed-fetch-gating-yaml-waived': {
        default: 'fail fetch gating.yaml waived',
    },
};

// artifact: ArtifactRpm | ArtifactContainerImage | ArtifactMbs;
interface ArtifactGreenwaveStatesSummaryProps {
    artifact: Artifact;
    isLoading?: boolean;
}

export const ArtifactGreenwaveStatesSummary: React.FC<
    ArtifactGreenwaveStatesSummaryProps
> = (props) => {
    const { artifact, isLoading } = props;
    const isScratch = isArtifactScratch(artifact);
    if (isScratch) {
        return null;
    }
    if (!isGatingArtifact(artifact)) {
        return null;
    }
    if (isLoading) {
        return <Spinner size="sm" />;
    }
    const decision = getGwDecision(artifact);
    if (!decision) {
        return null;
    }
    const reqSummary: { [name: string]: number } = {};
    const reqStatesGreenwave = mkReqStatesGreenwave(decision);
    let totalWaivers = 0;
    for (const stateName of _.keys(
        reqStatesGreenwave,
    ) as GreenwaveRequirementTypes[]) {
        if (reqStatesGreenwave.hasOwnProperty(stateName)) {
            if (stateName === 'fetched-gating-yaml') {
                /*
                 * Ignore the 'fetched-gating-yaml' virtual test as we dont display it in the UI.
                 * It is prevented from displaying in `ArtifactStatesList()`:
                 */
                continue;
            }
            const gwStates = reqStatesGreenwave[stateName] as AChildGreenwave[];
            // stateName === requirement.type
            const namingRules = gwStateMappings[stateName];
            for (const state of gwStates) {
                const resultOutcome = state.result?.outcome;
                const reqName = resultOutcome
                    ? _.get(
                          namingRules,
                          _.toLower(resultOutcome),
                          resultOutcome,
                      )
                    : namingRules['default'];
                reqSummary[reqName] = reqSummary[reqName]
                    ? reqSummary[reqName] + 1
                    : 1;
                const waived = !!state.waiver;
                if (waived) {
                    totalWaivers++;
                }
            }
        }
    }
    if (totalWaivers) {
        reqSummary['waived'] = totalWaivers;
    }
    const gatingPassed = decision?.policies_satisfied;
    const iconStyle = { height: '1.2em' };
    const statusIcon = (
        <GatingStatusIcon status={gatingPassed} style={iconStyle} />
    );
    return (
        <Flex flexWrap={{ default: 'nowrap' }}>
            <FlexItem>{statusIcon}</FlexItem>
            {_.map(reqSummary, (_len, reqName) => (
                <FlexItem key={reqName} spacer={{ default: 'spacerNone' }}>
                    <PrintRequirementsSize
                        reqName={reqName}
                        allReqs={reqSummary}
                    />
                </FlexItem>
            ))}
        </Flex>
    );
};
