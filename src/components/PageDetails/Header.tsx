/*
 * This file is part of ciboard
 *
 * Copyright (c) 2023 Matěj Grabovský <mgrabovs@redhat.com>
 * Copyright (c) 2023 Andrei Stepanov <mgrabovs@redhat.com>
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
import React, { useEffect, useState } from 'react';
import {
    Flex,
    Stack,
    Title,
    Button,
    FlexItem,
    StackItem,
    TextContent,
} from '@patternfly/react-core';
import {
    UserIcon,
    CubeIcon,
    CodeBranchIcon,
    AngleDoubleLeftIcon,
} from '@patternfly/react-icons';
import { useLocation, useNavigate } from 'react-router-dom';

import {
    Artifact,
    getAType,
    getArtifactId,
    getArtifactName,
    getArtifacIssuer,
    isArtifactScratch,
    getArtifactGatingTag,
    getArtifactRemoteUrl,
    getArtifactTypeLabel,
} from '../../types';
import { ExternalLink } from '../ExternalLink';
import { ArtifactGreenwaveStatesSummary } from '../GatingStatus';

interface ArtifactTitleProps {
    artifact: Artifact;
}

function ArtifactTitle(props: ArtifactTitleProps) {
    const { artifact } = props;
    const gatingTag = getArtifactGatingTag(artifact);
    const hasGatingDecision = !_.isNil(artifact.greenwaveDecision);
    const isScratch = isArtifactScratch(artifact);
    const issuer = getArtifacIssuer(artifact);
    return (
        <Flex spaceItems={{ default: 'spaceItemsLg' }}>
            <TextContent className="pf-v5-u-mr-auto">
                <Title headingLevel="h1">{getArtifactName(artifact)}</Title>
            </TextContent>
            <FlexItem spacer={{ default: 'spacerXl' }}></FlexItem>
            {hasGatingDecision && (
                <ArtifactGreenwaveStatesSummary artifact={artifact} />
            )}
            {isScratch && <span className="pf-v5-u-color-200">scratch</span>}
            {!isScratch && gatingTag && (
                <span className="pf-v5-u-color-200" title="Gating tag">
                    <CodeBranchIcon /> {gatingTag}
                </span>
            )}
            {issuer && (
                <span
                    className="pf-v5-u-color-200"
                    title="Build issuer/packager"
                >
                    <UserIcon /> {issuer}
                </span>
            )}
        </Flex>
    );
}
export interface BackButtonProps {}

const BackButton: React.FC<BackButtonProps> = (props) => {
    const navigate = useNavigate();
    let location = useLocation();
    // -1 - means go back to prev history
    const [navigationDepth, setNavigationDepth] = useState(-1);
    useEffect(() => {
        // this will track side-bar changes and url
        setNavigationDepth(navigationDepth - 1);
    }, [location]);
    if (!(window.history.state && window.history.state.idx > 0)) {
        return null;
    }
    return (
        <div
            style={{
                position: 'relative',
            }}
        >
            <Button
                variant="secondary"
                ouiaId="Primary"
                style={{
                    position: 'absolute',
                }}
                onClick={() => navigate(navigationDepth)}
            >
                <Flex>
                    <FlexItem>
                        <AngleDoubleLeftIcon />
                    </FlexItem>
                    <FlexItem>back to results</FlexItem>
                </Flex>
            </Button>
        </div>
    );
};

export interface ArtifactHeaderProps {
    artifact: Artifact;
}

export function ArtifactHeader(props: ArtifactHeaderProps) {
    const { artifact } = props;
    const aType = getAType(artifact);
    const artId = getArtifactId(artifact);
    const artifactTypeLabel = getArtifactTypeLabel(aType);
    const artifactUrl = getArtifactRemoteUrl(artifact);
    const externalLink = (
        <ExternalLink href={artifactUrl}>
            <CubeIcon
                className="pf-v5-u-mr-xs"
                style={{ verticalAlign: '-.125em' }}
            />{' '}
            {artifactTypeLabel} #{artId}
        </ExternalLink>
    );

    return (
        <>
            <BackButton />
            <Stack className="resultsNarrower">
                <StackItem>{externalLink}</StackItem>
                <StackItem>
                    <ArtifactTitle artifact={artifact} />
                </StackItem>
            </Stack>
        </>
    );
}
