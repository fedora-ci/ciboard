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
import { useQuery } from '@apollo/client';
import classNames from 'classnames';
import moment from 'moment';
import { Dispatch, ReactNode, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    ActionGroup,
    Button,
    Checkbox,
    CheckboxProps,
    DataList,
    DataListCell,
    DataListItem,
    DataListItemCells,
    DataListItemRow,
    Dropdown,
    DropdownItem,
    DropdownProps,
    DropdownToggle,
    Flex,
    FlexItem,
    Form,
    FormGroup,
    Grid,
    GridItem,
    InputGroup,
    PageSection,
    PageSectionVariants,
    Select,
    SelectOption,
    SelectProps,
    SelectVariant,
    Text,
    TextContent,
    TextInput,
    TextInputProps,
    Title,
} from '@patternfly/react-core';
import { ArrowIcon, ThIcon } from '@patternfly/react-icons';
import {
    cellWidth,
    ICell,
    IRow,
    Table,
    TableHeader,
    TableVariant,
    TableBody,
} from '@patternfly/react-table';

import { config } from '../config';
import styles from '../custom.module.css';
import { bumpGatingSearchEpoch, setGatingSearchOptions } from '../actions';
import { RootStateType } from '../reducers';
import {
    StateGatingTests,
    getSelectFromType,
} from '../reducers/gateArtifactsReducer';
import {
    Artifact,
    ArtifactType,
    ComponentMapping,
    StageNameType,
    StateNameType,
} from '../artifact';
import { mkSpecialRows } from '../utils/artifactsTable';
import { PageCommon } from './PageCommon';
import { ActionsGateArtifactsType } from '../actions/types';
import {
    PageGatingArtifacts,
    PageGatingArtifactsData,
    PageGatingGetSSTTeams,
} from '../queries/Artifacts';
import { PaginationToolbar } from './PaginationToolbar';
import { artifactUrl, getArtifactName } from '../utils/artifactUtils';

interface CiSystem {
    ciSystemName: string;
    generatedAt?: string;
    order?: number;
    result: string;
    stage?: StageNameType;
    state: StateNameType;
    status?: string;
    test?: {
        resuls: string;
    };
    textClasses?: string;
}

interface CiSystemsTableProps {
    currentState: {
        [key in StateNameType]: CiSystem[];
    };
    searchParams: StateGatingTests;
}

interface GatingSearchQuery {
    aid_offset?: string;
    atype: ArtifactType;
    dbFieldName1: string;
    dbFieldNameComponentMapping1?: string;
    dbFieldValues1: string;
    dbFieldValuesComponentMapping1?: string[];
    dbFieldName2?: string;
    dbFieldValues2?: string;
    dbFieldName3?: string;
    dbFieldValues3?: string;
    options: {
        componentMappingProductId?: number;
        reduced?: boolean;
        valuesAreRegex1?: boolean;
        valuesAreRegex2?: boolean;
        valuesAreRegex3?: boolean;
    };
}

interface MappingInfoProps {
    mapping?: ComponentMapping;
}

const ciSystems: string[] = [
    'baseos-ci.brew-build.covscan',
    'baseos-ci.brew-build.rpminspect-analysis',
    'baseos-ci.brew-build.rpminspect-comparison',
    'baseos',
    'brew-build.installability',
    'brew-build.revdeps',
    'brew-build.rpmdeplint',
    'covscan',
    'desktop-qe',
    'leapp',
    'osci',
    'redhat-module.installability',
];

const gatingTagMenuItems: string[] = ['8\\.', '9\\.', '8\\.4', 'dnf', 'gnome'];

const buildTypeMenuItems = {
    ordinary: 'brew-build',
    modularity: 'redhat-module',
};

const columns = (buildType: string): ICell[] => {
    return [
        { title: 'Artifact' },
        { title: 'Tag', transforms: [cellWidth(20)] },
        { title: buildType },
        { title: 'Owners' },
        {
            title: 'CI Systems',
            transforms: [cellWidth(100)],
        },
        { title: 'Info' },
    ];
};

const artifactDashboardUrl = ({ aid, type }: Artifact) =>
    `${window.location.origin}/#/artifact/${type}/aid/${aid}`;

const CiSystemsTable = (props: CiSystemsTableProps) => {
    const { currentState, searchParams } = props;
    const ciSystemsNames: CiSystem[] = [];
    for (const state of [
        'complete',
        'error',
        'queued',
        'running',
    ] as StateNameType[]) {
        if (!_.has(currentState, state)) {
            continue;
        }
        for (const ciSystem of currentState[state]) {
            if (ciSystem.stage !== 'test') {
                continue;
            }
            let ciSystemName: string;
            let result = '';
            const parts_v1 = [];
            const parts_v2 = [];
            for (const part of ['namespace', 'type', 'category']) {
                parts_v1.push(_.get(ciSystem, part, null));
                parts_v2.push(_.get(_.get(ciSystem, 'test', {}), part, null));
            }
            if (_.every(parts_v1)) {
                ciSystemName = _.join(parts_v1, '.');
            } else if (_.every(parts_v2)) {
                ciSystemName = _.join(parts_v2, '.');
            } else {
                console.log('Cannot construct CI system name', ciSystem);
                continue;
            }
            const re = new RegExp(searchParams.ciSystem, 'gi');
            if (searchParams.ciSystem && !ciSystemName.match(re)) {
                continue;
            }
            if (ciSystem.status) {
                // v1
                result = ciSystem.status;
            }
            if (ciSystem.test && ciSystem.test.resuls) {
                // v2
                result = ciSystem.test.resuls;
            }
            ciSystemsNames.push({
                ciSystemName,
                generatedAt: ciSystem.generatedAt,
                result,
                state,
            });
        }
    }
    _.forEach(ciSystemsNames, (ciSystem, index) => {
        const { state, result } = ciSystem;
        let isPassed = false;
        let isInfo = false;
        let isFailed = false;
        let isOther = false;
        let order;
        if (state === 'running' || state === 'queued') {
            isInfo = true;
            order = 1;
        } else if (state === 'error') {
            isFailed = true;
            order = 2;
        } else {
            // complete
            if (result.match(/pass/gi)) {
                isPassed = true;
                order = 0;
            } else if (result.match(/fail/gi)) {
                isFailed = true;
                order = 2;
            } else {
                isOther = true;
                order = 3;
            }
        }
        const textClasses = classNames(styles.sstStatus, {
            [styles.statusPassed]: isPassed,
            [styles.statusInfo]: isInfo,
            [styles.statusFailed]: isFailed,
            [styles.statusOther]: isOther,
        });
        ciSystem.order = order;
        ciSystem.textClasses = textClasses;
    });
    const ciSystemsList = classNames(styles['ciSystemsList']);
    const items: ReactNode[] = _.orderBy(ciSystemsNames, 'order', 'asc').map(
        (ciSystem, index) => {
            const { ciSystemName, generatedAt, result, state, textClasses } =
                ciSystem;
            const time = moment.utc(generatedAt).local();
            const ciSystemTime = time.format('YYYY-MM-DD, HH:mm');
            const zoneShift = time.format('ZZ');
            return (
                <DataListItem
                    key={index}
                    aria-labelledby="simple-item1"
                    className={ciSystemsList}
                >
                    <DataListItemRow>
                        <DataListItemCells
                            className="pf-u-p-0"
                            dataListCells={[
                                <DataListCell
                                    className="pf-u-p-0"
                                    key="ciSystem name"
                                    width={3}
                                >
                                    {ciSystemName}
                                </DataListCell>,
                                <DataListCell
                                    className="pf-u-p-0"
                                    key="ciSystem state-result"
                                    alignRight
                                    width={1}
                                >
                                    <div className={textClasses}>
                                        {state}
                                        {result ? ' / ' + result : ''}
                                    </div>
                                </DataListCell>,
                                <DataListCell
                                    className="pf-u-p-0"
                                    key="ciSystem time"
                                    alignRight
                                    width={1}
                                >
                                    <Flex>
                                        <FlexItem className="pf-u-p-0 pf-u-m-0">
                                            <TextContent>
                                                <Text
                                                    style={{
                                                        whiteSpace: 'nowrap',
                                                        fontFamily:
                                                            'var(--pf-global--FontFamily--monospace)',
                                                        fontSize: 'x-small',
                                                    }}
                                                    component="small"
                                                >
                                                    {ciSystemTime}
                                                </Text>
                                            </TextContent>
                                        </FlexItem>
                                        <FlexItem className="pf-u-p-0 pf-u-m-0">
                                            <TextContent>
                                                <Text
                                                    component="small"
                                                    style={{
                                                        whiteSpace: 'nowrap',
                                                        fontFamily:
                                                            'var(--pf-global--FontFamily--monospace)',
                                                        fontSize: '0.5em',
                                                    }}
                                                >
                                                    {zoneShift}
                                                </Text>
                                            </TextContent>
                                        </FlexItem>
                                    </Flex>
                                </DataListCell>,
                            ]}
                        />
                    </DataListItemRow>
                </DataListItem>
            );
        },
    );
    const allCISystems = classNames(styles['allCISystems']);
    return (
        <DataList
            aria-label="List of CI results"
            className={allCISystems}
            isCompact
        >
            {items}
        </DataList>
    );
};

const MappingInfo = (props: MappingInfoProps) => {
    const { mapping } = props;
    if (!mapping?.product_id) return null;
    const { default_assignee, qa_contact, sst_name } = mapping;
    return (
        <>
            Team: {sst_name}
            <br />
            QA: {qa_contact}
            <br />
            Owner: {default_assignee}
        </>
    );
};

function mkArtifactRow(
    artifact: Artifact,
    searchParams: StateGatingTests,
): IRow {
    const artifactLink = (
        <div style={{ whiteSpace: 'nowrap' }}>
            <a
                href={artifactUrl(artifact)}
                onClick={(e) => e.stopPropagation()}
                rel="noopener noreferrer"
                target="_blank"
            >
                {artifact.payload?.scratch
                    ? `scratch:${artifact.aid}`
                    : artifact.aid}
            </a>
        </div>
    );

    const cells = [
        {
            title: artifactLink,
        },
        artifact.payload?.gate_tag_name,
        {
            title: (
                <div>
                    <Title
                        size="md"
                        headingLevel="h6"
                        style={{ whiteSpace: 'nowrap' }}
                    >
                        {getArtifactName(artifact)}
                    </Title>
                </div>
            ),
        },
        {
            title: (
                /*
                TODO: Component mapping not yet supported.
                <div style={{ whiteSpace: 'nowrap' }}>
                    builder: {artifact.payload.issuer}
                    <br />
                    <MappingInfo
                        mapping={artifact.component_mapping}
                    />
                </div>
                */
                <p>MappingInfo</p>
            ),
        },
        {
            /*
                <div>
                    <CiSystemsTable
                        currentState={transformKaiStates(artifact.states, 'test')}
                        searchParams={searchParams}
                    />
                </div>
                */
            title: <p>CiSystemsTable</p>,
        },
        {
            title: (
                <a
                    href={artifactDashboardUrl(artifact)}
                    title="Artifact link"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <ArrowIcon size="sm" />
                </a>
            ),
        },
    ];
    return { cells };
}

function BuildTypeSelector() {
    const dispatch: Dispatch<ActionsGateArtifactsType> = useDispatch();
    const { buildType: buildTypeInit } = useSelector<
        RootStateType,
        StateGatingTests
    >((state) => state.gateArtifacts);
    const inititalState = getSelectFromType(buildTypeInit);
    const [buildType, setBuildType] = useState(inititalState);
    const [isExpanded, setExpanded] = useState(false);
    const onSelect: SelectProps['onSelect'] = (_event, selection) => {
        const selectionString = selection.toString();
        setBuildType(selectionString);
        setExpanded(false);
        dispatch(
            setGatingSearchOptions({
                buildType: selectionString,
            }),
        );
    };
    return (
        <Select
            isOpen={isExpanded}
            isPlain
            onSelect={onSelect}
            onToggle={setExpanded}
            selections={buildType}
        >
            {_.keys(buildTypeMenuItems).map((item, index) => (
                <SelectOption key={index} value={item} />
            ))}
        </Select>
    );
}

function Checkboxes() {
    const dispatch: Dispatch<ActionsGateArtifactsType> = useDispatch();
    const { ignoreCiSystem: initialState } = useSelector<
        RootStateType,
        StateGatingTests
    >((state) => state.gateArtifacts);
    const [ignoreCiSystem, setIgnoreCiSystem] = useState(initialState);
    const onChange: CheckboxProps['onChange'] = (flag) => {
        setIgnoreCiSystem(flag);
        dispatch(
            setGatingSearchOptions({
                ignoreCiSystem: flag,
            }),
        );
    };
    return (
        <Checkbox
            id="toggle-hide-missing-disabled-typeahead"
            isChecked={ignoreCiSystem}
            label="Show builds with missing CI system"
            name="toggle-hide-missing-disabled-typeahead"
            onChange={onChange}
        />
    );
}

function CiSystemSelector() {
    const dispatch: Dispatch<ActionsGateArtifactsType> = useDispatch();
    const { ciSystem: init_state } = useSelector<
        RootStateType,
        StateGatingTests
    >((state) => state.gateArtifacts);
    const [isExpanded, setExpanded] = useState(false);
    const [ciSystem, setCISystem] = useState(init_state);
    const onToggle = (isExpanded: boolean) => {
        setExpanded(isExpanded);
    };
    const onSelect: SelectProps['onSelect'] = (_event, selection) => {
        const selectionString = selection.toString();
        setCISystem(selectionString);
        setExpanded(false);
        dispatch(
            setGatingSearchOptions({
                ciSystem: selectionString,
            }),
        );
    };
    return (
        <Select
            aria-labelledby="plain-typeahead-select-id-ci-system"
            isCreatable
            isOpen={isExpanded}
            isPlain
            onClear={(event) => onSelect(event, '')}
            onSelect={onSelect}
            onToggle={onToggle}
            placeholderText="CI system regex"
            selections={ciSystem}
            typeAheadAriaLabel="Select CI system"
            variant={SelectVariant.typeahead}
        >
            {ciSystems.map((value, index) => (
                <SelectOption key={index} value={value} />
            ))}
        </Select>
    );
}

function GatingTagSelector() {
    const dispatch: Dispatch<ActionsGateArtifactsType> = useDispatch();
    const { gateTag: init_state } = useSelector<
        RootStateType,
        StateGatingTests
    >((state) => state.gateArtifacts);
    const [gateTag, setRHELVersion] = useState(init_state);
    const [isExpanded, setExpanded] = useState(false);
    const titleId = 'plain-typeahead-select-id-gating-tag';
    const onToggle = (isExpanded: boolean) => {
        setExpanded(isExpanded);
    };
    const onSelect: SelectProps['onSelect'] = (_event, selection) => {
        const selectionString = selection.toString();
        setRHELVersion(selectionString);
        setExpanded(false);
        dispatch(
            setGatingSearchOptions({
                gateTag: selectionString,
            }),
        );
    };
    return (
        <Select
            aria-labelledby={titleId}
            createText="Search for gate-tag:"
            isCreatable
            isOpen={isExpanded}
            isPlain
            onClear={_.partialRight(onSelect, '')}
            onSelect={onSelect}
            onToggle={onToggle}
            placeholderText="gate-tag name regex"
            selections={gateTag}
            typeAheadAriaLabel="RHEL version"
            variant={SelectVariant.typeahead}
        >
            {_.map(gatingTagMenuItems, (item, index) => (
                <SelectOption key={index} value={item} />
            ))}
        </Select>
    );
}

function PackagerSelector() {
    const dispatch: Dispatch<ActionsGateArtifactsType> = useDispatch();
    const { packager: init_state } = useSelector<
        RootStateType,
        StateGatingTests
    >((state) => state.gateArtifacts);
    const [value, setValue] = useState(init_state);
    const handleTextInputChange: TextInputProps['onChange'] = (value) => {
        setValue(value);
    };
    const updateRedux = () => {
        dispatch(
            setGatingSearchOptions({
                packager: value,
            }),
        );
    };
    return (
        <TextInput
            id="packager-input"
            onBlur={updateRedux}
            onChange={handleTextInputChange}
            value={value}
        />
    );
}

function ProductSelector() {
    const dispatch: Dispatch<ActionsGateArtifactsType> = useDispatch();
    const { productId } = useSelector<RootStateType, StateGatingTests>(
        (state) => state.gateArtifacts,
    );
    const [isOpen, setOpen] = useState(false);
    const onFocus = () => {
        document.getElementById('toggle-id')?.focus();
    };
    const onSelect: DropdownProps['onSelect'] = (_event) => {
        setOpen(!isOpen);
        onFocus();
    };
    // FIXME: This doesn't seem to react on product change properly.
    const onClickItem = (productId: number): void => {
        dispatch(
            setGatingSearchOptions({
                productId,
            }),
        );
    };
    const dropdownItems = [
        <DropdownItem
            autoFocus={productId === 604}
            component="button"
            description="SST teams for RHEL 9"
            key="action1"
            onClick={() => onClickItem(604)}
        >
            RHEL 9
        </DropdownItem>,
        <DropdownItem
            autoFocus={productId === 370}
            component="button"
            description="SST teams for RHEL 8"
            key="action2"
            onClick={() => onClickItem(370)}
        >
            RHEL 8
        </DropdownItem>,
    ];
    return (
        <Dropdown
            isOpen={isOpen}
            dropdownItems={dropdownItems}
            isPlain
            onSelect={onSelect}
            toggle={
                <DropdownToggle
                    id="toggle-id"
                    onToggle={setOpen}
                    toggleIndicator={null}
                >
                    <ThIcon />
                </DropdownToggle>
            }
        />
    );
}

function SstSelector() {
    const dispatch: Dispatch<ActionsGateArtifactsType> = useDispatch();
    const { productId, sstTeams: initialState } = useSelector<
        RootStateType,
        StateGatingTests
    >((state) => state.gateArtifacts);
    const [isExpanded, setExpanded] = useState(false);
    const [selectedSst, setSelectedSst] = useState(initialState);
    const onSelect: SelectProps['onSelect'] = (_event, selection) => {
        const updatedSet = _.xor(selectedSst, [selection.toString()]);
        setSelectedSst(updatedSet);
        dispatch(
            setGatingSearchOptions({
                sstTeams: updatedSet,
            }),
        );
    };
    let sstMenuItems: string[] = [];
    const queryVariables = {
        product_id: productId,
    };
    const { data, loading } = useQuery(PageGatingGetSSTTeams, {
        errorPolicy: 'all',
        fetchPolicy: 'cache-first',
        notifyOnNetworkStatusChange: true,
        variables: queryVariables,
    });
    const haveData = !loading && data && !_.isEmpty(data.db_sst_list);
    if (haveData) {
        sstMenuItems = _.map(data.db_sst_list, (a) => _.toString(a));
    }
    const badge = !_.isEmpty(selectedSst)
        ? `Selected: ${_.size(selectedSst)}`
        : undefined;
    return (
        <Select
            customBadgeText={badge}
            isOpen={isExpanded}
            isPlain
            maxHeight="37.5rem"
            onSelect={onSelect}
            onToggle={setExpanded}
            selections={selectedSst}
            variant={SelectVariant.checkbox}
        >
            {_.map(sstMenuItems, (item, index) => (
                <SelectOption key={index} value={item} />
            ))}
        </Select>
    );
}

function GatingResults() {
    const reduxState = useSelector<RootStateType, StateGatingTests>(
        (state) => state.gateArtifacts,
    );
    let artifacts: Artifact[] = [];
    /**
     * pagination vars,
     * useRef - preserves values during component re-render,
     * no need to update component re-render when update.
     */
    const aidOffsetPages = useRef<string[]>([]);
    /**
     * array of sorted 'aid' from the bottom of each known page
     */
    const knownPages = aidOffsetPages.current;
    /**
     * aid_offset -- entry from 'known_pages'
     * Set when user clicks on 'prev' or 'next'
     */
    /**
     * Maps to page number
     */
    const [aidOffset, setAidOffset] = useState<string | undefined>();
    const [searchParams, setSearchParams] = useState(_.cloneDeep(reduxState));
    useEffect(() => {
        if (searchParams.searchEpoch !== reduxState.searchEpoch) {
            /** apply new search options */
            setSearchParams(_.cloneDeep(reduxState));
            /** Search parameters has changed */
            const len = _.size(knownPages);
            knownPages.splice(0, len);
            /** reset pages */
            setAidOffset(undefined);
        }
    }, [reduxState.searchEpoch]);
    /**
     * has_next -- returned by query from backend
     */
    let hasNext = false;
    /**
     * currentPage -- index in known pages
     */
    let currentPage = 1;
    let loadNextIsDisabled = true;
    let loadPrevIsDisabled = true;
    /**
     * page navigation
     */
    const onClickLoadNext = () => {
        const newAidOffset = _.last(artifacts)?.aid;
        setAidOffset(newAidOffset);
    };
    const onClickLoadPrev = () => {
        const index = _.findLastIndex(knownPages, (o) => aidOffset! < o);
        if (index < -1) {
            /** reach first page */
            setAidOffset(undefined);
            return;
        }
        const newAidOffset = knownPages[index];
        setAidOffset(newAidOffset);
    };
    const artifactsType = searchParams.buildType;
    /**
     * gate_tag_name must be first in the query field, otherwise query will be slow.
     * Special index is present:
     * db.artifacts.createIndex({"type" : 1, "aid" : -1, "gate_tag_name" : 1}, { collation: { locale: "en_US", numericOrdering : true} })
     */
    const dbFieldName1 = 'gate_tag_name';
    const dbFieldValues1 = _.trim(searchParams.gateTag);
    const dbFieldName2 = 'resultsdb_testcase';
    const dbFieldValues2 = _.trim(searchParams.ciSystem);
    const dbFieldName3 = 'issuer';
    const dbFieldValues3 = _.trim(searchParams.packager);
    const dbFieldNameComponentMapping1 = 'sst_team_name';
    const dbFieldValuesComponentMapping1 = searchParams.sstTeams;
    const searchOptions = {
        valuesAreRegex1: true,
        valuesAreRegex2: true,
        valuesAreRegex3: true,
        reduced: true,
    };
    /** Always present block */
    const queryVariables: GatingSearchQuery = {
        /** Brew-build, redhat-module. Always present in query. */
        atype: artifactsType,
        /**
         * gate_tag_name -> RHEL version. Always present in query.
         * This will guarantee that gate_tag_name is not emtpy.
         */
        dbFieldName1: dbFieldName1,
        dbFieldValues1: dbFieldValues1,
        options: searchOptions,
    };
    if (!_.isNil(aidOffset)) {
        queryVariables.aid_offset = aidOffset;
    }
    if (!_.isEmpty(dbFieldValues2)) {
        /** CI system name -> resultsdb testcase name */
        queryVariables.dbFieldName2 = dbFieldName2;
        queryVariables.dbFieldValues2 = dbFieldValues2;
    }
    if (!_.isEmpty(dbFieldValues3)) {
        queryVariables.dbFieldName3 = dbFieldName3;
        queryVariables.dbFieldValues3 = dbFieldValues3;
    }
    if (!_.isEmpty(dbFieldValuesComponentMapping1)) {
        if (_.isEmpty(queryVariables.dbFieldValues1)) {
            /** Limit gating tag to product id */
            if (searchParams.productId === 604) {
                queryVariables.dbFieldValues1 = 'rhel-9';
            } else if (searchParams.productId === 370) {
                queryVariables.dbFieldValues1 = 'rhel-8';
            }
        }
        queryVariables.options.componentMappingProductId =
            searchParams.productId;
        queryVariables.dbFieldNameComponentMapping1 =
            dbFieldNameComponentMapping1;
        queryVariables.dbFieldValuesComponentMapping1 =
            dbFieldValuesComponentMapping1;
    }
    const query = new URLSearchParams(window.location.search);
    const btype = query.get('btype');
    const {
        loading: isLoading,
        error,
        data,
    } = useQuery<PageGatingArtifactsData>(PageGatingArtifacts, {
        variables: queryVariables,
        /** https://www.apollographql.com/docs/react/api/core/ApolloClient/ */
        fetchPolicy: 'cache-first',
        notifyOnNetworkStatusChange: true,
        errorPolicy: 'all',
        /** Do query if URL has artifact type */
        skip: _.isEmpty(btype),
    });
    const haveData = !isLoading && data && !_.isEmpty(data.artifacts.artifacts);
    const haveErrorNoData = !isLoading && error && !haveData;
    if (haveData) {
        artifacts = data.artifacts.artifacts;
        hasNext = data.artifacts.has_next;
        const aidAtBottom = _.last(artifacts)!.aid;
        if (!_.includes(knownPages, aidAtBottom)) {
            knownPages.splice(
                /**
                 * Keep list sorted, by inserting aid at the correct place.
                 * Q: Does this works when 'aid' is not number?
                 */
                _.sortedIndexBy(knownPages, aidAtBottom, (x) => -x),
                0,
                aidAtBottom,
            );
        }
    }
    if (knownPages.length && !_.isEmpty(artifacts)) {
        const aidAtBottom = _.last(artifacts)!.aid;
        currentPage = 1 + _.findIndex(knownPages, (x) => x === aidAtBottom);
    }
    if (currentPage > 1) {
        loadPrevIsDisabled = false;
    }
    if (hasNext) {
        loadNextIsDisabled = false;
    }
    let rowsErrors: IRow[] = [];
    if (haveErrorNoData) {
        const errorMsg = {
            title: 'Cannot fetch data',
            body: <div>{error.toString()}</div>,
            type: 'error',
        };
        rowsErrors = mkSpecialRows(errorMsg);
    }

    const rowsArtifacts = _.map(artifacts, (artifact) =>
        mkArtifactRow(artifact, searchParams),
    );

    let rowsLoading: IRow[] = [];
    if (isLoading) {
        rowsLoading = mkSpecialRows({
            title: 'Loading data.',
            body: 'Please wait.',
            type: 'loading',
        });
    }
    const knownRows: IRow[] = _.concat(rowsArtifacts, rowsErrors, rowsLoading);

    const paginationProps = {
        isLoading,
        currentPage,
        loadPrevIsDisabled,
        loadNextIsDisabled,
        onClickLoadPrev,
        onClickLoadNext,
    };
    return (
        <>
            <Table
                header={<PaginationToolbar {...paginationProps} />}
                variant={TableVariant.compact}
                cells={columns(artifactsType)}
                rows={knownRows}
                aria-label="table with results"
            >
                <TableHeader />
                <TableBody />
            </Table>
            <PaginationToolbar {...paginationProps} />
        </>
    );
}

function GatingToolbar() {
    const dispatch: Dispatch<ActionsGateArtifactsType> = useDispatch();
    const onClickSearch = () => {
        dispatch(bumpGatingSearchEpoch());
    };
    return (
        <Flex>
            <Flex
                alignContent={{ default: 'alignContentCenter' }}
                direction={{ default: 'column' }}
                grow={{ default: 'grow' }}
            >
                <Form>
                    <Grid hasGutter md={4}>
                        <FormGroup
                            fieldId="grid-form-email-01"
                            helperText="Brew artifact type."
                            isRequired
                            label="Build type"
                        >
                            <BuildTypeSelector />
                        </FormGroup>
                        <FormGroup
                            fieldId="grid-form-email-01"
                            helperText="Brew gate tag."
                            label="Gating tag"
                        >
                            <GatingTagSelector />
                        </FormGroup>
                        <FormGroup
                            fieldId="grid-form-name-01"
                            helperText="Test case name as it sees ResultsDB."
                            label="CI system"
                        >
                            <CiSystemSelector />
                        </FormGroup>
                        <FormGroup
                            fieldId="grid-form-email-01"
                            helperText="SST teams for specific product."
                            label="SST teams"
                        >
                            <InputGroup>
                                <ProductSelector />
                                <SstSelector />
                            </InputGroup>
                        </FormGroup>
                        <FormGroup
                            fieldId="grid-form-email-01"
                            helperText="Kerberos principal who made a build."
                            label="Packager"
                        >
                            <PackagerSelector />
                        </FormGroup>
                        <GridItem span={12}>
                            <FormGroup
                                fieldId="options"
                                hasNoPaddingTop
                                isHelperTextBeforeField
                                isStack
                                label="Search options"
                            >
                                <Checkboxes />
                            </FormGroup>
                        </GridItem>
                    </Grid>
                    <ActionGroup>
                        <Button onClick={onClickSearch} variant="primary">
                            Show
                        </Button>
                    </ActionGroup>
                </Form>
            </Flex>
        </Flex>
    );
}

export function PageGating() {
    return (
        <PageCommon title={`Gating tests | ${config.defaultTitle}`}>
            <PageSection isFilled variant={PageSectionVariants.default}>
                <GatingToolbar />
                <GatingResults />
            </PageSection>
        </PageCommon>
    );
}
