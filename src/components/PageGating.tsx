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
import { ReactNode, useEffect, useRef, useState } from 'react';
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
import { LinkIcon, ThIcon } from '@patternfly/react-icons';
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
import {
    BUILD_TYPE_MENU_ITEMS,
    StateGatingTests,
    getSelectFromType,
} from '../slices/gateArtifactsSlice';
import {
    Artifact,
    isStateKai,
    ArtifactType,
    StageNameType,
    ComponentComponentMappingType,
    StatesByCategoryType,
    StateExtendedKaiNameType,
    isArtifactRPM,
    isArtifactMBS,
} from '../artifact';
import { mkSpecialRows } from '../utils/artifactsTable';
import { PageCommon } from './PageCommon';
import {
    PageGatingArtifacts,
    PageGatingArtifactsData,
    PageGatingGetSSTTeams,
} from '../queries/Artifacts';
import { PaginationToolbar } from './PaginationToolbar';
import {
    artifactUrl,
    getArtifactName,
    getTestcaseName,
} from '../utils/artifactUtils';
import { transformKaiStates } from '../utils/stages_states';
import { useAppDispatch, useAppSelector } from '../hooks';

interface CiSystem {
    ciSystemName: string;
    generatedAt?: string;
    order?: number;
    result: string;
    stage?: StageNameType;
    state: StateExtendedKaiNameType;
    status?: string;
    test?: {
        resuls: string;
    };
    textClasses?: string;
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

interface CiSystemsTableProps {
    currentState: StatesByCategoryType;
    searchParams: StateGatingTests;
}
const CiSystemsTable = (props: CiSystemsTableProps) => {
    const { currentState, searchParams } = props;
    const ciSystemsNames: CiSystem[] = [];
    const kaiStatesNames: StateExtendedKaiNameType[] = [
        'running',
        'queued',
        'error',
        'failed',
        'passed',
        'info',
        'needs_inspection',
        'not_applicable',
    ];
    for (const state of kaiStatesNames) {
        const kaiStates = currentState[state];
        if (_.isUndefined(kaiStates)) {
            continue;
        }
        for (const kaiState of kaiStates) {
            if (!isStateKai(kaiState)) {
                continue;
            }
            let ciSystemName: string = getTestcaseName(kaiState);
            const re = new RegExp(searchParams.ciSystem, 'gi');
            if (searchParams.ciSystem && !ciSystemName.match(re)) {
                continue;
            }
            ciSystemsNames.push({
                ciSystemName,
                generatedAt: _.toString(kaiState.broker_msg_body.generated_at),
                result: '',
                state,
            });
        }
    }
    _.forEach(ciSystemsNames, (ciSystem) => {
        const { state } = ciSystem;
        let isPassed = false;
        let isInfo = false;
        let isFailed = false;
        let isOther = false;
        let order;
        if (state === 'running' || state === 'queued' || state === 'info') {
            isInfo = true;
            order = 1;
        } else if (state === 'error' || state === 'failed') {
            isFailed = true;
            order = 2;
        } else if (state === 'passed') {
            isPassed = true;
            order = 0;
        } else {
            /** state === 'needs_inspection' || state === 'not_applicable' */
            isOther = true;
            order = 3;
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
                                        {result ? ` / ${result}` : ''}
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

interface MappingInfoProps {
    mapping: ComponentComponentMappingType | undefined;
}

const MappingInfo = (props: MappingInfoProps) => {
    const { mapping } = props;
    if (!mapping?.product_id) return null;
    const { def_assignee, qa_contact, sst_team_name } = mapping;
    return (
        <>
            Team: {sst_team_name}
            <br />
            QA: {qa_contact}
            <br />
            Owner: {def_assignee}
        </>
    );
};

function mkArtifactRow(
    artifact: Artifact,
    searchParams: StateGatingTests,
): IRow {
    if (!(isArtifactRPM(artifact) || isArtifactMBS(artifact))) {
        return {};
    }
    const isScratch = _.get(artifact, 'payload.scratch', false);
    const artifactLink = (
        <div style={{ whiteSpace: 'nowrap' }}>
            <a
                href={artifactUrl(artifact)}
                onClick={(e) => e.stopPropagation()}
                rel="noopener noreferrer"
                target="_blank"
            >
                {isScratch ? `scratch:${artifact.aid}` : artifact.aid}
            </a>
        </div>
    );

    const cells: IRow['cells'] = [
        {
            title: artifactLink,
        },
        _.get(artifact, 'payload.gate_tag_name', null),
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
                <div style={{ whiteSpace: 'nowrap' }}>
                    builder: {artifact.payload.issuer}
                    <br />
                    <MappingInfo mapping={artifact.component_mapping} />
                </div>
            ),
        },
        {
            title: (
                <div>
                    <CiSystemsTable
                        currentState={transformKaiStates(
                            artifact.states,
                            'test',
                        )}
                        searchParams={searchParams}
                    />
                </div>
            ),
        },
        {
            title: (
                <a
                    href={artifactDashboardUrl(artifact)}
                    title="Artifact link"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <LinkIcon style={{ height: '0.9em' }} />
                </a>
            ),
        },
    ];
    return { cells };
}

function BuildTypeSelector() {
    const dispatch = useAppDispatch();
    const { buildType: buildTypeInit } = useAppSelector(
        (state) => state.gateArtifacts,
    );
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
            {_.keys(BUILD_TYPE_MENU_ITEMS).map((item, index) => (
                <SelectOption key={index} value={item} />
            ))}
        </Select>
    );
}

function Checkboxes() {
    const dispatch = useAppDispatch();
    const { ignoreCiSystem: initialState } = useAppSelector(
        (state) => state.gateArtifacts,
    );
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
    const dispatch = useAppDispatch();
    const { ciSystem: init_state } = useAppSelector(
        (state) => state.gateArtifacts,
    );
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
    const dispatch = useAppDispatch();
    const { gateTag: init_state } = useAppSelector(
        (state) => state.gateArtifacts,
    );
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
    const dispatch = useAppDispatch();
    const { packager: init_state } = useAppSelector(
        (state) => state.gateArtifacts,
    );
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
    const dispatch = useAppDispatch();
    const { productId } = useAppSelector((state) => state.gateArtifacts);
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
    const dispatch = useAppDispatch();
    const { productId, sstTeams: initialState } = useAppSelector(
        (state) => state.gateArtifacts,
    );
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
    const reduxState = useAppSelector((state) => state.gateArtifacts);
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
    }, [knownPages, reduxState, searchParams.searchEpoch]);
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
    const dbFieldName1 = 'payload.gate_tag_name';
    const dbFieldValues1 = _.trim(searchParams.gateTag);
    /** resultsdb_testcase */
    const dbFieldName2 = 'states.kai_state.test_case_name';
    const dbFieldValues2 = _.trim(searchParams.ciSystem);
    const dbFieldName3 = 'payload.issuer';
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
    const dispatch = useAppDispatch();
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
