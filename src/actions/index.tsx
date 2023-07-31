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

import _ from 'lodash';
import axios from 'axios';
import { ApolloClient } from '@apollo/client';

import { GASetSearchOptionsPayload } from './types';
import { AppDispatch, GetState } from '../reduxStore';
import * as alertsSlice from '../slices/alertsSlice';
import * as authSlice from '../slices/authSlice';
import * as filtersSlice from '../slices/filtersSlice';
import * as gatingTestsFormSlice from '../slices/gatingTestsFormSlice';
import * as waiveSlice from '../slices/waiveSlice';
import { Artifact, PayloadRPMBuildType } from '../artifact';
import { greenwave } from '../config';
import WaiverdbNewMutation from '../mutations/WaiverdbNew';
import { db_field_from_atype } from '../utils/artifactUtils';

export const cleanseGatingFormState = () => gatingTestsFormSlice.cleanse();

export const goToGatingNextPage = (aid: string) =>
    gatingTestsFormSlice.goToNextPage(aid);

export const goToGatingPrevPage = () => gatingTestsFormSlice.goToPrevPage();

export const setGatingSearchOptions = (
    gatingOptions: GASetSearchOptionsPayload,
) => gatingTestsFormSlice.setCriteria(gatingOptions);

export const updateGatingSearchOptions = (
    gatingOptions: GASetSearchOptionsPayload,
) => gatingTestsFormSlice.updateCriteria(gatingOptions);

type AlertVariantType = 'success' | 'danger' | 'warning' | 'info' | 'default';

export const popAlert = (key: number) => alertsSlice.popAlert({ key });

/**
 * Push a new alert to the alerts queue.
 * @param variant Variant of the alert component, e.g. `success` or `warning`.
 * @param title Text of the alert.
 * @param autoRm If `true`, automatically remove the alert after 3 seconds.
 * @returns Promise that resolves after a succesful event dispatch.
 */
export const pushAlert = (
    variant: AlertVariantType,
    title: React.ReactNode,
    autoRm = true,
) => {
    return async (dispatch: AppDispatch) => {
        const key = new Date().getTime();
        if (autoRm) {
            setTimeout(function () {
                dispatch(popAlert(key));
            }, 3000);
        }
        dispatch(alertsSlice.pushAlert({ key, variant, title }));
    };
};

export const addFilter = (newval = '', type = '') => {
    return async (dispatch: AppDispatch, getState: GetState) => {
        const { filters } = getState();
        const currentType = filters.type;
        const activeFilters = filters.active;
        const foreignRegex = /[^\u0000-\u007f]/;
        if (foreignRegex.test(newval)) {
            console.log('Ignoring filter with no-latin character: %s', newval);
            return null;
        }
        console.log('%O', { newval, type });
        if (!_.has(db_field_from_atype, type)) {
            console.log('Ignoring filter with unsupported type: %s', type);
            return null;
        }
        console.log('Add new filter', type, newval);
        if (type !== currentType) {
            /** new epoch */
        } else if (_.includes(activeFilters, newval)) {
            console.log('Do not add existing filter', newval);
            return null;
        }
        dispatch(filtersSlice.addFilter({ newval, type }));
    };
};

export const deleteFilter = (delval = '') =>
    filtersSlice.deleteFilter({ delval });

export const setOptionsForFilters = (newOptions: any) => {
    return async (dispatch: AppDispatch, getState: GetState) => {
        const { filters } = getState();
        const currentOptions = filters.options;
        const optionsSame = _.isMatch(currentOptions, newOptions);
        if (optionsSame) {
            return null;
        }
        const type = filters.type;
        const activeFilters = filters.active;
        dispatch(filtersSlice.setOptions(newOptions));
        for (const filter of activeFilters) {
            dispatch(addFilter(filter, type));
        }
    };
};

export const fetchUser = () => {
    return async (dispatch: AppDispatch) => {
        const res = await axios.get('/current_user');
        dispatch(authSlice.fetchUser(res.data));
    };
};

export const createWaiver = (
    artifact: Artifact | undefined,
    testcase: string | undefined,
) => {
    return async (dispatch: AppDispatch, getState: GetState) => {
        const { displayName, nameID } = getState().auth;
        if (!displayName && !nameID) {
            dispatch(
                pushAlert(
                    'warning',
                    <>
                        Please <a href="/login">log in</a> before creating a
                        waiver.
                    </>,
                ),
            );
            return;
        }
        dispatch(waiveSlice.createWaiver({ artifact, testcase }));
    };
};

export const resetWaiverReply = () => {
    return async (dispatch: AppDispatch, getState: GetState) => {
        const { timestamp, waiveError } = getState().waive;
        if (timestamp || waiveError) {
            dispatch(waiveSlice.resetWaiver());
        }
    };
};

export const submitWaiver = (reason: string, client: ApolloClient<object>) => {
    return async (dispatch: AppDispatch, getState: GetState) => {
        /**
         * result - state to waive
         * Result name with link
         * get NVR, for modules we need to convert it to 'brew' like form
         */
        let waiveError: string;
        const { artifact, testcase } = getState().waive;
        if (_.isNil(_.get(artifact, 'payload.nvr')) || _.isNil(testcase)) {
            return;
        }
        // NOTE: We know that artifact.payload is not null thanks to the check at the
        // top of the function. Moreover, we know that payload has the nvr property,
        // so we assert the type of the payload here.
        const nvr = (artifact!.payload! as PayloadRPMBuildType).nvr;
        if (!nvr) {
            waiveError = 'Could not get NVR, please contact support.';
            dispatch(waiveSlice.submitWaiver({ waiveError, reason: '' }));
            return;
        }
        /**
         * Workaround until CVP-287 is not fixed, container are reported as brew builds.
         * subject.type MUST be koji_build for containers until CVP-287 is not fixed.
         * NOTE: We know that artifact is not null thanks to the check at the top
         * of the function.
         */
        let artifactType = artifact!.type;
        if (artifactType === 'brew-build' && nvr.match(/.*-container-.*/)) {
            artifactType = 'redhat-container-image';
        }
        const product_version = greenwave.decision.product_version(
            nvr,
            artifactType,
        );
        try {
            const response = await client.mutate({
                mutation: WaiverdbNewMutation,
                variables: {
                    // NOTE: We know that artifact is not null thanks to the check at
                    // the top of the function.
                    subject_type: artifact!.type,
                    subject_identifier: nvr,
                    testcase,
                    waived: true,
                    product_version,
                    comment: reason,
                },
            });
            console.log('Got response from WaiverDB', response);
            dispatch(
                waiveSlice.submitWaiver({
                    reason,
                    waiveError: '',
                }),
            );
            /* XXX run query to update artifacts */
        } catch (error) {
            if (_.isError(error)) {
                waiveError = error.message;
            } else {
                waiveError = _.toString(error);
            }
            dispatch(waiveSlice.submitWaiver({ waiveError, reason: '' }));
        }
    };
};
