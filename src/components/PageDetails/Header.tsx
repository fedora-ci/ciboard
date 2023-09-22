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
    Flex,
    Stack,
    Title,
    FlexItem,
    StackItem,
    TextContent,
} from '@patternfly/react-core';
import { CodeBranchIcon, CubeIcon, UserIcon } from '@patternfly/react-icons';

import { Artifact, isArtifactScratch } from '../../artifact';
import {
    getArtifactName,
    getArtifacIssuer,
    getArtifactGatingTag,
    getArtifactRemoteUrl,
    getArtifactTypeLabel,
    getArtifactId,
} from '../../utils/artifactUtils';
import { ExternalLink } from '../ExternalLink';
import { ArtifactGreenwaveStatesSummary } from '../GatingStatus';

interface ArtifactTitleProps {
    artifact: Artifact;
}

function ArtifactTitle(props: ArtifactTitleProps) {
    const { artifact } = props;
    const { hitSource } = artifact;
    const gatingTag = getArtifactGatingTag(artifact);
    const hasGatingDecision = !_.isNil(artifact.greenwaveDecision);
    const isScratch = isArtifactScratch(artifact);
    const issuer = getArtifacIssuer(artifact);

    return (
        <Flex spaceItems={{ default: 'spaceItemsLg' }}>
            <TextContent className="pf-u-mr-auto">
                <Title headingLevel="h1">{getArtifactName(artifact)}</Title>
            </TextContent>
            <FlexItem spacer={{ default: 'spacerXl' }}></FlexItem>
            {hasGatingDecision && (
                <ArtifactGreenwaveStatesSummary artifact={artifact} />
            )}
            {isScratch && <span className="pf-u-color-200">scratch</span>}
            {!isScratch && gatingTag && (
                <span className="pf-u-color-200" title="Gating tag">
                    <CodeBranchIcon /> {gatingTag}
                </span>
            )}
            {issuer && (
                <span className="pf-u-color-200" title="Build issuer/packager">
                    <UserIcon /> {issuer}
                </span>
            )}
        </Flex>
    );
}

export interface ArtifactHeaderProps {
    artifact: Artifact;
}

export function ArtifactHeader(props: ArtifactHeaderProps) {
    const { artifact } = props;
    const { hitSource } = artifact;
    const { aType } = hitSource;
    const artId = getArtifactId(artifact);
    const artifactTypeLabel = getArtifactTypeLabel(aType);
    const artifactUrl = getArtifactRemoteUrl(artifact);
    const externalLink = (
        <ExternalLink href={artifactUrl}>
            <CubeIcon
                className="pf-u-mr-xs"
                style={{ verticalAlign: '-.125em' }}
            />{' '}
            {artifactTypeLabel} #{artId}
        </ExternalLink>
    );

    return (
        <Stack className="resultsNarrower">
            <StackItem>{externalLink}</StackItem>
            <StackItem>
                <ArtifactTitle artifact={artifact} />
            </StackItem>
        </Stack>
    );
}
