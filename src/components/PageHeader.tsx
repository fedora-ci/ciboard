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

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { css } from '@patternfly/react-styles';
import {
    Nav,
    Button,
    NavItem,
    NavList,
    NavProps,
    Dropdown,
    PageHeader,
    ButtonVariant,
    DropdownToggle,
    PageHeaderTools,
    PageHeaderToolsItem,
    PageHeaderToolsGroup,
    DropdownItem,
} from '@patternfly/react-core';
import {
    AutomationIcon,
    ExternalLinkSquareAltIcon,
} from '@patternfly/react-icons';
import accessibleStyles from '@patternfly/react-styles/css/utilities/Accessibility/accessibility';

import { fetchUser } from '../actions';
import { IStateAuth } from '../actions/types';
import { menuRoutes } from '../routes';
import { RootStateType } from '../reducers';
import {
    OnDropdownSelectType,
    OnDropdownToggleType,
} from '../utils/artifactsTable';

const logoProps = {
    to: '/',
    style: {
        color: 'var(--pf-global--secondary-color--100)',
        textDecoration: 'inherit',
    },
};

type SelectedItemType = Parameters<Extract<NavProps['onSelect'], Function>>[0];

const onLoginClick = () => {
    /**
     *  Set a session cookie to with the current URL as the value so that we can
     * redirect back after a successful login/logout.
     */
    const { hash, pathname, search } = window.location;
    const currentURL = encodeURIComponent(pathname + search + hash);
    document.cookie = `auth_redirect=${currentURL}; path=/; secure`;
};

const LoginLink = () => {
    return (
        <Button
            component="a"
            href={'/login'}
            id="default-example-uid-01"
            aria-label="Log in to CI Dashboard"
            icon={<ExternalLinkSquareAltIcon />}
            iconPosition="right"
            onClick={onLoginClick}
            variant={ButtonVariant.link}
        >
            Login
        </Button>
    );
};

const LogoutLink = () => (
    <DropdownItem
        aria-label="Log out of CI Dashboard"
        component="a"
        href="/logout"
        onClick={onLoginClick}
    >
        Logout
    </DropdownItem>
);

const userDropdownItems = [<LogoutLink />];

const HeaderToolbar = () => {
    const dispatch = useDispatch();
    const auth = useSelector<RootStateType, IStateAuth>((store) => store.auth);
    const [isDropdownOpen, setDropDownOpen] = useState(false);
    useEffect(() => {
        dispatch(fetchUser());
    }, []);
    const onDropdownToggle: OnDropdownToggleType = (
        isDropdownOpen: boolean,
    ) => {
        setDropDownOpen(isDropdownOpen);
    };
    const onDropdownSelect: OnDropdownSelectType = (event) => {
        setDropDownOpen(!isDropdownOpen);
    };
    function renderContent() {
        switch (auth.displayName) {
            case '':
                return <LoginLink />;
            default:
                return (
                    <Dropdown
                        isPlain
                        position="right"
                        onSelect={onDropdownSelect}
                        isOpen={isDropdownOpen}
                        toggle={
                            <DropdownToggle onToggle={onDropdownToggle}>
                                {auth.displayName}
                            </DropdownToggle>
                        }
                        dropdownItems={userDropdownItems}
                    />
                );
        }
    }
    const toolbar = (
        <PageHeaderTools>
            <PageHeaderToolsGroup>
                <PageHeaderToolsItem
                    className={css(
                        accessibleStyles.screenReader,
                        accessibleStyles.visibleOnMd,
                    )}
                >
                    {renderContent()}
                </PageHeaderToolsItem>
            </PageHeaderToolsGroup>
        </PageHeaderTools>
    );
    return toolbar;
};

export const DashboardPageHeader = () => {
    const location = useLocation();
    let history = useHistory();
    const [activeItem, setActiveItem] = useState<string | number>(
        'grp-1_itm-1',
    );
    const navigateTo = (href: string) => {
        history.push(href);
    };
    /** Event handlers */
    const onNavSelect = (result: SelectedItemType) => {
        /** activeItem -- holds name of selected item. XXX: remove this code */
        console.log('Selected: ', activeItem);
        setActiveItem(result.itemId);
    };
    /** Horizontal menu */
    const menuElements = menuRoutes.map((item) => (
        <NavItem
            itemId={item.key}
            key={item.key}
            isActive={item.to === location.pathname}
            onClick={() => navigateTo(item.to)}
        >
            {item.title}
        </NavItem>
    ));
    const PageNav = (
        <Nav variant="horizontal" onSelect={onNavSelect} aria-label="Nav">
            <NavList>{menuElements}</NavList>
        </Nav>
    );
    return (
        <PageHeader
            logo={
                <>
                    <AutomationIcon size="lg" className="pf-u-mr-sm" /> CI
                    Dashboard
                </>
            }
            headerTools={<HeaderToolbar />}
            logoComponent="div"
            logoProps={logoProps}
            topNav={PageNav}
        />
    );
};
