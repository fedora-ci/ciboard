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

import qs from 'qs';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import {
    Page,
    PageSection,
    PageSectionVariants,
    Alert,
    AlertGroup,
    AlertVariant,
    AlertActionCloseButton,
} from '@patternfly/react-core';

import { DashboardPageHeader } from './PageHeader';
import { RootStateType } from '../reducers';
import { setQueryString, popAlert } from '../actions';
import { IStateAlerts } from '../actions/types';

export const ToastAlertGroup = () => {
    const dispatch = useDispatch();
    const onClick = () => {
        // XXX key -- was param
        dispatch(popAlert(123));
    };
    const { alerts } = useSelector<RootStateType, IStateAlerts>(
        (state) => state.alerts,
    );
    return (
        <AlertGroup isToast>
            {alerts.map(({ key, variant, title }) => (
                <Alert
                    isLiveRegion
                    variant={AlertVariant[variant]}
                    title={title}
                    actionClose={
                        <AlertActionCloseButton
                            title={title}
                            variantLabel={`${variant} alert`}
                            onClose={() => onClick()} // XXX
                        />
                    }
                    key={key}
                />
            ))}
        </AlertGroup>
    );
};

const PageCommon = (props: any) => {
    const location = useLocation();
    const dispatch = useDispatch();
    const queryString = qs.parse(location.search, {
        ignoreQueryPrefix: true,
    });
    dispatch(setQueryString(queryString.toString()));

    const pageId = 'main-content-page-layout-horizontal-nav';
    let to_render;
    if (queryString.embedded !== 'true') {
        to_render = (
            <>
                <Page header={<DashboardPageHeader />} mainContainerId={pageId}>
                    <PageSection
                        variant={PageSectionVariants.default}
                        isFilled
                        hasOverflowScroll
                    >
                        {props.children}
                    </PageSection>
                </Page>
            </>
        );
    } else {
        to_render = props.children;
    }
    return to_render;
};
export default PageCommon;
