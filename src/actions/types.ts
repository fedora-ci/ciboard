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

import qs from 'qs';
import { AlertVariant } from '@patternfly/react-core';
import { Artifact, StateType } from '../artifact';
import React from 'react';

export const SST_PAGE = 'SST_PAGE';
export const SST_MENU = 'SUBMIT_MENU';
export const SST_LOADING = 'SUBMIT_LOADING';

export const FETCH_USER = 'FETCH_USER';

export const MAIN_SCROLLER_BOTTOM = 'MAIN_SCROLLER_BOTTOM';

export const NEW_EPOCH = 'NEW_EPOCH';
export const ADD_POST_QUERY = 'ADD_POST_QUERY';
export const FETCH_ARTIFACTS = 'FETCH_ARTIFACTS';
export const UPDATE_ARTIFACT = 'UPDATE_ARTIFACT';
export const ARTIFACTS_LOADING = 'ARTIFACTS_LOADING';

export const GATE_ARTIFACTS_SET_SEARCH_OPTIONS =
    'GATE_ARTIFACTS_SET_SEARCH_OPTIONS';
export const GATE_ARTIFACTS_BUMP_SEARCH_EPOCH =
    'GATE_ARTIFACTS_BUMP_SEARCH_EPOCH';

export const ADD_FILTER = 'ADD_FILTER';
export const DELETE_FILTER = 'DELETE_FILTER';
export const SET_QUERY_STRING = 'SET_QUERY_STRING';
export const SET_OPTIONS_FOR_FILTERS = 'SET_OPTIONS_FOR_FILTERS';

export const POP_ALERT = 'POP_ALERT';
export const PUSH_ALERT = 'PUSH_ALERT';

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

/**
 * Actions
 */

export interface ActionPushAlert {
    type: typeof PUSH_ALERT;
    payload: {
        key: number;
        title: React.ReactNode;
        variant: keyof typeof AlertVariant;
    };
}

export interface ActionPopAlert {
    type: typeof POP_ALERT;
    payload: {
        key: number;
    };
}

export interface ActionSetOptionsForFilters {
    type: typeof SET_OPTIONS_FOR_FILTERS;
    payload: {
        skipScratch: boolean;
    };
}

export interface ActionAddFilter {
    type: typeof ADD_FILTER;
    payload: {
        newval: string;
        type: string;
    };
}

export interface ActionDeleteFilter {
    type: typeof DELETE_FILTER;
    payload: {
        delval: string;
    };
}

export interface ActionSetQueryString {
    type: typeof SET_QUERY_STRING;
    payload: {
        queryString: qs.ParsedQs;
    };
}

export interface ActionGASetSearchOptions {
    type: typeof GATE_ARTIFACTS_SET_SEARCH_OPTIONS;
    payload: {
        gateTag?: string;
        packager?: string;
        ciSystem?: string;
        sstTeams?: string[];
        productId?: number;
        buildType?: string;
        ignoreCiSystem?: boolean;
    };
}

export interface ActionGABumpSearchEpoch {
    type: typeof GATE_ARTIFACTS_BUMP_SEARCH_EPOCH;
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

export interface ActionAuthFetchUser {
    type: typeof FETCH_USER;
    payload: {
        displayName: string;
        nameID: string;
    };
}

/**
 * Actions for reducers
 */

export type ActionsQueryStringType = ActionSetQueryString;
export type ActionsAuthType = ActionAuthFetchUser;
export type ActionsAlertsType = ActionPushAlert | ActionPopAlert;
export type ActionsFiltersType =
    | ActionSetOptionsForFilters
    | ActionAddFilter
    | ActionDeleteFilter;
export type ActionsGateArtifactsType =
    | ActionGASetSearchOptions
    | ActionGABumpSearchEpoch;
