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
import React from 'react';
import {
    Flex,
    Label,
    Title,
    LabelProps,
    DescriptionListTerm,
    DescriptionListGroup,
    DescriptionListDescription,
} from '@patternfly/react-core';
import { LinkifyNewTab } from '../utils/utils';

type AChildDetailsEntryPropsWithChildren =
    React.PropsWithChildren<React.ReactNode> & { caption: string };

export const AChildDetailsEntry = (
    props: AChildDetailsEntryPropsWithChildren,
) => {
    const { children, caption } = props;
    if (_.isNil(children)) return null;
    return (
        <Flex direction={{ default: 'column' }}>
            <Title headingLevel="h1" size="lg">
                {caption}
            </Title>
            <Flex
                direction={{ default: 'column' }}
                grow={{ default: 'grow' }}
                spaceItems={{ default: 'spaceItemsLg' }}
            >
                {children}
            </Flex>
            <Flex />
        </Flex>
    );
};

export const mkLabel = (
    name: string,
    value: string,
    color: LabelProps['color'] = 'orange',
    icon: JSX.Element | null = null,
): JSX.Element => {
    return (
        <DescriptionListGroup key={name}>
            <DescriptionListTerm>{name}</DescriptionListTerm>
            <DescriptionListDescription>
                <Label
                    isCompact
                    color={color}
                    icon={icon}
                    variant="filled"
                    isTruncated
                >
                    <LinkifyNewTab>{value.toString()}</LinkifyNewTab>
                </Label>
            </DescriptionListDescription>
        </DescriptionListGroup>
    );
};
