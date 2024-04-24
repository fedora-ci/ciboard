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
import {
    Card,
    Flex,
    Title,
    Spinner,
    CardBody,
    FlexItem,
    Bullseye,
    CardTitle,
    CardHeader,
    EmptyState,
    EmptyStateIcon,
} from '@patternfly/react-core';

import { useAppSelector } from '../hooks';
import { PaginationToolbar } from './PaginationToolbar';
import { Artifact, ArtifactRPM, isArtifactRPM } from '../artifact';
import { ExclamationCircleIcon } from '@patternfly/react-icons';

interface ShowLoadingProps {}
function ShowLoading(props: ShowLoadingProps) {
    const { isLoading } = useAppSelector((state) => state.artifacts);
    if (!isLoading) return null;
    return (
        <>
            <Bullseye>
                <EmptyState>
                    <EmptyStateIcon variant="container" component={Spinner} />
                    <Title headingLevel="h2" size="lg">
                        Loading search results…
                    </Title>
                </EmptyState>
            </Bullseye>
        </>
    );
}

interface ArtifactRPMCardProps {
    artifact: ArtifactRPM;
}
const ArtifactRPMCard = (props: ArtifactRPMCardProps) => {
    const { artifact } = props;
    const { hitInfo, hitSource } = artifact;
    return (
        <Card id={hitInfo._id} isSelectable>
            <CardHeader>
                <CardTitle>
                    {hitSource.taskId} {hitSource.aType}
                </CardTitle>
            </CardHeader>
            <CardBody>
                <Flex>
                    <FlexItem>{hitSource.nvr}</FlexItem>
                    <FlexItem>{hitSource.issuer}</FlexItem>
                    <FlexItem>{hitSource.scratch}</FlexItem>
                    <FlexItem>{hitSource.component}</FlexItem>
                    <FlexItem>{hitSource.buildId}</FlexItem>
                    <FlexItem>{hitSource.gateTag}</FlexItem>
                    <FlexItem>{hitSource.source}</FlexItem>
                    <FlexItem>{hitSource.brokerMsgIdGateTag}</FlexItem>
                </Flex>
            </CardBody>
        </Card>
    );
};

interface ArtifactCardProps {
    artifact: Artifact;
}
const ArtifactCard = (props: ArtifactCardProps) => {
    const { artifact } = props;
    if (isArtifactRPM(artifact)) {
        return <ArtifactRPMCard artifact={artifact} />;
    }
    return (
        <Flex>
            <FlexItem>{artifact.hitInfo._id}</FlexItem>
        </Flex>
    );
};

interface ArtListProps {}
const ArtList = (_props: ArtListProps) => {
    const { artList } = useAppSelector((state) => state.artifacts);
    if (_.isEmpty(artList)) return null;
    const entries: JSX.Element[] = [];
    _.map(artList, (artifact: any) => {
        entries.push(<ArtifactCard artifact={artifact} />);
    });
    return <>{entries}</>;
};

interface NothingFoundProps {}
const NothingFound = (_props: NothingFoundProps) => {
    const { hitsInfo } = useAppSelector((state) => state.artifacts);
    const totalHits = hitsInfo?.total?.value;
    if (totalHits !== 0) return null;
    return (
        <Bullseye>
            <EmptyState>
                <EmptyStateIcon
                    className="pf-u-danger-color-100"
                    icon={ExclamationCircleIcon}
                />
                <Title headingLevel="h2" size="lg">
                    Nothing found
                </Title>
            </EmptyState>
        </Bullseye>
    );
};

export function ShowArtifacts() {
    return (
        <>
            <PaginationToolbar />;
            <ShowLoading />
            <ArtList />
            <NothingFound />
        </>
    );
}

/*

                        {error && (
                            <EmptyStateBody>
                                Error: {error.toString()}
                            </EmptyStateBody>
                        )}
                        */
