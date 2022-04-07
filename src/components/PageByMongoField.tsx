/*
 * This file is part of ciboard

 * Copyright (c) 2021, 2022 Andrei Stepanov <astepano@redhat.com>
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
import { useParams } from 'react-router-dom';
import React, { useState, useRef } from 'react';
import { useQuery } from '@apollo/client';
import {
    IRow,
    Table,
    TableBody,
    TableHeader,
    TableVariant,
} from '@patternfly/react-table';

import { config } from '../config';
import { ArtifactType } from '../artifact';
import { PageCommon, ToastAlertGroup } from './PageCommon';
import { ArtifactsCompleteQuery } from '../queries/Artifacts';
import { PaginationToolbar, PaginationToolbarProps } from './PaginationToolbar';
import { getArtifactName } from '../utils/artifactUtils';
import {
    ShowErrors,
    InputRowType,
    tableColumns,
    mkSpecialRows,
    mkArtifactsRows,
    CustomRowWrapper,
    OnCollapseEventType,
} from '../utils/artifactsTable';
import WaiveForm from './WaiveForm';

interface ArtifactsTableProps {
    onArtifactsLoaded?(artifacts: ArtifactType[]): void;
}

/**
 * Displays artifacts based on current URL
 * Expects URL in form: '/artifact/:type/:search/:value',
 * Example:
 *
 *     https://dashboard.osci.redhat.com/#/artifact/brew-build/aid/25997353,25997351
 *
 * Known URL args:
 *
 * - embedded - used for embedded view
 * - focus - used to focus on a specific test for a single artifact view
 */

const ArtifactsTable: React.FC<any> = ({
    onArtifactsLoaded,
}: ArtifactsTableProps) => {
    const scrollRef = useRef<HTMLTableRowElement>(null);
    var artifacts: ArtifactType[] = [];
    /**
     * Pagination vars
     */
    const aid_offset_pages = useRef<string[]>([]);
    /**
     * array of sorted 'aid' from the bottom of each known page
     */
    const known_pages = aid_offset_pages.current;
    /**
     * aid_offset -- entry from 'known_pages'
     * Set when user clicks on 'prev' or 'next'
     * Maps to page number
     */
    const [aid_offset, setAidOffset] = useState<string | undefined>(undefined);
    /**
     * has_next -- returned by query from backend
     */
    var has_next = false;
    /**
     * currentPage -- index in known pages
     */
    var currentPage: number = 1;
    var loadNextIsDisabled = true;
    var loadPrevIsDisabled = true;
    /**
     * From url
     */
    type MongoFieldsParams = {
        type: string;
        search: string;
        value: string;
    };
    const {
        type: artifactsType,
        search: dbFieldName,
        value: dbFieldValuesString,
    } = useParams<MongoFieldsParams>();
    const dbFieldValues = dbFieldValuesString.split(',');
    /** Index of the currently expanded artifact row within the `artifacts` list. */
    const [opened, setOpened] = useState<number | null>(null);
    /** page navigation */
    const onClickLoadNext = () => {
        const new_aid_offset = _.last(artifacts)?.aid;
        setOpened(null);
        setAidOffset(new_aid_offset);
    };
    const onClickLoadPrev = () => {
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
    /** Frontend need to ask exact DB field, with its full path */
    const dbFieldPath = _.includes(['aid'], dbFieldName)
        ? dbFieldName
        : `payload.${dbFieldName}`;
    const {
        loading: isLoading,
        error,
        data,
    } = useQuery(ArtifactsCompleteQuery, {
        variables: {
            atype: artifactsType,
            aid_offset,
            dbFieldName1: dbFieldPath,
            dbFieldValues1: dbFieldValues,
        },
        /** https://www.apollographql.com/docs/react/api/core/ApolloClient/ */
        fetchPolicy: 'cache-first',
        notifyOnNetworkStatusChange: true,
        errorPolicy: 'all',
        skip: _.isEmpty(dbFieldValues),
    });
    const haveData = !isLoading && data && !_.isEmpty(data.artifacts.artifacts);
    const haveErrorNoData = !isLoading && error && !haveData;
    if (haveData) {
        artifacts = data.artifacts.artifacts;
        has_next = data.artifacts.has_next;
        if (onArtifactsLoaded) {
            onArtifactsLoaded(artifacts);
        }
        const aid_at_bottom = _.last(artifacts)?.aid;
        if (!_.includes(known_pages, aid_at_bottom) && aid_at_bottom) {
            known_pages.splice(
                /**
                 * Keep list sorted, by insertign aid at the correct place.
                 * Q: Does this works when 'aid' is not number?
                 */
                _.sortedIndexBy(known_pages, aid_at_bottom, (x) => -x),
                0,
                aid_at_bottom,
            );
        }
    }
    if (known_pages.length && _.size(artifacts)) {
        const aidAtBottom = _.last(artifacts)?.aid;
        currentPage = 1 + _.findIndex(known_pages, (x) => x === aidAtBottom);
    }
    if (currentPage > 1) {
        loadPrevIsDisabled = false;
    }
    if (has_next) {
        loadNextIsDisabled = false;
    }
    const onCollapse: OnCollapseEventType = (
        _event,
        rowKey,
        _isOpen,
        _rowData,
        _extraData,
    ) => {
        if (opened === rowKey) {
            setOpened(null);
            return;
        }
        setOpened(rowKey);
    };
    var indexToOpen = opened;
    if (_.size(artifacts) === 1) {
        /** Always open if only 1 entry */
        indexToOpen = 0;
    }
    const columns = tableColumns(artifactsType);
    var rows_errors: IRow[] = [];
    if (haveErrorNoData) {
        const errorMsg: InputRowType = {
            title: 'Cannot fetch data',
            body: <>{error?.toString()}</>,
            type: 'error',
        };
        rows_errors = mkSpecialRows(errorMsg);
    }
    const rows_artifacts = mkArtifactsRows({
        artifacts,
        opened: indexToOpen,
    });
    const forceExpandErrors = haveErrorNoData ? true : false;
    const foundValues = _.map(artifacts, _.property(dbFieldPath));
    const missing = _.difference(dbFieldValues, foundValues);
    var rows_missing: IRow[] = [];
    if (!_.isEmpty(missing) && haveData) {
        rows_errors = mkSpecialRows({
            title: `No data for ${artifactsType} with ${dbFieldName}`,
            body: <>{missing.toString()}</>,
            type: 'error',
        });
    }
    var rows_loading: IRow[] = [];
    if (isLoading) {
        rows_loading = mkSpecialRows({
            title: 'Loading data.',
            body: <>'Please wait.'</>,
            type: 'loading',
        });
    }
    const known_rows = _.concat(
        rows_artifacts,
        rows_errors,
        rows_missing,
        rows_loading,
    );
    const paginationProps: PaginationToolbarProps = {
        isLoading,
        currentPage,
        loadPrevIsDisabled,
        loadNextIsDisabled,
        onClickLoadPrev,
        onClickLoadNext,
    };
    const element = (
        <>
            <Table
                header={<PaginationToolbar {...paginationProps} />}
                variant={TableVariant.compact}
                borders={false}
                cells={columns}
                rows={known_rows}
                aria-label="table with results"
                onCollapse={onCollapse}
                rowWrapper={(rowWrapperProps) =>
                    CustomRowWrapper({ scrollRef, ...rowWrapperProps })
                }
            >
                <TableHeader />
                <TableBody />
            </Table>
            <PaginationToolbar {...paginationProps} />
            <ShowErrors error={error} forceExpand={forceExpandErrors} />
        </>
    );
    return element;
};

export function PageByMongoField() {
    const [pageTitle, setPageTitle] = useState<string | undefined>();
    /**
     * Display the artifact's NVR/NVSC/whatever and gating status (if available) in
     * the page title once the artifact info is loaded.
     */
    const onArtifactsLoaded = (artifacts: ArtifactType[]) => {
        /**
         * XXX: We only handle the single-artifact case for now.
         * TODO: Support multiple artifacts per page. Perhaps only display info for
         * the currently expanded row?
         */
        if (artifacts?.length !== 1) return;
        const artifact = artifacts[0];
        let title = `${getArtifactName(artifact)} | ${config.defaultTitle}`;
        if (artifact.greenwave_decision?.summary) {
            if (artifact.greenwave_decision.policies_satisfied)
                title = `✅ ${title}`;
            else title = `❌ ${title}`;
        }
        setPageTitle(title);
    };

    return (
        <PageCommon title={pageTitle}>
            <ArtifactsTable />
            <ToastAlertGroup />
            <WaiveForm />
        </PageCommon>
    );
}
