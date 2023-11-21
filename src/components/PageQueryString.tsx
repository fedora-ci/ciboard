/*
 * This file is part of ciboard
 *
 * Copyright (c) 2021, 2023 Andrei Stepanov <astepano@redhat.com>
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
import { useEffect } from 'react';
import { PageSection } from '@patternfly/react-core';
import { useApolloClient } from '@apollo/client';
import { useSearchParams } from 'react-router-dom';

import { config } from '../config';
import { WaiveModal } from './WaiveForm';
import { SearchToolbar } from './SearchToolbar';
import { ShowArtifacts } from './ArtifactsList';
import { PageCommon, ToastAlertGroup } from './PageCommon';
import { useAppDispatch, useAppSelector } from '../hooks';
import {
    actLoad,
    actArtTypes,
    actNewerThen,
    actQueryString,
} from './../actions';
import {
    actPage,
    actPaginationSize,
    InitialState as queryInitialState,
} from '../slices/artifactsQuerySlice';

interface SetQueryStringProps {}
const SetQueryString: React.FC<SetQueryStringProps> = (_props: {}) => {
    const artifacts = useAppSelector((state) => state.artifacts);
    const queryState = useAppSelector((state) => state.artifactsQuery);
    const [searchParams, setSearchParams] = useSearchParams();
    const dispatch = useAppDispatch();
    const client = useApolloClient();
    /** Used to init redux-store when page is opened for first time, and there are query-string params */
    const initQs = searchParams.get('qs');
    const initNewer = searchParams.get('newer');
    const initArtTypesString = searchParams.get('atypes');
    const initPage = searchParams.get('page');
    const initPageSize = searchParams.get('pagesize');
    useEffect(() => {
        if (initNewer) {
            /** this will reset page to 1 */
            dispatch(actNewerThen(initNewer));
        }
        if (initPageSize) {
            /** this will reset page to 1 */
            const pagesize = _.toNumber(initPageSize);
            dispatch(actPaginationSize(pagesize));
        }
        if (initArtTypesString) {
            /** this will reset page to 1 */
            const atypes = initArtTypesString.split(',');
            dispatch(actArtTypes(atypes));
        }
        if (initQs) {
            dispatch(actQueryString(initQs));
        }
        if (initPage) {
            /** Order of the above `if` is important */
            const page = _.toNumber(initPage);
            dispatch(actPage(page));
        }
        // Always load some data on open
        dispatch(actLoad(client));
        /**
         * Ensure the useEffect only runs once.
         * That will not invoke re-renders because dispatch value will not change
         */
    }, [dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

    const { page, paginationSize } = queryState;
    useEffect(() => {
        if (queryInitialState.page === page) {
            searchParams.delete('page');
        } else {
            searchParams.set('page', `${page}`);
        }
        if (queryInitialState.paginationSize === paginationSize) {
            searchParams.delete('pagesize');
        } else {
            searchParams.set('pagesize', `${paginationSize}`);
        }
        setSearchParams(searchParams.toString());
    }, [page, paginationSize]); // eslint-disable-line react-hooks/exhaustive-deps

    const { artTypes, newerThen, queryString } = queryState;
    useEffect(() => {
        if (_.isEqual(queryInitialState.artTypes, queryState.artTypes)) {
            searchParams.delete('atypes');
        } else {
            if (artTypes) {
                searchParams.set('atypes', artTypes.join(','));
            }
        }
        if (_.isEqual(queryInitialState.newerThen, queryState.newerThen)) {
            searchParams.delete('newer');
        } else {
            if (newerThen) {
                searchParams.set('newer', newerThen.toString());
            }
        }
        if (_.isEqual(queryInitialState.queryString, queryState.queryString)) {
            searchParams.delete('qs');
        } else {
            if (queryString) {
                searchParams.set('qs', queryString);
            }
        }
        setSearchParams(searchParams.toString());
    }, [artifacts, artTypes, newerThen, queryString]); // eslint-disable-line react-hooks/exhaustive-deps
    return null;
};

export function PageQueryString(_props: {}) {
    const artifactsQuery = useAppSelector((state) => state.artifactsQuery);
    const { queryString } = artifactsQuery;

    let pageTitle: string | undefined;
    if (!_.isUndefined(queryString)) {
        let queryForTitle = queryString;
        if (queryForTitle.length > 40) {
            queryForTitle = queryForTitle.substring(0, 40).trimEnd() + '…';
        }
        pageTitle = `Results for ‘${queryForTitle}’ | ${config.defaultTitle}`;
    }

    return (
        <PageCommon title={pageTitle}>
            <PageSection isFilled={false}>
                <SearchToolbar />
                <ShowArtifacts />
            </PageSection>
            <ToastAlertGroup />
            <WaiveModal />
            <SetQueryString />
        </PageCommon>
    );
}
