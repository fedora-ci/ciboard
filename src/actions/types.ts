/*
 * This file is part of ciboard
 *
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

import qs from 'qs';
import { AlertVariant } from '@patternfly/react-core';
import { Artifact, StateType } from '../artifact';
import React from 'react';

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

export interface IStateFilters {
    type: string;
    active: string[];
    options: {
        skipScratch: boolean;
    };
}

export interface IStateAlerts {
    alerts: {
        key: number;
        title: React.ReactNode;
        variant: keyof typeof AlertVariant;
    }[];
}

export interface IStateWaiver {
    artifact?: Artifact;
    reason: string;
    state?: StateType;
    timestamp?: number;
    waiveError: string;
}

export interface IStateAuth {
    displayName: string;
    nameID: string;
}

export interface IStateQueryString {
    queryString: qs.ParsedQs;
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

export interface AddFilterPayload {
    newval: string;
    type: string;
}

export interface DeleteFilterPayload {
    delval: string;
}

export interface SetOptionsForFiltersPayload {
    skipScratch: boolean;
}

export interface SetQueryStringPayload {
    queryString: qs.ParsedQs;
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
    state: StateType | undefined;
    artifact: Artifact | undefined;
}

export interface SubmitWaiverPayload {
    /* Cannot send waiver */
    waiveError: string;
    reason: string;
}

export interface FetchUserPayload {
    displayName: string;
    nameID: string;
}
