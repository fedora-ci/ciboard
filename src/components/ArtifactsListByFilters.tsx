/*
 * This file is part of ciboard

 * Copyright (c) 2021 Andrei Stepanov <astepano@redhat.com>
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
import { useQuery } from '@apollo/client';
import { useSelector } from 'react-redux';
import { useState, useRef, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableHeader,
    TableVariant,
} from '@patternfly/react-table';

import { ArtifactsListByFiltersQuery1 } from '../queries/Artifacts';
import {
    ShowErrors,
    tableColumns,
    InputRowType,
    TableRowsType,
    mkSpecialRows,
    mkArtifactsRows,
    CustomRowWrapper,
    OnCollapseEventType,
} from '../utils/artifactsTable';
import { RootStateType } from '../reducers';
import { IStateFilters } from '../actions/types';

import PaginationToolbar from './PaginationToolbar';

const ArtifactsTable: React.FC = () => {
    const queryString = ''; // XXX : delme
    const scrollRef = useRef<HTMLTableRowElement>(null);
    const waitForRef = useRef<HTMLElement>(null);
    const aid_offset_pages = useRef<string[]>([]);
    const known_pages = aid_offset_pages.current;
    const [opened, setOpened] = useState<number | null>(null);
    /** maps to page number */
    const [aid_offset, setAidOffset] = useState<string | undefined>(undefined);
    const activeFilters = useSelector<RootStateType, IStateFilters>(
        (state) => state.filters,
    );
    const {
        type: artifactsType,
        active: artifactsFilters,
        options: { skipScratch },
    } = activeFilters;
    const columns = tableColumns(artifactsType);
    const regexs = _.map(artifactsFilters, (regex) =>
        regex.startsWith('^') ? regex : `^${regex}`,
    );
    /** XXX */
    var artifacts: any[] = [];
    var has_next = false;
    var currentPage = '';
    var loadNextIsDisabled = true;
    var loadPrevIsDisabled = true;
    useEffect(() => {
        /**
         * didMount, didUpdated => after render() => 'opened' changed =>
         *  => allows to scroll to opened artifact if present.
         */
        if (typeof opened == 'number' && scrollRef.current) {
            scrollRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }
    }, [opened]);
    useEffect(() => {
        /**
         * reset:
         * - known pages if artifactFilters changed
         * - current page: aid_offset
         * - current opened
         */
        const len = _.size(known_pages);
        known_pages.splice(0, len);
        setOpened(null);
        setAidOffset(undefined);
    }, [artifactsFilters, known_pages]);
    /** XXX */
    const searchOptions: any = { valuesAreRegex1: true, reduced: true };
    if (skipScratch) {
        searchOptions.skipScratch = skipScratch;
    }
    const onCollapse: OnCollapseEventType = (event, rowKey) => {
        if (opened === rowKey) {
            setOpened(null);
            return;
        }
        setOpened(rowKey);
    };
    const onClickLoadNext = () => {
        const new_aid_offset: string = _.last(artifacts).aid;
        setOpened(null);
        setAidOffset(new_aid_offset);
    };
    const onClickLoadPrev = () => {
        //const firstAidOnActivePage = artifacts[0].aid;
        if (!aid_offset) {
            return;
        }
        const index = _.findLastIndex(known_pages, (o) => aid_offset < o);
        if (index < -1) {
            /** reach first page */
            setOpened(null);
            setAidOffset(undefined);
            return;
        }
        const new_aid_offset = known_pages[index];
        setOpened(null);
        setAidOffset(new_aid_offset);
    };
    const {
        loading: isLoading,
        error,
        data,
    } = useQuery(ArtifactsListByFiltersQuery1, {
        variables: {
            dbFieldValues1: regexs,
            aid_offset,
            options: searchOptions,
            atype: artifactsType,
        },
        fetchPolicy: 'cache-first',
        errorPolicy: 'all',
        notifyOnNetworkStatusChange: true,
        skip: _.isEmpty(regexs),
    });
    /** Even there is an error there could be data */
    const haveData =
        !isLoading && data && !_.isEmpty(data.db_artifacts.artifacts);
    const haveErrorNoData = !isLoading && error && !haveData;
    if (haveData) {
        artifacts = data.db_artifacts.artifacts;
        has_next = data.db_artifacts.has_next;
        const aid_offset: string = _.last(artifacts).aid;
        if (!_.includes(known_pages, aid_offset)) {
            known_pages.splice(
                _.sortedIndexBy(known_pages, aid_offset, (x) => -x),
                0,
                aid_offset,
            );
        }
    }
    if (known_pages.length && _.size(artifacts)) {
        const aid_offset = _.last(artifacts).aid;
        currentPage = _.chain(known_pages)
            .findIndex((x) => x === aid_offset)
            .add(1)
            .value()
            .toString();
    }
    if (Number(currentPage) > 1) {
        loadPrevIsDisabled = false;
    }
    if (has_next) {
        loadNextIsDisabled = false;
    }
    var rows_errors: TableRowsType = [];
    if (haveErrorNoData) {
        const errorMsg: InputRowType = {
            title: 'Cannot fetch data',
            body: <div>{error?.toString()}</div>,
            type: 'error',
        };
        rows_errors = mkSpecialRows(errorMsg);
    }
    const rows_artifacts: TableRowsType = mkArtifactsRows({
        opened,
        artifacts,
        waitForRef,
        queryString,
    });
    const known_rows: TableRowsType = _.concat(rows_artifacts, rows_errors);
    const forceExpandErrors = haveErrorNoData ? true : false;
    const paginationProps = {
        isLoading,
        currentPage,
        loadPrevIsDisabled,
        loadNextIsDisabled,
        onClickLoadPrev,
        onClickLoadNext,
    };
    const results = (
        <>
            <Table
                header={<PaginationToolbar {...paginationProps} />}
                variant={TableVariant.compact}
                cells={columns}
                rows={known_rows}
                aria-label="table with results"
                onCollapse={onCollapse}
                rowWrapper={({ ...props }) =>
                    CustomRowWrapper({ scrollRef, ...props })
                }
            >
                <TableHeader />
                <TableBody />
            </Table>
            <PaginationToolbar {...paginationProps} />
            <ShowErrors error={error} forceExpand={forceExpandErrors} />
        </>
    );
    return results;
};

const ArtifactsListByFilters = () => {
    const element = (
        <>
            <ArtifactsTable />
        </>
    );
    return element;
};

export default ArtifactsListByFilters;
