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
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import {
    Alert,
    AlertActionCloseButton,
    AlertGroup,
    AlertVariant,
    Page,
    PageSection,
    PageSectionVariants,
} from '@patternfly/react-core';

import { config } from '../config';
import { useTitle } from '../hooks';
import { RootStateType } from '../slices';
import { popAlert } from '../actions';
import { IStateAlerts } from '../actions/types';
import { DashboardPageHeader } from './PageHeader';

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
    const [searchParams] = useSearchParams();

    const title = props.title || config.defaultTitle;
    useTitle(title);

    const pageId = 'main-content-page-layout-horizontal-nav';
    let to_render: JSX.Element;
    if (searchParams.get('embedded') !== 'true') {
        to_render = (
            <Page header={<DashboardPageHeader />} mainContainerId={pageId}>
                <PageSection
                    variant={PageSectionVariants.default}
                    isFilled
                    hasOverflowScroll
                >
                    {props.children}
                </PageSection>
            </Page>
        );
    } else {
        to_render = <>{props.children}</>;
    }
    return to_render;
}
