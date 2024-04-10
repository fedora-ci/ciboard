/*
 * This file is part of ciboard
 *
 * Copyright (c) 2023, 2024 Andrei Stepanov <astepano@redhat.com>
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
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import {
    Text,
    List,
    Flex,
    Tile,
    Slider,
    Button,
    Popover,
    Toolbar,
    Checkbox,
    FlexItem,
    ListItem,
    HelperText,
    ToolbarItem,
    TextContent,
    TextVariants,
    ToolbarContent,
    HelperTextItem,
    TextInputGroup,
    PopoverPosition,
    TextInputGroupMain,
    TextInputGroupUtilities,
} from '@patternfly/react-core';
import { HelpIcon, SearchIcon } from '@patternfly/react-icons';

import {
    actLoad,
    actPage,
    actNewQuery,
    actDoDeepSearch,
    actIsExtendedQs,
} from './../actions';
import { useAppDispatch, useAppSelector } from '../hooks';
import { actArtTypes, actNewerThen, actQueryString } from './../actions';
import { useSearchParams } from 'react-router-dom';
import { useStore } from 'react-redux';
import { RootStateType } from '../slices';

/**
 * These are default search-field for each artifact type. List here all possible artifact-types:
 *
 * * https://pagure.io/greenwave/blob/master/f/conf/subject_types
 * * https://gitlab.cee.redhat.com/gating/greenwave-playbooks/-/blob/master/roles/greenwave/files/subject_types.yaml
 */
const artifactTypeToHumanName = {
    '': 'Anything',
    'brew-build': 'RH RPM',
    'koji-build': 'Fedora RPM',
    'koji-build-cs': 'Centos RPM',
    'redhat-module': 'RH modules',
    'productmd-compose': 'RH composes',
    'redhat-container-image': 'RH containers',
};

interface HelpForSearchInputProps {}
const HelpForSearchInput: React.FC<HelpForSearchInputProps> = (_props: {}) => {
    const isExtendedQs = useAppSelector(
        (state) => state.artifactsQuery.isExtendedQs,
    );
    if (!isExtendedQs) {
        return null;
    }
    return (
        <>
            <Popover
                position={PopoverPosition['bottomEnd']}
                aria-label="Uncontrolled popover with button in the body that can close it"
                hasAutoWidth
                headerIcon={<HelpIcon />}
                hideOnOutsideClick={false}
                bodyContent={(hide) => (
                    <>
                        <HelperText>
                            <HelperTextItem
                                style={{ fontFamily: 'RedHatDisplay' }}
                            >
                                <TextContent>
                                    <Text component={TextVariants.h1}>
                                        Query examples
                                    </Text>
                                </TextContent>
                            </HelperTextItem>
                            <HelperTextItem
                                style={{
                                    whiteSpace: 'nowrap',
                                    fontFamily: 'RedHatMono',
                                }}
                            >
                                <List isPlain isBordered>
                                    <ListItem>errata 1217*</ListItem>
                                    <ListItem>
                                        component: kernel AND scratch: true AND
                                        issuer: sb*
                                    </ListItem>
                                    <ListItem>
                                        component: kernel AND gateTag:
                                        (rhel-8.8* OR rhel-9.2*)
                                    </ListItem>
                                </List>
                            </HelperTextItem>
                            <HelperText>
                                <HelperTextItem
                                    style={{ fontFamily: 'RedHatDisplay' }}
                                >
                                    <TextContent>
                                        <Text component={TextVariants.h1}>
                                            Known fields
                                        </Text>
                                    </TextContent>
                                </HelperTextItem>
                                <HelperTextItem
                                    style={{ fontFamily: 'RedHatMono' }}
                                >
                                    <List isPlain isBordered>
                                        <ListItem>
                                            nvr: "annobin-12.28-1.el9"
                                        </ListItem>
                                        <ListItem>
                                            source:
                                            "git+https://pkgs.devel.redhat.com/git/rpms/annobin#b9e86e0c6d348cb7a7045c7f26e8c0aef3068061"
                                        </ListItem>
                                        <ListItem>issuer: "mrezanin"</ListItem>
                                        <ListItem>taskId: "56055780"</ListItem>
                                        <ListItem>contId: </ListItem>
                                        <ListItem>scratch: false</ListItem>
                                        <ListItem>
                                            gateTag: "rhel-9.4.0-gate "
                                        </ListItem>
                                        <ListItem>buildId: "2721481"</ListItem>
                                        <ListItem>
                                            component: "annobin"
                                        </ListItem>
                                        <ListItem>msgFullText: </ListItem>
                                        <ListItem>
                                            msgState: "complete | running |
                                            error | queued"
                                        </ListItem>
                                        <ListItem>
                                            msgStage: "test | build"
                                        </ListItem>
                                        <ListItem>
                                            testCaseName:
                                            "osci.brew-build.test-compose.integration"
                                        </ListItem>
                                        <ListItem>
                                            brokerMsgIdGateTag:{' '}
                                        </ListItem>
                                    </List>
                                </HelperTextItem>
                            </HelperText>
                        </HelperText>
                        <br />
                        <a
                            href="https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html#query-string-syntax"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            query syntax help
                        </a>

                        <div style={{ textAlign: 'right' }}>
                            <button onClick={hide}>close</button>
                        </div>
                    </>
                )}
            >
                <Button variant="plain" isInline>
                    Query help
                </Button>
            </Popover>
        </>
    );
};

interface ArtifactTypeSelectionProps {}
const ArtifactTypeSelection: React.FC<
    ArtifactTypeSelectionProps
> = (_props: {}) => {
    const dispatch = useAppDispatch();
    const selectedArtTypes = useAppSelector(
        (state) => state.artifactsQuery.artTypes,
    );
    const onSelect = (event: React.MouseEvent | React.KeyboardEvent) => {
        const targetId = event.currentTarget.id;
        if (targetId === '') {
            if (_.isEqual(selectedArtTypes, [''])) {
                return;
            } else {
                dispatch(actArtTypes(['']));
                return;
            }
        }
        const turnOff = _.includes(selectedArtTypes, targetId);
        let artTypes = turnOff
            ? _.filter(selectedArtTypes, (id) => id !== targetId)
            : [...(selectedArtTypes as []), targetId];
        artTypes = _.without(artTypes, '');
        if (_.isEmpty(artTypes)) {
            artTypes = [''];
        }
        dispatch(actArtTypes(artTypes));
    };
    const onKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            onSelect(event);
        }
    };
    const tilesItems: JSX.Element[] = [];
    for (const [key, menuName] of _.entries(artifactTypeToHumanName)) {
        const isSelected = _.includes(selectedArtTypes, key);
        tilesItems.push(
            <Tile
                id={key}
                key={key}
                style={{ margin: '0 2px', fontFamily: 'RedHatDisplay' }}
                title=""
                onClick={onSelect}
                isStacked
                onKeyDown={onKeyDown}
                isSelected={isSelected}
            >
                {menuName}
            </Tile>,
        );
    }
    _.map(artifactTypeToHumanName);
    return <>{tilesItems}</>;
};

interface TimelineSelectionProps {}
const TimelineSelection: React.FC<TimelineSelectionProps> = (_props: {}) => {
    const dispatch = useAppDispatch();
    const newerThen = useAppSelector((state) => state.artifactsQuery.newerThen);
    const steps = [
        { value: 1, label: '1mo' },
        { value: 3, label: '3mos' },
        { value: 6, label: '6mos' },
        { value: 8, label: 'anytime' },
    ];
    const onChange = (value: number) => {
        const newValue = _.toString(value);
        if (newerThen !== newValue) {
            dispatch(actNewerThen(newValue));
        }
    };
    let label = '';
    switch (newerThen) {
        case '1':
            label = '1 month';
            break;
        case '8':
            label = 'all time';
            break;
        default:
            label = `${newerThen} months`;
    }
    return (
        <Flex direction={{ default: 'column' }}>
            <FlexItem>
                <Text style={{ fontFamily: 'RedhatText' }}>
                    Lookup for: {label}
                </Text>
            </FlexItem>
            <FlexItem>
                <Slider
                    value={_.toNumber(newerThen)}
                    min={steps[0].value}
                    max={steps[3].value}
                    onChange={(_event, value: number) => onChange(value)}
                    customSteps={steps}
                />
            </FlexItem>
        </Flex>
    );
};

interface DoDeepSearchProps {}
const DoDeepSearch: React.FC<DoDeepSearchProps> = (_props: {}) => {
    const dispatch = useAppDispatch();
    const doDeepSearch = useAppSelector(
        (state) => state.artifactsQuery.doDeepSearch,
    );
    const onChange = (
        _event: React.FormEvent<HTMLInputElement>,
        checked: boolean,
    ) => {
        // event.currentTarget.name === 'deepsearch'
        if (doDeepSearch !== checked) {
            dispatch(actDoDeepSearch(checked));
        }
    };

    return (
        <>
            <Checkbox
                label="Do Deep Search"
                isChecked={doDeepSearch}
                onChange={onChange}
                id="deep-search"
                name="deepsearch"
            />
        </>
    );
};

interface IsExtendedQsProps {}
const IsExtendedQs: React.FC<IsExtendedQsProps> = (_props: {}) => {
    const dispatch = useAppDispatch();
    const isExtendedQs = useAppSelector(
        (state) => state.artifactsQuery.isExtendedQs,
    );
    const onChange = (
        _event: React.FormEvent<HTMLInputElement>,
        checked: boolean,
    ) => {
        // event.currentTarget.name === 'extendedquery'
        if (isExtendedQs !== checked) {
            dispatch(actIsExtendedQs(checked));
        }
    };

    return (
        <>
            <Checkbox
                label="Do extended query"
                isChecked={isExtendedQs}
                onChange={onChange}
                id="extended-query-string"
                name="extendedquery"
            />
        </>
    );
};

interface SearchInputProps {
    qsValue: string;
    setQsValue: Dispatch<SetStateAction<string>>;
}
const SearchInput: React.FC<SearchInputProps> = (props) => {
    const { qsValue, setQsValue } = props;
    const dispatch = useAppDispatch();
    const client = useApolloClient();
    const store = useStore<RootStateType>();
    const ref: React.MutableRefObject<HTMLInputElement | null> = useRef(null);

    useEffect(() => {
        ref.current && ref.current.focus();
    }, [dispatch]);

    const onKeyPress = (keyEvent: React.KeyboardEvent) => {
        if (keyEvent.key === 'Enter' && qsValue && !_.isEmpty(qsValue)) {
            dispatch(actPage(1));
            dispatch(actQueryString(qsValue));
            dispatch(actNewQuery(store.getState().artifactsQuery));
            dispatch(actLoad(client));
            keyEvent.stopPropagation();
            keyEvent.preventDefault();
        }
    };
    const handleInputChange = (
        _event: React.FormEvent<HTMLInputElement>,
        qsValue: string,
    ) => {
        setQsValue(qsValue);
    };
    return (
        <>
            <TextInputGroup>
                <TextInputGroupMain
                    ref={ref}
                    icon={<SearchIcon />}
                    value={qsValue}
                    onChange={handleInputChange}
                    onKeyDown={onKeyPress}
                />
                <TextInputGroupUtilities>
                    <HelpForSearchInput />
                </TextInputGroupUtilities>
            </TextInputGroup>
        </>
    );
};

interface SearchToolbarProps {}
export const SearchToolbar: React.FC<SearchToolbarProps> = (_props: {}) => {
    const client = useApolloClient();
    const store = useStore<RootStateType>();
    const dispatch = useAppDispatch();
    const [searchParams, _setSearchParams] = useSearchParams();
    const [qsValue, setQsValue] = useState<string>('');

    useEffect(() => {
        const initQs = searchParams.get('qs');
        // cover race conditions in scenarious qs from address bar and from redux storage
        const reduxStorageQs =
            store.getState().artifactsCurrentQuery.queryString;
        const initVal = initQs ? initQs : reduxStorageQs;
        if (initVal) {
            // Put into search field initial value from URL
            setQsValue(initVal);
        }
        /**
         * Ensure the useEffect only runs once.
         * That will not invoke re-renders because dispatch value will not change
         */
    }, [dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

    const onClickDoSearch = () => {
        dispatch(actPage(1));
        dispatch(actQueryString(qsValue));
        dispatch(actNewQuery(store.getState().artifactsQuery));
        dispatch(actLoad(client));
    };

    const toolbarItems = (
        <>
            <ToolbarItem style={{ flexBasis: '100%' }}>
                <SearchInput setQsValue={setQsValue} qsValue={qsValue} />
            </ToolbarItem>
            <ToolbarItem style={{ flexBasis: '100%' }}>
                <Flex
                    direction={{ default: 'column' }}
                    style={{ flexBasis: '100%' }}
                >
                    <FlexItem>
                        <DoDeepSearch />
                    </FlexItem>
                    <FlexItem>
                        <IsExtendedQs />
                    </FlexItem>
                    <FlexItem grow={{ default: 'grow' }}>
                        <div style={{ maxWidth: '400px' }}>
                            <TimelineSelection />
                        </div>
                    </FlexItem>
                </Flex>
            </ToolbarItem>
            <ToolbarItem
                visibility={{ default: 'visible' }}
                style={{ flexBasis: '100%' }}
            >
                <ArtifactTypeSelection />
            </ToolbarItem>
            <ToolbarItem
                visibility={{ default: 'visible' }}
                style={{ flexBasis: '100%' }}
            >
                <Flex justifyContent={{ default: 'justifyContentFlexEnd' }}>
                    <FlexItem>
                        <Button onClick={onClickDoSearch} variant="primary">
                            Search
                        </Button>
                    </FlexItem>
                </Flex>
            </ToolbarItem>
        </>
    );

    const toolBar = (
        <Flex justifyContent={{ default: 'justifyContentCenter' }}>
            <Toolbar
                id="data-toolbar-with-query"
                className="pf-v5-u-mx-xl"
                style={{ background: 'inherit', maxWidth: '1000px' }}
            >
                <ToolbarContent>{toolbarItems}</ToolbarContent>
            </Toolbar>
        </Flex>
    );

    return toolBar;
};
