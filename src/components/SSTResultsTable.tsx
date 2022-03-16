/*
 * This file is part of ciboard
 *
 * Copyright (c) 2021 Andrei Stepanov <astepano@redhat.com>
 * Copyright (c) 2022 Matěj Grabovský <mgrabovs@redhat.com>
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
import React, { ComponentType, useEffect, useState } from 'react';
import {
    Bullseye,
    EmptyState,
    EmptyStateBody,
    EmptyStateIcon,
    EmptyStateVariant,
    Spinner,
    Title,
} from '@patternfly/react-core';
import ReactTable, {
    SortByDirection,
    Table,
    TableBody,
    TableHeader,
    TableVariant,
    cellWidth,
    sortable,
} from '@patternfly/react-table';
import { global_danger_color_200 } from '@patternfly/react-tokens';
import {
    ExclamationCircleIcon,
    SearchIcon,
} from '@patternfly/react-icons';
import { ApolloError } from '@apollo/client';

import styles from '../custom.module.css';
import { SSTResult } from '../types';

interface EmptyStateParam {
	body: string;
	icon: ComponentType;
	icon_color?: string;
	title: string;
}

interface ResultsTableProps {
	error?: ApolloError;
	loading: boolean;
	results?: SSTResult[];
}

const columns: ReactTable.ICell[] = [
    {
        title: 'NVR',
        transforms: [cellWidth(20), sortable],
    },
    {
        title: 'Bug',
        transforms: [cellWidth(10)],
    },
    {
        title: 'Assignee',
        transforms: [sortable],
    },
    {
        title: 'Artifact',
    },
    {
        title: 'Gating rules',
    },
    {
        title: 'Testcase',
    },
    {
        title: 'Status',
        transforms: [cellWidth(15), sortable],
    },
    {
        title: 'Time',
        transforms: [sortable],
    },
    {
        title: 'Logs',
    },
];

function makeRow(row: SSTResult): ReactTable.IRow[] {
    const cells = [];

    cells.push({
        sortKey: row.nvr,
        title: (
            <a
                className={styles.sstNVR}
                href={row.metadata_url}
                rel="noopener noreferrer"
                target="_blank"
            >
                {row.nvr}
            </a>
        ),
    });

    if (row.gating_bug) {
        cells.push({
            title: (
                <a
                    href={row.gating_bug.url}
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    {row.gating_bug.text}
                </a>
            ),
        });
    } else {
        cells.push({ title: 'N/A', });
    }

    cells.push({
        sortKey: row.assignee,
        title: row.assignee,
    });

    cells.push({
        title: (
            <a href={row.artifact.url}>
                {row.artifact.id}
            </a>
        ),
    });

    if (row.gating_yaml_url) {
        cells.push({
            title: (
                <a
                    href={row.gating_yaml_url}
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    gating.yaml
                </a>
            ),
        });
    } else {
        cells.push({ title: <i>Missing</i>, });
    }

    if (row.testcase.category === null) {
        cells.push({ title: <i>Unknown test</i>, });
    } else {
        cells.push({
            title: (
                ({ category, namespace, type }) => (
                    `${namespace}.${type}.${category}`
                )
            )(row.testcase),
        });
    }

    // FIXME: Duplication in PageSST.
    const statusLower = _.get(row, 'status', 'unknown').toLowerCase();
    let statusClass = styles.sstStatusOther;
    if (statusLower.startsWith('pass')) {
        statusClass = styles.sstStatusPassed;
    } else if (statusLower.startsWith('fail')) {
        statusClass = styles.sstStatusFailed;
    } else if (['info', 'needs_inspection', 'not_applicable'].includes(statusLower)) {
        statusClass = styles.sstStatusInfo;
    }

    cells.push({
        sortKey: statusLower,
        title: (
            <>
                <span className={statusClass}>{statusLower}</span>
                {row.rebuild_url &&
                    <a
                        className="pf-u-ml-sm"
                        href={row.rebuild_url}
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        Rebuild ↻
                    </a>
                }
            </>
        ),
    });

    cells.push({
        sortKey: row.time,
        title: row.time,
    });

    if (row.log_urls) {
        cells.push({
            title: (
                <a
                    href={row.log_urls[0]}
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    Logs
                </a>
            ),
        });
    } else {
        cells.push({ title: <i>No logs</i>, });
    }

    return cells;
}

const emptyStateParams: {
	empty: EmptyStateParam;
	error: EmptyStateParam;
	loading: EmptyStateParam;
} = {
    empty: {
        body: 'No results match the criteria.',
        icon: SearchIcon,
        title: 'No results found',
    },
    error: {
        body: 'Error retrieving test results for the SST. Please check your connection and try again.',
        icon: ExclamationCircleIcon,
        icon_color: global_danger_color_200.value,
        title: 'Connection error',
    },
    loading: {
        body: 'Do not turn off your computer.',
        icon: Spinner,
        title: 'Loading test results',
    },
};

function makeEmptyStateRow({ body, icon, icon_color, title }: EmptyStateParam): ReactTable.IRow {
    return {
        heightAuto: true,
        cells: [{
            props: { colSpan: 11 },
            title: (
                <Bullseye>
                    <EmptyState variant={EmptyStateVariant.small}>
                        <EmptyStateIcon
                            icon={icon}
                            color={icon_color}
                        />
                        <Title headingLevel="h2" size="lg">
                            {title}
                        </Title>
                        <EmptyStateBody>
                            {body}
                        </EmptyStateBody>
                    </EmptyState>
                </Bullseye>
            ),
        }],
    };
}

export function ResultsTable({ error, loading, results }: ResultsTableProps) {
    const [rows, setRows] = useState<ReactTable.IRow[]>([]);
    const [sortBy, setSortBy] = useState<ReactTable.ISortBy>({});

    useEffect(() => {
        // Clear rows and reset sorting criteria whenever the results change.
        setRows([]);
        setSortBy({});

        if (error)
            setRows([makeEmptyStateRow(emptyStateParams.error)]);
        else if (loading)
            setRows([makeEmptyStateRow(emptyStateParams.loading)]);
        else if (_.isEmpty(results))
            setRows([makeEmptyStateRow(emptyStateParams.empty)]);
        else
            setRows(_.map(results, makeRow));
    }, [error, loading, results]);

    const onSort: ReactTable.OnSort = (_event, index, direction) => {
        const sortedRows = rows.sort((a, b) =>
            a[index].sortKey < b[index].sortKey
                ? -1
                : a[index].sortKey > b[index].sortKey
                ? 1
                : 0,
        );
        setRows(
            direction === SortByDirection.asc
                ? sortedRows
                : sortedRows.reverse()
        );
        setSortBy({ index, direction });
    };

    return (
        <Table
            aria-label="Table of test results for the selected subsystem"
            variant={TableVariant.compact}
            borders={true}
            cells={columns}
            rows={rows}
            sortBy={sortBy}
            onSort={onSort}
        >
            <TableHeader />
            <TableBody />
        </Table>
    );
}
