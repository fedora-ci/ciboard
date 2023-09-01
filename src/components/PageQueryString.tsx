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
import { PageSection } from '@patternfly/react-core';

import { config } from '../config';
import { WaiveModal } from './WaiveForm';
import { SearchToolbar } from './SearchToolbar';
import { ShowArtifacts } from './ArtifactsList';
import { useAppSelector } from '../hooks';
import { PageCommon, ToastAlertGroup } from './PageCommon';

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
        </PageCommon>
    );
}
