/*
 * This file is part of ciboard
 *
 * Copyright (c) 2023 Matěj Grabovský <mgrabovs@redhat.com>
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

import {
    Button,
    Flex,
    FlexItem,
    TextContent,
    Title,
} from '@patternfly/react-core';
import { AngleLeftIcon } from '@patternfly/react-icons';

import { GatingStatusIcon } from '../../utils/artifactUtils';

export function BackButton(_props: {}) {
    return (
        <Button className="pf-u-px-0" icon={<AngleLeftIcon />} variant="link">
            Back to results list
        </Button>
    );
}

export interface SummaryHeaderProps {
    gatingStatus?: 'fail' | 'pass';
    gatingTag?: string;
    isScratch?: boolean;
    nvr: string;
    owner: string;
}

// TODO: Better naming.
export function SummaryHeader(props: SummaryHeaderProps) {
    return (
        <Flex spaceItems={{ default: 'spaceItemsLg' }}>
            <TextContent>
                <Title headingLevel="h1">{props.nvr}</Title>
            </TextContent>
            <FlexItem spacer={{ default: 'spacerXl' }}></FlexItem>
            {/* TODO: Replace with real gating status. See `ArtifactGreenwaveStatesSummary`. */}
            {props.gatingStatus && (
                <TextContent>
                    <GatingStatusIcon status={props.gatingStatus === 'pass'} />{' '}
                    <span className="pf-u-danger-color-100 pf-u-font-weight-bold">
                        2 err
                    </span>{' '}
                    <span className="pf-u-success-color-100 pf-u-font-weight-bold">
                        6 ok
                    </span>
                </TextContent>
            )}
            {props.isScratch && <span className="pf-u-color-200">scratch</span>}
            {!props.isScratch && props.gatingTag && (
                <span className="pf-u-color-200" title="Gating tag">
                    {props.gatingTag}
                </span>
            )}
        </Flex>
    );
}
