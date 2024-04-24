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
import axios, { AxiosResponse } from 'axios';
import { ApolloClient } from '@apollo/client';

import { Artifact, getANvr, getAType } from '../types';
import { greenwave } from '../config';
import { GASetSearchOptionsPayload } from './types';
import { AppDispatch, GetState } from '../reduxStore';
import WaiverdbNewMutation from '../mutations/WaiverdbNew';
import * as alertsSlice from '../slices/alertsSlice';
import * as authSlice from '../slices/authSlice';
import * as gatingTestsFormSlice from '../slices/gatingTestsFormSlice';
import * as waiveSlice from '../slices/waiveSlice';
import { AlertVariant } from '@patternfly/react-core';
export * from '../slices/artifactsSlice';
export * from '../slices/artifactsQuerySlice';

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

export const popAlert = (key: number) => alertsSlice.popAlert({ key });

type AlertVariantKeys = keyof typeof AlertVariant;

/**
 * Push a new alert to the alerts queue.
 * @param variant Variant of the alert component, e.g. `success` or `warning`.
 * @param title Text of the alert.
 * @param autoRm If `true`, automatically remove the alert after 3 seconds.
 * @returns Promise that resolves after a succesful event dispatch.
 */
export const pushAlert = (
    variant: AlertVariantKeys,
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

export const fetchUser = () => {
    return async (dispatch: AppDispatch) => {
        let res: AxiosResponse<any, any>;
        try {
            res = await axios.get('/current_user');
        } catch (err) {
            console.log('Cannot get current user', err);
            return;
        }
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
        const nvr = getANvr(artifact!);
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
        let aType = getAType(artifact!);
        if (aType === 'brew-build' && nvr.match(/.*-container-.*/)) {
            aType = 'redhat-container-image';
        }
        const product_version = greenwave.decision.product_version(nvr, aType);
        try {
            const response = await client.mutate({
                mutation: WaiverdbNewMutation,
                variables: {
                    // NOTE: We know that artifact is not null thanks to the check at
                    // the top of the function.
                    waived: true,
                    comment: reason,
                    testcase,
                    subject_type: aType,
                    product_version,
                    subject_identifier: nvr,
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
