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
import { Link, useNavigate } from 'react-router-dom';
import { ApolloError } from '@apollo/client';
import {
    Bullseye,
    EmptyState,
    EmptyStateBody,
    EmptyStateIcon,
    Spinner,
    Title,
} from '@patternfly/react-core';
import { LinkIcon, SearchIcon } from '@patternfly/react-icons';
import {
    TableComposable,
    Tbody,
    Td,
    Th,
    Thead,
    Tr,
} from '@patternfly/react-table';

import { getArtifactLocalPath } from '../../utils/artifactUtils';
import { Artifact } from '../../artifact';
import {
    ArtifactDestination,
    ArtifactName,
    ShowErrors,
    tableColumns,
} from '../../utils/artifactsTable';
import { ArtifactGreenwaveStatesSummary } from '../GatingStatus';
import { PaginationToolbar } from '../PaginationToolbar';

interface ArtifactRowProps {
    artifact: Artifact;
}

function ArtifactRow(props: ArtifactRowProps) {
    const { artifact } = props;

    const navigate = useNavigate();

    const artifactPath = getArtifactLocalPath(artifact);
    const artifactLink = (
        <Link to={artifactPath}>
            <LinkIcon />
        </Link>
    );
    const packager =
        'issuer' in artifact.payload ? artifact.payload.issuer : 'Unknown';

    const onRowClick = () => navigate(artifactPath);

    return (
        <Tr isHoverable onRowClick={onRowClick}>
            <Td>{artifact.aid}</Td>
            <Td>
                <ArtifactName artifact={artifact} />
            </Td>
            <Td>
                <ArtifactGreenwaveStatesSummary artifact={artifact} />
            </Td>
            <Td>
                <ArtifactDestination artifact={artifact} />
            </Td>
            <Td style={{ whiteSpace: 'nowrap' }}>{packager}</Td>
            <Td>{artifactLink}</Td>
        </Tr>
    );
}

const LoadingState = (_props: {}) => (
    <EmptyState variant="small">
        <EmptyStateIcon component={Spinner} variant="container" />
        <Title headingLevel="h3" size="md">
            Loading artifacts…
        </Title>
    </EmptyState>
);

const NoArtifactsState = (_props: {}) => (
    <EmptyState variant="small">
        <EmptyStateIcon component={SearchIcon} variant="container" />
        <Title headingLevel="h3" size="md">
            No results found
        </Title>
        <EmptyStateBody>
            No artifacts match your query. Try to adjust your criteria and
            search again.
        </EmptyStateBody>
    </EmptyState>
);

export interface ArtifactsListNewProps {
    artifacts?: Artifact[];
    /** The type of artifacts to look up. */
    artifactType: string;
    currentPage: number;
    error?: ApolloError;
    hasNextPage?: boolean;
    loading?: boolean;
    onClickNext(): void;
    onClickPrev(): void;
}

export function ArtifactsListNew(props: ArtifactsListNewProps) {
    const { artifacts, currentPage, error, loading } = props;

    const columns = tableColumns(props.artifactType);

    let artifactRows: JSX.Element[] = [];
    let emptyRow: JSX.Element | undefined;
    if (!_.isNil(artifacts)) {
        artifactRows = artifacts.map((artifact) => (
            <ArtifactRow artifact={artifact} key={artifact.aid} />
        ));

        if (_.isEmpty(artifacts)) {
            emptyRow = (
                <Tr>
                    <Td colSpan={columns.length}>
                        <Bullseye>
                            <NoArtifactsState />
                        </Bullseye>
                    </Td>
                </Tr>
            );
        }
    }

    const loadingRow = loading && (
        <Tr>
            <Td colSpan={columns.length}>
                <Bullseye>
                    <LoadingState />
                </Bullseye>
            </Td>
        </Tr>
    );

    const errorRow = error && (
        <Tr>
            <Td colSpan={columns.length}>
                <ShowErrors error={error} />
            </Td>
        </Tr>
    );

    const paginationToolbar = (
        <PaginationToolbar
            currentPage={currentPage}
            isLoading={loading}
            loadNextIsDisabled={!props.hasNextPage}
            loadPrevIsDisabled={currentPage <= 1}
            onClickLoadNext={props.onClickNext}
            onClickLoadPrev={props.onClickPrev}
        />
    );

    return (
        <>
            {paginationToolbar}
            <TableComposable variant="compact">
                <Thead>
                    <Tr>
                        {columns.map(({ title }, index) => (
                            <Th key={index}>{title}</Th>
                        ))}
                    </Tr>
                </Thead>
                <Tbody>
                    {loadingRow}
                    {errorRow}
                    {emptyRow}
                    {artifactRows}
                </Tbody>
            </TableComposable>
            {paginationToolbar}
        </>
    );
}
