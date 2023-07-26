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
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
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

import {
    ArtifactsCompleteQuery,
    ArtifactsCompleteQueryData,
} from '../../queries/Artifacts';
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
    /** The type of artifacts to look up. */
    artifactType: string;
    /** The artifact property to match against. */
    fieldName?: string;
    /** The desired property value(s). */
    fieldValues: string[];
    /** Match filter values as regular expressions against the property value. */
    matchRegex?: boolean;
    /** Exclude scratch builds from the search. */
    skipScratch?: boolean;
}

export function ArtifactsListNew(props: ArtifactsListNewProps) {
    const { artifactType, fieldName, fieldValues } = props;

    const [aidStack, setAidStack] = useState<string[]>([]);
    const aidOffset = _.last(aidStack);
    const currentPage = 1 + aidStack.length;

    const fieldPath = fieldName
        ? fieldName === 'aid'
            ? fieldName
            : // Fields other than `aid` are found inside the payload.
              `payload.${fieldName}`
        : // Keep the path undefined if no field name was specified.
          undefined;
    const columns = tableColumns(artifactType);

    const queryValid = !_.isEmpty(artifactType) && !_.isEmpty(fieldValues);
    const queryOptions = {
        reduced: true,
        skipScratch: props.skipScratch,
        valuesAreRegex1: props.matchRegex,
    };

    const { data, error, loading } = useQuery<ArtifactsCompleteQueryData>(
        ArtifactsCompleteQuery,
        {
            variables: {
                atype: artifactType,
                aid_offset: aidOffset,
                dbFieldName1: fieldPath,
                dbFieldValues1: fieldValues,
                options: queryOptions,
            },
            fetchPolicy: 'cache-first',
            notifyOnNetworkStatusChange: true,
            errorPolicy: 'all',
            skip: !queryValid,
        },
    );

    const haveData = !loading && data && !_.isEmpty(data.artifacts?.artifacts);
    let hasNext = false;
    let artifactRows: any[] = [];
    let emptyRow: JSX.Element | undefined;
    if (haveData) {
        artifactRows = data.artifacts?.artifacts.map((artifact) => (
            <ArtifactRow artifact={artifact} key={artifact.aid} />
        ));
        hasNext = data.artifacts?.has_next;
    }

    if (!loading && data && _.isEmpty(data.artifacts?.artifacts)) {
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

    const onClickLoadNext = () => {
        const lastAid = _.last(data?.artifacts?.artifacts)?.aid;
        // This should not happen, but just to be sure...
        if (!hasNext || !lastAid) return;
        const newAidStack = aidStack.slice();
        newAidStack.push(lastAid);
        setAidStack(newAidStack);
    };

    const onClickLoadPrev = () => {
        // This should not happen, but just to be sure...
        if (currentPage <= 1) return;
        const newAidStack = _.dropRight(aidStack, 1);
        setAidStack(newAidStack);
    };

    const paginationProps = {
        currentPage,
        isLoading: loading,
        loadNextIsDisabled: !hasNext,
        loadPrevIsDisabled: currentPage <= 1,
        onClickLoadNext,
        onClickLoadPrev,
    };

    const paginationToolbar = <PaginationToolbar {...paginationProps} />;

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
