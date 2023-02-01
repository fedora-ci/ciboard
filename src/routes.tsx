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

import * as React from 'react';
import { PageByFilters } from './components/PageByFilters';
import { PageByMongoField } from './components/PageByMongoField';
import { PageGating } from './components/PageGating';
import { PageHelp } from './components/PageHelp';
import { PageMetadataEdit } from './components/PageMetadataEdit';
import { PageMetadataList } from './components/PageMetadataList';
import { PageNewIssue } from './components/PageNewIssue';
import { PageResultsNew } from './components/PageResultsNew';
import { PageSST } from './components/PageSST';

export interface MenuEntry {
    title: string;
    key: string;
    to: string;
    route?: string;
    render: (props: any) => JSX.Element;
    /* show entry only if required AuthZ flag is true */
    reqAuthzFlag?: string;
}

export const menuRoutes: MenuEntry[] = [
    {
        title: 'Search test results',
        key: 'artifact-search',
        to: '/search',
        render: (props) => <PageByFilters {...props} />,
    },
    {
        title: 'Subsystems',
        key: 'subsystems',
        to: '/sst',
        route: '/sst/:section?/:release?',
        render: (props) => <PageSST {...props} />,
    },
    {
        title: 'Gating tests',
        key: 'gatingtests',
        to: '/gating',
        route: '/gating',
        render: (props) => <PageGating {...props} />,
    },
    {
        title: 'Report issue',
        key: 'issue',
        to: '/newissue',
        render: (props) => <PageNewIssue {...props} />,
    },
    {
        title: 'Metadata',
        key: 'metadata',
        to: '/metadata',
        render: (props) => <PageMetadataList {...props} />,
        reqAuthzFlag: 'can_edit_metadata',
    },
    {
        title: 'Help',
        key: 'help',
        to: '/help',
        render: (props) => <PageHelp {...props} />,
    },
];

export const otherRoutes: MenuEntry[] = [
    {
        title: '',
        key: 'artifact',
        to: '/artifact/:type/:search/:value',
        render: (props) => <PageByMongoField {...props} />,
    },
    {
        title: '',
        key: 'metadata-edit',
        to: '/metadata/edit/:id?/:clone?',
        render: (props) => <PageMetadataEdit {...props} />,
    },
    {
        title: '',
        key: 'resultsnew',
        /*
         * Further details on new address structure:
         * - /artifact/:type/:field/:value - same as now, see PageByMongoField
         * - /artifact/:type/:field/:value/tc/:testcase - show specific test in sidebar
         * - /artifact/:type/:field/:value/...?
         */
        to: '/resultsnew/:task_id?',
        render: (props) => <PageResultsNew {...props} />,
    },
];
