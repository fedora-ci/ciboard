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

import * as React from 'react';
import PageHelp from './components/PageHelp';
import PageNewIssue from './components/PageNewIssue';
import PageByFilters from './components/PageByFilters';
import PageByMongoField from './components/PageByMongoField';
import { PageSST } from './components/PageSST';

export type menuEntryType = {
    title: string;
    key: string;
    to: string;
    route?: string;
    render: (props: any) => JSX.Element;
};

const menuRoutes: menuEntryType[] = [
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
        title: 'Report issue',
        key: 'issue',
        to: '/newissue',
        render: (props) => <PageNewIssue {...props} />,
    },
    {
        title: 'Help',
        key: 'help',
        to: '/help',
        render: (props) => <PageHelp {...props} />,
    },
];

const otherRoutes: menuEntryType[] = [
    {
        title: '',
        key: 'artifact',
        to: '/artifact/:type/:search/:value',
        render: (props) => <PageByMongoField {...props} />,
    },
];

export { menuRoutes, otherRoutes };
