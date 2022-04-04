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
    Flex,
    FlexItem,
    Banner,
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
                <Flex
                    direction={{ default: 'column' }}
                    flexWrap={{ default: 'nowrap' }}
                    spaceItems={{ default: 'spaceItemsNone' }}
                    style={{ height: '100%' }}
                >
                    <FlexItem
                        key="1"
                        grow={{ default: 'grow' }}
                        style={{ minHeight: 0 }}
                    >
                        <Page
                            header={<DashboardPageHeader />}
                            mainContainerId={pageId}
                        >
                            <PageSection
                                variant={PageSectionVariants.darker}
                                isFilled
                                hasOverflowScroll
                            >
                                {props.children}
                            </PageSection>
                        </Page>
                    </FlexItem>
                    <FlexItem key="2">
                        <Banner isSticky variant="default">
                            This dashboard will replace the current.
                            <a
                                target="_blank"
                                rel="noopener noreferrer"
                                href="https://dashboard.osci.redhat.com"
                            >
                                {' '}
                                https://dashboard.osci.redhat.com
                            </a>{' '}
                            on 1 of Jun 2022. For missing features or feedback
                            please:{' '}
                            <a
                                target="_blank"
                                rel="noopener noreferrer"
                                href="https://issues.redhat.com/secure/CreateIssueDetails!init.jspa?pid=12325047&issuetype=1&priority=3&labels=user_request&labels=osci-dashboard&customfield_12311140=OSCI-3089"
                            >
                                open a ticket.
                            </a>
                        </Banner>
                    </FlexItem>
                </Flex>
            </>
        );
    } else {
        to_render = props.children;
    }
    return to_render;
};
export default PageCommon;
