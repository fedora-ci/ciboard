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

import { useApolloClient } from '@apollo/client';
import { Flex, FlexItem, Pagination } from '@patternfly/react-core';

import { useAppSelector, useAppDispatch } from '../hooks';
import { actLoad, actPage, actPaginationSize } from './../actions';

export interface PaginationToolbarProps {}
export function PaginationToolbar(_props: PaginationToolbarProps) {
    const dispatch = useAppDispatch();
    const client = useApolloClient();
    const artifacts = useAppSelector((state) => state.artifacts);
    const queryState = useAppSelector((state) => state.artifactsQuery);
    const { totalHits } = artifacts;
    const artifactsQuery = useAppSelector((state) => state.artifactsQuery);
    const { paginationSize } = artifactsQuery;
    const currentPage = artifactsQuery.page;

    const onSetPage = (
        _event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
        newPage: number,
    ) => {
        dispatch(actPage(newPage));
        dispatch(actLoad(client));
    };

    const onPageSizeSelect = (
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
            page={currentPage}
            ouiaId="PaginationTop"
            perPage={paginationSize}
            widgetId="pagination menu bar"
            itemCount={totalHits}
            onSetPage={onSetPage}
            onPerPageSelect={onPageSizeSelect}
        >
            {totalHits && (
                <Flex style={{ order: -1, flexGrow: 1 }}>
                    <FlexItem style={{ flex: '0 0 23%' }} />
                    <Flex>
                        <FlexItem>Search results for:</FlexItem>
                        <FlexItem
                            style={{
                                fontWeight:
                                    'var(--pf-global--FontWeight--bold)',
                            }}
                        >
                            {queryState.queryString}
                        </FlexItem>
                    </Flex>
                </Flex>
            )}
        </Pagination>
    );
}
