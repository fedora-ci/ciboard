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

import * as _ from 'lodash';
import {
    Button,
    Flex,
    FlexItem,
    Stack,
    StackItem,
    TextContent,
    Title,
} from '@patternfly/react-core';
import {
    AngleLeftIcon,
    CodeBranchIcon,
    CubeIcon,
} from '@patternfly/react-icons';
import { Artifact } from '../../artifact';

import { mkLinkKojiWebTask } from '../../utils/artifactUtils';
import { ExternalLink } from '../ExternalLink';
import { ArtifactGreenwaveStatesSummary } from '../GatingStatus';

function BackButton(_props: {}) {
    return (
        <Button className="pf-u-px-0" icon={<AngleLeftIcon />} variant="link">
            Back to results list
        </Button>
    );
}

interface SummaryHeaderProps {
    artifact: Artifact;
    gatingTag?: string;
    isScratch?: boolean;
    nvr: string;
    owner: string;
}

function ArtifactTitle(props: SummaryHeaderProps) {
    const hasGatingDecision = !_.isNil(props.artifact.greenwave_decision);

    return (
        <Flex spaceItems={{ default: 'spaceItemsLg' }}>
            <TextContent>
                <Title headingLevel="h1">{props.nvr}</Title>
            </TextContent>
            <FlexItem spacer={{ default: 'spacerXl' }}></FlexItem>
            {hasGatingDecision && (
                <ArtifactGreenwaveStatesSummary artifact={props.artifact} />
            )}
            {props.isScratch && <span className="pf-u-color-200">scratch</span>}
            {!props.isScratch && props.gatingTag && (
                <span className="pf-u-color-200" title="Gating tag">
                    <CodeBranchIcon /> {props.gatingTag}
                </span>
            )}
        </Flex>
    );
}

interface PageHeaderProps {
    artifact: Artifact;
    gatingStatus?: 'fail' | 'pass';
    gatingTag?: string;
    hasBackLink?: boolean;
    isScratch?: boolean;
    nvr: string;
    owner: string;
}

export function ArtifactHeader(props: PageHeaderProps) {
    const { artifact } = props;
    // TODO: Use the correct label (Brew, MBS, Compose).
    const artifactLabel = `Brew #${artifact.aid}`;
    // TODO: Use the correct service and instance.
    const artifactUrl = mkLinkKojiWebTask(artifact.aid, 'rh');
    const externalLink = (
        <ExternalLink href={artifactUrl}>
            <CubeIcon
                className="pf-u-mr-xs"
                style={{ verticalAlign: '-.125em' }}
            />{' '}
            {artifactLabel}
        </ExternalLink>
    );

    return (
        <Stack className="resultsNarrower">
            {props.hasBackLink && (
                <StackItem>
                    <BackButton />
                </StackItem>
            )}
            <StackItem>{externalLink}</StackItem>
            <StackItem>
                <ArtifactTitle
                    artifact={artifact}
                    gatingTag={props.gatingTag}
                    nvr={props.nvr}
                    owner={props.owner}
                />
            </StackItem>
        </Stack>
    );
}