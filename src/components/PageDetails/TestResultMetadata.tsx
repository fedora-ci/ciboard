/*
 * This file is part of ciboard
 *
 * Copyright (c) 2023 Matěj Grabovský <mgrabovs@redhat.com>
 * Copyright (c) 2023 Andrei Stepanov <astepano@redhat.com>
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
import { useContext } from 'react';
import {
    Flex,
    Text,
    Title,
    Label,
    Stack,
    Divider,
    TextContent,
    DescriptionList,
    DescriptionListTerm,
    DescriptionListGroup,
    DescriptionListDescription,
} from '@patternfly/react-core';

import styles from '../../custom.module.css';
import {
    Artifact,
    getAType,
    getThreadID,
    ArtifactType,
    StateTestMsg,
    ArtifactState,
    isStateTestMsg,
    StateGreenwave,
    isGreenwaveState,
    getDatagrepperUrl,
    isGreenwaveAndTestMsg,
    getTestMsgExtendedStatus,
} from '../../types';
import { ExternalLink } from '../ExternalLink';
import { SelectedTestContext } from './contexts';
import {
    secondsToTimestampWithTz,
    timestampToTimestampWithTz,
} from '../../utils/timeUtils';

interface GreenwaveMetadataProps {
    state: StateGreenwave;
}

function GreenwaveMetadata({ state }: GreenwaveMetadataProps) {
    /*
     * Greenwave returns a timestamp without a time zone, e.g.
     * 2023-07-19T12:14:02.630361. However, we know the timestamp
     * is in UTC, so we can append the 'Z' to make sure Moment.js
     * takes it into accoutn.
     */
    const submitTimeTz =
        state.result?.submit_time && `${state.result?.submit_time}Z`;
    const submitTimeReadable =
        submitTimeTz && timestampToTimestampWithTz(submitTimeTz);

    const items = [
        {
            label: 'ResultsDB',
            value: state.result?.href && (
                <ExternalLink hasIcon href={state.result.href}>
                    Result #{state.result.id}
                </ExternalLink>
            ),
        },
        {
            label: 'Timestamp',
            value: submitTimeReadable && (
                <time className={styles['timestamp']} dateTime={submitTimeTz}>
                    {submitTimeReadable}
                </time>
            ),
        },
        {
            label: 'Req. type',
            value: state.requirement?.type,
        },
        {
            label: 'Req. scenario',
            value: state.requirement?.scenario,
        },
        {
            label: 'Req. source',
            value: state.requirement?.source && (
                <ExternalLink hasIcon href={state.requirement.source}>
                    Link
                </ExternalLink>
            ),
        },
        {
            label: 'Outcome',
            value: state.result?.outcome,
        },
        {
            label: 'Ref. URL',
            value: state.result?.ref_url && (
                <ExternalLink hasIcon href={state.result.ref_url}>
                    Link
                </ExternalLink>
            ),
        },
    ];

    return (
        <div>
            <Title headingLevel="h3" size="lg">
                Greenwave info
            </Title>
            <DescriptionList isAutoFit isCompact isHorizontal>
                {items.map(({ label, value }, index) =>
                    // Skip undefined or null entries.
                    _.isNil(value) ? null : (
                        <DescriptionListGroup key={index}>
                            <DescriptionListTerm>{label}</DescriptionListTerm>
                            <DescriptionListDescription>
                                {value}
                            </DescriptionListDescription>
                        </DescriptionListGroup>
                    ),
                )}
            </DescriptionList>
        </div>
    );
}

interface KaiMetadataProps {
    artifactType: ArtifactType;
    state: StateTestMsg;
}

function KaiMetadata(props: KaiMetadataProps) {
    const { artifactType, state } = props;

    const messageId = state.hitSource.rawData.message.brokerMsgId;
    const datagrepperUrl = getDatagrepperUrl(messageId, artifactType);
    // The original time is in milliseconds since the Unix epoch.
    const timestampMillis = state.hitSource.timestamp;
    const timestampUnix = timestampMillis / 1000;
    const submitTime = secondsToTimestampWithTz(timestampUnix);
    // `Date()`, on the other hand, expects milliseconds.
    const submitTimeIso8601 = new Date(timestampMillis).toISOString();

    const items = [
        {
            label: 'Message',
            value: (
                <ExternalLink hasIcon href={datagrepperUrl}>
                    {messageId}
                </ExternalLink>
            ),
        },
        {
            label: 'Timestamp',
            value: (
                <time
                    className={styles['timestamp']}
                    dateTime={submitTimeIso8601}
                >
                    {submitTime}
                </time>
            ),
        },
        {
            label: 'Status',
            value: getTestMsgExtendedStatus(state),
        },
        {
            label: 'Thread ID',
            value: getThreadID(state),
        },
        {
            label: 'Message version',
            value: state.kai_state.version,
        },
    ];

    return (
        <div>
            <Title headingLevel="h3" size="lg">
                UMB info
            </Title>
            <DescriptionList isAutoFit isCompact isHorizontal>
                {items.map(({ label, value }, index) =>
                    // Skip undefined or null entries.
                    _.isNil(value) ? null : (
                        <DescriptionListGroup key={index}>
                            <DescriptionListTerm>{label}</DescriptionListTerm>
                            <DescriptionListDescription>
                                {value}
                            </DescriptionListDescription>
                        </DescriptionListGroup>
                    ),
                )}
            </DescriptionList>
        </div>
    );
}

interface SourceLabelsProps {
    state: ArtifactState;
}

function SourceLabels({ state }: SourceLabelsProps) {
    return (
        <>
            {(isGreenwaveState(state) || isGreenwaveAndTestMsg(state)) && (
                <Label color="green">Greenwave</Label>
            )}
            {(isStateTestMsg(state) || isGreenwaveAndTestMsg(state)) && (
                <Label color="green">UMB</Label>
            )}
        </>
    );
}

interface TestResultMetadataProps {
    artifact?: Artifact;
}

export function TestResultMetadata({ artifact }: TestResultMetadataProps) {
    const selectedTest = useContext(SelectedTestContext);
    if (!artifact || !selectedTest) return null;
    const state = selectedTest.originalState;
    const aType = getAType(artifact);

    return (
        <Stack hasGutter>
            <TextContent>
                <Text>
                    The information on this tab are mostly useful only for
                    debugging CI systems.
                </Text>
            </TextContent>
            <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                <span>Source of data:</span>
                <SourceLabels state={state} />
            </Flex>
            {isGreenwaveState(state) && (
                <>
                    <Divider />
                    <GreenwaveMetadata state={state} />
                </>
            )}
            {isStateTestMsg(state) && (
                <>
                    <Divider />
                    <KaiMetadata artifactType={aType} state={state} />
                </>
            )}
            {isGreenwaveAndTestMsg(state) && (
                <>
                    <Divider />
                    <GreenwaveMetadata state={state.gs} />
                    <Divider />
                    <KaiMetadata artifactType={aType} state={state.ms} />
                </>
            )}
        </Stack>
    );
}
