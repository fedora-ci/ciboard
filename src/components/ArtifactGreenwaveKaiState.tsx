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
    DataListCell,
    DataListContent,
    DataListItem,
    DataListItemCells,
    DataListItemRow,
    DataListToggle,
    Flex,
    FlexItem,
    Label,
    Text,
    TextContent,
} from '@patternfly/react-core';
import { RegisteredIcon, WeeblyIcon } from '@patternfly/react-icons';

import styles from '../custom.module.css';
import { Artifact, StateGreenwaveKaiType } from '../artifact';
import {
    getUmbDocsUrl,
    isResultWaivable,
    renderStatusIcon,
} from '../utils/artifactUtils';
import { ArtifactStateProps, StateLink } from './ArtifactState';
import {
    GreenwaveResultInfo,
    GreenwaveWaiver,
    WaiveButton,
} from './ArtifactGreenwaveState';
import {
    KaiDetailedResults,
    KaiDocsButton,
    KaiRerunButton,
    KaiStateMapping,
    ResultNote,
} from './ArtifactKaiState';

interface GreenwaveKaiStateActionsProps {
    artifact: Artifact;
    state: StateGreenwaveKaiType;
}

export const GreenwaveKaiStateActions: React.FC<
    GreenwaveKaiStateActionsProps
> = (props) => {
    const { state, artifact } = props;
    const docsUrl = getUmbDocsUrl(state.ks.broker_msg_body);
    const rerunUrl = state.ks.broker_msg_body.run.rebuild;
    const showWaiveButton = isResultWaivable(state.gs);
    return (
        <Flex style={{ minWidth: '20em' }}>
            <Flex flex={{ default: 'flex_1' }}>
                {showWaiveButton && (
                    <WaiveButton artifact={artifact} state={state.gs} />
                )}
            </Flex>
            <Flex flex={{ default: 'flex_1' }}>
                <KaiRerunButton rerunUrl={rerunUrl} />
            </Flex>
            <Flex flex={{ default: 'flex_1' }}>
                <KaiDocsButton docsUrl={docsUrl} />
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
    const { artifact, artifactDashboardUrl, state } = props;
    const { waiver } = state.gs;
    const isWaived = _.isNumber(waiver?.id);
    const isGatingResult = _.isString(state.gs.requirement?.testcase);
    const labels: JSX.Element[] = [];
    if (isGatingResult) {
        labels.push(
            <Label
                key="gating"
                color="blue"
                icon={<RegisteredIcon />}
                isCompact
            >
                Required for gating
            </Label>,
        );
    }
    if (isWaived) {
        labels.push(
            <Label key="waived" color="orange" icon={<WeeblyIcon />} isCompact>
                Waived
            </Label>,
        );
    }
    const resultOutcome = state.gs.result?.outcome;
    const requirementType = state.gs.requirement?.type;
    /*
     * green pass icon == outcome: test-result-passed + type: NEEDS_INSPECTION
     * running icon == outcome: test-result-missing + type: RUNNING
     * Take requimentType as main creteria, unless for specific cases.
     */
    const iconName = _.includes(['test-result-missing'], requirementType)
        ? resultOutcome || requirementType || 'unknown'
        : requirementType || resultOutcome || 'unknown';
    return (
        <Flex>
            <Flex flex={{ default: 'flex_1' }}>
                <FlexItem>{renderStatusIcon(iconName)}</FlexItem>
                <TextContent>
                    <Text className="pf-u-text-nowrap">
                        {state.gs.testcase}
                    </Text>
                </TextContent>
                <Flex spaceItems={{ default: 'spaceItemsXs' }}>{labels}</Flex>
            </Flex>
            <Flex flex={{ default: 'flex_1' }}>
                <GreenwaveKaiStateActions artifact={artifact} state={state} />
                <StateLink
                    artifactDashboardUrl={artifactDashboardUrl}
                    state={state}
                />
            </Flex>
        </Flex>
    );
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
        if (forceExpand) {
            setExpandedResult('');
        } else {
            const key = state.gs.testcase;
            setExpandedResult(key);
        }
    };

    /** Note for info test results */
    const key = state.gs.testcase;
    const resultClasses = classNames(styles.helpSelect, {
        [styles.expandedResult]: forceExpand,
    });
    const toRender = (
        <DataListItem
            aria-labelledby="artifact-item-result"
            className={resultClasses}
            isExpanded={forceExpand}
            key={key}
        >
            <DataListItemRow>
                <DataListToggle
                    id="toggle"
                    isExpanded={forceExpand}
                    onClick={onToggle}
                />
                <DataListItemCells
                    className="pf-u-m-0 pf-u-p-0"
                    dataListCells={[
                        <DataListCell
                            className="pf-u-m-0 pf-u-p-0"
                            key="secondary content"
                        >
                            <FaceForGreenwaveKaiState
                                artifact={artifact}
                                artifactDashboardUrl={artifactDashboardUrl}
                                state={state}
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
                        <ResultNote state={state.ks} />
                        <GreenwaveResultInfo state={state.gs} />
                        <KaiStateMapping artifact={artifact} state={state.ks} />
                        <KaiDetailedResults
                            artifact={artifact}
                            state={state.ks}
                        />
                    </>
                )}
            </DataListContent>
        </DataListItem>
    );

    return toRender;
};
