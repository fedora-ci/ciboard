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
import classNames from 'classnames';
import * as React from 'react';
import {
    Flex,
    Text,
    Label,
    FlexItem,
    TextContent,
    DataListCell,
    DataListItem,
    DataListToggle,
    DataListItemRow,
    DataListContent,
    DataListItemCells,
} from '@patternfly/react-core';

import styles from '../custom.module.css';
import { Artifact, StateGreenwaveKaiType } from '../artifact';
import { renderStatusIcon } from '../utils/artifactUtils';
import { ArtifactStateProps, StateLink } from './ArtifactState';
import {
    WaiveButton,
    GreenwaveWaiver,
    GreenwaveResultInfo,
    GreenwaveRequirement,
} from './ArtifactGreenwaveState';
import {
    KaiStateXunit,
    KaiReTestButton,
    KaiStateMapping,
} from './ArtifactKaiState';
import { RegisteredIcon, WeeblyIcon } from '@patternfly/react-icons';

interface GreenwaveKaiStateActionsProps {
    artifact: Artifact;
    state: StateGreenwaveKaiType;
}

export const GreenwaveKaiStateActions: React.FC<
    GreenwaveKaiStateActionsProps
> = (props) => {
    const { state, artifact } = props;
    return (
        <Flex style={{ minWidth: '15em' }}>
            <Flex flex={{ default: 'flex_1' }}>
                <WaiveButton state={state.gs} artifact={artifact} />
            </Flex>
            <Flex flex={{ default: 'flex_1' }}>
                <KaiReTestButton state={state.ks} />
            </Flex>
        </Flex>
    );
};

interface FaceForGreenwaveKaiStateProps {
    state: StateGreenwaveKaiType;
    artifact: Artifact;
    artifactDashboardUrl: string;
}

export const FaceForGreenwaveKaiState: React.FC<
    FaceForGreenwaveKaiStateProps
> = (props) => {
    const { artifact, state, artifactDashboardUrl } = props;
    const { waiver } = state.gs;
    const isWaived = _.isNumber(waiver?.id);
    const isGatingResult = _.isString(state.gs.requirement?.testcase);
    const labels: JSX.Element[] = [];
    if (isGatingResult) {
        labels.push(
            <Label
                color="blue"
                isCompact
                key="required"
                icon={<RegisteredIcon />}
            >
                required for gating
            </Label>,
        );
    }
    if (isWaived) {
        labels.push(
            <Label color="red" isCompact key="waived" icon={<WeeblyIcon />}>
                waived
            </Label>,
        );
    }
    const iconName: string = _.get(
        state,
        'requirement.type',
        _.get(state, 'result.outcome', 'unknown'),
    ).toLocaleLowerCase();
    const element = (
        <Flex>
            <Flex flex={{ default: 'flex_1' }}>
                <FlexItem>{renderStatusIcon(iconName)}</FlexItem>
                <Flex flexWrap={{ default: 'nowrap' }}>
                    <TextContent>
                        <Text>{state.gs.testcase}</Text>
                    </TextContent>
                </Flex>
                <Flex>
                    <FlexItem>{labels}</FlexItem>
                </Flex>
            </Flex>
            <Flex flex={{ default: 'flex_1' }}>
                <Flex>
                    <GreenwaveKaiStateActions
                        state={state}
                        artifact={artifact}
                    />
                </Flex>
                <Flex>
                    <StateLink
                        state={state}
                        artifactDashboardUrl={artifactDashboardUrl}
                    />
                </Flex>
            </Flex>
        </Flex>
    );
    return element;
};

export interface ArtifactGreenwaveKaiStateProps extends ArtifactStateProps {
    state: StateGreenwaveKaiType;
}

export const ArtifactGreenwaveKaiState: React.FC<
    ArtifactGreenwaveKaiStateProps
> = (props) => {
    const {
        artifact,
        artifactDashboardUrl,
        forceExpand,
        setExpandedResult,
        state,
    } = props;

    /*
     * Expand a specific testcase according to query string and scroll to it
     * ?focus=tc:<test-case-name> or ?focus=id:<pipeline-id>
     */
    const onToggle = () => {
        if (!forceExpand) {
            const key = state.gs.testcase;
            setExpandedResult(key);
        } else if (forceExpand) {
            setExpandedResult('');
        }
    };

    /** Note for info test results */
    const key = state.gs.testcase;
    const resultClasses = classNames(styles.helpSelect, styles.level2, {
        [styles.expandedResult]: forceExpand,
    });
    const toRender = (
        <DataListItem
            key={key}
            isExpanded={forceExpand}
            className={resultClasses}
            aria-labelledby="artifact-item-result"
        >
            <DataListItemRow>
                <DataListToggle
                    id="toggle"
                    onClick={onToggle}
                    isExpanded={forceExpand}
                />
                <DataListItemCells
                    className="pf-u-m-0 pf-u-p-0"
                    dataListCells={[
                        <DataListCell
                            className="pf-u-m-0 pf-u-p-0"
                            key="secondary content"
                        >
                            <FaceForGreenwaveKaiState
                                state={state}
                                artifact={artifact}
                                artifactDashboardUrl={artifactDashboardUrl}
                            />
                        </DataListCell>,
                    ]}
                />
            </DataListItemRow>
            <DataListContent
                aria-label="Detailed information on test result"
                id="ex-result-expand1"
                isHidden={!forceExpand}
            >
                {forceExpand && (
                    <>
                        <GreenwaveWaiver state={state.gs} />
                        <KaiStateXunit state={state.ks} artifact={artifact} />
                        <GreenwaveResultInfo state={state.gs} />
                        <GreenwaveRequirement state={state.gs} />
                        <KaiStateMapping state={state.ks} artifact={artifact} />
                    </>
                )}
            </DataListContent>
        </DataListItem>
    );

    return toRender;
};
