/*
 * This file is part of ciboard
 *
 * Copyright (c) 2021 Andrei Stepanov <astepano@redhat.com>
 * Copyright (c) 2022 Matěj Grabovský <mgrabovs@redhat.com>
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
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Dropdown,
    DropdownItem,
    DropdownToggle,
    Text,
    TextContent,
} from '@patternfly/react-core';
import { CaretDownIcon } from '@patternfly/react-icons';

import { SSTItem } from '../types';

interface DropdownSelectorProps {
    section?: string;
    sstList?: SSTItem[];
};

export function DropdownSelector(props: DropdownSelectorProps) {
    const sstList = props.sstList;
    const [isOpen, setOpen] = useState(false);

    if (_.isEmpty(sstList)) {
        return (
            <TextContent>
                <Text>No SSTs found.</Text>
            </TextContent>
        );
    }

    const onFocus = () => {
        const toggleElement = document.getElementById('sst-dropdown-toggle');
        if (toggleElement)
            toggleElement.focus();
    };

    const onToggle = (isOpen: boolean) => {
        setOpen(isOpen);
    };

    const onSelect = (_event?: React.SyntheticEvent<HTMLDivElement, Event>) => {
        setOpen(!isOpen);
        onFocus();
    };

    // sstList cannot be null, we check that at the top of the function.
    const items = sstList!.map(({ display_name, name }) => (
        <DropdownItem
            key={name}
            className={name === props.section ? 'pf-u-font-weight-bold' : ''}
            component={
                <Link to={`/sst/${name}`}>{display_name}</Link>
            }
        />
    ));

    const currentSST = _.find(
        sstList,
        ({ name }) => (name === props.section)
    );

    let dropdownLabel = 'Select a subsystem…';
    if (currentSST)
        dropdownLabel = currentSST.display_name;

    return (
        <Dropdown
            dropdownItems={items}
            isOpen={isOpen}
            onSelect={onSelect}
            toggle={
                <DropdownToggle
                    onToggle={onToggle}
                    toggleIndicator={CaretDownIcon}
                >
                    {dropdownLabel}
                </DropdownToggle>
            }
        />
    );
}
