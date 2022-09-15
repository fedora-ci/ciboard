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

import _ from 'lodash';
import qs from 'qs';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import {
    Alert,
    AlertActionCloseButton,
    AlertGroup,
    AlertVariant,
    Page,
} from '@patternfly/react-core';

import { config } from '../config';
import { useTitle } from '../hooks';
import { RootStateType } from '../reducers';
import { popAlert, setQueryString } from '../actions';
import { IStateAlerts } from '../actions/types';
import { DashboardPageHeader } from './PageHeader';
import { useEffect } from 'react';

type PageCommonProps = React.PropsWithChildren<React.ReactNode> & {
    title?: string;
};

export function ToastAlertGroup() {
    const dispatch = useDispatch();
    const onClick = (key: number) => {
        dispatch(popAlert(key));
    };
    const { alerts } = useSelector<RootStateType, IStateAlerts>(
        (state) => state.alerts,
    );
    return (
        <AlertGroup isToast>
            {_.map(alerts, ({ key, title, variant }) => (
                <Alert
                    isLiveRegion
                    variant={AlertVariant[variant]}
                    title={title}
                    actionClose={
                        <AlertActionCloseButton
                            title="Dismiss this alert"
                            onClose={() => onClick(key)}
                        />
                    }
                    key={key}
                />
            ))}
        </AlertGroup>
    );
}

export function PageCommon(props: PageCommonProps) {
    const location = useLocation();
    const dispatch = useDispatch();
    const queryString = qs.parse(location.search, {
        ignoreQueryPrefix: true,
    });
    useEffect(() => {
        /*
         * This code is side-effect. There-fore must be called in useEffect. Otherwise will be thrown:
         * Cannot update a component (`ArtifactStatesList`) while rendering a different component (`PageCommon`).
         * To locate the bad setState() call inside `PageCommon`, follow the stack trace as described in https://reactjs.org/link/setstate-in-render
         */
        dispatch(setQueryString(queryString));
    }, [dispatch, queryString]);

    const title = props.title || config.defaultTitle;
    useTitle(title);

    const pageId = 'main-content-page-layout-horizontal-nav';
    let to_render: JSX.Element;
    if (queryString.embedded !== 'true') {
        to_render = (
            <Page header={<DashboardPageHeader />} mainContainerId={pageId}>
                {/* TODO: Add this chunk to the old-style pages as necessary.
                <PageSection
                    variant={PageSectionVariants.default}
                    isFilled
                    hasOverflowScroll
                >*/}
                {props.children}
                {/* </PageSection> */}
            </Page>
        );
    } else {
        to_render = <>{props.children}</>;
    }
    return to_render;
}
