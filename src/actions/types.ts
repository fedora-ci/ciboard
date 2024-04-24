/*
 * This file is part of ciboard
 *
 * Copyright (c) 2021, 2022, 2024 Andrei Stepanov <astepano@redhat.com>
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

import React from 'react';
import { AlertVariant } from '@patternfly/react-core';

import { Artifact } from '../types';
import { CiTest } from '../components/PageDetails/types';

export const SST_PAGE = 'SST_PAGE';
export const SST_MENU = 'SUBMIT_MENU';
export const SST_LOADING = 'SUBMIT_LOADING';

export const MAIN_SCROLLER_BOTTOM = 'MAIN_SCROLLER_BOTTOM';

export const NEW_EPOCH = 'NEW_EPOCH';
export const ADD_POST_QUERY = 'ADD_POST_QUERY';
export const FETCH_ARTIFACTS = 'FETCH_ARTIFACTS';
export const UPDATE_ARTIFACT = 'UPDATE_ARTIFACT';
export const ARTIFACTS_LOADING = 'ARTIFACTS_LOADING';

/**
 * States
 */

export interface IStateArtifactsQuery {
    page: number;
    sortBy: string | undefined;
    artTypes: string[] | undefined;
    newerThen: string | undefined;
    doDeepSearch: boolean;
    queryString: string | undefined;
    paginationSize: number;
}

export interface IStateAlerts {
    alerts: {
        key: number;
        title: React.ReactNode;
        variant: keyof typeof AlertVariant;
    }[];
}

export interface IStateWaiver {
    reason: string;
    artifact?: Artifact;
    ciTest?: CiTest;
    timestamp?: number;
    waiveError: string;
}

export interface IStateAuth {
    nameID: string;
    displayName: string;
}

/*
 * Payload types for Redux actions.
 */

export interface PushAlertPayload {
    key: number;
    title: React.ReactNode;
    variant: keyof typeof AlertVariant;
}

export interface PopAlertPayload {
    key: number;
}

export interface GASetSearchOptionsPayload {
    gateTag?: string;
    packager?: string;
    ciSystem?: string;
    sstTeams?: string[];
    productId?: number;
    buildType?: string;
    ignoreCiSystem?: boolean;
}

export interface CreateWaiverPayload {
    artifact: Artifact | undefined;
    ciTest: CiTest | undefined;
}

export interface SubmitWaiverPayload {
    reason: string;
    /* Cannot send waiver */
    waiveError: string;
}

export interface FetchUserPayload {
    nameID: string;
    displayName: string;
}
