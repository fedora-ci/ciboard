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

import _ from 'lodash';
import classNames from 'classnames';
import * as React from 'react';
import { useDispatch } from 'react-redux';
import {
    Alert,
    Button,
    DataListCell,
    DataListContent,
    DataListItem,
    DataListItemCells,
    DataListItemRow,
    DataListToggle,
    DescriptionList,
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm,
    Flex,
    FlexItem,
    Label,
    Text,
    TextContent,
} from '@patternfly/react-core';

import {
    OutlinedThumbsUpIcon,
    RegisteredIcon,
    ThumbsUpIcon,
    WeeblyIcon,
} from '@patternfly/react-icons';

import styles from '../custom.module.css';
import {
    LinkifyNewTab,
    isResultWaivable,
    renderStatusIcon,
    timestampForUser,
} from '../utils/artifactUtils';
import { Artifact, StateGreenwaveType } from '../artifact';
import { ArtifactStateProps } from './ArtifactState';
import {
    StateDetailsEntry,
    StateLink,
    mkLabel,
    mkPairs,
} from './ArtifactState';
import { createWaiver } from '../actions';
import { KaiRerunButton } from './ArtifactKaiState';

export interface PropsWithGreenwaveState {
    state: StateGreenwaveType;
}

export interface WaiveButtonProps extends PropsWithGreenwaveState {
    artifact: Artifact;
}

export const WaiveButton: React.FC<WaiveButtonProps> = (props) => {
    const { state, artifact } = props;
    const { requirement } = state;
    const dispatch = useDispatch();
    if (_.isNil(requirement?.testcase)) return null;
    const onClick: React.MouseEventHandler = (e) => {
        e.stopPropagation();
        dispatch(createWaiver(artifact, state));
    };
    const resultClasses = classNames(styles['actionButton']);
    return (
        <Button
            className={resultClasses}
            isSmall
            onClick={onClick}
            variant="control"
        >
            <OutlinedThumbsUpIcon /> <span>waive</span>
        </Button>
    );
};

export interface GreenwaveStateActionsProps extends PropsWithGreenwaveState {
    artifact: Artifact;
}

export const GreenwaveStateActions: React.FC<GreenwaveStateActionsProps> = (
    props,
) => {
    const { artifact, state } = props;
    const rerunUrl = _.first(state.result?.data.rebuild);
    const showWaiveButton = isResultWaivable(state);
    return (
        <Flex style={{ minWidth: '15em' }}>
            <Flex flex={{ default: 'flex_1' }}>
                {showWaiveButton && (
                    <WaiveButton artifact={artifact} state={state} />
                )}
            </Flex>
            <Flex flex={{ default: 'flex_1' }}>
                <KaiRerunButton rerunUrl={rerunUrl} />
            </Flex>
        </Flex>
    );
};

const resultMapping = [
    ['submit_time', 'submited', _.partialRight(timestampForUser, true)],
    ['id', 'result id'],
    ['href', 'resultsdb url'],
    ['note', 'note'],
    ['outcome', 'outcome'],
    /**
     * based on internal resultdb logic
     * https://github.com/release-engineering/resultsdb-updater/pull/131
     * https://issues.redhat.com/browse/RHELWF-5987
     */
    ['testcase.ref_url', 'testcase info'],
];

export const GreenwaveResultInfo: React.FC<PropsWithGreenwaveState> = (
    props,
) => {
    const { result } = props.state;
    if (!result) return null;
    const pairs = mkPairs(resultMapping, result);
    if (_.isEmpty(pairs)) return null;
    const elements: JSX.Element[] = pairs.map(([name, value]) =>
        mkLabel(name, value, 'orange'),
    );
    return (
        <StateDetailsEntry caption="Result info">
            <Flex>
                <FlexItem>
                    <DescriptionList
                        isCompact
                        isHorizontal
                        columnModifier={{
                            default: '2Col',
                        }}
                    >
                        {elements}
                    </DescriptionList>
                </FlexItem>
            </Flex>
        </StateDetailsEntry>
    );
};

export const GreenwaveWaiver: React.FC<PropsWithGreenwaveState> = (props) => {
    const { waiver } = props.state;
    if (!waiver) return null;
    const humanTime = timestampForUser(waiver.timestamp);
    return (
        <Alert
            customIcon={<ThumbsUpIcon />}
            isInline
            title="Test result waived"
            variant="warning"
        >
            <TextContent className="pf-u-font-size-sm">
                <Text component="p">
                    This test result was waived by <b>{waiver.username}</b> on{' '}
                    {humanTime} with the following comment:
                </Text>
                <Text component="p">
                    <LinkifyNewTab>{waiver.comment}</LinkifyNewTab>
                </Text>
            </TextContent>
        </Alert>
    );
};

export const GreenwaveResultData: React.FC<PropsWithGreenwaveState> = (
    props,
) => {
    const { state } = props;
    const { result } = state;
    if (_.isUndefined(result) || !_.isObject(result?.data)) {
        return null;
    }
    const mkItem = (name: string, values: string[]): JSX.Element => {
        const valuesRendered: Array<JSX.Element | string> = _.map(
            values,
            (v, index) => {
                return <LinkifyNewTab key={index}>{v}</LinkifyNewTab>;
            },
        );
        return (
            <DescriptionListGroup key={name}>
                <DescriptionListTerm>{name}</DescriptionListTerm>
                <DescriptionListDescription>
                    <Label
                        isCompact
                        color="cyan"
                        icon={null}
                        variant="filled"
                        isTruncated
                    >
                        {valuesRendered}
                    </Label>
                </DescriptionListDescription>
            </DescriptionListGroup>
        );
    };
    const items: Array<JSX.Element> = [];
    /* result.data is array */
    _.map(result.data, (values, k) => {
        const item = mkItem(k, values);
        items.push(item);
    });
    if (_.isEmpty(items)) {
        return null;
    }
    return (
        <StateDetailsEntry caption="Result data">
            <Flex>
                <DescriptionList
                    columnModifier={{
                        default: '2Col',
                    }}
                    isCompact
                    isHorizontal
                >
                    {items}
                </DescriptionList>
            </Flex>
        </StateDetailsEntry>
    );
};

export interface FaceForGreenwaveStateProps extends PropsWithGreenwaveState {
    artifact: Artifact;
    artifactDashboardUrl: string;
}

export const FaceForGreenwaveState: React.FC<FaceForGreenwaveStateProps> = (
    props,
) => {
    const { artifact, artifactDashboardUrl, state } = props;
    const { waiver } = state;
    const isWaived = _.isNumber(waiver?.id);
    const isGatingResult = _.isString(state.requirement?.testcase);
    const labels: JSX.Element[] = [];
    if (isGatingResult) {
        labels.push(
            <Label color="blue" icon={<RegisteredIcon />} isCompact>
                Required for gating
            </Label>,
        );
    }
    if (isWaived) {
        labels.push(
            <Label color="orange" icon={<WeeblyIcon />} isCompact>
                Waived
            </Label>,
        );
    }
    const resultOutcome = state.result?.outcome;
    const requimentType = state.requirement?.type;
    const iconName = _.compact([resultOutcome, requimentType, 'unknown'])[0];
    return (
        <Flex>
            <Flex flex={{ default: 'flex_1' }}>
                <FlexItem>{renderStatusIcon(iconName)}</FlexItem>
                <TextContent>
                    <Text className="pf-u-text-nowrap">{state.testcase}</Text>
                </TextContent>
                <Flex spaceItems={{ default: 'spaceItemsXs' }}>{labels}</Flex>
            </Flex>
            <Flex flex={{ default: 'flex_1' }}>
                <GreenwaveStateActions artifact={artifact} state={state} />
                <StateLink
                    artifactDashboardUrl={artifactDashboardUrl}
                    state={state}
                />
            </Flex>
        </Flex>
    );
};

export type ArtifactGreenwaveStateProps = ArtifactStateProps &
    PropsWithGreenwaveState;

export const ArtifactGreenwaveState: React.FC<ArtifactGreenwaveStateProps> = (
    props,
) => {
    const {
        state,
        artifact,
        forceExpand,
        setExpandedResult,
        artifactDashboardUrl,
    } = props;

    const { testcase } = state;
    /*
     * Expand a specific testcase according to query string and scroll to it
     * ?focus=tc:<test-case-name> or ?focus=id:<pipeline-id>
     */
    const onToggle = () => {
        setExpandedResult(forceExpand ? '' : testcase);
    };
    /** Note for info test results */
    const resultClasses = classNames(styles.helpSelect, {
        [styles.expandedResult]: forceExpand,
    });
    const toRender = (
        <DataListItem
            key={testcase}
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
                            <FaceForGreenwaveState
                                artifact={artifact}
                                artifactDashboardUrl={artifactDashboardUrl}
                                state={state}
                            />
                        </DataListCell>,
                    ]}
                />
            </DataListItemRow>
            <DataListContent
                aria-label="Primary Content Result Details"
                id="ex-result-expand1"
                isHidden={!forceExpand}
            >
                {forceExpand && (
                    <>
                        <GreenwaveWaiver state={state} />
                        <GreenwaveResultInfo state={state} />
                        <GreenwaveResultData state={state} />
                    </>
                )}
            </DataListContent>
        </DataListItem>
    );

    return toRender;
};
