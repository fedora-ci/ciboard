/*
 * This file is part of ciboard

 * Copyright (c) 2021, 2022, 2023 Andrei Stepanov <astepano@redhat.com>
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

import { PageSST } from './components/PageSST';
import { PageHelp } from './components/PageHelp';
import { PageDetails } from './components/PageDetails';
import { PageNewIssue } from './components/PageNewIssue';
import { PageQueryString } from './components/PageQueryString';
import { PageMetadataEdit } from './components/PageMetadataEdit';
import { PageMetadataList } from './components/PageMetadataList';
import { PageDbFieldLegacy } from './components/PageDbFieldLegacy';

export interface MenuEntry {
    element: JSX.Element;
    title: string;
    key: string;
    path: string;
    route?: string;
    /* show entry only if required AuthZ flag is true */
    reqAuthzFlag?: string;
}

export const menuRoutes: MenuEntry[] = [
    {
        title: 'Search test results',
        key: 'artifact-search',
        path: '/search',
        element: <PageQueryString />,
    },
    {
        title: 'Subsystems',
        key: 'subsystems',
        path: '/sst',
        route: '/sst/*',
        element: <PageSST />,
    },
    {
        title: 'Report issue',
        key: 'issue',
        path: '/newissue',
        element: <PageNewIssue />,
    },
    {
        title: 'Metadata',
        key: 'metadata',
        path: '/metadata',
        element: <PageMetadataList />,
        reqAuthzFlag: 'can_edit_metadata',
    },
    {
        title: 'Help',
        key: 'help',
        path: '/help',
        element: <PageHelp />,
    },
];

export const otherRoutes: MenuEntry[] = [
    {
        title: '',
        key: 'artifact',
        path: '/artifact/:type/:search/:value',
        element: <PageDbFieldLegacy />,
    },
    {
        title: '',
        key: 'details',
        path: '/details/:artifactId',
        element: <PageDetails />,
    },
    {
        title: '',
        key: 'metadata-edit',
        path: '/metadata/edit/:id?/:clone?',
        element: <PageMetadataEdit />,
    },
];
