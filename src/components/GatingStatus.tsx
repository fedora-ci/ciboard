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
import React from 'react';
import {
    Flex,
    Text,
    Title,
    Spinner,
    FlexItem,
    TitleSizes,
    TextContent,
} from '@patternfly/react-core';

import {
    resultColor,
    GatingStatusIcon,
    isGatingArtifact,
} from '../utils/utils';
import { Artifact, getGwDecision } from '../types';

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

interface PrintRequirementsSizeProps {
    allReqs: { [key: string]: number };
    reqName: string;
}

interface ArtifactGreenwaveStatesSummaryProps {
    artifact: Artifact;
    isLoading?: boolean;
}

export const ArtifactGreenwaveStatesSummary: React.FC<
    ArtifactGreenwaveStatesSummaryProps
> = (props) => {
    const { artifact, isLoading } = props;
    if (!isGatingArtifact(artifact)) {
        return null;
    }
    const decision = getGwDecision(artifact);
    const isScratch = _.get(artifact, 'payload.scratch', true);
    if (isScratch) {
        return null;
    }
    if (_.isNil(decision) && !isLoading) {
        return null;
    }
    const reqSummary: { [name: string]: number } = {};
    /*
     * Ignore the 'fetched-gating-yaml' virtual test as we dont display it in the UI.
     * It is prevented from displaying in `ArtifactStatesList()`:
     *     `if (stateName === 'fetched-gating-yaml') continue;`
     */
    const unsatisfiedCount = decision?.unsatisfied_requirements?.length;
    const satisfiedCount = decision?.satisfied_requirements?.filter(
        ({ type }) => type !== 'fetched-gating-yaml',
    ).length;
    if (unsatisfiedCount) {
        reqSummary['err'] = unsatisfiedCount;
    }
    if (satisfiedCount) {
        reqSummary['ok'] = satisfiedCount;
    }
    const gatingPassed = decision?.policies_satisfied;
    const iconStyle = { height: '1.2em' };
    const statusIcon = isLoading ? null : (
        <GatingStatusIcon status={gatingPassed} style={iconStyle} />
    );
    return (
        <Flex flexWrap={{ default: 'nowrap' }}>
            <FlexItem>
                <TextContent>
                    <Text>{statusIcon}</Text>
                </TextContent>
            </FlexItem>
            {_.map(reqSummary, (_len, reqName) => (
                <FlexItem key={reqName} spacer={{ default: 'spacerMd' }}>
                    <PrintRequirementsSize
                        reqName={reqName}
                        allReqs={reqSummary}
                    />
                </FlexItem>
            ))}
            {isLoading && (
                <FlexItem spacer={{ default: 'spacerMd' }}>
                    <Spinner size="sm" />
                </FlexItem>
            )}
        </Flex>
    );
};
