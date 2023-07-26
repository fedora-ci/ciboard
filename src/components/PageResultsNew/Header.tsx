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
    UserIcon,
} from '@patternfly/react-icons';

import { Artifact, isArtifactScratch } from '../../artifact';
import {
    getArtifacIssuer,
    getArtifactGatingTag,
    getArtifactName,
    getArtifactRemoteUrl,
    getArtifactTypeLabel,
    mkLinkKojiWebTask,
} from '../../utils/artifactUtils';
import { ExternalLink } from '../ExternalLink';
import { ArtifactGreenwaveStatesSummary } from '../GatingStatus';

function BackButton(_props: {}) {
    // const navigate = useNavigate();
    // TODO: Call `navigate(-1)` on click to go to the previous page.
    return (
        <Button className="pf-u-px-0" icon={<AngleLeftIcon />} variant="link">
            Back to results list
        </Button>
    );
}

interface ArtifactTitleProps {
    artifact: Artifact;
}

function ArtifactTitle(props: ArtifactTitleProps) {
    const { artifact } = props;
    const gatingTag = getArtifactGatingTag(artifact);
    const hasGatingDecision = !_.isNil(artifact.greenwave_decision);
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
                <span
                    className="pf-u-color-200"
                    title="Build issuer / packager"
                >
                    <UserIcon /> {issuer}
                </span>
            )}
        </Flex>
    );
}

export interface ArtifactHeaderProps {
    artifact: Artifact;
    hasBackLink?: boolean;
}

export function ArtifactHeader(props: ArtifactHeaderProps) {
    const { artifact } = props;
    const artifactTypeLabel = getArtifactTypeLabel(artifact.type);
    const artifactUrl = getArtifactRemoteUrl(artifact);
    const externalLink = (
        <ExternalLink href={artifactUrl}>
            <CubeIcon
                className="pf-u-mr-xs"
                style={{ verticalAlign: '-.125em' }}
            />{' '}
            {artifactTypeLabel} #{artifact.aid}
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
                <ArtifactTitle artifact={artifact} />
            </StackItem>
        </Stack>
    );
}
