/*
 * This file is part of ciboard
 *
 * Copyright (c) 2023 Matěj Grabovský <mgrabovs@redhat.com>
 * Copyright (c) 2023, 2024 Andrei Stepanov <astepano@redhat.com>
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
    Brand,
    Button,
    Spinner,
    Bullseye,
    EmptyState,
    EmptyStateIcon,
    EmptyStateHeader,
} from '@patternfly/react-core';
import { Td, Th, Tr, Table, Tbody, Thead } from '@patternfly/react-table';
import { Link } from 'react-router-dom';
import { ExclamationCircleIcon } from '@patternfly/react-icons';

import rhMbs from './../img/rhmbs.png';
import rhLogo from './../img/rhfavicon.svg';
import rhContLogo from './../img/rhcont.png';
import { useAppSelector } from '../hooks';
import { PaginationToolbar } from './PaginationToolbar';
import {
    Artifact,
    getAType,
    ArtifactRpm,
    ArtifactMbs,
    isArtifactMbs,
    isArtifactRpm,
    getArtifactId,
    getArtifactRemoteUrl,
    getArtifactLocalPath,
    getArtifactTypeLabel,
    ArtifactContainerImage,
    isArtifactRedhatContainerImage,
} from '../types';
import { ExternalLink } from './ExternalLink';
import { store } from '../reduxStore';
import { ArtifactGreenwaveStatesSummary } from './GatingStatus';

interface ShowLoadingProps {}
function ShowLoading(props: ShowLoadingProps) {
    const { isLoading } = useAppSelector((state) => state.artifacts);
    if (!isLoading) return null;
    return (
        <>
            <Bullseye>
                <EmptyState>
                    <EmptyStateHeader
                        titleText="Loading search results…"
                        icon={<EmptyStateIcon icon={Spinner} />}
                        headingLevel="h2"
                    />
                </EmptyState>
            </Bullseye>
        </>
    );
}

const makeArtifactRowRpm = (artifact: ArtifactRpm): ArtifactRow => {
    const { isLoadingExtended: isLoading } = store.getState().artifacts;
    const { hit_source } = artifact;
    const aType = getAType(artifact);
    const href = getArtifactLocalPath(artifact);
    const cell0: JSX.Element = (
        <>
            <Brand alt="Red hat build" widths={{ default: '30px' }}>
                <source srcSet={rhLogo} />
            </Brand>
        </>
    );
    const cell1: JSX.Element = <>{getArtifactTypeLabel(aType)}</>;
    const artifactUrl = getArtifactRemoteUrl(artifact);
    const artId = getArtifactId(artifact);
    const cell2: JSX.Element = (
        <ExternalLink href={artifactUrl}>{artId}</ExternalLink>
    );
    const cell3: JSX.Element = <>{hit_source.nvr}</>;
    const cell4: JSX.Element = (
        <>
            <ArtifactGreenwaveStatesSummary
                isLoading={isLoading}
                artifact={artifact}
            />
        </>
    );
    const cell5: JSX.Element = <>{hit_source.gateTag}</>;
    const cell6: JSX.Element = <>{hit_source.issuer}</>;
    const cell7: JSX.Element = (
        <>
            <Link to={href}>
                <Button variant="secondary">details</Button>
            </Link>
        </>
    );
    const artifactRow: ArtifactRow = [
        cell0,
        cell1,
        cell2,
        cell3,
        cell4,
        cell5,
        cell6,
        cell7,
    ];
    return artifactRow;
};

const makeArtifactRowRedhatContainerImage = (
    artifact: ArtifactContainerImage,
): ArtifactRow => {
    const { isLoadingExtended: isLoading } = store.getState().artifacts;
    const { hit_source } = artifact;
    const aType = getAType(artifact);
    const href = getArtifactLocalPath(artifact);
    const cell0: JSX.Element = (
        <>
            <Brand alt="Red hat container image" widths={{ default: '30px' }}>
                <source srcSet={rhContLogo} />
            </Brand>
        </>
    );
    const cell1: JSX.Element = <>{getArtifactTypeLabel(aType)}</>;
    const artifactUrl = getArtifactRemoteUrl(artifact);
    const artId = getArtifactId(artifact);
    const cell2: JSX.Element = (
        <ExternalLink href={artifactUrl}>{artId}</ExternalLink>
    );
    const cell3: JSX.Element = <>{hit_source.nvr}</>;
    const cell4: JSX.Element = (
        <>
            <ArtifactGreenwaveStatesSummary
                isLoading={isLoading}
                artifact={artifact}
            />
        </>
    );
    const cell5: JSX.Element = <>{hit_source.contTag}</>;
    const cell6: JSX.Element = <>{hit_source.issuer}</>;
    const cell7: JSX.Element = (
        <>
            <Link to={href}>
                <Button variant="secondary">details</Button>
            </Link>
        </>
    );
    const artifactRow: ArtifactRow = [
        cell0,
        cell1,
        cell2,
        cell3,
        cell4,
        cell5,
        cell6,
        cell7,
    ];
    return artifactRow;
};

const makeArtifactRowMbs = (artifact: ArtifactMbs): ArtifactRow => {
    const { isLoadingExtended: isLoading } = store.getState().artifacts;
    const { hit_source } = artifact;
    const aType = getAType(artifact);
    const href = getArtifactLocalPath(artifact);
    const cell0: JSX.Element = (
        <>
            <Brand alt="Red hat container image" widths={{ default: '30px' }}>
                <source srcSet={rhMbs} />
            </Brand>
        </>
    );
    const cell1: JSX.Element = <>{getArtifactTypeLabel(aType)}</>;
    const artId = getArtifactId(artifact);
    const artifactUrl = getArtifactRemoteUrl(artifact);
    const cell2: JSX.Element = (
        <ExternalLink href={artifactUrl}>{artId}</ExternalLink>
    );
    const cell3: JSX.Element = <>{hit_source.nsvc}</>;
    const cell4: JSX.Element = (
        <>
            <ArtifactGreenwaveStatesSummary
                isLoading={isLoading}
                artifact={artifact}
            />
        </>
    );
    const cell5: JSX.Element = <>{hit_source.gateTag}</>;
    const cell6: JSX.Element = <>{hit_source.issuer}</>;
    const cell7: JSX.Element = (
        <>
            <Link to={href}>
                <Button variant="secondary">details</Button>
            </Link>
        </>
    );
    const artifactRow: ArtifactRow = [
        cell0,
        cell1,
        cell2,
        cell3,
        cell4,
        cell5,
        cell6,
        cell7,
    ];
    return artifactRow;
};

type ArtifactRow =
    | [
          JSX.Element,
          JSX.Element,
          JSX.Element,
          JSX.Element,
          JSX.Element,
          JSX.Element,
          JSX.Element,
          JSX.Element,
      ]
    | undefined;

const columnNames = {
    logo: '',
    aType: 'Type',
    id: 'Id',
    artifactName: 'Name',
    issuer: 'Issuer',
    gateTag: 'Build tag',
    gatingStatus: 'Gating status',
    details: '',
};

const makeArtifactRow = (artifact: Artifact): ArtifactRow | undefined => {
    if (isArtifactRpm(artifact)) {
        return makeArtifactRowRpm(artifact);
    }
    if (isArtifactRedhatContainerImage(artifact)) {
        return makeArtifactRowRedhatContainerImage(artifact);
    }
    if (isArtifactMbs(artifact)) {
        return makeArtifactRowMbs(artifact);
    }
    //<FlexItem>{artifact.hit_info._id}</FlexItem>
};

interface ArtListProps {}
const ArtifactsTable = (_props: ArtListProps) => {
    const { artList } = useAppSelector((state) => state.artifacts);
    if (_.isEmpty(artList)) return null;
    const entries: ArtifactRow[] = [];
    _.map(artList, (artifact: any) => {
        entries.push(makeArtifactRow(artifact));
    });
    return (
        <>
            <Table aria-label="Simple table" variant="compact" borders={true}>
                <Thead>
                    <Tr>
                        <Th
                            style={{
                                maxWidth: 'none',
                            }}
                        >
                            {columnNames.logo}
                        </Th>
                        <Th
                            style={{
                                maxWidth: 'none',
                            }}
                        >
                            {columnNames.aType}
                        </Th>
                        <Th
                            style={{
                                maxWidth: 'none',
                            }}
                        >
                            {columnNames.id}
                        </Th>
                        <Th
                            style={{
                                maxWidth: 'none',
                            }}
                        >
                            {columnNames.artifactName}
                        </Th>
                        <Th
                            style={{
                                maxWidth: 'none',
                            }}
                        >
                            {columnNames.gatingStatus}
                        </Th>
                        <Th
                            style={{
                                maxWidth: 'none',
                            }}
                        >
                            {columnNames.gateTag}
                        </Th>
                        <Th
                            style={{
                                maxWidth: 'none',
                            }}
                        >
                            {columnNames.issuer}
                        </Th>
                        <Th
                            style={{
                                maxWidth: 'none',
                            }}
                        >
                            {columnNames.details}
                        </Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {_.map(entries, (aRow, index) => {
                        if (!aRow) {
                            return <></>;
                        }
                        return (
                            <Tr key={index}>
                                <Td
                                    style={{
                                        verticalAlign: 'middle',
                                        tableLayout: 'fixed',
                                        width: '1%',
                                    }}
                                    dataLabel={columnNames.logo}
                                >
                                    {aRow[0]}
                                </Td>
                                <Td
                                    style={{
                                        verticalAlign: 'middle',
                                        whiteSpace: 'nowrap',
                                        tableLayout: 'fixed',
                                        width: '1%',
                                    }}
                                    dataLabel={columnNames.aType}
                                >
                                    {aRow[1]}
                                </Td>
                                <Td
                                    style={{
                                        verticalAlign: 'middle',
                                        whiteSpace: 'nowrap',
                                        fontFamily: 'RedHatMono',
                                    }}
                                    dataLabel={columnNames.id}
                                >
                                    {aRow[2]}
                                </Td>
                                <Td
                                    style={{
                                        verticalAlign: 'middle',
                                        whiteSpace: 'nowrap',
                                        fontFamily: 'RedHatDisplay',
                                    }}
                                    dataLabel={columnNames.artifactName}
                                >
                                    {aRow[3]}
                                </Td>
                                <Td
                                    style={{
                                        verticalAlign: 'middle',
                                        whiteSpace: 'nowrap',
                                        tableLayout: 'fixed',
                                        width: '1%',
                                    }}
                                    dataLabel={columnNames.gatingStatus}
                                >
                                    {aRow[4]}
                                </Td>
                                <Td
                                    style={{
                                        verticalAlign: 'middle',
                                        whiteSpace: 'nowrap',
                                    }}
                                    dataLabel={columnNames.gateTag}
                                >
                                    {aRow[5]}
                                </Td>
                                <Td
                                    style={{
                                        verticalAlign: 'middle',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        maxWidth: '12em',
                                    }}
                                    dataLabel={columnNames.issuer}
                                >
                                    {aRow[6]}
                                </Td>
                                <Td
                                    style={{
                                        verticalAlign: 'middle',
                                        whiteSpace: 'nowrap',
                                    }}
                                    dataLabel={columnNames.details}
                                >
                                    {aRow[7]}
                                </Td>
                            </Tr>
                        );
                    })}
                </Tbody>
            </Table>
        </>
    );
};

interface NothingFoundProps {}
const NothingFound = (_props: NothingFoundProps) => {
    const { hits_info } = useAppSelector((state) => state.artifacts);
    const totalHits = hits_info?.total?.value;
    if (totalHits !== 0) return null;
    return (
        <Bullseye>
            <EmptyState>
                <EmptyStateHeader
                    titleText="Nothing found"
                    icon={
                        <EmptyStateIcon
                            className="pf-v5-u-danger-color-100"
                            icon={ExclamationCircleIcon}
                        />
                    }
                    headingLevel="h2"
                />
            </EmptyState>
        </Bullseye>
    );
};

export function ShowArtifacts() {
    return (
        <>
            <PaginationToolbar />
            <ShowLoading />
            <ArtifactsTable />
            <NothingFound />
        </>
    );
}

/* XXX

                        {error && (
                            <EmptyStateBody>
                                Error: {error.toString()}
                            </EmptyStateBody>
                        )}
                        */
