/*
 * This file is part of ciboard

 * Copyright (c) 2022 Andrei Stepanov <astepano@redhat.com>
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
import _ from 'lodash';
import {
    useEffect,
    useReducer,
    MouseEventHandler,
    FunctionComponent,
    DispatchWithoutAction,
} from 'react';
import { ApolloError, useLazyQuery, useMutation } from '@apollo/client';
import { Link } from 'react-router-dom';
import {
    Flex,
    Title,
    Alert,
    Modal,
    Button,
    Toolbar,
    Spinner,
    Bullseye,
    FlexItem,
    EmptyState,
    AlertGroup,
    ActionList,
    ToolbarItem,
    SearchInput,
    ModalVariant,
    EmptyStateIcon,
    EmptyStateBody,
    ToolbarContent,
    ActionListItem,
    ActionListGroup,
    EmptyStateVariant,
} from '@patternfly/react-core';
import {
    Tr,
    Th,
    Td,
    Tbody,
    Thead,
    ThProps,
    TableComposable,
} from '@patternfly/react-table';
import {
    CopyIcon,
    EditIcon,
    SearchIcon,
    Remove2Icon,
    AddCircleOIcon,
} from '@patternfly/react-icons';

import { config } from '../config';
import { PageCommon } from './PageCommon';
import { MetadataRaw } from './PageMetadataEdit';
import { MetadataUpdate } from '../mutations/Metadata';
import { MetadataRawListQuery } from '../queries/Metadata';

interface ActionsProps {
    mEntry: Partial<MetadataEntryType>;
    forceUpdate: DispatchWithoutAction;
}
const Actions: FunctionComponent<ActionsProps> = (props) => {
    const { mEntry, forceUpdate } = props;
    const [
        removeEntry,
        {
            data: removeData,
            loading: removeLoading,
            error: removeError,
            reset: removeReset,
        },
    ] = useMutation<MetadataRemoveEntry>(MetadataUpdate, {
        errorPolicy: 'all',
        notifyOnNetworkStatusChange: true,
    });

    const [isModalOpen, setIsModalOpen] = React.useState(false);

    const handleModalCancel = () => {
        setIsModalOpen(!isModalOpen);
    };
    const handleModalConfirm = () => {
        removeReset();
        const variables = { _id: mEntry._id };
        removeEntry({
            variables,
        });
        setIsModalOpen(!isModalOpen);
    };

    /* on remove */
    const onClickRemove: MouseEventHandler = () => {
        /* reset the mutation's result to its initial, uncalled state. */
        setIsModalOpen(true);
    };

    const entryIsRemoved =
        !removeLoading && _.isObject(removeData) && !_.isError(removeError);

    useEffect(() => {
        if (entryIsRemoved) {
            /* data is saved, go back to the list */
            forceUpdate();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entryIsRemoved]);

    return (
        <>
            <ActionList>
                <ActionListGroup>
                    <ActionListItem>
                        <Button
                            isInline
                            isSmall
                            variant="link"
                            id="edit-button"
                            component={(props) => (
                                <Link
                                    {...props}
                                    to={`metadata/edit/${mEntry._id}`}
                                />
                            )}
                            icon={<EditIcon />}
                        />
                    </ActionListItem>
                    <ActionListItem>
                        <Button
                            isInline
                            isSmall
                            variant="link"
                            id="cancel-button"
                            component={(props) => (
                                <Link
                                    {...props}
                                    to={`metadata/edit/${mEntry._id}/clone`}
                                />
                            )}
                            icon={<CopyIcon />}
                        />
                    </ActionListItem>
                    <ActionListItem>
                        <Button
                            isInline
                            isDisabled={removeLoading}
                            isLoading={removeLoading}
                            isSmall
                            variant="link"
                            id="cancel-button"
                            icon={<Remove2Icon />}
                            onClick={onClickRemove}
                        />
                        <APIError error={removeError} />
                    </ActionListItem>
                </ActionListGroup>
            </ActionList>
            <Modal
                title="Permanently delete record?"
                isOpen={isModalOpen}
                variant={ModalVariant.small}
                onClose={handleModalCancel}
                titleIconVariant="warning"
                actions={[
                    <Button
                        key="confirm"
                        variant="primary"
                        onClick={handleModalConfirm}
                    >
                        Confirm
                    </Button>,
                    <Button
                        key="cancel"
                        variant="link"
                        onClick={handleModalCancel}
                    >
                        Cancel
                    </Button>,
                ]}
            >
                This metadata will be removed.
            </Modal>
        </>
    );
};

const columnNames = {
    name: 'Testcase name',
    isRegex: 'Is regex',
    priority: 'Priority',
    product: 'Product',
    actions: '',
};

/*
 * Based on https://pagure.io/fedora-ci/messages/blob/master/f/schemas/contact.yaml
 */
export interface Contact {
    name?: string;
    url?: string;
    irc?: string;
    team?: string;
    docs?: string;
    email?: string;
    gchat_room_url?: string;
    report_issue_url?: string;
}

export interface KnownIssue {
    info: string;
    status: 'active' | 'fixed' | 'irrelevant';
    severity: 'blocker' | 'critical' | 'major' | 'normal' | 'minor';
}

export interface Dependency {
    comment: string;
    dependency: 'is_required' | 'is_related_to';
    testcase_name: string;
}

/* based on schema */
export type MetadataEntryType = {
    _id: string | undefined;
    contact: Partial<Contact>;
    priority: number;
    dependency: Dependency[];
    description?: string;
    known_issues: KnownIssue[];
    testcase_name: string;
    product_version?: string;
    testcase_name_is_regex: boolean;
};

interface IsLoadingProps {
    isLoading: boolean;
}
export const IsLoading: FunctionComponent<IsLoadingProps> = (props) => {
    const { isLoading } = props;
    if (!isLoading) {
        return null;
    }
    return (
        <Spinner isSVG size="sm" aria-label="Contents of the small example" />
    );
};

interface APIErrorProps {
    error: ApolloError | undefined;
}
export const APIError: FunctionComponent<APIErrorProps> = (props) => {
    const { error } = props;
    if (!_.isError(error)) {
        return null;
    }
    return (
        <AlertGroup isToast isLiveRegion>
            <Alert variant="danger" title="Error" timeout={true} key="error">
                {error.message}
            </Alert>
        </AlertGroup>
    );
    //return <div className="pf-u-danger-color-100">{error.message}</div>;
};

interface NothingFoundTRProps {
    active: boolean;
    colSpan: number;
}
export const NothingFoundTR: FunctionComponent<NothingFoundTRProps> = (
    props,
) => {
    const { active, colSpan } = props;
    if (!active) {
        return null;
    }
    return (
        <Tr key="empty">
            <Td colSpan={colSpan}>
                <Bullseye>
                    <EmptyState variant={EmptyStateVariant.small}>
                        <EmptyStateIcon icon={SearchIcon} />
                        <Title headingLevel="h2" size="lg">
                            No entries found
                        </Title>
                        <EmptyStateBody>Try again</EmptyStateBody>
                    </EmptyState>
                </Bullseye>
            </Td>
        </Tr>
    );
};

interface IsRegexProps {
    isRegex: boolean;
}
export const IsRegex: FunctionComponent<IsRegexProps> = (props) => {
    const { isRegex } = props;
    if (!isRegex) {
        return null;
    }
    return <small>re</small>;
};

interface MetadataRawListQueryResult {
    metadata_raw: MetadataEntryType[];
}

interface MetadataRemoveEntry {
    metadata_update: MetadataRaw;
}

const MetadataList: FunctionComponent<{}> = () => {
    /* On forceUpdate() query is not issued */
    const [getMetadataList, { loading, error, data: metadata }] =
        useLazyQuery<MetadataRawListQueryResult>(MetadataRawListQuery, {
            errorPolicy: 'all',
            /* need to re-fetch each time when user press save/back button */
            fetchPolicy: 'network-only',
            notifyOnNetworkStatusChange: true,
        });
    useEffect(() => {
        getMetadataList();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const forceUpdateReducer = (state_: any) => {
        getMetadataList();
        /* each time return new object: {} !== {}, which will lead to re-render */
        return {};
    };
    const [, forceUpdate] = useReducer(forceUpdateReducer, 0);

    const haveData = !loading && metadata && !_.isEmpty(metadata.metadata_raw);

    const customStyle1 = {
        borderLeft: '3px solid var(--pf-global--primary-color--100)',
    };
    const customStyle2 = {
        borderLeft: '3px solid var(--pf-global--default-color--200)',
    };

    /**
     * 
    const onAddClick: MouseEventHandler = () => {
        dispatch({ type: 'rmIssue', issue });
    };
     */

    const [activeSortDirection, setActiveSortDirection] = React.useState<
        'asc' | 'desc'
    >('asc');

    const sortParams: ThProps['sort'] = {
        sortBy: {
            direction: activeSortDirection,
            index: 3,
        },
        onSort: (_event, _index, direction) => {
            setActiveSortDirection(direction);
        },
        columnIndex: 3,
    };

    const metadataSorted = haveData
        ? _.sortBy(metadata.metadata_raw, ['priority'])
        : [];
    if (activeSortDirection === 'desc') {
        _.reverse(metadataSorted);
    }
    const isEmpty = _.isNil(haveData);

    const [valueSearch, setSearchValue] = React.useState('');
    const onSearchChange = (_event: any, value: string) => {
        setSearchValue(value);
    };

    const metadataShow = _.filter(metadataSorted, (e) =>
        _.includes(e.testcase_name, valueSearch),
    );

    return (
        <>
            <Toolbar id="toolbar">
                <ToolbarContent>
                    <ToolbarItem>
                        <SearchInput
                            placeholder="Find by name"
                            value={valueSearch}
                            onChange={onSearchChange}
                            onClear={(event) => onSearchChange(event, '')}
                        />
                    </ToolbarItem>
                </ToolbarContent>
            </Toolbar>

            <TableComposable
                aria-label="Metadata table"
                variant="compact"
                isStriped
            >
                <Thead noWrap>
                    <Tr>
                        <Th width={40}>{columnNames.name}</Th>
                        <Th width={10}>{columnNames.isRegex}</Th>
                        <Th
                            width={10}
                            info={{
                                tooltip: 'The lower number the higher priority',
                            }}
                            sort={sortParams}
                        >
                            {columnNames.priority}
                        </Th>
                        <Th
                            width={20}
                            info={{
                                tooltip:
                                    'If empty, then this metadata applies to all products',
                            }}
                        >
                            {columnNames.product}
                        </Th>
                        <Th width={20}>{columnNames.actions}</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    <NothingFoundTR active={isEmpty} colSpan={5} />
                    {metadataShow.map((mEntry, rowIndex) => {
                        const isOddRow = (rowIndex + 1) % 2;
                        return (
                            <Tr
                                key={rowIndex}
                                style={isOddRow ? customStyle1 : customStyle2}
                            >
                                <Td
                                    width={50}
                                    modifier="nowrap"
                                    isActionCell
                                    dataLabel={columnNames.name}
                                >
                                    {mEntry.testcase_name}
                                </Td>
                                <Td
                                    dataLabel={columnNames.isRegex}
                                    modifier="nowrap"
                                >
                                    <IsRegex
                                        isRegex={mEntry.testcase_name_is_regex}
                                    />
                                </Td>
                                <Td
                                    dataLabel={columnNames.priority}
                                    modifier="nowrap"
                                >
                                    {mEntry.priority}
                                </Td>
                                <Td
                                    dataLabel={columnNames.product}
                                    modifier="nowrap"
                                >
                                    {mEntry.product_version}
                                </Td>
                                <Td modifier="nowrap">
                                    <Actions
                                        mEntry={mEntry}
                                        forceUpdate={forceUpdate}
                                    />
                                </Td>
                            </Tr>
                        );
                    })}
                </Tbody>
            </TableComposable>
            <Button
                variant="primary"
                isInline
                isSmall
                component={(props) => <Link {...props} to="metadata/edit" />}
                icon={<AddCircleOIcon />}
            >
                Add new
            </Button>
            <APIError error={error} />
        </>
    );
};

export function PageMetadataList() {
    return (
        <PageCommon title={`Metadata | ${config.defaultTitle}`}>
            <Flex grow={{ default: undefined }}>
                <FlexItem>
                    <MetadataList />
                </FlexItem>
            </Flex>
        </PageCommon>
    );
}
