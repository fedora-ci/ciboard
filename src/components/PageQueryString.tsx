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
import { useSearchParams } from 'react-router-dom';

import { config } from '../config';
import { WaiveModal } from './WaiveForm';
import { SearchToolbar } from './SearchToolbar';
import { ShowArtifacts } from './ArtifactsList';
import { PageCommon, ToastAlertGroup } from './PageCommon';
import { useAppDispatch, useAppSelector } from '../hooks';
import { InitialState as queryInitialState } from '../slices/artifactsQuerySlice';
import { actArtTypes, actNewerThen, actQueryString } from './../actions';

interface SetQueryStringProps {}
const SetQueryString: React.FC<SetQueryStringProps> = (_props: {}) => {
    const artifacts = useAppSelector((state) => state.artifacts);
    const queryState = useAppSelector((state) => state.artifactsQuery);
    const [searchParams, setSearchParams] = useSearchParams();
    const dispatch = useAppDispatch();
    const newer = searchParams.get('newer');
    const queryString = searchParams.get('qs');
    const atypesString = searchParams.get('atypes');
    useEffect(() => {
        if (atypesString) {
            const atypes = atypesString.split(',');
            dispatch(actArtTypes(atypes));
        }
        if (newer) {
            dispatch(actNewerThen(newer));
        }
        if (queryString) {
            dispatch(actQueryString(queryString));
        }
        /**
         * Ensure the useEffect only runs once.
         * That will not invoke re-renders because dispatch value will not change
         */
    }, [dispatch]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => {
        const currentParams = Object.fromEntries(searchParams.entries());
        if (
            queryState.artTypes &&
            !_.isEqual(_.split(atypesString, ','), queryState.queryString) &&
            !_.isEqual(queryInitialState.artTypes, queryState.artTypes)
        ) {
            currentParams['atypes'] = queryState.artTypes.join(',');
        }
        if (
            queryState.newerThen &&
            !_.isEqual(newer, queryState.newerThen) &&
            !_.isEqual(queryInitialState.newerThen, queryState.newerThen)
        ) {
            currentParams['newer'] = queryState.newerThen.toString();
        }
        if (
            queryState.queryString &&
            !_.isEqual(queryString, queryState.queryString) &&
            !_.isEqual(queryInitialState.queryString, queryState.queryString)
        ) {
            currentParams['qs'] = queryState.queryString;
        }
        setSearchParams(currentParams);
        console.log('XXXXX XXXXX effect');
    }, [artifacts]); // eslint-disable-line react-hooks/exhaustive-deps
    console.log('XXXXX XXXXX');
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
