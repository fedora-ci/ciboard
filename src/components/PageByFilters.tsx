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
import { useSelector, useDispatch } from 'react-redux';
import React, { useState, useEffect, useRef } from 'react';
import {
    Flex,
    Button,
    Select,
    Toolbar,
    Checkbox,
    TextInput,
    InputGroup,
    SelectOption,
    SelectVariant,
    ButtonVariant,
    ToolbarItem,
    ToolbarGroup,
    ToolbarFilter,
    ToolbarContent,
    SelectOptionObject,
} from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';

import { RootStateType } from '../reducers';
import { IStateFilters } from '../actions/types';
import PageCommon, { ToastAlertGroup } from './PageCommon';
import ArtifactsListByFilters from './ArtifactsListByFilters';
import { addFilter, deleteFilter, setOptionsForFilters } from '../actions';

/**
 * These are default search-field for each artifact type
 *
 * List here all possible artifact-types:
 *
 * https://github.com/fedora-ci/kaijs/blob/main/src/dbInterface.ts#L24
 * https://pagure.io/greenwave/blob/master/f/conf/subject_types
 * https://gitlab.cee.redhat.com/gating/greenwave-playbooks/-/blob/master/roles/greenwave/files/subject_types.yaml
 *
 */
const menuTypes = {
    'Brew NVR': 'brew-build',
    'Modularity NSVC': 'redhat-module',
    'CentOS Stream NVR': 'koji-build-cs',
    'Fedora NVR': 'koji-build',
};

const statusMenuItems = _.map(_.toPairs(menuTypes), ([menuName, key]) => (
    <SelectOption key={key} value={menuName} />
));

function usePrevious(value: number) {
    const ref = useRef(0);
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
}

const SearchToolbar = () => {
    const dispatch = useDispatch();
    const filters = useSelector<RootStateType, IStateFilters>(
        (state) => state.filters,
    );
    const [inputValue, setInputValue] = useState('');
    const [statusIsExpanded, setIsExpanded] = useState(false);
    const menu_default_entry = _.toPairs(menuTypes)[0][0];
    const [statusSelected, setSelected] = useState<string | null>(
        menu_default_entry,
    );
    const onInputChange = (newValue: string) => {
        setInputValue(newValue);
    };
    const onStatusToggle = (isExpanded: boolean) => {
        setIsExpanded(isExpanded);
    };
    const onStatusSelect = (
        event: React.MouseEvent | React.ChangeEvent,
        selection: string | SelectOptionObject,
        isPlaceholder?: boolean | undefined,
    ) => {
        if (isPlaceholder) clearStatusSelection();
        setIsExpanded(false);
        if (_.isString(selection)) {
            setSelected(selection);
        }
    };
    const toggleScratch = (checked: boolean) => {
        console.log('Setting checkbox to', checked);
        dispatch(setOptionsForFilters({ skipScratch: checked }));
    };
    const clearStatusSelection = () => {
        setSelected(null);
        setIsExpanded(false);
    };
    const prevFiltersLen = usePrevious(_.size(filters.active));
    useEffect(() => {
        const url = new URL(window.location.href);
        if (
            _.size(filters.active) === 0 &&
            url.searchParams.has('filters') &&
            prevFiltersLen > 0
        ) {
            console.log('Remove filters from URL');
            url.searchParams.delete('filters');
            //window.history.pushState('', 'remove filter', url.href);
            window.history.replaceState('', 'filter', url.href);
        }
    }, [filters, prevFiltersLen]);
    useEffect(() => {
        /** Check if there are filters. */
        const url = new URL(window.location.href);
        const filters_enc = url.searchParams.get('filters');
        if (!filters_enc) {
            /** No filters in url */
            return;
        }
        /** There are some filters. */
        try {
            /** Filters from URL */
            const filters = JSON.parse(atob(filters_enc));
            for (const filter of filters.active) {
                /** Add filters from URL */
                dispatch(setOptionsForFilters(filters.options));
                dispatch(addFilter(filter, filters.type));
            }
        } catch (e) {
            console.warn('Could not retrieve filters from URL', e);
        }
        /**
         * Ensure the useEffect only runs once.
         * That will not invoke re-renders because dispatch value will not change
         */
    }, [dispatch]);
    const onKeyPress = (keyEvent: React.KeyboardEvent) => {
        if (!statusSelected) {
            return;
        }
        if (keyEvent.key === 'Enter' && inputValue && _.size(inputValue) > 0) {
            setInputValue('');
            dispatch(addFilter(inputValue, _.get(menuTypes, statusSelected)));
            keyEvent.stopPropagation();
            keyEvent.preventDefault();
        }
    };
    const onClick = () => {
        if (!statusSelected) {
            return;
        }
        const atype = _.get(menuTypes, statusSelected);
        if (inputValue && _.size(inputValue)) {
            setInputValue('');
            dispatch(addFilter(inputValue, atype));
        } else if (_.isEmpty(inputValue) && filters.type != atype) {
            /** keep values, just change artifacts type */
            dispatch(addFilter(inputValue, atype));
        }
    };
    const toggleGroupItems = (
        <>
            <ToolbarItem>
                <InputGroup>
                    <Select
                        variant={SelectVariant.single}
                        aria-label="Select Input"
                        onToggle={onStatusToggle}
                        onSelect={onStatusSelect}
                        selections={statusSelected?.toString()}
                        isOpen={statusIsExpanded}
                    >
                        {statusMenuItems}
                    </Select>
                    <TextInput
                        name="textInput2"
                        id="textInput2"
                        style={{ minWidth: '15em' }}
                        type="search"
                        aria-label="search input example"
                        onChange={onInputChange}
                        onKeyPress={onKeyPress}
                        value={inputValue}
                    />
                    <Button
                        variant={ButtonVariant.control}
                        aria-label="search button for search input"
                        onClick={onClick}
                    >
                        <SearchIcon />
                    </Button>
                </InputGroup>
            </ToolbarItem>
            <ToolbarGroup variant="filter-group">
                <ToolbarFilter
                    chips={filters.active}
                    deleteChip={(ignore, delval) => {
                        if (!_.isString(delval)) {
                            return;
                        }
                        dispatch(deleteFilter(delval));
                    }}
                    categoryName={filters.type}
                >
                    <></>
                </ToolbarFilter>
            </ToolbarGroup>
        </>
    );
    const toolbarItems = (
        <React.Fragment>
            <ToolbarGroup variant="icon-button-group">
                {toggleGroupItems}
                <ToolbarItem></ToolbarItem>
                <ToolbarItem>
                    <Checkbox
                        label="Skip scratch builds"
                        isChecked={filters.options.skipScratch}
                        onChange={toggleScratch}
                        aria-label="checkbox for scratch"
                        id="toggle-scratch"
                    />
                </ToolbarItem>
            </ToolbarGroup>
        </React.Fragment>
    );
    const toolBar = (
        <Flex
            grow={{ default: 'grow' }}
            justifyContent={{ default: 'justifyContentCenter' }}
        >
            <Toolbar
                id="data-toolbar-with-filter"
                className="pf-u-mx-xl"
                style={{ background: 'inherit' }}
                collapseListedFiltersBreakpoint="xl"
                clearAllFilters={() => {
                    dispatch(deleteFilter());
                }}
            >
                <ToolbarContent>{toolbarItems}</ToolbarContent>
            </Toolbar>
        </Flex>
    );

    const url = new URL(window.location.href);
    const filters_bin = url.searchParams.get('filters');
    if (_.size(filters.active) > 0) {
        let url_filters = {};
        if (filters_bin) {
            url_filters = JSON.parse(atob(filters_bin));
        }
        if (!_.isEqual(url_filters, filters)) {
            /** Update URL with new filters param. */
            var filters_param = JSON.stringify(filters);
            var update_filters = false;
            try {
                filters_param = btoa(filters_param);
                update_filters = true;
            } catch {
                console.log('Cannot set filters %o', filters);
            }
            if (update_filters) {
                url.searchParams.set('filters', filters_param);
                window.history.replaceState('', 'filter', url.href);
            }
        }
    }

    return toolBar;
};

const PageByFilters = () => {
    return (
        <PageCommon>
            <SearchToolbar />
            <ArtifactsListByFilters />
            <ToastAlertGroup />
        </PageCommon>
    );
};

export default PageByFilters;
