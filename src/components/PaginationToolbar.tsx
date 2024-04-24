/*
 * This file is part of ciboard

 * Copyright (c) 2021, 2023 Andrei Stepanov <astepano@redhat.com>
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

import React, { useEffect } from 'react';
import { Pagination } from '@patternfly/react-core';
import { useApolloClient } from '@apollo/client';
import { useSearchParams } from 'react-router-dom';

import { useAppSelector, useAppDispatch } from '../hooks';
import { actLoad, actPage, actPaginationSize } from './../actions';
import { InitialState } from '../slices/artifactsQuerySlice';

/***  CAN BE REMOVED

export function PaginationToolbar2(props: PaginationToolbarProps) {
    const dispatch = useAppDispatch();
    const client = useApolloClient();
    const artifacts = useAppSelector((state) => state.artifacts);
    const artifactsQuery = useAppSelector((state) => state.artifactsQuery);
    const isLoading = artifacts.isLoading;
    const currentPage = artifactsQuery.page;
    const totalPages = artifacts.totalHits / artifactsQuery.paginationSize;
    const loadNextIsEnabled = totalPages > artifactsQuery.page;
    const loadPrevIsEnabled = totalPages && artifactsQuery.page > 1;

    const onClickLoadNext = () => {
        dispatch(actPageNext());
        dispatch(actLoad(client));
    };
    const onClickLoadPrev = () => {
        dispatch(actPagePrev());
        dispatch(actLoad(client));
    };

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
                            isDisabled={!loadPrevIsEnabled}
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
                            isDisabled={!loadNextIsEnabled}
                        >
                            <AngleRightIcon />
                        </Button>
                    </ToolbarItem>
                </ToolbarGroup>
            </ToolbarContent>
        </Toolbar>
    );
}

*/

export interface PaginationToolbarProps {}
export function PaginationToolbar(props: PaginationToolbarProps) {
    const dispatch = useAppDispatch();
    const client = useApolloClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const artifacts = useAppSelector((state) => state.artifacts);
    const { totalHits } = artifacts;
    const artifactsQuery = useAppSelector((state) => state.artifactsQuery);
    const { page, paginationSize } = artifactsQuery;
    const currentPage = artifactsQuery.page;

    useEffect(() => {
        if (InitialState.page === page) {
            searchParams.delete('page');
        } else {
            searchParams.set('page', `${page}`);
        }
        if (InitialState.paginationSize === paginationSize) {
            searchParams.delete('perpage');
        } else {
            searchParams.set('perpage', `${paginationSize}`);
        }
        setSearchParams(searchParams.toString());
    }, [page, paginationSize, searchParams, setSearchParams]);

    const onSetPage = (
        _event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
        newPage: number,
    ) => {
        dispatch(actPage(newPage));
        dispatch(actLoad(client));
    };

    const onPerPageSelect = (
        _event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
        newPerPage: number,
        newPage: number,
    ) => {
        dispatch(actPaginationSize(newPerPage));
        dispatch(actPage(newPage));
        dispatch(actLoad(client));
    };

    return (
        <Pagination
            isSticky
            itemCount={totalHits}
            perPage={paginationSize}
            page={currentPage}
            onSetPage={onSetPage}
            widgetId="pagination menu bar"
            onPerPageSelect={onPerPageSelect}
            ouiaId="PaginationTop"
        />
    );
}
