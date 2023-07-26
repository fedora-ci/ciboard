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
import { ApolloError, useQuery } from '@apollo/client';
import classNames from 'classnames';
import moment from 'moment';
import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
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
    Title,
} from '@patternfly/react-core';
import { LinkIcon, SearchIcon, ThIcon } from '@patternfly/react-icons';
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
import {
    cleanseGatingFormState,
    goToGatingNextPage,
    goToGatingPrevPage,
    setGatingSearchOptions,
    updateGatingSearchOptions,
} from '../actions';
import {
    BUILD_TYPE_MENU_ITEMS,
    deserializeGatingFormState,
    selectSerializedGatingFormState,
} from '../slices/gatingTestsFormSlice';
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
    PageGatingGetSSTTeamsData,
} from '../queries/Artifacts';
import { PaginationToolbar } from './PaginationToolbar';
import {
    getArtifactRemoteUrl,
    getArtifactName,
    getTestcaseName,
} from '../utils/artifactUtils';
import { transformKaiStates } from '../utils/stages_states';
import { useAppDispatch, useAppSelector } from '../hooks';
import { RootState } from '../reduxStore';

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

const PRODUCTS = [
    { id: 604, label: 'RHEL 9' },
    { id: 370, label: 'RHEL 8' },
];

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

function selectGatingQueryVariables(state: RootState): GatingSearchQuery {
    const { gatingTestsForm: formState } = state;

    const atype = formState.buildType;
    /**
     * gate_tag_name must be first in the query field, otherwise query will be slow.
     * Special index is present:
     * db.artifacts.createIndex({"type" : 1, "aid" : -1, "gate_tag_name" : 1}, { collation: { locale: "en_US", numericOrdering : true} })
     */
    const dbFieldName1 = 'payload.gate_tag_name';
    const dbFieldValues1 = _.trim(formState.gateTag);
    /** resultsdb_testcase */
    const dbFieldName2 = 'states.kai_state.test_case_name';
    const dbFieldValues2 = _.trim(formState.ciSystem);
    const dbFieldName3 = 'payload.issuer';
    const dbFieldValues3 = _.trim(formState.packager);
    const dbFieldNameComponentMapping1 = 'sst_team_name';
    const dbFieldValuesComponentMapping1 = formState.sstTeams;
    const options = {
        valuesAreRegex1: true,
        valuesAreRegex2: true,
        valuesAreRegex3: true,
        reduced: true,
    };

    const variables: GatingSearchQuery = {
        /** Brew-build, redhat-module. Always present in query. */
        atype,
        /**
         * gate_tag_name -> RHEL version. Always present in query.
         * This will guarantee that gate_tag_name is not emtpy.
         */
        dbFieldName1,
        dbFieldValues1,
        options,
    };

    if (!_.isEmpty(dbFieldValues2)) {
        /** CI system name -> resultsdb testcase name */
        variables.dbFieldName2 = dbFieldName2;
        variables.dbFieldValues2 = dbFieldValues2;
    }
    if (!_.isEmpty(dbFieldValues3)) {
        variables.dbFieldName3 = dbFieldName3;
        variables.dbFieldValues3 = dbFieldValues3;
    }
    if (!_.isEmpty(dbFieldValuesComponentMapping1)) {
        if (_.isEmpty(variables.dbFieldValues1)) {
            /** Limit gating tag to product id */
            if (formState.productId === 604) {
                variables.dbFieldValues1 = 'rhel-9';
            } else if (formState.productId === 370) {
                variables.dbFieldValues1 = 'rhel-8';
            }
        }
        variables.options.componentMappingProductId = formState.productId;
        variables.dbFieldNameComponentMapping1 = dbFieldNameComponentMapping1;
        variables.dbFieldValuesComponentMapping1 =
            dbFieldValuesComponentMapping1;
    }

    if (!_.isEmpty(formState.aidStack)) {
        variables.aid_offset = _.last(formState.aidStack);
    }

    return variables;
}

interface CiSystemsTableProps {
    ciSystem: string;
    currentState: StatesByCategoryType;
}

const CiSystemsTable = (props: CiSystemsTableProps) => {
    const { ciSystem, currentState } = props;
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
            let ciSystemName = getTestcaseName(kaiState);
            if (!ciSystemName) {
                continue;
            }
            const re = new RegExp(ciSystem, 'gi');
            if (ciSystem && !ciSystemName.match(re)) {
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

function mkArtifactRow(artifact: Artifact, ciSystem: string): IRow {
    if (!(isArtifactRPM(artifact) || isArtifactMBS(artifact))) {
        return {};
    }
    const isScratch = _.get(artifact, 'payload.scratch', false);
    const artifactLink = (
        <div style={{ whiteSpace: 'nowrap' }}>
            <a
                href={getArtifactRemoteUrl(artifact)}
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
                        ciSystem={ciSystem}
                        currentState={transformKaiStates(
                            artifact.states,
                            'test',
                        )}
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
    const buildType = useAppSelector(
        (state) => state.gatingTestsForm.buildType,
    );
    const [isExpanded, setExpanded] = useState(false);
    const onSelect: SelectProps['onSelect'] = (_event, selection) => {
        const selectionString = selection.toString();
        setExpanded(false);
        dispatch(
            updateGatingSearchOptions({
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
            {_.map(BUILD_TYPE_MENU_ITEMS, (value, label) => (
                <SelectOption key={value} value={value}>
                    {label}
                </SelectOption>
            ))}
        </Select>
    );
}

function Checkboxes() {
    const dispatch = useAppDispatch();
    const ignoreCiSystem = useAppSelector(
        (state) => state.gatingTestsForm.ignoreCiSystem,
    );
    const onChange: CheckboxProps['onChange'] = (flag) => {
        dispatch(
            updateGatingSearchOptions({
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
    const ciSystem = useAppSelector((state) => state.gatingTestsForm.ciSystem);
    const [isExpanded, setExpanded] = useState(false);
    const onToggle = (isExpanded: boolean) => {
        setExpanded(isExpanded);
    };
    const onSelect: SelectProps['onSelect'] = (_event, selection) => {
        const selectionString = selection.toString();
        setExpanded(false);
        dispatch(
            updateGatingSearchOptions({
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
    const gateTag = useAppSelector((state) => state.gatingTestsForm.gateTag);
    const [isExpanded, setExpanded] = useState(false);
    const titleId = 'plain-typeahead-select-id-gating-tag';
    const onToggle = (isExpanded: boolean) => {
        setExpanded(isExpanded);
    };
    const onSelect: SelectProps['onSelect'] = (_event, selection) => {
        const selectionString = selection.toString();
        setExpanded(false);
        dispatch(
            updateGatingSearchOptions({
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
    const packager = useAppSelector((state) => state.gatingTestsForm.packager);
    const onChange = (_value: string, event: FormEvent<HTMLInputElement>) => {
        const value = event.currentTarget.value;
        dispatch(
            updateGatingSearchOptions({
                packager: value,
            }),
        );
    };

    return (
        <TextInput id="packager-input" onChange={onChange} value={packager} />
    );
}

function ProductSelector() {
    const dispatch = useAppDispatch();
    const productId = useAppSelector(
        (state) => state.gatingTestsForm.productId,
    );
    const [isOpen, setOpen] = useState(false);
    const onFocus = () => {
        document.getElementById('toggle-id')?.focus();
    };
    const onSelect: DropdownProps['onSelect'] = (_event) => {
        setOpen(!isOpen);
        onFocus();
    };
    const onClickItem = (productId: number): void => {
        dispatch(
            updateGatingSearchOptions({
                productId,
                // Clear SSTs list as they are specific to a product release.
                sstTeams: [],
            }),
        );
    };
    const dropdownItems = PRODUCTS.map(({ id, label }) => (
        <DropdownItem
            autoFocus={productId === id}
            component="button"
            description={`SST teams for ${label}`}
            key="action1"
            onClick={() => onClickItem(id)}
        >
            {label}
        </DropdownItem>
    ));

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
    const productId = useAppSelector(
        (state) => state.gatingTestsForm.productId,
    );
    const sstTeams = useAppSelector((state) => state.gatingTestsForm.sstTeams);
    const [isExpanded, setExpanded] = useState(false);
    const onSelect: SelectProps['onSelect'] = (_event, selection) => {
        const updatedSet = _.xor(sstTeams, [selection.toString()]);
        dispatch(
            updateGatingSearchOptions({
                sstTeams: updatedSet,
            }),
        );
    };
    let sstMenuItems: string[] = [];
    const queryVariables = {
        product_id: productId,
    };
    const { data, loading } = useQuery<PageGatingGetSSTTeamsData>(
        PageGatingGetSSTTeams,
        {
            errorPolicy: 'all',
            fetchPolicy: 'cache-first',
            notifyOnNetworkStatusChange: true,
            variables: queryVariables,
        },
    );
    const haveData = !loading && data && !_.isEmpty(data.db_sst_list);
    if (haveData) {
        // NOTE: We know `db_sst_list` is not undefined thanks to `!_.isEmpty()` above.
        sstMenuItems = data
            .db_sst_list!.filter((sst) => !_.isNil(sst))
            .map((sst) => _.toString(sst))
            .sort();
    }
    const badge = !_.isEmpty(sstTeams)
        ? `Selected: ${_.size(sstTeams)}`
        : undefined;

    return (
        <Select
            customBadgeText={badge}
            isOpen={isExpanded}
            isPlain
            maxHeight="37.5rem"
            onSelect={onSelect}
            onToggle={setExpanded}
            selections={sstTeams}
            variant={SelectVariant.checkbox}
        >
            {_.map(sstMenuItems, (item, index) => (
                <SelectOption key={index} value={item} />
            ))}
        </Select>
    );
}

interface GatingResultsProps {
    data?: PageGatingArtifactsData;
    error?: ApolloError;
    isLoading?: boolean;
}

function GatingResults(props: GatingResultsProps) {
    const { data, error, isLoading } = props;

    const dispatch = useAppDispatch();
    const aidStack = useAppSelector(
        ({ gatingTestsForm }) => gatingTestsForm.aidStack,
    );
    const buildType = useAppSelector(
        ({ gatingTestsForm }) => gatingTestsForm.buildType,
    );
    const ciSystem = useAppSelector(
        ({ gatingTestsForm }) => gatingTestsForm.ciSystem,
    );

    let artifacts: Artifact[] = [];

    /**
     * Are there more pages in the results?
     */
    let hasNext = false;
    /**
     * index in known pages
     */
    let currentPage = 1 + aidStack.length;
    let loadNextIsDisabled = true;
    let loadPrevIsDisabled = true;

    const haveData =
        !isLoading && data && !_.isEmpty(data.artifacts?.artifacts);
    const haveErrorNoData = !isLoading && error && !haveData;
    if (haveData) {
        artifacts = data.artifacts!.artifacts;
        hasNext = data.artifacts!.has_next;
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
        mkArtifactRow(artifact, ciSystem),
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

    const onClickLoadNext = () => {
        const newAidOffset = _.last(artifacts)?.aid;
        if (!hasNext || _.isNil(newAidOffset)) {
            // This shouldn't happen but just to be sure...
            return;
        }
        dispatch(goToGatingNextPage(newAidOffset));
    };
    const onClickLoadPrev = () => {
        dispatch(goToGatingPrevPage());
    };

    const paginationProps = {
        isLoading,
        currentPage,
        loadPrevIsDisabled,
        loadNextIsDisabled,
        onClickLoadNext,
        onClickLoadPrev,
    };

    return (
        <>
            <Table
                header={<PaginationToolbar {...paginationProps} />}
                variant={TableVariant.compact}
                cells={columns(buildType)}
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

interface GatingToolbarProps {
    onSubmit?(): void;
}

function GatingToolbar(props: GatingToolbarProps) {
    const onClickSearch = () => {
        if (props.onSubmit) props.onSubmit();
    };

    return (
        <Flex
            alignContent={{ default: 'alignContentCenter' }}
            direction={{ default: 'column' }}
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
                    <FormGroup fieldId="options" isStack label="Search options">
                        <Checkboxes />
                    </FormGroup>
                    <GridItem span={12}>
                        <Button
                            icon={<SearchIcon />}
                            onClick={onClickSearch}
                            variant="primary"
                        >
                            Search
                        </Button>
                    </GridItem>
                </Grid>
            </Form>
        </Flex>
    );
}

export function PageGating() {
    const dispatch = useAppDispatch();
    const isFormDirty = useAppSelector(
        ({ gatingTestsForm }) => !!gatingTestsForm.isDirty,
    );
    const queryVariables = useAppSelector(selectGatingQueryVariables);
    const serializedFormState = useAppSelector(selectSerializedGatingFormState);
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        // Hydrate form state from URL parameters.
        if (searchParams.has('btype')) {
            const deserialized = deserializeGatingFormState(searchParams);
            dispatch(setGatingSearchOptions(deserialized));
        }
    }, [dispatch, searchParams]);

    const { data, error, loading } = useQuery<PageGatingArtifactsData>(
        PageGatingArtifacts,
        {
            errorPolicy: 'all',
            fetchPolicy: 'cache-first',
            notifyOnNetworkStatusChange: true,
            skip: isFormDirty,
            variables: queryVariables,
        },
    );

    const onSearchSubmit = () => {
        setSearchParams(serializedFormState);
        dispatch(cleanseGatingFormState());
    };

    return (
        <PageCommon title={`Gating tests | ${config.defaultTitle}`}>
            <PageSection isFilled variant={PageSectionVariants.default}>
                <GatingToolbar onSubmit={onSearchSubmit} />
                <GatingResults data={data} error={error} isLoading={loading} />
            </PageSection>
        </PageCommon>
    );
}
