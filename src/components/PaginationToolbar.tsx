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

import React, { MouseEventHandler } from 'react';
import {
    Text,
    Button,
    Toolbar,
    Spinner,
    TextContent,
    ToolbarItem,
    ToolbarGroup,
    ToolbarContent,
} from '@patternfly/react-core';
import { AngleLeftIcon, AngleRightIcon } from '@patternfly/react-icons';

export interface PaginationToolbarProps {
    isLoading?: boolean;
    currentPage: number;
    onClickLoadPrev: MouseEventHandler;
    onClickLoadNext: MouseEventHandler;
    loadPrevIsDisabled: boolean;
    loadNextIsDisabled: boolean;
}

export function PaginationToolbar(props: PaginationToolbarProps) {
    const {
        isLoading,
        currentPage,
        onClickLoadPrev,
        onClickLoadNext,
        loadPrevIsDisabled,
        loadNextIsDisabled,
    } = props;
    return (
        <Toolbar style={{ background: 'inherit' }} id="toolbar-top">
            <ToolbarContent>
                <ToolbarGroup alignment={{ default: 'alignRight' }}>
                    <ToolbarItem style={{ minWidth: '30px' }}>
                        {isLoading && (
                            <>
                                Loading <Spinner size="md" />
                            </>
                        )}
                    </ToolbarItem>
                    <ToolbarItem>
                        <Button
                            variant="tertiary"
                            onClick={onClickLoadPrev}
                            isDisabled={loadPrevIsDisabled}
                        >
                            <AngleLeftIcon />
                        </Button>
                    </ToolbarItem>
                    <ToolbarItem>
                        <TextContent>
                            <Text>{currentPage}</Text>
                        </TextContent>
                    </ToolbarItem>
                    <ToolbarItem>
                        <Button
                            variant="tertiary"
                            onClick={onClickLoadNext}
                            isDisabled={loadNextIsDisabled}
                        >
                            <AngleRightIcon />
                        </Button>
                    </ToolbarItem>
                </ToolbarGroup>
            </ToolbarContent>
        </Toolbar>
    );
}
