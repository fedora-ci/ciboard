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
import * as React from 'react';
import { ComponentType, useEffect, useState } from 'react';
import {
    Flex,
    Label,
    Button,
    Spinner,
    Bullseye,
    FlexItem,
    EmptyState,
    LabelProps,
    EmptyStateBody,
    EmptyStateIcon,
    EmptyStateVariant, EmptyStateHeader,
} from '@patternfly/react-core';
import {
	sortable,
	cellWidth,
	Visibility,
	classNames as rtClassNames,
	TableVariant,
	SortByDirection,
	ICell,
	IRow,
	ISortBy,
	OnSort
} from '@patternfly/react-table';
import {
	Table,
	TableBody,
	TableHeader
} from '@patternfly/react-table/deprecated';
import classNames from 'classnames';
import { ApolloError } from '@apollo/client';
import { global_danger_color_200 } from '@patternfly/react-tokens';
import {
    OkIcon,
    SearchIcon,
    InfoCircleIcon,
    ErrorCircleOIcon,
    ExclamationCircleIcon,
} from '@patternfly/react-icons';

import styles from '../custom.module.css';
import { SSTResult } from '../types';

interface EmptyStateParam {
    body: string;
    icon: ComponentType;
    icon_color?: string;
    title: string;
}

const columns: ICell[] = [
    {
        /* 0 */
        title: 'NVR',
        transforms: [cellWidth(20), sortable],
    },
    {
        /* 1 */
        title: 'Bug',
        transforms: [cellWidth(10)],
    },
    {
        /* 2 */
        title: 'Assignee',
        transforms: [sortable],
    },
    {
        /* 3 */
        title: 'Artifact',
    },
    {
        /* 4 */
        title: 'Gating rules',
    },
    {
        /* 5 */
        title: 'Tests',
    },
    {
        /* index: 6 */
        title: 'Test repo',
        /**
         * use to hide column, if all entries are emtpy: OSCI-3214
         * [ classNames(Visibility.hidden, Visibility.visibleOnMd, Visibility.hiddenOnLg, Visibility.visibleOn2Xl) ]
         */
        columnTransforms: [],
    },
    {
        /* 7 */
        title: 'Status',
        transforms: [cellWidth(15), sortable],
    },
    {
        /* 8 */
        title: 'Time',
        transforms: [sortable],
    },
    {
        /* 9 */
        title: 'Logs',
    },
];

function makeRow(row: SSTResult): IRow[] {
    const cells = [];
    cells.push({
        sortKey: row.nvr,
        title: (
            <a
                className={styles.sstNVR}
                href={row.nvr_link}
                rel="noopener noreferrer"
                target="_blank"
            >
                {row.nvr}
            </a>
        ),
    });
    if (!_.isEmpty(row.el8_gating_bug) && row.el8_gating_bug !== 'X') {
        cells.push({
            title: (
                <a
                    href={row.el8_gating_bug_link}
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    {row.el8_gating_bug}
                </a>
            ),
        });
    } else {
        cells.push({ title: 'N/A' });
    }
    cells.push({
        sortKey: row.assignee,
        title: row.assignee,
    });
    cells.push({
        title: <a href={row.aid_link}>{row.aid}</a>,
    });
    if (!_.isEmpty(row.yaml_link) && row?.yaml !== 'missing') {
        cells.push({
            title: (
                <a
                    href={row.yaml_link}
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    gating.yaml
                </a>
            ),
        });
    } else {
        cells.push({ title: <i>Missing</i> });
    }

    if (!_.isEmpty(row.tests_number)) {
        cells.push({ title: `${row.tests_number}` });
    } else if (row.category === null) {
        cells.push({ title: <i>Unknown test</i> });
    } else {
        cells.push({
            title: `${row.namespace}.${row.type}.${row.category}`,
        });
    }

    if (!_.isEmpty(row.test_git_link) && row.test_git_link !== 'X') {
        cells.push({
            title: (
                <a
                    href={row.test_git_link}
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    {row.test_git}
                </a>
            ),
        });
    } else {
        cells.push({});
    }

    // FIXME: Duplication in PageSST.
    const status = _.toLower(_.get(row, 'status', 'unknown'));
    let statusColor: LabelProps['color'] = 'blue';
    let statusIcon = <InfoCircleIcon />;
    if (_.startsWith(status, 'pass')) {
        statusColor = 'green';
        statusIcon = <OkIcon />;
    } else if (status.startsWith('fail')) {
        statusColor = 'red';
        statusIcon = <ErrorCircleOIcon />;
    } else if (
        _.includes(['info', 'needs_inspection', 'not_applicable'], status)
    ) {
        statusColor = 'orange';
        statusIcon = <ExclamationCircleIcon />;
    }
    const rebuildButtonIsHidden =
        _.isEmpty(row.rebuild_link) || row.rebuild_link === 'X';
    const rebuildButtonClass = classNames({
        [styles['isHidden']]: rebuildButtonIsHidden,
    });
    cells.push({
        sortKey: status,
        title: (
            <Flex>
                <FlexItem>
                    <Label color={statusColor} isCompact icon={statusIcon}>
                        {status}
                    </Label>
                </FlexItem>
                <FlexItem>
                    <Button
                        href={row.rebuild_link}
                        target="_blank"
                        isInline
                        className={rebuildButtonClass}
                        component="a"
                        variant="link"
                    >
                        ↻ rebuild
                    </Button>
                </FlexItem>
            </Flex>
        ),
    });

    cells.push({
        sortKey: row.time,
        title: row.time,
    });

    const logUrl = _.isArray(row.log_link) ? row.log_link[0] : row.log_link;
    if (!_.isEmpty(logUrl) && logUrl !== 'X') {
        cells.push({
            title: (
                <a href={logUrl} rel="noopener noreferrer" target="_blank">
                    Logs
                </a>
            ),
        });
    } else {
        cells.push({ title: <i>No logs</i> });
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

function makeEmptyStateRow({
    body,
    icon,
    icon_color,
    title,
}: EmptyStateParam): IRow {
    return {
        heightAuto: true,
        cells: [
            {
                props: { colSpan: 11 },
                title: (
                    <Bullseye>
                        <EmptyState variant={EmptyStateVariant.sm}>
                            <EmptyStateHeader titleText={<>{title}</>} icon={<EmptyStateIcon icon={icon} color={icon_color} />} headingLevel="h2" />
                            <EmptyStateBody>{body}</EmptyStateBody>
                        </EmptyState>
                    </Bullseye>
                ),
            },
        ],
    };
}

interface ResultsTableProps {
    error?: ApolloError;
    loading: boolean;
    results?: SSTResult[];
}

export function ResultsTable(props: ResultsTableProps) {
    const { error, loading, results } = props;
    const [rows, setRows] = useState<IRow[]>([]);
    const [sortBy, setSortBy] = useState<ISortBy>({});

    /** `columns` is global var, need to reset before previous render */
    /** https://issues.redhat.com/browse/OSCI-3214 */
    const showTestRespoColumn = _.some(_.map(results, 'test_git_link'), _.size);
    if (showTestRespoColumn) {
        columns[6].columnTransforms = [];
    } else {
        columns[6].columnTransforms = [
            /** type error - bug in upstream, `as string` can be removed on next release */
            rtClassNames(Visibility.hidden as string),
        ];
    }

    useEffect(() => {
        /* XXX: Clear rows and reset sorting criteria whenever the results change. */
        setRows([]);
        setSortBy({});

        if (error) {
            setRows([makeEmptyStateRow(emptyStateParams.error)]);
        } else if (loading) {
            setRows([makeEmptyStateRow(emptyStateParams.loading)]);
        } else if (_.isEmpty(results)) {
            setRows([makeEmptyStateRow(emptyStateParams.empty)]);
        } else {
            setRows(_.map(results, (r) => makeRow(r)));
        }
    }, [error, loading, results]);

    const onSort: OnSort = (_event, index, direction) => {
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
                : sortedRows.reverse(),
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
