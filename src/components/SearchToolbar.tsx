/*
 * This file is part of ciboard
 *
 * Copyright (c) 2023 Andrei Stepanov <astepano@redhat.com>
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
import { Dispatch, SetStateAction, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import {
    Text,
    Flex,
    Tile,
    Slider,
    Button,
    Popover,
    Toolbar,
    FlexItem,
    HelperText,
    ToolbarItem,
    TextVariants,
    ToolbarContent,
    HelperTextItem,
    TextInputGroup,
    PopoverPosition,
    ExpandableSection,
    TextInputGroupMain,
    TextInputGroupUtilities,
} from '@patternfly/react-core';
import { HelpIcon, SearchIcon } from '@patternfly/react-icons';

import { actLoad, actPage } from './../actions';
import { useAppDispatch, useAppSelector } from '../hooks';
import { actArtTypes, actNewerThen, actQueryString } from './../actions';

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
    return (
        <>
            <Popover
                position={PopoverPosition['bottomEnd']}
                aria-label="Uncontrolled popover with button in the body that can close it"
                headerContent={<div>Popover header</div>}
                hasAutoWidth
                headerIcon={<HelpIcon />}
                hideOnOutsideClick={false}
                bodyContent={(hide) => (
                    <div>
                        <>
                            <HelperText>
                                <HelperTextItem>
                                    This is default helper text
                                </HelperTextItem>
                            </HelperText>
                            <HelperText>
                                <HelperTextItem variant="indeterminate">
                                    This is indeterminate helper text
                                </HelperTextItem>
                            </HelperText>
                            <HelperText>
                                <HelperTextItem variant="warning">
                                    This is warning helper text
                                </HelperTextItem>
                            </HelperText>
                            <HelperText>
                                <HelperTextItem variant="success">
                                    This is success helper text
                                </HelperTextItem>
                            </HelperText>
                            <HelperText>
                                <HelperTextItem variant="error">
                                    This is error helper text
                                </HelperTextItem>
                            </HelperText>
                        </>
                        <div>
                            <button onClick={hide}>close</button>
                        </div>
                    </div>
                )}
                footerContent="Popover footer"
            >
                <Button variant="plain">
                    <HelpIcon />
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
                key={key}
                title=""
                isStacked
                isSelected={isSelected}
                onKeyDown={onKeyDown}
                onClick={onSelect}
            >
                {menuName}
            </Tile>,
        );
        tilesItems.push(<> </>);
    }
    _.map(artifactTypeToHumanName);
    return <>{tilesItems}</>;
};

interface TimelineSelectionProps {}
const TimelineSelection: React.FC<TimelineSelectionProps> = (_props: {}) => {
    const dispatch = useAppDispatch();
    const newerThen = useAppSelector((state) => state.artifactsQuery.newerThen);
    const steps = [
        { value: 1, label: '1 month' },
        { value: 3, label: '3 months' },
        { value: 6, label: '6 months' },
        { value: 8, label: 'All time' },
    ];
    const onChange = (value: number) => {
        const newValue = _.toString(value);
        if (newerThen !== newValue) {
            dispatch(actNewerThen(newValue));
        }
    };
    return (
        <>
            <Text component={TextVariants.h3}>Find for:</Text>
            <Slider
                value={_.toNumber(newerThen)}
                min={steps[0].value}
                max={steps[3].value}
                onChange={onChange}
                customSteps={steps}
            />
            <br />
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
    const onKeyPress = (keyEvent: React.KeyboardEvent) => {
        if (keyEvent.key === 'Enter' && qsValue && !_.isEmpty(qsValue)) {
            dispatch(actPage(1));
            dispatch(actQueryString(qsValue));
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
    const dispatch = useAppDispatch();
    const [qsValue, setQsValue] = useState<string>('');

    const onClickDoSearch = () => {
        dispatch(actPage(1));
        dispatch(actQueryString(qsValue));
        dispatch(actLoad(client));
    };

    const toolbarItems = (
        <>
            <ToolbarItem style={{ flexBasis: '100%' }}>
                <SearchInput setQsValue={setQsValue} qsValue={qsValue} />
            </ToolbarItem>
            <ToolbarItem style={{ flexBasis: '100%' }}>
                <ExpandableSection toggleText="more">
                    <div style={{ maxWidth: '400px' }}>
                        <TimelineSelection />
                    </div>
                </ExpandableSection>
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
                className="pf-u-mx-xl"
                style={{ background: 'inherit', maxWidth: '1000px' }}
            >
                <ToolbarContent>{toolbarItems}</ToolbarContent>
            </Toolbar>
        </Flex>
    );

    return toolBar;
};
