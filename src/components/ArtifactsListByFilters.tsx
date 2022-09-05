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
    IRow,
    Table,
    TableBody,
    TableHeader,
    TableVariant,
} from '@patternfly/react-table';

import {
    ArtifactsCompleteQuery,
    ArtifactsListByFiltersQuery,
} from '../queries/Artifacts';
import {
    ShowErrors,
    tableColumns,
    InputRowType,
    mkSpecialRows,
    mkArtifactsRows,
    CustomRowWrapper,
    OnCollapseEventType,
} from '../utils/artifactsTable';
import { RootStateType } from '../reducers';
import { IStateFilters } from '../actions/types';
import { PaginationToolbar } from './PaginationToolbar';
import { Artifact, isArtifactMBS, isArtifactRPM } from '../artifact';
import styles from '../custom.module.css';

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
    let artifacts: any[] = [];
    let hasNext = false;
    let currentPage: number = 1;
    let loadNextIsDisabled = true;
    let loadPrevIsDisabled = true;
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
    } = useQuery(ArtifactsListByFiltersQuery, {
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
    const haveData = !isLoading && data && !_.isEmpty(data.artifacts?.artifacts);
    const haveErrorNoData = !isLoading && error && !haveData;
    const aidsAtPage: string[] = [];
    if (haveData) {
        artifacts = data.artifacts.artifacts;
        _.forEach(artifacts, (a: Artifact) => {
            if (
                (isArtifactRPM(a) || isArtifactMBS(a)) &&
                a.payload.gate_tag_name
            ) {
                aidsAtPage.push(a.aid);
            }
        });
        hasNext = data.artifacts.has_next;
        const aid_offset: string = _.last(artifacts).aid;
        if (!_.includes(known_pages, aid_offset)) {
            known_pages.splice(
                _.sortedIndexBy(known_pages, aid_offset, (x) => -x),
                0,
                aid_offset,
            );
        }
    }
    const { loading: isCompleteLoading, data: dataComplete } = useQuery(
        ArtifactsCompleteQuery,
        {
            variables: {
                dbFieldName1: 'aid',
                dbFieldValues1: aidsAtPage,
                aid_offset,
                /* ask for exact set of known artifacts */
                options: { ...searchOptions, valuesAreRegex1: false },
                atype: artifactsType,
            },
            fetchPolicy: 'cache-first',
            errorPolicy: 'all',
            notifyOnNetworkStatusChange: true,
            skip: _.isEmpty(aidsAtPage),
        },
    );
    const haveCompleteData =
        !isCompleteLoading &&
        dataComplete &&
        !_.isEmpty(dataComplete.artifacts.artifacts);
    if (haveCompleteData) {
        const withGating = dataComplete.artifacts.artifacts;
        artifacts = _.map(artifacts, (a) => {
            const updated = _.find(withGating, ['aid', a.aid]);
            return updated ? updated : a;
        });
    }
    if (known_pages.length && _.size(artifacts)) {
        const aid_offset = _.last(artifacts).aid;
        currentPage = _.chain(known_pages)
            .findIndex((x) => x === aid_offset)
            .add(1)
            .value();
    }
    if (currentPage > 1) {
        loadPrevIsDisabled = false;
    }
    if (hasNext) {
        loadNextIsDisabled = false;
    }
    let rowsErrors: IRow[] = [];
    if (haveErrorNoData) {
        const errorMsg: InputRowType = {
            title: 'Cannot fetch data',
            body: <div>{error?.toString()}</div>,
            type: 'error',
        };
        rowsErrors = mkSpecialRows(errorMsg);
    }
    const rows_artifacts = mkArtifactsRows({
        opened,
        artifacts,
        waitForRef,
        queryString,
        gatingDecisionIsLoading: isCompleteLoading,
    });
    const known_rows = _.concat(rows_artifacts, rowsErrors);
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
                className={styles.artifactsTable}
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

export function ArtifactsListByFilters() {
    return <ArtifactsTable />;
}
